# GC Barcode Helper Extension

기존 Tote Helper를 Chrome 개발자 모드에서 테스트하기 위한 확장 프로그램 폴더입니다.

## 로컬 테스트 설치

1. Chrome 주소창에 `chrome://extensions`를 입력합니다.
2. 오른쪽 위 `개발자 모드`를 켭니다.
3. `압축해제된 확장 프로그램을 로드`를 클릭합니다.
4. 이 `extension` 폴더를 선택합니다.
5. `https://inventory.coupang.com/` 페이지를 엽니다.
6. Chrome 확장 프로그램 메뉴에서 `GC Barcode Helper`를 고정합니다.
7. WMS/Inventory 페이지에서 `GC Barcode Helper` 아이콘을 클릭합니다.

## 참고

- 루트의 원본 `new-tote-helper.js`는 변경하지 않았습니다.
- 확장 프로그램은 이 폴더 안의 복사본 `new-tote-helper.js`를 주입합니다.
- `JsBarcode`는 `vendor/` 안에 포함되어 있어 CDN 코드를 실행하지 않습니다.
- 이 폴더의 파일을 수정한 뒤에는 `chrome://extensions`에서 확장 프로그램 새로고침 버튼을 눌러야 합니다.
- 실제 업무 페이지 도메인이 `https://inventory.coupang.com/`와 다르면 `manifest.json`과 `background.js`의 허용 도메인을 같이 수정해야 합니다.
