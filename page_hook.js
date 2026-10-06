// Runs in the Taobao page itself: when the page loads its orders, pass a copy of the response to content.js.
// The extension never requests data from Taobao on its own (Taobao blocks that as a bot); it only copies
// what the page already loaded.
(() => {
  const seen = [];
  const send = (payload) => {
    seen.push(payload);
    window.postMessage({ __taobaoOrderExport: 'orders', payload }, location.origin);
  };
  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.__taobaoOrderExport !== 'replay') return;
    for (const payload of seen) window.postMessage({ __taobaoOrderExport: 'orders', payload }, location.origin);
  });

  // Current page: mtop.taobao.order.queryboughtlistV2; older page: mainOrders
  const looksLikeOrders = (text) =>
    typeof text === 'string' && (text.includes('queryboughtlist') || text.includes('mainOrders'));

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
        } else if (this.responseType === 'json' && this.response) {
          const t = JSON.stringify(this.response);
          if (looksLikeOrders(t)) send(t);
        }
      } catch (_) {}
    });
    return origOpen.apply(this, args);
  };

  // On the older page, page 1's orders are embedded in the HTML (var data = JSON.parse('…'))
  const grabInitial = () => {
    try {
      if (window.data && window.data.mainOrders) send(JSON.stringify(window.data));
    } catch (_) {}
  };
  if (document.readyState === 'complete') grabInitial();
  else window.addEventListener('load', grabInitial);
})();
