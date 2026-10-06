<div align="center">

<img src="icons/128.png" width="96" height="96" alt="Order Exporter for Taobao icon">

# Order Exporter for Taobao

**Export every order from Taobao's 已买到的宝贝 page to Excel or JSON, right in your browser.**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-ff5000)
![Chrome | Edge | Brave](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-4285F4?logo=googlechrome&logoColor=white)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

**English** · [繁體中文](docs/i18n/README.zh-TW.md) · [简体中文](docs/i18n/README.zh-CN.md) · [日本語](docs/i18n/README.ja.md) · [한국어](docs/i18n/README.ko.md) · [Español](docs/i18n/README.es.md)

</div>

<p align="center">
  <img src="docs/screenshots/toolbar.png" alt="An Export all orders button next to Taobao's own 导出订单 button" width="88%">
</p>
<p align="center">
  <img src="docs/screenshots/dialog-en.png" alt="Export dialog in English" width="44%">
  &nbsp;
  <img src="docs/screenshots/dialog-zh-CN.png" alt="Export dialog in Simplified Chinese" width="44%">
</p>

<details>
<summary>More screenshots</summary>

<p align="center"><img src="docs/screenshots/exporting.png" alt="The extension turning pages during an export" width="80%"></p>

All screenshots use made-up demo orders.

</details>

## ✨ Features

- 📦 **All your orders**, back to the oldest one. Taobao's own 导出订单 stops at 10 pages per export.
- 📅 **Pick a range**: all orders, the first *N* pages, or orders placed between two dates. Optionally leave out closed orders.
- ☑️ **Pick the fields** like Taobao's dialog: order no., time, status, shop, paid, shipping, total, discount, item, variant, qty, amount, item link, picture.
- 📊 **Excel (.xlsx) or JSON.** In Excel, every item row keeps its order number, amounts are real numbers, and an Orders sheet keeps totals from being counted twice.
- 🔒 **Local only.** No account, no server, no tracking. It reads only what the Taobao page has already loaded.
- 🌐 **Interface in English, 简体中文 and 繁體中文**, following your browser's language.

## 📥 Install

> [!NOTE]
> The extension is not on the Chrome Web Store yet. Install it from source for now.

1. Download this repository (**Code › Download ZIP**) and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode**, click **Load unpacked** and pick the folder that contains `manifest.json`.

Keep the folder: the browser loads the extension from it. To update, replace the folder and click ↻ on the extension.

## 🚀 Usage

1. Sign in to Taobao and open **我的淘宝 › 已买到的宝贝**.
2. Click **Export all orders**, next to Taobao's 导出订单 button or at the bottom right.
3. Choose fields, which orders and the file format, then click **Export**.

The extension clicks "next page" by itself, about 2–4 seconds per page (30 orders a page), then downloads `taobao-orders-<date>.xlsx` or `.json`.
If Taobao shows a slider check, finish it and click **Continue**. **Stop** ends early.

| | Taobao's 导出订单 | This extension |
| --- | --- | --- |
| Orders per export | up to 10 pages | all, first *N* pages, or a date range |
| Formats | Excel | Excel or JSON |
| 2nd+ item of an order | order no., time and shop left blank | always filled in |
| Amounts | text such as `￥26.80` | numbers |
| Picture links | no | yes |

The file layouts (Excel sheets and the JSON schema) are described in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#output-files).

## 🛠️ Build from source

```bash
git clone https://github.com/HKmario852/Taobao-Order-Export.git
cd Taobao-Order-Export
node --test test/*.test.js          # Node 18+
zip -r taobao-order-export.zip manifest.json *.js _locales icons   # package for the store
```

There is nothing to compile. Every push to `main` also builds a store-ready zip under **Actions**. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for how it works, regenerating screenshots and adding a language.

**Tech stack:** plain JavaScript, Chrome Manifest V3, a small built-in `.xlsx` writer, `node:test`. Playwright is used only to take screenshots.

## 🔐 Privacy

The extension makes no network requests of its own and has no analytics. Your dialog choices are remembered in the Taobao page's local storage; order data stays in the open tab until you download it. It never exports addresses, phone numbers or recipient names. Details: [PRIVACY.md](PRIVACY.md).

## ⚠️ Disclaimer

Not affiliated with Taobao or Alibaba. It reads the data Taobao's own page loads (an internal, undocumented response), so a change to that page can break it until the extension is updated. Shipping, total and discount are exported only when Taobao includes them; tracking numbers are not exported.

## 📄 License

[MIT](LICENSE) © HKmario852
