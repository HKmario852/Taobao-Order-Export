// node --test
const test = require('node:test');
const assert = require('node:assert');
const { normalizeMainOrders, buildExport } = require('../normalize.js');

// 假資料，唔係真訂單
const sample = [
  {
    id: '100001',
    orderInfo: { createTime: '2026-09-30 21:05:11', id: '100001' },
    seller: { shopName: '測試小店', nick: 'test-shop' },
    payInfo: { actualFee: '58.90' },
    statusInfo: { text: '交易成功' },
    subOrders: [
      { itemInfo: { title: '手機殼' }, quantity: '2', priceInfo: { realTotal: '29.45' } },
      { itemInfo: {}, quantity: '1' },
    ],
  },
  { id: '100002', orderInfo: {}, payInfo: { actualFee: '1.00' } },
  null,
];

test('keeps only the fields needed for bookkeeping', () => {
  const out = normalizeMainOrders(sample);
  assert.deepStrictEqual(out, [
    {
      id: '100001',
      time: '2026-09-30 21:05:11',
      shop: '測試小店',
      items: [{ title: '手機殼', qty: 2, price: '29.45' }],
      paid: '58.90',
      status: '交易成功',
    },
  ]);
});

test('falls back to the seller nick when there is no shop name', () => {
  const [o] = normalizeMainOrders([{ ...sample[0], seller: { nick: 'test-shop' } }]);
  assert.strictEqual(o.shop, 'test-shop');
});

test('export is newest first with the format tag', () => {
  const a = { id: '1', time: '2026-01-01 10:00:00' };
  const b = { id: '2', time: '2026-02-01 10:00:00' };
  const out = buildExport(new Map([['1', a], ['2', b]]));
  assert.strictEqual(out.format, 'money-expense-taobao');
  assert.strictEqual(out.version, 1);
  assert.deepStrictEqual(out.orders.map((o) => o.id), ['2', '1']);
});
