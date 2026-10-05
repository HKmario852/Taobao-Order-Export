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

function buildExport(ordersById) {
  const orders = [...ordersById.values()].sort((a, b) => (a.time < b.time ? 1 : -1));
  return { format: MONEY_EXPENSE_FORMAT, version: 1, exportedAt: new Date().toISOString(), orders };
}

if (typeof module !== 'undefined') module.exports = { normalizeOrder, normalizeMainOrders, buildExport };
