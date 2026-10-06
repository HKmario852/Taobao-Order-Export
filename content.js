// Adds a small box to the bottom right of 已买到的宝贝: it clicks "next page" by itself, copies each page's
// orders, then downloads them as Excel or JSON. Everything stays in your browser; nothing is sent anywhere.
// Taobao blocks direct data requests, so the extension turns pages the way a person would.

(() => {
  const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String)) || key;
  const collected = new Map(); // order number → order
  // Column and sheet names for the Excel file, in the browser's language
  const SHEET_LABELS = [
    'ordersSheet', 'itemsSheet', 'orderId', 'time', 'shop', 'status', 'items',
    'qty', 'paid', 'item', 'price', 'picture', 'link', 'open',
  ];
  let lastPage = null; // { page, hasMore, totalNum, pageSize }
  let waiters = [];

  const addOrders = (orders) => {
    for (const o of orders) collected.set(o.id, o);
    updateCount();
  };

  // ---- UI ----
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:20px;bottom:20px;z-index:2147483647;background:#111;color:#fff;' +
    'border-radius:16px;padding:12px 14px;font:14px/1.4 sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:280px';
  const status = document.createElement('div');
  status.style.marginBottom = '8px';
  const run = document.createElement('button');
  run.textContent = t('exportAll');
  const saveXlsx = document.createElement('button');
  saveXlsx.textContent = t('downloadExcel');
  const saveJson = document.createElement('button');
  saveJson.textContent = t('downloadJson');
  const row = document.createElement('div');
  row.style.marginTop = '6px';
  for (const b of [run, saveXlsx, saveJson]) {
    b.style.cssText =
      'border:0;border-radius:999px;padding:6px 12px;margin-right:6px;cursor:pointer;font-weight:600;' +
      'background:#fff;color:#111';
  }
  run.style.background = '#C8F169';
  row.append(saveXlsx, saveJson);
  box.append(status, run, row);
  document.body.appendChild(box);

  function totalPages() {
    if (!lastPage || !lastPage.totalNum || !lastPage.pageSize) return null;
    return Math.ceil(lastPage.totalNum / lastPage.pageSize);
  }

  function updateCount(note) {
    const total = lastPage && lastPage.totalNum;
    status.textContent = note || (total ? t('collectedOf', collected.size, total) : t('collected', collected.size));
  }
  updateCount();

  // Orders the page itself loaded (see page_hook.js)
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.__taobaoOrderExport !== 'orders') return;
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

  // Ask page_hook.js to resend whatever the page loaded before this script started
  window.postMessage({ __taobaoOrderExport: 'replay' }, location.origin);

  // ---- Paging ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Waits for Taobao to load page [page]; null after [timeoutMs] (usually a slide-to-verify check). */
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
    run.textContent = t('reading');
    try {
      // Start from page 1 (Continue picks up from the current page)
      if (!resume && (!lastPage || lastPage.page !== 1)) {
        if (!clickPager('.ant-pagination-item-1')) throw new Error(t('noFirstPage'));
        if (!(await waitForPage(1, 8000))) {
          // Already on page 1 but nothing copied yet: go to page 2 and back
          if (!clickPager('.ant-pagination-item-2') || !(await waitForPage(2, 20000))) throw new Error(t('noFirst'));
          await sleep(1500);
          clickPager('.ant-pagination-item-1');
          if (!(await waitForPage(1, 20000))) throw new Error(t('noFirst'));
        }
      }
      let page = lastPage && lastPage.page ? lastPage.page : 1;
      while (lastPage && lastPage.hasMore) {
        const total = totalPages();
        updateCount(
          total ? t('readingPageOf', page + 1, total, collected.size) : t('readingPage', page + 1, collected.size),
        );
        // Go at a person's pace, not too fast
        await sleep(2000 + Math.random() * 2000);
        if (!clickPager('.ant-pagination-next')) break;
        const next = await waitForPage(page + 1, 20000);
        if (!next) {
          paused = true;
          throw new Error(t('verify', page + 1));
        }
        page = next.page;
      }
      updateCount(t('done', collected.size));
    } catch (err) {
      updateCount(t('soFar', err.message, collected.size));
    } finally {
      busy = false;
      run.disabled = false;
      run.textContent = paused ? t('resume') : t('exportAll');
    }
  }

  // Continue: carry on from the current page instead of going back to page 1
  run.addEventListener('click', () => exportAll(paused && !!lastPage));

  function download(bytes, type, ext) {
    const blob = new Blob([bytes], { type });
    const a = document.createElement('a');
    const day = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `taobao-orders-${day}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    updateCount(t('downloaded', collected.size));
  }

  function ready() {
    if (collected.size > 0) return true;
    updateCount(t('nothing'));
    return false;
  }

  saveJson.addEventListener('click', () => {
    if (!ready()) return;
    download(JSON.stringify(buildExport(collected), null, 1), 'application/json', 'json');
  });

  saveXlsx.addEventListener('click', () => {
    if (!ready()) return;
    const labels = {};
    for (const k of SHEET_LABELS) labels[k] = t(k);
    download(
      ordersWorkbook(buildExport(collected).orders, labels),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xlsx',
    );
  });
})();
