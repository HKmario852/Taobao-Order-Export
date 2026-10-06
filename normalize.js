// Turns the order data that Taobao's 已买到的宝贝 page loads into a small, stable format.
// Keeps only order number, time, shop, items, amount paid and status: no address, phone or recipient.

const EXPORT_FORMAT = 'taobao-order-export';

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

// Taobao often gives pictures and links as "//img.alicdn.com/…"; add https:.
function httpsUrl(v) {
  const u = str(v);
  if (u.startsWith('//')) return `https:${u}`;
  return /^https?:\/\//.test(u) ? u.replace(/^http:/, 'https:') : '';
}

function yuan(v) {
  return str(v).replace(/[^0-9.]/g, '');
}

// Current 已买到的宝贝 page (mtop.taobao.order.queryboughtlistV2): each order is split into
// components keyed by order number: shopInfo_<id> (time, shop, status), orderPayment_<id> (paid)
// and orderItemInfo_<id>_<sub id> (one per item). Returns this page's orders and paging.
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
      const sku = str(item.skuText);
      if (sku) entry.sku = sku;
      const pic = httpsUrl(item.pic);
      const url = httpsUrl(item.itemUrl || item.outerUrl);
      if (pic) entry.pic = pic;
      if (url) entry.url = url;
      items.push(entry);
    }
    const order = { id, time, shop: str(shop.shopName || shop.sellerName), items, paid, status: str(shop.tradeTitle) };
    // Shipping, total price and discount when Taobao gives them (older importers ignore extra fields)
    const postFee = yuan((payment.pcPostFee || payment.postFee || {}).value);
    const total = yuan((payment.totalFee || {}).value);
    const discount = yuan((payment.discountFee || {}).value);
    if (postFee) order.postFee = postFee;
    if (total) order.total = total;
    if (discount) order.discount = discount;
    orders.push(order);
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
  return { format: EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), orders };
}

if (typeof module !== 'undefined') module.exports = { EXPORT_FORMAT, normalizeOrder, normalizeMainOrders, normalizeBoughtListV2, buildExport };
