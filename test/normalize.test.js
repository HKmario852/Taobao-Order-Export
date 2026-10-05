// node --test
const test = require('node:test');
const assert = require('node:assert');
const { normalizeMainOrders, normalizeBoughtListV2, buildExport } = require('../normalize.js');

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

// 新版「已買到的寶貝」回應（假資料）：每張訂單拆做幾個組件
const v2 = {
  api: 'mtop.taobao.order.queryboughtlistV2',
  data: {
    data: {
      shopInfo_900001: {
        tag: 'shopInfo',
        fields: { orderId: '900001', createTime: '2026-09-22 14:03:55', shopName: '測試旗艦店', tradeTitle: '卖家已发货' },
      },
      orderPayment_900001: { tag: 'orderPayment', fields: { actualFee: { prefix: '实付款', value: '￥194.28' } } },
      orderItemInfo_900001_900002: {
        tag: 'orderItemInfo',
        fields: {
          item: {
            title: '折疊傘',
            quantity: '1',
            priceInfo: { actualTotalFee: '￥186.28' },
            pic: '//img.alicdn.com/imgextra/test.jpg',
            itemUrl: '//item.taobao.com/item.htm?id=1',
          },
        },
      },
      orderItemInfo_900001_900003: {
        tag: 'orderItemInfo',
        fields: { item: { title: '運費險', quantity: '2', priceInfo: { actualTotalFee: '￥8.00' } } },
      },
      shopInfo_900009: { tag: 'shopInfo', fields: { orderId: '900009', createTime: '2026-09-01 10:00:00' } },
      operations_900001: { tag: 'operations', fields: {} },
      pagination: { tag: 'pagination', fields: { currentPage: 2, hasMore: true, pageSize: 30, totalNum: 569 } },
    },
  },
};

test('reads the new bought-list layout and its paging', () => {
  const out = normalizeBoughtListV2(v2);
  assert.deepStrictEqual(out.orders, [
    {
      id: '900001',
      time: '2026-09-22 14:03:55',
      shop: '測試旗艦店',
      items: [
        {
          title: '折疊傘',
          qty: 1,
          price: '186.28',
          pic: 'https://img.alicdn.com/imgextra/test.jpg',
          url: 'https://item.taobao.com/item.htm?id=1',
        },
        { title: '運費險', qty: 2, price: '8.00' },
      ],
      paid: '194.28',
      status: '卖家已发货',
    },
  ]);
  assert.strictEqual(out.page, 2);
  assert.strictEqual(out.hasMore, true);
  assert.strictEqual(out.totalNum, 569);
  assert.strictEqual(out.pageSize, 30);
});

test('ignores responses that are not a bought list', () => {
  assert.strictEqual(normalizeBoughtListV2({ data: {} }), null);
  assert.strictEqual(normalizeBoughtListV2(null), null);
});
