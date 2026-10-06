// Adds an "Export all orders" button to 已买到的宝贝 that opens a dialog like Taobao's own 导出订单, but
// without its 10-page limit: pick the fields, which orders (all, the first N pages or a date range) and
// Excel or JSON. The extension then clicks "next page" by itself, copies each page's orders and downloads
// the file. Everything stays in your browser; nothing is sent anywhere. Taobao blocks direct data
// requests, so the extension turns pages the way a person would.

(() => {
  const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String)) || key;
  const collected = new Map(); // order number → order
  const SHEET_LABELS = ['ordersSheet', 'itemsSheet', 'items', 'open', ...ALL_FIELDS];
  const PREFS_KEY = 'taobaoOrderExport.prefs';
  let lastPage = null; // { page, hasMore, totalNum, pageSize, orders }
  let waiters = [];

  // ---- Settings, remembered between visits ----
  const prefs = (() => {
    const base = { fields: DEFAULT_FIELDS, range: 'all', pages: 10, from: '', to: '', skipClosed: false, format: 'xlsx' };
    try {
      return { ...base, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
    } catch (_) {
      return base;
    }
  })();
  const savePrefs = () => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (_) {}
  };

  // ---- Small helpers for building the dialog ----
  const el = (tag, css, text) => {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const ORANGE = '#ff5000';
  const btnCss = (primary) =>
    `border:1px solid ${primary ? ORANGE : '#ddd'};border-radius:8px;padding:7px 16px;cursor:pointer;` +
    `font:600 14px sans-serif;background:${primary ? ORANGE : '#fff'};color:${primary ? '#fff' : '#333'};margin-left:8px`;
  const labelCss = 'display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin:4px 0';

  function checkbox(text, checked, onChange) {
    const label = el('label', labelCss);
    const input = el('input', `accent-color:${ORANGE};width:16px;height:16px;margin:0`);
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    label.append(input, document.createTextNode(text));
    return { label, input };
  }

  function radio(name, value, text, checked, onChange) {
    const label = el('label', labelCss);
    const input = el('input', `accent-color:${ORANGE};width:16px;height:16px;margin:0`);
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = checked;
    input.addEventListener('change', () => input.checked && onChange(value));
    label.append(input, document.createTextNode(text));
    return { label, input };
  }

  // ---- Dialog ----
  const overlay = el(
    'div',
    'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:none;align-items:center;' +
      'justify-content:center;font:14px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#222',
  );
  const dialog = el(
    'div',
    'background:#fff;border-radius:12px;width:min(640px,94vw);max-height:90vh;overflow:auto;' +
      'box-shadow:0 10px 40px rgba(0,0,0,.3);padding:20px 24px',
  );
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !busy) close();
  });

  const head = el('div', 'display:flex;justify-content:space-between;align-items:center');
  head.append(el('div', 'font-size:18px;font-weight:700', t('dialogTitle')));
  const x = el('button', 'border:0;background:none;font-size:22px;cursor:pointer;color:#888', '×');
  x.addEventListener('click', () => !busy && close());
  head.append(x);
  dialog.append(head);
  dialog.append(
    el(
      'div',
      `margin:10px 0 14px;padding:8px 12px;border-radius:8px;background:#fff3ec;color:${ORANGE};font-size:13px`,
      t('better'),
    ),
  );

  const section = (title) => {
    const s = el('div', 'margin:12px 0 4px;font-weight:700', title);
    dialog.append(s);
    return s;
  };

  // Fields
  const fieldsHead = section(t('fieldsTitle'));
  const fieldBoxes = {};
  const allBox = checkbox(t('selectAll'), false, (on) => {
    for (const f of ALL_FIELDS) fieldBoxes[f].input.checked = on;
    readFields();
  });
  allBox.label.style.cssText += ';font-weight:400;margin-left:12px';
  fieldsHead.append(allBox.label);
  const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:2px 12px');
  for (const f of ALL_FIELDS) {
    fieldBoxes[f] = checkbox(t(f), prefs.fields.includes(f), () => readFields());
    grid.append(fieldBoxes[f].label);
  }
  dialog.append(grid);
  function readFields() {
    prefs.fields = ALL_FIELDS.filter((f) => fieldBoxes[f].input.checked);
    allBox.input.checked = prefs.fields.length === ALL_FIELDS.length;
    savePrefs();
  }
  allBox.input.checked = prefs.fields.length === ALL_FIELDS.length;

  // Which orders
  section(t('rangeTitle'));
  const rangeBox = el('div', 'display:flex;flex-direction:column');
  const setRange = (v) => {
    prefs.range = v;
    savePrefs();
  };
  const rAll = radio('teRange', 'all', t('rangeAll'), prefs.range === 'all', setRange);
  const rPages = radio('teRange', 'pages', t('rangePages'), prefs.range === 'pages', setRange);
  const pagesInput = el('input', 'width:64px;padding:3px 6px;border:1px solid #ccc;border-radius:6px');
  pagesInput.type = 'number';
  pagesInput.min = '1';
  pagesInput.value = String(prefs.pages);
  pagesInput.addEventListener('input', () => {
    prefs.pages = Math.max(1, Number.parseInt(pagesInput.value, 10) || 1);
    rPages.input.checked = true;
    setRange('pages');
  });
  rPages.label.append(pagesInput, document.createTextNode(t('pagesUnit')));
  const rDates = radio('teRange', 'dates', t('rangeDates'), prefs.range === 'dates', setRange);
  const dateInput = (value, key) => {
    const i = el('input', 'padding:3px 6px;border:1px solid #ccc;border-radius:6px');
    i.type = 'date';
    i.value = value;
    i.addEventListener('input', () => {
      prefs[key] = i.value;
      rDates.input.checked = true;
      setRange('dates');
    });
    return i;
  };
  rDates.label.append(dateInput(prefs.from, 'from'), document.createTextNode(t('dateTo')), dateInput(prefs.to, 'to'));
  const skip = checkbox(t('skipClosed'), prefs.skipClosed, (on) => {
    prefs.skipClosed = on;
    savePrefs();
  });
  rangeBox.append(rAll.label, rPages.label, rDates.label, skip.label);
  dialog.append(rangeBox);

  // Format
  section(t('formatTitle'));
  const formatBox = el('div', 'display:flex;gap:24px;align-items:center;flex-wrap:wrap');
  const jsonNote = el('span', 'color:#888;font-size:12px', t('jsonNote'));
  const setFormat = (v) => {
    prefs.format = v;
    savePrefs();
    grid.style.opacity = v === 'json' ? '.45' : '1';
    jsonNote.style.display = v === 'json' ? 'inline' : 'none';
  };
  formatBox.append(
    radio('teFormat', 'xlsx', t('formatXlsx'), prefs.format === 'xlsx', setFormat).label,
    radio('teFormat', 'json', t('formatJson'), prefs.format === 'json', setFormat).label,
    jsonNote,
  );
  dialog.append(formatBox);
  setFormat(prefs.format);

  // Status line and buttons
  const status = el('div', 'margin-top:16px;min-height:20px;color:#555');
  const bar = el('div', 'display:flex;justify-content:flex-end;margin-top:12px');
  const cancel = el('button', btnCss(false), t('cancel'));
  const go = el('button', btnCss(true), t('start'));
  bar.append(cancel, go);
  dialog.append(status, bar);
  document.body.appendChild(overlay);

  function open() {
    overlay.style.display = 'flex';
    if (!busy) updateCount();
  }
  function close() {
    overlay.style.display = 'none';
  }
  cancel.addEventListener('click', () => {
    if (busy) stopRequested = true;
    else close();
  });

  // Launchers: next to Taobao's own 导出订单 button when it's there, plus one at the bottom right.
  const floating = el(
    'button',
    'position:fixed;right:20px;bottom:20px;z-index:2147483645;border:0;border-radius:999px;padding:9px 16px;' +
      `background:${ORANGE};color:#fff;font:600 14px sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)`,
    t('exportAll'),
  );
  floating.addEventListener('click', open);
  document.body.appendChild(floating);

  function placeToolbarButton() {
    if (document.getElementById('te-toolbar-btn')) return;
    const official = [...document.querySelectorAll('span,div,button,a')].find(
      (n) => n.childElementCount <= 3 && /^\s*导出订单\s*(新)?\s*$/.test(n.textContent || ''),
    );
    if (!official || !official.parentElement) return;
    const b = el(
      'button',
      `border:1px solid ${ORANGE};color:${ORANGE};background:#fff;border-radius:6px;padding:3px 10px;` +
        'cursor:pointer;font:13px sans-serif;margin-left:8px',
      t('exportAll'),
    );
    b.id = 'te-toolbar-btn';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      open();
    });
    official.parentElement.insertBefore(b, official.nextSibling);
  }
  let placing = false;
  new MutationObserver(() => {
    if (placing) return;
    placing = true;
    requestAnimationFrame(() => {
      placeToolbarButton();
      placing = false;
    });
  }).observe(document.body, { childList: true, subtree: true });
  placeToolbarButton();

  function updateCount(note) {
    const total = lastPage && lastPage.totalNum;
    status.textContent = note || (total ? t('collectedOf', collected.size, total) : t('collected', collected.size));
  }

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
      for (const o of v2.orders) collected.set(o.id, o);
      if (!busy) updateCount();
      const ready = waiters;
      waiters = [];
      for (const w of ready) w(v2);
      return;
    }
    for (const o of normalizeMainOrders(json && json.mainOrders)) collected.set(o.id, o);
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
    (li.querySelector('button, a') || li).click();
    return true;
  }

  const isClosed = (o) => /关闭|關閉|已取消|cancel/i.test(o.status || '');
  const day = (time) => String(time || '').slice(0, 10);

  /** Orders matching the dialog's settings, newest first. */
  function selected() {
    let orders = buildExport(collected).orders;
    if (prefs.range === 'dates') orders = orders.filter((o) => day(o.time) >= prefs.from && day(o.time) <= prefs.to);
    if (prefs.range === 'pages' && lastPage && lastPage.pageSize) orders = orders.slice(0, prefs.pages * lastPage.pageSize);
    if (prefs.skipClosed) orders = orders.filter((o) => !isClosed(o));
    return orders;
  }

  /** Have we read far enough back for the chosen range? (Orders are listed newest first.) */
  function enough(page) {
    if (!lastPage || !lastPage.hasMore) return true;
    if (prefs.range === 'pages') return page >= prefs.pages;
    if (prefs.range === 'dates') {
      const oldestOnPage = (lastPage.orders || []).reduce((m, o) => (!m || o.time < m ? o.time : m), '');
      return !!oldestOnPage && day(oldestOnPage) < prefs.from;
    }
    return false;
  }

  let busy = false;
  let paused = false;
  let stopRequested = false;

  async function exportOrders() {
    if (busy) return;
    if (prefs.format === 'xlsx' && prefs.fields.length === 0) return updateCount(t('pickField'));
    if (prefs.range === 'dates' && (!prefs.from || !prefs.to)) return updateCount(t('badDates'));
    const resume = paused && !!lastPage;
    busy = true;
    paused = false;
    stopRequested = false;
    go.disabled = true;
    go.style.opacity = '.6';
    cancel.textContent = t('stop');
    try {
      // Start from page 1 ("Continue" picks up from the current page)
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
      while (!enough(page)) {
        if (stopRequested) throw new Error(t('stopped'));
        const total = lastPage.totalNum && lastPage.pageSize ? Math.ceil(lastPage.totalNum / lastPage.pageSize) : null;
        const last = prefs.range === 'pages' ? Math.min(prefs.pages, total || prefs.pages) : total;
        updateCount(
          last ? t('readingPageOf', page + 1, last, collected.size) : t('readingPage', page + 1, collected.size),
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
      save();
    } catch (err) {
      updateCount(t('soFar', err.message, collected.size));
    } finally {
      busy = false;
      go.disabled = false;
      go.style.opacity = '1';
      go.textContent = paused ? t('resume') : t('start');
      cancel.textContent = t('cancel');
    }
  }
  go.addEventListener('click', exportOrders);

  function save() {
    const orders = selected();
    if (!orders.length) return updateCount(t('noneMatch'));
    const stamp = new Date().toISOString().slice(0, 10);
    let bytes;
    let type;
    if (prefs.format === 'json') {
      const out = buildExport(new Map());
      out.orders = orders;
      bytes = JSON.stringify(out, null, 1);
      type = 'application/json';
    } else {
      const labels = {};
      for (const k of SHEET_LABELS) labels[k] = t(k);
      bytes = ordersWorkbook(orders, labels, prefs.fields);
      type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type }));
    a.download = `taobao-orders-${stamp}.${prefs.format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    updateCount(t('downloaded', orders.length));
  }
})();
