// 將淘寶「已買到的寶貝」嘅訂單 JSON（mainOrders）轉做 Money Expense 讀得明嘅格式。
// 只留記帳要用嘅欄位：訂單號、時間、店舖、商品名、數量、實付款、狀態。冇地址、電話、收件人。

const MONEY_EXPENSE_FORMAT = 'money-expense-taobao';

function str(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

function normalizeOrder(o) {
  if (!o || typeof o !== 'object') return null;
  const info = o.orderInfo || {};
  const id = str(o.id || info.id);
  const time = str(info.createTime || o.createTime);
  const paid = str((o.payInfo || {}).actualFee);
  if (!id || !time || !paid) return null;
  const items = [];
  for (const s of Array.isArray(o.subOrders) ? o.subOrders : []) {
    const title = str((s.itemInfo || {}).title);
    // 運費險、保險等附加項目冇商品頁，都照留，App 會合併做同一筆
    if (!title) continue;
    items.push({
      title,
      qty: Number.parseInt(str(s.quantity), 10) || 1,
      price: str((s.priceInfo || {}).realTotal),
    });
  }
  return {
    id,
    time,
    shop: str((o.seller || {}).shopName || (o.seller || {}).nick),
    items,
    paid,
    status: str((o.statusInfo || {}).text),
  };
}

function normalizeMainOrders(mainOrders) {
  const out = [];
  for (const o of Array.isArray(mainOrders) ? mainOrders : []) {
    const n = normalizeOrder(o);
    if (n) out.push(n);
  }
  return out;
}

// 淘寶嘅圖同連結有時係「//img.alicdn.com/…」，補返 https:
function httpsUrl(v) {
  const u = str(v);
  if (u.startsWith('//')) return `https:${u}`;
  return /^https?:\/\//.test(u) ? u.replace(/^http:/, 'https:') : '';
}

function yuan(v) {
  return str(v).replace(/[^0-9.]/g, '');
}

// 新版「已買到的寶貝」（mtop.taobao.order.queryboughtlistV2）：每張訂單拆咗做幾個組件，
// 用訂單號串返埋：shopInfo_<單號>（時間、店舖、狀態）、orderPayment_<單號>（實付款）、
// orderItemInfo_<單號>_<子單號>（每件貨）。返回呢頁嘅訂單同分頁資料。
function normalizeBoughtListV2(json) {
  const comps = json && json.data && json.data.data;
  if (!comps || typeof comps !== 'object') return null;
  const pag = (comps.pagination && comps.pagination.fields) || {};
  const orders = [];
  for (const [key, comp] of Object.entries(comps)) {
    if (!key.startsWith('shopInfo_')) continue;
    const shop = (comp && comp.fields) || {};
    const id = str(shop.orderId || key.slice('shopInfo_'.length));
    const payment = (comps[`orderPayment_${id}`] || {}).fields || {};
    const paid = yuan((payment.actualFee || {}).value);
    const time = str(shop.createTime);
    if (!id || !time || !paid) continue;
    const items = [];
    for (const [k, c] of Object.entries(comps)) {
      if (!k.startsWith(`orderItemInfo_${id}_`)) continue;
      const item = (c && c.fields && c.fields.item) || {};
      const title = str(item.title);
      if (!title) continue;
      const entry = {
        title,
        qty: Number.parseInt(str(item.quantity), 10) || 1,
        price: yuan((item.priceInfo || {}).actualTotalFee),
      };
      const pic = httpsUrl(item.pic);
      const url = httpsUrl(item.itemUrl || item.outerUrl);
      if (pic) entry.pic = pic;
      if (url) entry.url = url;
      items.push(entry);
    }
    orders.push({ id, time, shop: str(shop.shopName || shop.sellerName), items, paid, status: str(shop.tradeTitle) });
  }
  return {
    orders,
    page: Number.parseInt(str(pag.currentPage), 10) || null,
    hasMore: pag.hasMore === true || pag.hasMore === 'true',
    totalNum: Number.parseInt(str(pag.totalNum), 10) || null,
    pageSize: Number.parseInt(str(pag.pageSize), 10) || null,
  };
}

function buildExport(ordersById) {
  const orders = [...ordersById.values()].sort((a, b) => (a.time < b.time ? 1 : -1));
  return { format: MONEY_EXPENSE_FORMAT, version: 1, exportedAt: new Date().toISOString(), orders };
}

if (typeof module !== 'undefined') module.exports = { normalizeOrder, normalizeMainOrders, normalizeBoughtListV2, buildExport };
