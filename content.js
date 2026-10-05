// 「已買到的寶貝」頁面右下角加一個掣：自動逐頁撳「下一頁」，抄低每頁訂單，然後下載一個 JSON 檔俾 Money Expense 匯入。
// 全部喺你部電腦做，唔會將資料傳去任何地方。淘寶擋直接問資料，所以照住人咁轉頁。

(() => {
  const collected = new Map(); // 訂單號 → 訂單
  let lastPage = null; // { page, hasMore, totalNum, pageSize }
  let waiters = [];

  const addOrders = (orders) => {
    for (const o of orders) collected.set(o.id, o);
    updateCount();
  };

  // ---- 介面 ----
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:20px;bottom:20px;z-index:2147483647;background:#111;color:#fff;' +
    'border-radius:16px;padding:12px 14px;font:14px/1.4 sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:280px';
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

  function totalPages() {
    if (!lastPage || !lastPage.totalNum || !lastPage.pageSize) return null;
    return Math.ceil(lastPage.totalNum / lastPage.pageSize);
  }

  function updateCount(note) {
    const total = lastPage && lastPage.totalNum ? ` / 共 ${lastPage.totalNum}` : '';
    status.textContent = note || `Money Expense：已收集 ${collected.size}${total} 張訂單`;
  }
  updateCount();

  // 淘寶頁面自己載入嘅訂單（見 page_hook.js）
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.__moneyExpense !== 'orders') return;
    let json;
    try {
      json = JSON.parse(e.data.payload);
    } catch (_) {
      return;
    }
    const v2 = normalizeBoughtListV2(json);
    if (v2 && (v2.orders.length || v2.page)) {
      lastPage = v2;
      addOrders(v2.orders);
      const ready = waiters;
      waiters = [];
      for (const w of ready) w(v2);
      return;
    }
    addOrders(normalizeMainOrders(json && json.mainOrders));
  });

  // 喺呢個 script 載入之前淘寶已經載入咗嘅，叫 page_hook.js 再送一次
  window.postMessage({ __moneyExpense: 'replay' }, location.origin);

  // ---- 轉頁 ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** 等淘寶載入第 [page] 頁；[timeoutMs] 內冇就返回 null（多數係要滑動驗證）。 */
  function waitForPage(page, timeoutMs) {
    if (lastPage && lastPage.page === page) return Promise.resolve(lastPage);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        waiters = waiters.filter((w) => w !== check);
        resolve(null);
      }, timeoutMs);
      function check(p) {
        if (p.page !== page) {
          waiters.push(check);
          return;
        }
        clearTimeout(timer);
        resolve(p);
      }
      waiters.push(check);
    });
  }

  function clickPager(selector) {
    const li = document.querySelector(selector);
    if (!li || li.getAttribute('aria-disabled') === 'true' || li.classList.contains('ant-pagination-disabled')) return false;
    li.scrollIntoView({ block: 'center' });
    (li.querySelector('button, a') || li).click();
    return true;
  }

  let busy = false;
  let paused = false;

  async function exportAll(resume) {
    if (busy) return;
    busy = true;
    paused = false;
    run.disabled = true;
    run.textContent = '讀緊…';
    try {
      // 由第一頁開始（「繼續」就由而家嗰頁接住）
      if (!resume && (!lastPage || lastPage.page !== 1)) {
        if (!clickPager('.ant-pagination-item-1')) throw new Error('搵唔到第一頁嘅掣，請重新整理頁面');
        if (!(await waitForPage(1, 8000))) {
          // 已經喺第一頁但未抄到：轉去第二頁再返嚟
          if (!clickPager('.ant-pagination-item-2') || !(await waitForPage(2, 20000))) throw new Error('等唔到第一頁');
          await sleep(1500);
          clickPager('.ant-pagination-item-1');
          if (!(await waitForPage(1, 20000))) throw new Error('等唔到第一頁');
        }
      }
      let page = lastPage && lastPage.page ? lastPage.page : 1;
      while (lastPage && lastPage.hasMore) {
        const total = totalPages();
        updateCount(`讀緊第 ${page + 1}${total ? ` / ${total}` : ''} 頁…（已收集 ${collected.size} 張）`);
        // 好似人咁慢慢睇，唔好太密
        await sleep(2000 + Math.random() * 2000);
        if (!clickPager('.ant-pagination-next')) break;
        const next = await waitForPage(page + 1, 20000);
        if (!next) {
          paused = true;
          throw new Error(`第 ${page + 1} 頁載入唔到：淘寶可能要你滑動驗證。完成後撳「繼續」`);
        }
        page = next.page;
      }
      updateCount(`讀完：${collected.size} 張訂單。撳「下載」`);
    } catch (err) {
      updateCount(`${err.message}（已收集 ${collected.size} 張）`);
    } finally {
      busy = false;
      run.disabled = false;
      run.textContent = paused ? '繼續' : '匯出全部訂單';
    }
  }

  // 「繼續」：由而家嗰頁接住讀，唔使返去第一頁
  run.addEventListener('click', () => exportAll(paused && !!lastPage));

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
