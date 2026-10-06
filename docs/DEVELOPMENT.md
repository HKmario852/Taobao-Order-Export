# Development notes

[← Back to README](../README.md)

## How it works

Taobao blocks extensions that request order data directly, so this one never does. It copies what the
已买到的宝贝 page loads for itself and turns the pages the way a person would.

```
Taobao page ──fetch/XHR──▶ page_hook.js (copies order responses)
                               │ window.postMessage
                               ▼
                           content.js ──▶ normalize.js ──▶ orders in memory
                               │ clicks "next page", waits 2–4 s, repeats
                               ▼
                           xlsx.js / JSON ──▶ download
```

## Files

| File | What it does |
| --- | --- |
| [`manifest.json`](../manifest.json) | Manifest V3. Content scripts only, on `buyertrade.taobao.com/trade/itemlist/*`. No extra permissions. |
| [`page_hook.js`](../page_hook.js) | Runs in the page (`world: MAIN`) at `document_start`. Wraps `fetch` and `XMLHttpRequest` and copies responses that contain orders (`mtop.taobao.order.queryboughtlistV2`, or `mainOrders` on the older page). |
| [`normalize.js`](../normalize.js) | Turns those responses into the JSON format below and reads the paging info. |
| [`xlsx.js`](../xlsx.js) | A dependency-free `.xlsx` writer (stored zip, inline strings, numbers, `HYPERLINK` formulas) and the workbook layout. |
| [`content.js`](../content.js) | The **Export all orders** buttons, the dialog, paging, filtering by range and the download. Dialog choices are saved in `localStorage` under `taobaoOrderExport.prefs`. |
| [`_locales/`](../_locales) | Interface text: `en`, `zh_CN`, `zh_TW`, `zh_HK`. Chrome picks one from the browser language and falls back to English. |
| [`test/`](../test) | `node:test` unit tests for the normaliser and the Excel writer. |
| [`tools/screenshots/`](../tools/screenshots) | Demo page and script that regenerate the README screenshots. |
| [`tools/icons/`](../tools/icons) | The icon artwork and `make_icons.py`, which cuts it into `icons/16–128.png` (`pip install pillow`, then `python tools/icons/make_icons.py`). |

## Output files

### Excel (`taobao-orders-<date>.xlsx`)

Up to two sheets, with only the fields picked in the dialog:

| Sheet | One row per | Columns |
| --- | --- | --- |
| Orders | order | the picked order fields, plus a joined item list and total quantity |
| Items | item | order no., time, status and shop (if picked), then the picked item fields |

Money is written once per order on the Orders sheet, so it can be summed. Order numbers are text so Excel
doesn't round them. Header rows are frozen and filtered. Links longer than Excel's 255-character formula
limit are written as plain text.

### JSON (`taobao-orders-<date>.json`)

JSON always contains every field, whatever is ticked in the dialog. Orders are newest first.

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
      "status": "交易成功",
      "paid": "58.90",
      "postFee": "0.00",
      "total": "60.90",
      "discount": "2.00",
      "items": [
        {
          "title": "item name",
          "qty": 1,
          "price": "29.45",
          "sku": "颜色分类: 黑色",
          "pic": "https://img.alicdn.com/…jpg",
          "url": "https://item.taobao.com/item.htm?id=…"
        }
      ]
    }
  ]
}
```

- `time` is China time (UTC+8). Money is a string in RMB.
- `price` is what Taobao shows as the item line's amount.
- `postFee`, `total`, `discount`, `sku`, `pic` and `url` appear only when Taobao provides them.
- Files from versions before 2.0 use `"format": "money-expense-taobao"` with the same order fields.

## Tests

```bash
node --test test/*.test.js
```

Tests use made-up data only. Never commit real orders, shop names or screenshots of a real account.

## Packaging

The extension is the files at the repo root: `manifest.json`, `*.js`, `_locales/` and `icons/`.
Everything else (`docs/`, `tools/`, `test/`) is not part of it.

- Locally: `zip -r taobao-order-export.zip manifest.json *.js _locales icons`
- CI: [`.github/workflows/build.yml`](../.github/workflows/build.yml) runs the tests on pushes to `main` and on
  pull requests, and uploads `taobao-order-export-<version>` (the same files) as an artifact.

Bump `version` in `manifest.json` for each store upload.

## Screenshots

The images in [`docs/screenshots/`](screenshots) come from [`tools/screenshots/demo-page.html`](../tools/screenshots/demo-page.html),
a stand-in 已买到的宝贝 page with made-up orders. The script loads the unpacked extension into Chromium, serves
the demo page at the real address (nothing is fetched from Taobao) and saves the pictures.

```bash
npm install --no-save playwright
npx playwright install chromium
node tools/screenshots/take.js
```

Set `CHROMIUM_PATH` to use a Chromium you already have. Branded Google Chrome can't side-load extensions
from the command line, so use Chromium.

## Adding a language

1. Copy `_locales/en/messages.json` to `_locales/<code>/messages.json` (a [Chrome locale code](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales)).
2. Translate every `message`; keep the keys and `$A$`-style placeholders.
3. Load the unpacked extension with the browser set to that language and check the dialog.

## Links

Check that every relative link and image in the README files exists:

```bash
node tools/check-links.js
```
