// CSV export: one file, one row per item with its order's picked fields. An order's money columns are filled
// on its first row only, so summing a column doesn't count an order twice. Uses xlsx.js's field lists and cells.

// In the browser xlsx.js's declarations are shared globals; under Node (tests) they come from require.
const XL =
  typeof require === 'function'
    ? require('./xlsx.js')
    : { ORDER_FIELDS, ITEM_FIELDS, DEFAULT_FIELDS, orderCell, itemCell };

function csvField(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'money' in v) v = Number.isFinite(v.money) ? v.money : '';
  else if (typeof v === 'object' && 'link' in v) v = v.link;
  let s = String(v);
  // A text cell starting with = + - @ would run as a formula in Excel; a leading ' keeps it as text
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const ORDER_MONEY = new Set(['paid', 'postFee', 'total', 'discount']);

/** CSV text (with a UTF-8 BOM so Excel reads Chinese correctly) for [orders], using only the picked [fields]. */
function ordersCsv(orders, t, fields = XL.DEFAULT_FIELDS) {
  const picked = new Set(fields);
  const orderCols = XL.ORDER_FIELDS.filter((f) => picked.has(f));
  const itemCols = XL.ITEM_FIELDS.filter((f) => picked.has(f));
  // Links are written as plain URLs, so the "open" label isn't needed
  const lines = [[...orderCols, ...itemCols].map((f) => csvField(t[f])).join(',')];
  for (const o of orders) {
    const items = itemCols.length && o.items && o.items.length ? o.items : [null];
    items.forEach((item, n) => {
      const row = orderCols.map((f) => (n > 0 && ORDER_MONEY.has(f) ? null : XL.orderCell(o, f)));
      if (itemCols.length) row.push(...itemCols.map((f) => (item ? XL.itemCell(item, f, t) : null)));
      lines.push(row.map(csvField).join(','));
    });
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

if (typeof module !== 'undefined') module.exports = { ordersCsv, csvField };
