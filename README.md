# Order Exporter for Taobao · 淘宝订单导出

A browser extension that exports **all** your Taobao orders from 已买到的宝贝 (My Taobao › Bought items) to
**Excel (.xlsx)** or **JSON**, right back to your oldest order.

- Runs only in your browser. No account, no password, no server: nothing is sent anywhere.
- Only reads the Taobao page you are already signed in to. It never places, cancels or changes an order.
- Exports only what you need to track spending: order number, time, shop, items (name, quantity, amount,
  picture and item links), amount paid and status. No address, phone number or recipient.
- Works in Chrome, Edge, Brave and other Chromium browsers. The interface is in English, 简体中文 or 繁體中文,
  following your browser's language.

Not affiliated with Taobao or Alibaba.

## Install

**From source (now):**

1. Download this repository (**Code › Download ZIP**) and unzip it.
2. Open `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json`).

Keep the folder where it is: the browser loads the extension from it.

## Export your orders

1. Sign in to Taobao and open **我的淘宝 › 已买到的宝贝**.
2. A black box appears at the bottom right. Click **Export all orders**.
   The extension goes back to page 1 and clicks "next page" by itself, pausing 2–4 seconds per page like a
   person reading. About 30 orders per page, so 500 orders take about a minute.
3. When it says it's done, click **Download Excel** or **Download JSON**.

If Taobao asks you to slide to verify partway through, the extension stops. Finish the check, then click
**Continue** to carry on from that page.

Taobao blocks extensions that request order data directly, so this one doesn't: it only copies the data the
page itself loads as it turns the pages.

## Excel file

`taobao-orders-<date>.xlsx` has two sheets:

| Sheet | One row per | Columns |
| --- | --- | --- |
| Orders | order | order no., order time, shop, status, items, qty, paid (¥) |
| Items | item | order no., order time, shop, item, qty, amount (¥), picture link, item page link |

"Paid" appears once per order, so you can sum the Orders sheet safely. Order numbers are kept as text so Excel
doesn't round them. The header row is frozen and has filters.

## JSON file

```json
{
  "format": "taobao-order-export",
  "version": 1,
  "exportedAt": "2026-10-05T16:00:00.000Z",
  "orders": [
    {
      "id": "order number",
      "time": "2026-09-30 21:05:11",
      "shop": "shop name",
      "items": [
        {
          "title": "item name",
          "qty": 1,
          "price": "29.45",
          "pic": "https://img.alicdn.com/…jpg",
          "url": "https://item.taobao.com/item.htm?id=…"
        }
      ],
      "paid": "58.90",
      "status": "交易成功"
    }
  ]
}
```

`time` is China time. `paid` and `price` are in RMB. `pic` and `url` may be missing. Orders are newest first.

## 中文说明

把淘宝「已买到的宝贝」里的全部订单（一直到最旧的一张）导出成 Excel 或 JSON。

- 只在你的浏览器里运行，不用登录、不用密码、没有服务器，不会上传任何数据。
- 只读取你已经登录的淘宝页面，不会下单、取消或修改订单。
- 只导出记账需要的字段：订单号、时间、店铺、商品（名称、数量、金额、图片和商品链接）、实付款、状态。没有地址、电话或收件人。

**安装：** 下载本仓库（Code › Download ZIP）并解压，打开 `chrome://extensions`（Brave 用 `brave://extensions`），
开启右上角「开发者模式」，点「加载已解压的扩展程序」，选有 `manifest.json` 的文件夹。

**导出：** 登录淘宝，打开「我的淘宝 › 已买到的宝贝」，点右下角「导出全部订单」，读完后点「下载 Excel」或「下载 JSON」。
如果中途要滑动验证，完成后点「继续」。

本扩展与淘宝、阿里巴巴无关。

## Privacy

See [PRIVACY.md](PRIVACY.md). In short: the extension collects nothing and sends nothing.

## Development

```
node --test test/*.test.js
```

- `manifest.json`: Manifest V3. Runs only on `buyertrade.taobao.com/trade/itemlist/*`.
- `page_hook.js`: runs in the page and copies the order responses Taobao itself loads
  (`mtop.taobao.order.queryboughtlistV2`, or `mainOrders` on the older page).
- `normalize.js`: turns those responses into the JSON format above.
- `xlsx.js`: a small dependency-free Excel writer.
- `content.js`: the box at the bottom right; turns pages and downloads the files.
- `_locales/`: English, 简体中文 and 繁體中文 (zh_TW and zh_HK) text.

Every push builds `taobao-order-export-<version>.zip`, ready to upload to the Chrome Web Store, under the
**Actions** tab.

## License

[MIT](LICENSE)
