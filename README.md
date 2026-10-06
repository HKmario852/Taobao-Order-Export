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
2. Click **Export all orders**: next to Taobao's own 导出订单 button, or the orange button at the bottom right.
3. A dialog like Taobao's own opens. Choose:
   - **Fields**: order no., order time, status, shop, paid, shipping, total price, discount, item, variant,
     quantity, amount, item page link, picture link (remembered for next time).
   - **Which orders**: all orders back to the oldest, the first *N* pages, or orders placed between two dates.
     You can also leave out closed / cancelled orders (交易关闭).
   - **Format**: Excel (.xlsx) or JSON.
4. Click **Export**. The extension goes back to page 1 and clicks "next page" by itself, pausing 2–4 seconds
   per page like a person reading, then downloads the file. About 30 orders per page, so 500 orders take
   about a minute. For a date range it stops as soon as it has passed the start date.

If Taobao asks you to slide to verify partway through, the extension stops. Finish the check, then click
**Continue** to carry on from that page. **Stop** ends the run early.

Taobao blocks extensions that request order data directly, so this one doesn't: it only copies the data the
page itself loads as it turns the pages.

### Compared with Taobao's own 导出订单

| | Taobao 导出订单 | This extension |
| --- | --- | --- |
| How many orders | up to 10 pages per export | all orders, the first *N* pages, or a date range |
| Formats | Excel | Excel or JSON |
| Rows of a multi-item order | only the first row has order no., time, shop… | every row keeps them |
| Amounts | text like "￥26.80" | numbers you can sum |
| Pictures | no | picture link per item |

## Excel file

`taobao-orders-<date>.xlsx` has up to two sheets, with only the fields you picked:

| Sheet | One row per | Columns |
| --- | --- | --- |
| Orders | order | the order fields you picked, plus items and total quantity |
| Items | item | order no., time, status and shop (if picked), then the item fields you picked |

Money appears once per order on the Orders sheet, so you can sum it safely. Order numbers are kept as text so
Excel doesn't round them. Each header row is frozen and has filters.

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

**导出：** 登录淘宝，打开「我的淘宝 › 已买到的宝贝」，点淘宝「导出订单」旁边（或右下角）的「导出全部订单」。
像淘宝自己的导出一样选：要导出的字段、订单范围（全部订单／前 N 页／下单日期）、是否不导出交易关闭的订单、
格式（Excel 或 JSON），然后点「导出」。扩展会自己逐页翻，读完自动下载。如果中途要滑动验证，完成后点「继续」。

**比淘宝自带的导出好在哪：** 不限 10 页；可选 JSON；同一张订单的每行商品都带订单号、时间、店铺；金额是数字，可以直接加总；
每件商品有图片链接。

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
