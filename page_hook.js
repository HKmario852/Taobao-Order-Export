// 喺淘寶頁面本身度行：淘寶自己載入訂單嗰陣，將回應抄一份俾 content.js。
// 咁樣就算自動轉頁失敗，你自己逐頁撳，extension 都收集到。
(() => {
  const seen = [];
  const send = (payload) => {
    seen.push(payload);
    window.postMessage({ __moneyExpense: 'orders', payload }, location.origin);
  };
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.__moneyExpense !== 'replay') return;
    for (const payload of seen) window.postMessage({ __moneyExpense: 'orders', payload }, location.origin);
  });

  const looksLikeOrders = (text) => typeof text === 'string' && text.includes('mainOrders');

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const copy = res.clone();
      copy.text().then((t) => looksLikeOrders(t) && send(t)).catch(() => {});
    } catch (_) {}
    return res;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener('load', () => {
      try {
        if (this.responseType === '' || this.responseType === 'text') {
          if (looksLikeOrders(this.responseText)) send(this.responseText);
        }
      } catch (_) {}
    });
    return origOpen.apply(this, args);
  };

  // 第一頁嘅訂單係寫死喺網頁入面（var data = JSON.parse('…')）
  const grabInitial = () => {
    try {
      if (window.data && window.data.mainOrders) send(JSON.stringify(window.data));
    } catch (_) {}
  };
  if (document.readyState === 'complete') grabInitial();
  else window.addEventListener('load', grabInitial);
})();
