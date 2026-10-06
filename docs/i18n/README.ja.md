<div align="center">

<img src="../../icons/128.png" width="96" height="96" alt="Order Exporter for Taobao のアイコン">

# Order Exporter for Taobao

**タオバオ（淘宝）の「已买到的宝贝」（購入した商品）にある全注文を、ブラウザ上で Excel または JSON に書き出します。**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-ff5000)
![Chrome | Edge | Brave](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-4285F4?logo=googlechrome&logoColor=white)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

[English](../../README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md) · [Español](README.es.md)

</div>

<p align="center">
  <img src="../screenshots/toolbar.png" alt="タオバオの「导出订单」ボタンの隣に追加される「全注文を書き出す」ボタン" width="88%">
</p>
<p align="center">
  <img src="../screenshots/dialog-en.png" alt="英語の書き出しダイアログ" width="44%">
  &nbsp;
  <img src="../screenshots/dialog-zh-CN.png" alt="中国語の書き出しダイアログ" width="44%">
</p>

<details>
<summary>その他のスクリーンショット</summary>

<p align="center"><img src="../screenshots/exporting.png" alt="書き出し中に自動でページをめくる様子" width="80%"></p>

スクリーンショットはすべて架空のデモ注文です。

</details>

> [!NOTE]
> 拡張機能の画面は英語・簡体字中国語・繁体字中国語のみです（日本語表示はありません）。

## ✨ 機能

- 📦 **全注文を最古のものまで**書き出し。タオバオ標準の「导出订单」は 1 回 10 ページまでです。
- 📅 **範囲を選択**：全注文、最初の *N* ページ、または期間指定。取引終了（交易关闭）の注文を除外することもできます。
- ☑️ **タオバオのダイアログと同じように項目を選択**：注文番号、日時、状態、ショップ、支払額、送料、合計、割引、商品、型番・バリエーション、数量、金額、商品リンク、画像。
- 📊 **Excel（.xlsx）または JSON。** Excel では各商品行に注文番号が入り、金額は数値、注文単位の「Orders」シートで合計が二重にならないようにしています。
- 🔒 **ローカルのみで動作。** アカウント・サーバー・トラッキングなし。タオバオのページが読み込んだデータだけを使います。
- 🌐 **画面の言語**はブラウザに合わせて英語・简体中文・繁體中文から選ばれます。

## 📥 インストール

> [!NOTE]
> まだ Chrome ウェブストアでは公開していません。当面はソースからインストールしてください。

1. このリポジトリをダウンロード（**Code › Download ZIP**）して展開します。
2. `chrome://extensions` を開きます（Edge：`edge://extensions`、Brave：`brave://extensions`）。
3. **デベロッパー モード**をオンにし、**パッケージ化されていない拡張機能を読み込む**で `manifest.json` のあるフォルダを選びます。

ブラウザはそのフォルダから拡張機能を読み込むので、削除しないでください。更新するときはフォルダを入れ替えて ↻ を押します。

## 🚀 使い方

1. タオバオにログインし、**我的淘宝 › 已买到的宝贝** を開きます。
2. タオバオの「导出订单」の隣、または右下の **Export all orders** をクリックします。
3. 項目・範囲・ファイル形式を選んで **Export** をクリックします。

拡張機能が自動で「次のページ」を押していきます（1 ページ約 2〜4 秒、30 件／ページ）。終わると `taobao-orders-<日付>.xlsx` または `.json` がダウンロードされます。
途中でスライダー認証が出たら、完了後に **Continue** を押してください。**Stop** で途中終了できます。

| | タオバオの「导出订单」 | この拡張機能 |
| --- | --- | --- |
| 1 回の書き出し | 最大 10 ページ | 全件、最初の *N* ページ、期間指定 |
| 形式 | Excel | Excel または JSON |
| 2 点目以降の商品行 | 注文番号・日時・ショップが空欄 | 常に入る |
| 金額 | `￥26.80` のような文字列 | 数値 |
| 画像リンク | なし | あり |

ファイルの構成（Excel のシートと JSON のスキーマ）は [docs/DEVELOPMENT.md](../DEVELOPMENT.md#output-files)（英語）を参照してください。

## 🛠️ ソースからビルド

```bash
git clone https://github.com/HKmario852/Taobao-Order-Export.git
cd Taobao-Order-Export
node --test test/*.test.js          # Node 18 以上
zip -r taobao-order-export.zip manifest.json *.js _locales icons   # ストア提出用
```

コンパイルは不要です。`main` へ push するたびに **Actions** でストア提出用の zip も作られます。仕組み、スクリーンショットの再生成、言語の追加は [docs/DEVELOPMENT.md](../DEVELOPMENT.md) へ。

**技術スタック：** 素の JavaScript、Chrome Manifest V3、組み込みの小さな `.xlsx` ライター、`node:test`。Playwright はスクリーンショット撮影にのみ使用します。

## 🔐 プライバシー

拡張機能自身はネットワーク通信を行わず、解析も行いません。ダイアログの選択内容はタオバオのページの local storage に保存され、注文データはダウンロードするまで開いているタブの中だけにあります。住所・電話番号・受取人名は書き出しません。詳しくは [PRIVACY.md](../../PRIVACY.md)（英語）。

## ⚠️ 免責事項

タオバオ／アリババとは関係ありません。タオバオのページ自身が読み込むデータ（非公開・ドキュメントのない内部レスポンス）を読むため、ページの変更で動かなくなることがあります。送料・合計・割引はタオバオが提供する場合のみ書き出され、配送伝票番号は書き出しません。

## 📄 ライセンス

[MIT](../../LICENSE) © HKmario852
