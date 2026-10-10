// node --test
const test = require('node:test');
const assert = require('node:assert');
const { ordersCsv, csvField } = require('../csv.js');

// Made-up data, not real orders
const orders = [
  {
    id: '3100000000000000001',
    time: '2026-09-30 21:05:11',
    status: '交易成功',
    shop: '測試小店, "旗艦"',
    paid: '58.90',
    postFee: '0.00',
    items: [
      { title: '手機殼', sku: '黑色', qty: 2, price: '29.45', url: 'https://item.taobao.com/item.htm?id=1' },
      { title: '=SUM(A1)', qty: 1, price: '0.00' },
    ],
  },
  { id: '3100000000000000002', time: '2026-09-29 10:00:00', status: '交易关闭', shop: 'shop', paid: '1.00', items: [] },
];
const labels = { orderId: 'Order no.', time: 'Time', status: 'Status', shop: 'Shop', paid: 'Paid', postFee: 'Postage',
  item: 'Item', sku: 'Option', qty: 'Qty', price: 'Price', link: 'Link' };

const rows = (csv) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

test('starts with a BOM and uses CRLF line endings', () => {
  const csv = ordersCsv(orders, labels, ['orderId']);
  assert.ok(csv.startsWith('﻿'));
  assert.deepStrictEqual(rows(csv), ['Order no.', '3100000000000000001', '3100000000000000002']);
});

test('one row per item, money only on the first row of an order', () => {
  const csv = ordersCsv(orders, labels, ['orderId', 'shop', 'paid', 'item', 'qty', 'price', 'link']);
  assert.deepStrictEqual(rows(csv), [
    'Order no.,Shop,Paid,Item,Qty,Price,Link',
    '3100000000000000001,"測試小店, ""旗艦""",58.9,手機殼,2,29.45,https://item.taobao.com/item.htm?id=1',
    "3100000000000000001,\"測試小店, \"\"旗艦\"\"\",,'=SUM(A1),1,0,",
    '3100000000000000002,shop,1,,,,',
  ]);
});

test('quotes fields with commas, quotes and line breaks', () => {
  assert.strictEqual(csvField('a,b'), '"a,b"');
  assert.strictEqual(csvField('say "hi"'), '"say ""hi"""');
  assert.strictEqual(csvField('two\nlines'), '"two\nlines"');
  assert.strictEqual(csvField(null), '');
  assert.strictEqual(csvField({ money: null }), '');
});

test('text that Excel would run as a formula is kept as text', () => {
  for (const s of ['=1+1', '+86 phone', '-x', '@cmd']) assert.strictEqual(csvField(s), `'${s}`);
  assert.strictEqual(csvField({ money: -5 }), '-5');
});
