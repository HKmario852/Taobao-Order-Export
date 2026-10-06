<div align="center">

<img src="../../icons/128.png" width="96" height="96" alt="Order Exporter for Taobao 아이콘">

# Order Exporter for Taobao

**타오바오(淘宝) '已买到的宝贝'(구매한 상품)의 모든 주문을 브라우저에서 바로 Excel 또는 JSON으로 내보냅니다.**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-ff5000)
![Chrome | Edge | Brave](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-4285F4?logo=googlechrome&logoColor=white)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

[English](../../README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어** · [Español](README.es.md)

</div>

<p align="center">
  <img src="../screenshots/toolbar.png" alt="타오바오 '导出订单' 버튼 옆에 추가된 '모든 주문 내보내기' 버튼" width="88%">
</p>
<p align="center">
  <img src="../screenshots/dialog-en.png" alt="영어 내보내기 창" width="44%">
  &nbsp;
  <img src="../screenshots/dialog-zh-CN.png" alt="중국어 내보내기 창" width="44%">
</p>

<details>
<summary>스크린샷 더 보기</summary>

<p align="center"><img src="../screenshots/exporting.png" alt="내보내는 동안 자동으로 페이지를 넘기는 모습" width="80%"></p>

모든 스크린샷은 가상의 데모 주문을 사용했습니다.

</details>

> [!NOTE]
> 확장 프로그램 화면은 영어, 간체 중국어, 번체 중국어만 지원합니다(한국어 화면은 없습니다).

## ✨ 기능

- 📦 **가장 오래된 주문까지 전부** 내보냅니다. 타오바오 기본 '导出订单'은 한 번에 10페이지까지입니다.
- 📅 **범위 선택**: 전체 주문, 처음 *N* 페이지, 또는 기간 지정. 거래 종료(交易关闭) 주문은 뺄 수 있습니다.
- ☑️ **타오바오 창처럼 항목 선택**: 주문 번호, 시간, 상태, 상점, 결제 금액, 배송비, 총액, 할인, 상품, 옵션, 수량, 금액, 상품 링크, 사진.
- 📊 **Excel(.xlsx) 또는 JSON.** Excel에서는 모든 상품 행에 주문 번호가 들어가고, 금액은 숫자이며, 주문별 'Orders' 시트로 합계가 중복되지 않습니다.
- 🔒 **로컬에서만 동작.** 계정, 서버, 추적이 없으며 타오바오 페이지가 이미 불러온 데이터만 읽습니다.
- 🌐 **화면 언어**는 브라우저 언어에 따라 영어, 简体中文, 繁體中文 중에서 정해집니다.

## 📥 설치

> [!NOTE]
> 아직 Chrome 웹 스토어에 등록되지 않았습니다. 당분간 소스에서 설치해 주세요.

1. 이 저장소를 내려받아(**Code › Download ZIP**) 압축을 풉니다.
2. `chrome://extensions`를 엽니다(Edge: `edge://extensions`, Brave: `brave://extensions`).
3. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 눌러 `manifest.json`이 있는 폴더를 선택합니다.

브라우저가 그 폴더에서 확장 프로그램을 불러오므로 폴더를 지우지 마세요. 업데이트할 때는 폴더를 바꾼 뒤 ↻를 누릅니다.

## 🚀 사용법

1. 타오바오에 로그인하고 **我的淘宝 › 已买到的宝贝**를 엽니다.
2. 타오바오 '导出订单' 옆이나 오른쪽 아래의 **Export all orders**를 누릅니다.
3. 항목, 범위, 파일 형식을 고르고 **Export**를 누릅니다.

확장 프로그램이 '다음 페이지'를 스스로 누르며 읽습니다(페이지당 약 2~4초, 페이지당 30건). 끝나면 `taobao-orders-<날짜>.xlsx` 또는 `.json`이 내려받아집니다.
중간에 슬라이더 인증이 나오면 완료한 뒤 **Continue**를 누르세요. **Stop**으로 일찍 끝낼 수 있습니다.

| | 타오바오 '导出订单' | 이 확장 프로그램 |
| --- | --- | --- |
| 한 번에 내보내는 양 | 최대 10페이지 | 전체, 처음 *N* 페이지, 기간 지정 |
| 형식 | Excel | Excel 또는 JSON |
| 두 번째 이후 상품 행 | 주문 번호·시간·상점이 비어 있음 | 항상 채워짐 |
| 금액 | `￥26.80` 같은 텍스트 | 숫자 |
| 사진 링크 | 없음 | 있음 |

파일 구조(Excel 시트와 JSON 스키마)는 [docs/DEVELOPMENT.md](../DEVELOPMENT.md#output-files)(영어)를 참고하세요.

## 🛠️ 소스에서 빌드

```bash
git clone https://github.com/HKmario852/Taobao-Order-Export.git
cd Taobao-Order-Export
node --test test/*.test.js          # Node 18 이상
zip -r taobao-order-export.zip manifest.json *.js _locales icons   # 스토어 제출용
```

컴파일은 필요 없습니다. `main`에 push할 때마다 **Actions**에서 스토어 제출용 zip도 만들어집니다. 동작 원리, 스크린샷 다시 만들기, 언어 추가는 [docs/DEVELOPMENT.md](../DEVELOPMENT.md)를 보세요.

**기술 스택:** 순수 JavaScript, Chrome Manifest V3, 내장된 작은 `.xlsx` 작성기, `node:test`. Playwright는 스크린샷에만 씁니다.

## 🔐 개인정보

확장 프로그램은 자체적으로 네트워크 요청을 보내지 않고 분석 도구도 없습니다. 내보내기 창의 선택은 타오바오 페이지의 local storage에 저장되고, 주문 데이터는 내려받기 전까지 열린 탭 안에만 있습니다. 주소, 전화번호, 수령인 이름은 내보내지 않습니다. 자세한 내용은 [PRIVACY.md](../../PRIVACY.md)(영어).

## ⚠️ 면책 조항

타오바오, 알리바바와 관련이 없습니다. 타오바오 페이지가 스스로 불러오는 데이터(공개되지 않은 내부 응답)를 읽기 때문에 페이지가 바뀌면 업데이트 전까지 동작하지 않을 수 있습니다. 배송비, 총액, 할인은 타오바오가 제공할 때만 내보내며 운송장 번호는 내보내지 않습니다.

## 📄 라이선스

[MIT](../../LICENSE) © HKmario852
