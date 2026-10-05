// 「已買到的寶貝」頁面右下角加一個掣：逐頁讀訂單，然後下載一個 JSON 檔俾 Money Expense 匯入。
// 全部喺你部電腦做，唔會將資料傳去任何地方。

(() => {
  const collected = new Map(); // 訂單號 → 訂單
  const PAGE_SIZE = 15;
  const MAX_PAGES = 200;

  const addOrders = (data) => {
    const before = collected.size;
    for (const o of normalizeMainOrders(data && data.mainOrders)) collected.set(o.id, o);
    updateCount();
    return collected.size - before;
  };

  // ---- 介面 ----
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:20px;bottom:20px;z-index:2147483647;background:#111;color:#fff;' +
    'border-radius:16px;padding:12px 14px;font:14px/1.4 sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:260px';
  const status = document.createElement('div');
  status.style.marginBottom = '8px';
  const run = document.createElement('button');
  run.textContent = '匯出全部訂單';
  const save = document.createElement('button');
  save.textContent = '下載';
  for (const b of [run, save]) {
    b.style.cssText =
      'border:0;border-radius:999px;padding:6px 12px;margin-right:6px;cursor:pointer;font-weight:600;' +
      'background:#C8F169;color:#111';
  }
  save.style.background = '#fff';
  box.append(status, run, save);
  document.body.appendChild(box);

  let busy = false;
  function updateCount(note) {
    status.textContent = note || `Money Expense：已收集 ${collected.size} 張訂單`;
  }
  updateCount();

  // 淘寶頁面自己載入嘅訂單（見 page_hook.js）
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.__moneyExpense !== 'orders') return;
    try {
      addOrders(JSON.parse(e.data.payload));
    } catch (_) {}
  });

  // 喺呢個 script 載入之前淘寶已經載入咗嘅，叫 page_hook.js 再送一次
  window.postMessage({ __moneyExpense: 'replay' }, location.origin);

  // ---- 讀訂單 ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function decode(res) {
    const buf = await res.arrayBuffer();
    const utf8 = new TextDecoder('utf-8').decode(buf);
    if (!utf8.includes('�')) return utf8;
    return new TextDecoder('gbk').decode(buf);
  }

  async function fetchPage(pageNum) {
    const url =
      '/trade/itemlist/asyncBought.htm?action=itemlist/BoughtQueryAction&event_submit_do_query=1&_input_charset=utf8';
    const body = new URLSearchParams({ pageNum: String(pageNum), pageSize: String(PAGE_SIZE), prePageNo: String(Math.max(1, pageNum - 1)) });
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body,
    });
    if (!res.ok) throw new Error(`淘寶回應 ${res.status}`);
    const text = await decode(res);
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // 多數係要登入或者滑動驗證
      throw new Error('淘寶要你驗證身份');
    }
    if (!data || !Array.isArray(data.mainOrders)) throw new Error('淘寶冇俾訂單資料');
    return data;
  }

  run.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    run.disabled = true;
    try {
      let total = 1;
      for (let page = 1; page <= Math.min(total, MAX_PAGES); page++) {
        updateCount(`讀緊第 ${page}${total > 1 ? ` / ${total}` : ''} 頁…（已收集 ${collected.size} 張）`);
        const data = await fetchPage(page);
        addOrders(data);
        total = Number((data.page || {}).totalPage) || page;
        if (data.mainOrders.length === 0) break;
        // 好似人咁慢慢睇，唔好太密
        if (page < total) await sleep(1500 + Math.random() * 1500);
      }
      updateCount(`讀完：${collected.size} 張訂單。撳「下載」`);
    } catch (err) {
      updateCount(
        `${err.message}。自動讀到 ${collected.size} 張。你可以喺頁面自己逐頁撳「下一頁」，` +
          'extension 會照收集，之後撳「下載」。',
      );
    } finally {
      busy = false;
      run.disabled = false;
    }
  });

  save.addEventListener('click', () => {
    if (collected.size === 0) {
      updateCount('未收集到訂單：先撳「匯出全部訂單」或者喺頁面轉一頁');
      return;
    }
    const blob = new Blob([JSON.stringify(buildExport(collected), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const day = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `taobao-orders-${day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    updateCount(`已下載 ${collected.size} 張訂單。擺上 Google Drive，再喺 App「匯入淘寶訂單」`);
  });
})();
