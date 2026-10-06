// node --test
const test = require('node:test');
const assert = require('node:assert');
const { crc32, ordersWorkbook, colName } = require('../xlsx.js');

// Reads back a stored (uncompressed) zip: { name: text }.
function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  const out = {};
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    assert.strictEqual(view.getUint16(at + 8, true), 0, 'stored');
    const crc = view.getUint32(at + 14, true);
    const size = view.getUint32(at + 18, true);
    const nameLen = view.getUint16(at + 26, true);
    const name = dec.decode(bytes.subarray(at + 30, at + 30 + nameLen));
    const data = bytes.subarray(at + 30 + nameLen, at + 30 + nameLen + size);
    assert.strictEqual(crc32(data), crc, `crc of ${name}`);
    out[name] = dec.decode(data);
    at += 30 + nameLen + size;
  }
  assert.strictEqual(view.getUint32(bytes.length - 22, true), 0x06054b50, 'end of central directory');
  return out;
}

const labels = {
  ordersSheet: 'Orders',
  itemsSheet: 'Items',
  orderId: 'Order no.',
  time: 'Order time',
  shop: 'Shop',
  status: 'Status',
  items: 'Items',
  qty: 'Qty',
  paid: 'Paid (¥)',
  item: 'Item',
  price: 'Amount (¥)',
  picture: 'Picture',
  link: 'Item page',
  open: 'Open',
};

// Made-up data, not real orders
const orders = [
  {
    id: '3123456789012345678',
    time: '2026-09-30 21:05:11',
    shop: 'Test <Shop> & Co',
    status: '交易成功',
    paid: '58.90',
    items: [
      { title: '手機殼', qty: 2, price: '29.45', pic: 'https://img.alicdn.com/a.jpg', url: 'https://item.taobao.com/item.htm?id=1' },
      { title: '運費險', qty: 1, price: '' },
    ],
  },
];

test('crc32 matches the standard check value', () => {
  assert.strictEqual(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('column names go past Z', () => {
  assert.deepStrictEqual([0, 25, 26, 701, 702].map(colName), ['A', 'Z', 'AA', 'ZZ', 'AAA']);
});

test('workbook has an orders sheet and an items sheet', () => {
  const files = unzip(ordersWorkbook(orders, labels));
  assert.ok(files['[Content_Types].xml'].includes('/xl/worksheets/sheet2.xml'));
  assert.ok(files['xl/workbook.xml'].includes('<sheet name="Orders"'));
  assert.ok(files['xl/workbook.xml'].includes('<sheet name="Items"'));

  const orderSheet = files['xl/worksheets/sheet1.xml'];
  // Long order numbers stay text so Excel doesn't round them
  assert.ok(orderSheet.includes('<c r="A2" t="inlineStr"><is><t xml:space="preserve">3123456789012345678</t>'));
  assert.ok(orderSheet.includes('Test &lt;Shop&gt; &amp; Co'));
  assert.ok(orderSheet.includes('手機殼 ×2；運費險'));
  // Default columns: order no., time, status, shop, paid, shipping, items, qty
  assert.ok(orderSheet.includes('<c r="E2" s="2"><v>58.9</v></c>'));
  assert.ok(orderSheet.includes('<c r="H2"><v>3</v></c>'));
  assert.ok(orderSheet.includes('<autoFilter ref="A1:H2"/>'));

  const itemSheet = files['xl/worksheets/sheet2.xml'];
  // Every item row repeats its order number (Taobao's own export leaves these blank)
  assert.ok(itemSheet.includes('<row r="3"><c r="A3" t="inlineStr"><is><t xml:space="preserve">3123456789012345678</t>'));
  // order no., time, status, shop, item, variant, qty, price, link, picture
  assert.ok(itemSheet.includes('<c r="H2" s="2"><v>29.45</v></c>'));
  assert.ok(itemSheet.includes('HYPERLINK(&quot;https://img.alicdn.com/a.jpg&quot;,&quot;Open&quot;)'));
  assert.ok(!itemSheet.includes('<c r="H3"'), 'blank price stays empty');
});

test('only the picked fields are exported', () => {
  const files = unzip(ordersWorkbook(orders, labels, ['orderId', 'paid']));
  assert.ok(!files['[Content_Types].xml'].includes('sheet2.xml'), 'no item fields, no items sheet');
  const sheet = files['xl/worksheets/sheet1.xml'];
  assert.ok(sheet.includes('<autoFilter ref="A1:B2"/>'));
  assert.ok(sheet.includes('<c r="B2" s="2"><v>58.9</v></c>'));

  const itemsOnly = unzip(ordersWorkbook(orders, labels, ['item', 'qty']));
  assert.ok(!itemsOnly['xl/workbook.xml'].includes('<sheet name="Orders"'));
  assert.ok(itemsOnly['xl/workbook.xml'].includes('<sheet name="Items"'));
});

test('links too long for a formula are written as text', () => {
  const long = `https://item.taobao.com/item.htm?id=1&x=${'a'.repeat(300)}`;
  const files = unzip(ordersWorkbook([{ ...orders[0], items: [{ title: 'x', qty: 1, url: long }] }], labels));
  const itemSheet = files['xl/worksheets/sheet2.xml'];
  assert.ok(!itemSheet.includes('HYPERLINK'));
  assert.ok(itemSheet.includes(long.replace(/&/g, '&amp;')));
});
