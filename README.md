# 淘寶訂單匯出

Chrome extension：將淘寶「已買到的寶貝」嘅訂單匯出做一個 JSON 檔，再喺 [Money Expense](https://github.com/HKmario852/money-manager) 嘅「設定 › 自動記錄 › 匯入淘寶訂單」匯入。

- 全部喺你部電腦做：唔使淘寶密碼，唔會將資料傳去任何地方，冇追蹤。
- 只會讀你登入咗嘅淘寶頁面，唔會落單、取消或者改任何嘢。
- 只匯出記帳要用嘅欄位：訂單號、時間、店舖、商品名、數量、實付款（人民幣）、狀態。冇地址、電話、收件人。

## 安裝（一次）

1. 喺 GitHub 撳 **Code › Download ZIP**，解壓。
2. Chrome 打開 `chrome://extensions`，開右上角「開發人員模式」。
3. 撳「載入未封裝項目」，揀解壓出嚟嘅資料夾（有 `manifest.json` 嗰個）。

## 每次匯出

1. 用 Chrome 登入淘寶，打開「我的淘寶 › 已買到的寶貝」。
2. 右下角撳「匯出全部訂單」。extension 會由第一頁開始，自己逐頁撳「下一頁」（每頁之間停 2–4 秒，好似人咁睇），抄低每頁嘅訂單，一直讀到最舊嗰張。大約每 30 張一頁，500 幾張訂單約一分鐘。
3. 讀完撳「下載」，得到 `taobao-orders-日期.json`。
4. 將個檔擺上 Google Drive（或者傳去電話），喺 Money Expense 匯入。同一張訂單匯入幾多次都只會記一次。

淘寶會擋 extension 自己直接問訂單資料，所以 extension 唔會咁做，只係抄低淘寶頁面本身載入嘅資料。
如果中途淘寶要你滑動驗證，extension 會停低；完成驗證之後撳「繼續」，會由停低嗰頁接住讀。

## 匯出格式

```json
{
  "format": "money-expense-taobao",
  "version": 1,
  "exportedAt": "2026-10-05T16:00:00.000Z",
  "orders": [
    {
      "id": "訂單號",
      "time": "2026-09-30 21:05:11",
      "shop": "店舖名",
      "items": [{ "title": "商品名", "qty": 1, "price": "29.45" }],
      "paid": "58.90",
      "status": "交易成功"
    }
  ]
}
```

`time` 係中國時間；`paid` 同 `price` 係人民幣。

## 檔案

- `manifest.json`：Chrome extension 設定（Manifest V3），只喺 `buyertrade.taobao.com/trade/itemlist/*` 行。
- `content.js`：右下角嘅掣，自動逐頁撳「下一頁」同下載。
- `page_hook.js`：喺淘寶頁面抄低淘寶自己載入嘅訂單（`mtop.taobao.order.queryboughtlistV2`）。
- `normalize.js`：將淘寶嘅訂單資料（新版同舊版）轉做上面嘅格式。

## 測試

```sh
node --test
```
