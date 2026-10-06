<div align="center">

<img src="../../icons/128.png" width="96" height="96" alt="淘寶訂單匯出圖示">

# 淘寶訂單匯出（Order Exporter for Taobao）

**在瀏覽器內，把淘寶「已買到的寶貝」的全部訂單匯出成 Excel 或 JSON。**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-ff5000)
![Chrome | Edge | Brave](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-4285F4?logo=googlechrome&logoColor=white)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

[English](../../README.md) · **繁體中文** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md)

</div>

<p align="center">
  <img src="../screenshots/toolbar.png" alt="淘寶「导出订单」旁邊多了一個「匯出全部訂單」按鈕" width="88%">
</p>
<p align="center">
  <img src="../screenshots/dialog-zh-CN.png" alt="中文匯出視窗" width="44%">
  &nbsp;
  <img src="../screenshots/dialog-en.png" alt="英文匯出視窗" width="44%">
</p>

<details>
<summary>更多截圖</summary>

<p align="center"><img src="../screenshots/exporting.png" alt="匯出時擴充功能自動翻頁" width="80%"></p>

截圖全部使用虛構的示範訂單。

</details>

## ✨ 功能

- 📦 **全部訂單**，一直到最早那一張。淘寶自帶的「导出订单」每次最多 10 頁。
- 📅 **選擇範圍**：全部訂單、前 *N* 頁，或某段日期內下的單；也可以不匯出交易關閉的訂單。
- ☑️ **像淘寶的視窗一樣勾選欄位**：訂單號、時間、狀態、店鋪、實付款、運費、總價、優惠、商品、型號款式、數量、金額、商品連結、圖片。
- 📊 **Excel（.xlsx）或 JSON。** Excel 裡每行商品都帶訂單號，金額是數字，另有一張「訂單」表，加總不會重複計算。
- 🔒 **只在本機執行。** 不用帳號、沒有伺服器、沒有追蹤，只讀取淘寶頁面本身已載入的資料。
- 🌐 **介面有英文、简体中文、繁體中文**，跟隨瀏覽器語言。

## 📥 安裝

> [!NOTE]
> 擴充功能尚未上架 Chrome 線上應用程式商店，暫時請從原始碼安裝。

1. 下載本 repo（**Code › Download ZIP**）並解壓縮。
2. 開啟 `chrome://extensions`（Edge：`edge://extensions`，Brave：`brave://extensions`）。
3. 開啟「開發人員模式」，按「載入未封裝項目」，選擇含有 `manifest.json` 的資料夾。

資料夾請保留，瀏覽器是從那裡載入擴充功能的。要更新時，換成新的資料夾，再在擴充功能上按 ↻。

## 🚀 使用方法

1. 登入淘寶，打開「我的淘寶 › 已買到的寶貝」。
2. 按「匯出全部訂單」（在淘寶「导出订单」旁邊，或右下角）。
3. 選好欄位、訂單範圍和檔案格式，按「匯出」。

擴充功能會自己按「下一頁」，每頁約 2–4 秒（每頁 30 張訂單），讀完後下載 `taobao-orders-<日期>.xlsx` 或 `.json`。
中途淘寶要求滑動驗證的話，完成後按「繼續」。按「停止」可以提早結束。

| | 淘寶「导出订单」 | 本擴充功能 |
| --- | --- | --- |
| 每次匯出多少 | 最多 10 頁 | 全部、前 *N* 頁或日期範圍 |
| 格式 | Excel | Excel 或 JSON |
| 同一張單的第 2 件以後 | 訂單號、時間、店鋪留空 | 每行都有 |
| 金額 | 像 `￥26.80` 的文字 | 數字 |
| 圖片連結 | 沒有 | 有 |

檔案格式（Excel 工作表和 JSON 結構）見 [docs/DEVELOPMENT.md](../DEVELOPMENT.md#output-files)（英文）。

## 🛠️ 從原始碼建置

```bash
git clone https://github.com/HKmario852/Taobao-Order-Export.git
cd Taobao-Order-Export
node --test test/*.test.js          # Node 18 以上
zip -r taobao-order-export.zip manifest.json *.js _locales icons   # 打包上架用
```

不需要編譯。每次 push 到 `main`，**Actions** 也會產生一個可以直接上架的 zip。運作原理、重新產生截圖和新增語言，見 [docs/DEVELOPMENT.md](../DEVELOPMENT.md)。

**技術：** 純 JavaScript、Chrome Manifest V3、內建的小型 `.xlsx` 產生器、`node:test`。Playwright 只用來截圖。

## 🔐 私隱

擴充功能本身不發出任何網路請求，也沒有分析統計。匯出視窗的選擇會存在淘寶頁面的 local storage；訂單資料只留在開著的分頁，直到你下載。它不會匯出地址、電話或收件人姓名。詳見 [PRIVACY.md](../../PRIVACY.md)（英文）。

## ⚠️ 免責聲明

本擴充功能與淘寶、阿里巴巴無關。它讀取的是淘寶頁面自己載入的資料（非公開、沒有文件的內部回應），淘寶改版時可能會失效，直到擴充功能更新。運費、總價、優惠只在淘寶有提供時才會匯出；物流單號不會匯出。

## 📄 授權

[MIT](../../LICENSE) © HKmario852
