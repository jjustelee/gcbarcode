/**
 * tote-helper.js
 * ------------------------------------------------------------
 * 진열작업자용 토트바코드 셀프 조회 QA 버전
 *
 * 현재 상태:
 * - WMS 연동 전 QA용 하드코딩 데이터 사용
 * - SKU 스캔 → 수량 확인 → 토트바코드 Code128 생성
 * - 키보드 중심 조작 지원
 * - Enter / Esc / 숫자키 지원
 *
 * 나중에 WMS 연동 시 수정할 곳:
 * - fetchInventoryBySku() 함수
 *
 * UI 글씨 크기 / 색상 / 모달 크기 수정할 곳:
 * - 아래 CONFIG 영역
 * ------------------------------------------------------------
 */

(function () {
  "use strict";

  /**
   * ============================================================
   * 1. CONFIG 영역
   * ------------------------------------------------------------
   * 이 부분만 수정하면 화면 스타일 대부분을 바꿀 수 있습니다.
   * 글씨 크기, 색상, 버튼 크기, 모달 크기 등을 여기서 관리합니다.
   * ============================================================
   */
  const CONFIG = {
    /**
     * 앱 식별자
     * 기존에 열린 모달을 제거할 때 사용합니다.
     */
    appId: "tote-helper-worker-qa",

    /**
     * 바코드 라이브러리 주소
     * 회사망에서 CDN이 막히면 이 주소를 사내 JS 경로로 바꾸면 됩니다.
     */
    jsBarcodeUrl: "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js",

    /**
     * 색상 설정
     * ------------------------------------------------------------
     * 배경, 글자, 버튼, 오류 메시지 색상을 여기서 수정합니다.
     */
    colors: {
      overlay: "rgba(0,0,0,.72)",      // 모달 뒤 어두운 배경
      modalBg: "#ffffff",              // 모달 배경색
      text: "#111111",                 // 기본 글자색
      subText: "#555555",              // 라벨 글자색
      border: "#dddddd",               // 회색 테두리
      primaryButton: "#111111",        // 기본 버튼 배경
      secondaryButton: "#777777",      // 보조 버튼 배경
      buttonText: "#ffffff",           // 버튼 글자색
      summaryBg: "#f5f5f5",            // 바코드 화면 요약 박스 배경
      errorText: "#b42318",            // 오류 글자색
      errorBg: "#fff4f2",              // 오류 박스 배경
      errorBorder: "#f3b7ae"           // 오류 박스 테두리
    },

    /**
     * 모달 크기 / 여백 설정
     * ------------------------------------------------------------
     * 모달창이 너무 크거나 작으면 여기서 수정합니다.
     */
    layout: {
      modalWidth: "940px",             // 모달 기본 가로폭
      modalMaxWidth: "calc(100vw - 40px)",
      modalMaxHeight: "calc(100vh - 24px)",
      modalPadding: "30px",
      modalRadius: "28px",
      modalShadow: "0 26px 80px rgba(0,0,0,.45)"
    },

    /**
     * 글씨 크기 설정
     * ------------------------------------------------------------
     * 작업자 화면에서 가장 많이 수정할 가능성이 높은 영역입니다.
     */
    fontSize: {
      title: "54px",                   // 일반 화면 제목
      barcodeTitle: "42px",            // 바코드 화면 제목
      input: "48px",                   // 첫 화면 입력창 글씨
      button: "51px",                  // 일반 버튼 글씨
      smallButton: "42px",             // 바코드 화면 버튼 글씨
      label: "28px",                   // "수량", "상품명" 같은 라벨
      quantity: "122px",               // 수량 확인 화면의 큰 수량
      product: "48px",                 // 수량 확인 화면 상품명
      sku: "48px",                     // 상품바코드
      tote: "58px",                    // 토트바코드
      compactLabel: "20px",            // 바코드 화면 요약 라벨
      compactQuantity: "64px",         // 바코드 화면 요약 수량
      compactProduct: "30px",          // 바코드 화면 요약 상품명
      compactTote: "38px",             // 바코드 화면 요약 토트바코드
      multiTitle: "42px",              // 복수 선택 화면 제목
      multiQuantity: "54px",           // 복수 선택 카드 수량
      multiProduct: "30px",            // 복수 선택 카드 상품명
      multiSku: "28px",                // 복수 선택 카드 상품바코드
      multiTote: "32px",               // 복수 선택 카드 토트바코드
      error: "42px",                   // 오류 메시지
      qaButton: "18px"                 // QA 테스트 버튼
    },

    /**
     * 버튼 크기 설정
     * ------------------------------------------------------------
     * 작업자가 마우스를 덜 쓰더라도 버튼은 크게 두는 것이 좋습니다.
     */
    button: {
      padding: "30px 48px",
      radius: "22px",
      minWidth: "285px",
      margin: "10px",

      smallPadding: "22px 38px",
      smallRadius: "18px",
      smallMinWidth: "250px",
      smallMargin: "6px"
    },

    /**
     * 바코드 설정
     * ------------------------------------------------------------
     * PDA 스캔이 잘 안 되면 height, width, margin을 조정합니다.
     */
    barcode: {
      format: "CODE128",
      width: 3,
      height: 115,
      displayValue: false,
      margin: 8,
      svgHeight: "130px"
    },

    /**
     * 화면 문구 설정
     * ------------------------------------------------------------
     * 작업자에게 보이는 문구를 여기서 수정할 수 있습니다.
     */
    text: {
      scanTitle: "SKU 스캔",
      scanPlaceholder: "바코드 스캔해주세요.",
      loadingTitle: "조회 중",
      confirmTitle: "수량 확인",
      multiTitle: "해당하는 상품 번호를 누르세요",
      barcodeTitle: "PDA로 스캔",
      emptyTitle: "조회 없음",
      emptyMessage: "찾을 수 없음요. PS사원님께 문의해주세요~!!!",

      labelQuantity: "수량",
      labelProduct: "상품명",
      labelSku: "상품바코드",
      labelTote: "토트바코드",

      okButton: "맞음 Enter",
      backButton: "다시 Esc",
      closeButton: "닫기 Esc",
      cancelButton: "취소 Esc",
      firstButton: "처음으로 Enter"
    },

    /**
     * QA용 하드코딩 데이터
     * ------------------------------------------------------------
     * WMS 연동 전 화면 테스트용입니다.
     */
    qaData: {
      single: {
        toteBarcode: "A-12345-01",
        skuBarcode: "8801234567890",
        skuName: "QA 샘플 상품 A",
        quantity: "24",
        location: "196-PRB0-1-2"
      },
      second: {
        toteBarcode: "B-67890-02",
        skuBarcode: "8801234567890",
        skuName: "QA 샘플 상품 B",
        quantity: "12",
        location: "196-PRB0-1-3"
      }
    }
  };

  /**
   * ============================================================
   * 2. 내부 상태값
   * ============================================================
   */
  const STYLE_ID = CONFIG.appId + "-style";
  let appRoot = null;
  let currentKeyHandler = null;

  /**
   * ============================================================
   * 3. 초기화
   * ------------------------------------------------------------
   * 이미 실행 중인 모달이 있으면 제거하고 새로 실행합니다.
   * ============================================================
   */
  removePreviousApp();
  createStyle();
  createAppRoot();
  showScanScreen();

  /**
   * ============================================================
   * 4. 공통 유틸 함수
   * ============================================================
   */

  /**
   * 기존 모달과 스타일 제거
   * 북마크릿을 여러 번 눌렀을 때 중복 생성 방지
   */
  function removePreviousApp() {
    const oldApp = document.getElementById(CONFIG.appId);
    if (oldApp) oldApp.remove();

    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) oldStyle.remove();
  }

  /**
   * 키보드 이벤트 등록
   * 화면마다 Enter / Esc / 숫자키 동작이 다르기 때문에
   * 화면 전환 시 기존 키 이벤트를 제거하고 새로 등록합니다.
   */
  function setKeyHandler(handler) {
    if (currentKeyHandler) {
      document.removeEventListener("keydown", currentKeyHandler, true);
    }

    currentKeyHandler = handler;

    if (handler) {
      document.addEventListener("keydown", currentKeyHandler, true);
    }
  }

  /**
   * HTML 문자 이스케이프
   * 상품명/바코드에 특수문자가 들어와도 화면이 깨지지 않게 처리합니다.
   */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 모달 화면 렌더링
   */
  function render(html) {
    appRoot.innerHTML =
      '<div class="th-backdrop">' +
        '<div class="th-box">' +
          html +
        "</div>" +
      "</div>";
  }

  /**
   * 앱 닫기
   */
  function closeApp() {
    setKeyHandler(null);

    const app = document.getElementById(CONFIG.appId);
    if (app) app.remove();

    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  /**
   * ============================================================
   * 5. 스타일 생성
   * ------------------------------------------------------------
   * 글씨 크기 / 색상 / 버튼 크기는 대부분 CONFIG 영역에서 수정합니다.
   * ============================================================
   */
  function createStyle() {
    const c = CONFIG.colors;
    const l = CONFIG.layout;
    const f = CONFIG.fontSize;
    const b = CONFIG.button;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${CONFIG.appId} {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        font-family: Arial, sans-serif;
        color: ${c.text};
      }

      #${CONFIG.appId} .th-backdrop {
        width: 100%;
        height: 100%;
        background: ${c.overlay};
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 모달 전체 박스 */
      #${CONFIG.appId} .th-box {
        width: ${l.modalWidth};
        max-width: ${l.modalMaxWidth};
        max-height: ${l.modalMaxHeight};
        overflow: auto;
        background: ${c.modalBg};
        border-radius: ${l.modalRadius};
        padding: ${l.modalPadding};
        box-sizing: border-box;
        text-align: center;
        box-shadow: ${l.modalShadow};
      }

      /* 화면 제목 */
      #${CONFIG.appId} h1 {
        margin: 0 0 22px;
        font-size: ${f.title};
        line-height: 1.1;
        color: ${c.text};
        font-weight: 900;
      }

      /* 첫 화면 입력창 */
      #${CONFIG.appId} input {
        width: 100%;
        box-sizing: border-box;
        font-size: ${f.input};
        padding: 24px;
        border: 5px solid ${c.text};
        border-radius: 18px;
        text-align: center;
        margin: 10px 0 26px;
        font-weight: 800;
      }

      /* 일반 버튼 */
      #${CONFIG.appId} button {
        font-size: ${f.button};
        font-weight: 900;
        padding: ${b.padding};
        border: 0;
        border-radius: ${b.radius};
        background: ${c.primaryButton};
        color: ${c.buttonText};
        cursor: pointer;
        margin: ${b.margin};
        min-width: ${b.minWidth};
      }

      /* 보조 버튼 */
      #${CONFIG.appId} button.secondary {
        background: ${c.secondaryButton};
      }

      /* 바코드 화면처럼 좁은 곳에 쓰는 버튼 */
      #${CONFIG.appId} button.smallBtn {
        font-size: ${f.smallButton};
        padding: ${b.smallPadding};
        border-radius: ${b.smallRadius};
        min-width: ${b.smallMinWidth};
        margin: ${b.smallMargin};
      }

      /* 공통 라벨: 수량 / 상품명 / 상품바코드 / 토트바코드 */
      #${CONFIG.appId} .label {
        font-size: ${f.label};
        font-weight: 900;
        color: ${c.subText};
        margin-top: 22px;
        margin-bottom: 8px;
      }

      /* 수량 확인 화면 - 수량 */
      #${CONFIG.appId} .qty {
        font-size: ${f.quantity};
        font-weight: 900;
        line-height: 1;
        margin: 4px 0 20px;
        color: ${c.text};
      }

      /* 수량 확인 화면 - 상품명 */
      #${CONFIG.appId} .product {
        font-size: ${f.product};
        font-weight: 900;
        line-height: 1.22;
        margin: 4px 0 18px;
        color: ${c.text};
      }

      /* 수량 확인 화면 - 상품바코드 */
      #${CONFIG.appId} .sku {
        font-size: ${f.sku};
        font-weight: 900;
        letter-spacing: 1px;
        line-height: 1.15;
        margin: 4px 0 18px;
        color: ${c.text};
      }

      /* 수량 확인 화면 - 토트바코드 */
      #${CONFIG.appId} .tote {
        font-size: ${f.tote};
        font-weight: 900;
        letter-spacing: 2px;
        line-height: 1.15;
        margin: 4px 0 30px;
        color: ${c.text};
      }

      /* 바코드 화면 제목 */
      #${CONFIG.appId} .barcodeTitle {
        font-size: ${f.barcodeTitle};
        margin: 0 0 14px;
      }

      /* 바코드 화면 상단 요약 박스 */
      #${CONFIG.appId} .compactSummary {
        background: ${c.summaryBg};
        border: 3px solid ${c.border};
        border-radius: 20px;
        padding: 14px 18px;
        margin: 0 0 14px;
      }

      #${CONFIG.appId} .compactSummary .label {
        font-size: ${f.compactLabel};
        margin-top: 6px;
        margin-bottom: 2px;
      }

      #${CONFIG.appId} .compactQty {
        font-size: ${f.compactQuantity};
        font-weight: 900;
        line-height: 1;
        color: ${c.text};
        margin: 0 0 8px;
      }

      #${CONFIG.appId} .compactProduct {
        font-size: ${f.compactProduct};
        font-weight: 900;
        line-height: 1.18;
        color: ${c.text};
        margin: 0 0 8px;
      }

      #${CONFIG.appId} .compactTote {
        font-size: ${f.compactTote};
        font-weight: 900;
        letter-spacing: 2px;
        line-height: 1.1;
        color: ${c.text};
        margin: 0;
      }

      /* 복수 결과 화면 제목 */
      #${CONFIG.appId} .multiTitle {
        font-size: ${f.multiTitle};
        margin: 0 0 14px;
      }

      /* 복수 결과 카드 리스트 */
      #${CONFIG.appId} .multiList {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 0 0 12px;
      }

      /* 복수 결과 카드 */
      #${CONFIG.appId} .card {
        display: block;
        width: 100%;
        text-align: left;
        background: #fff;
        color: ${c.text};
        border: 4px solid ${c.border};
        border-radius: 18px;
        padding: 14px 18px;
        margin: 0;
        box-sizing: border-box;
      }

      #${CONFIG.appId} .card:hover {
        border-color: ${c.text};
      }

      #${CONFIG.appId} .card .q {
        font-size: ${f.multiQuantity};
        font-weight: 900;
        line-height: 1;
        color: ${c.text};
        margin-bottom: 8px;
      }

      #${CONFIG.appId} .card .p {
        font-size: ${f.multiProduct};
        font-weight: 900;
        line-height: 1.18;
        margin-bottom: 6px;
      }

      #${CONFIG.appId} .card .s {
        font-size: ${f.multiSku};
        font-weight: 900;
        line-height: 1.18;
        margin-bottom: 6px;
      }

      #${CONFIG.appId} .card .t {
        font-size: ${f.multiTote};
        font-weight: 900;
        letter-spacing: 1px;
        line-height: 1.18;
      }

      /* 조회 없음 / 오류 화면 */
      #${CONFIG.appId} .error {
        font-size: ${f.error};
        font-weight: 900;
        color: ${c.errorText};
        background: ${c.errorBg};
        border: 4px solid ${c.errorBorder};
        border-radius: 22px;
        padding: 34px;
        margin: 24px 0;
      }

      /* 바코드 영역 */
      #${CONFIG.appId} .barcodeBox {
        background: #fff;
        border: 4px solid ${c.text};
        border-radius: 14px;
        padding: 12px;
        margin: 12px auto 14px;
        overflow: hidden;
      }

      #${CONFIG.appId} .barcodeBox svg {
        width: 100%;
        max-width: 820px;
        height: ${CONFIG.barcode.svgHeight} !important;
        max-height: ${CONFIG.barcode.svgHeight};
      }

      /* 바코드 오류 메시지 */
      #${CONFIG.appId} .msg {
        font-size: 22px;
        color: ${c.errorText};
        margin-top: 8px;
        font-weight: 900;
      }

      /* QA 테스트 버튼 영역 */
      #${CONFIG.appId} .qa {
        margin-top: 24px;
        padding-top: 18px;
        border-top: 1px solid ${c.border};
      }

      #${CONFIG.appId} .qa button {
        font-size: ${f.qaButton};
        min-width: auto;
        padding: 10px 14px;
        border-radius: 10px;
        background: #999;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 앱 루트 생성
   */
  function createAppRoot() {
    appRoot = document.createElement("div");
    appRoot.id = CONFIG.appId;
    document.body.appendChild(appRoot);
  }

  /**
   * ============================================================
   * 6. QA 데이터 생성 함수
   * ------------------------------------------------------------
   * 현재는 WMS 연동 전이라 하드코딩 데이터를 반환합니다.
   * ============================================================
   */
  function createQaRow(sku, rowNumber) {
    const base = rowNumber === 2 ? CONFIG.qaData.second : CONFIG.qaData.single;

    return {
      toteBarcode: base.toteBarcode,
      skuBarcode: sku || base.skuBarcode,
      skuName: base.skuName,
      quantity: base.quantity,
      location: base.location
    };
  }

  /**
   * ============================================================
   * 7. WMS 조회 함수 자리
   * ------------------------------------------------------------
   * 나중에 실제 WMS URL을 붙일 때 가장 중요한 수정 위치입니다.
   *
   * 현재:
   * - 입력된 SKU를 받아서 QA용 단일 결과를 반환합니다.
   *
   * 나중:
   * - fetch()로 WMS 조회
   * - JSON 응답 파싱
   * - 토트바코드 / 상품명 / 수량 / 상품바코드 매핑
   * ============================================================
   */
  function fetchInventoryBySku(sku) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve([createQaRow(sku, 1)]);
      }, 450);
    });
  }

  /**
   * ============================================================
   * 8. 바코드 생성 관련 함수
   * ============================================================
   */

  /**
   * JsBarcode 라이브러리 로딩
   */
  function loadBarcodeLibrary(callback) {
    if (window.JsBarcode) {
      callback();
      return;
    }

    const script = document.createElement("script");
    script.src = CONFIG.jsBarcodeUrl;

    script.onload = callback;

    script.onerror = function () {
      const el = document.getElementById("barcodeError");
      if (el) {
        el.textContent = "바코드 생성 실패: CDN 차단 가능";
      }
    };

    document.head.appendChild(script);
  }

  /**
   * 실제 Code128 바코드 생성
   * 현재는 토트바코드 값(row.toteBarcode)을 바코드로 생성합니다.
   */
  function makeBarcode(value) {
    loadBarcodeLibrary(function () {
      try {
        window.JsBarcode("#toteRealBarcode", value, {
          format: CONFIG.barcode.format,
          width: CONFIG.barcode.width,
          height: CONFIG.barcode.height,
          displayValue: CONFIG.barcode.displayValue,
          margin: CONFIG.barcode.margin
        });
      } catch (error) {
        const el = document.getElementById("barcodeError");
        if (el) {
          el.textContent = "바코드 생성 오류: " + error.message;
        }
      }
    });
  }

  /**
   * ============================================================
   * 9. 화면 1 - SKU 스캔 화면
   * ============================================================
   */
  function showScanScreen() {
    setKeyHandler(function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeApp();
      }
    });

    render(
      `<h1>${CONFIG.text.scanTitle}</h1>
       <input id="toteSkuInput" placeholder="${CONFIG.text.scanPlaceholder}">
       <button id="closeBtn" class="secondary">${CONFIG.text.closeButton}</button>

       <!-- QA 테스트 버튼: 실제 배포 시 제거 가능 -->
       <div class="qa">
         <button id="qaOne">단일</button>
         <button id="qaMulti">복수</button>
         <button id="qaEmpty">없음</button>
         <button id="qaBarcode">바코드</button>
       </div>`
    );

    const input = document.getElementById("toteSkuInput");

    document.getElementById("closeBtn").onclick = closeApp;

    /**
     * QA 버튼
     * 실제 배포 시 이 4개 버튼은 제거해도 됩니다.
     */
    document.getElementById("qaOne").onclick = function () {
      showLoadingScreen("QA-SKU-001", function () {
        showConfirmScreen(createQaRow("QA-SKU-001", 1));
      });
    };

    document.getElementById("qaMulti").onclick = function () {
      showSelectScreen("QA-SKU-MULTI");
    };

    document.getElementById("qaEmpty").onclick = function () {
      showEmptyScreen("QA-SKU-EMPTY");
    };

    document.getElementById("qaBarcode").onclick = function () {
      showBarcodeScreen(createQaRow("QA-SKU-BARCODE", 1));
    };

    /**
     * 스캐너 입력 처리
     * 대부분의 바코드 스캐너는 입력 후 Enter를 자동 입력합니다.
     */
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();

        const sku = input.value.trim();
        if (!sku) return;

        showLoadingScreen(sku, function () {
          fetchInventoryBySku(sku).then(function (rows) {
            if (!rows || rows.length === 0) {
              showEmptyScreen(sku);
              return;
            }

            if (rows.length === 1) {
              showConfirmScreen(rows[0]);
              return;
            }

            showSelectScreen(sku, rows);
          });
        });
      }
    });

    /**
     * 모달이 뜨면 입력창에 자동 포커스
     */
    setTimeout(function () {
      input.focus();
    }, 100);
  }

  /**
   * ============================================================
   * 10. 화면 2 - 조회 중 화면
   * ============================================================
   */
  function showLoadingScreen(sku, next) {
    setKeyHandler(function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        showScanScreen();
      }
    });

    render(
      `<h1>${CONFIG.text.loadingTitle}</h1>
       <div class="sku">${escapeHtml(sku)}</div>
       <button id="cancelBtn" class="secondary">${CONFIG.text.cancelButton}</button>`
    );

    document.getElementById("cancelBtn").onclick = showScanScreen;

    next();
  }

  /**
   * ============================================================
   * 11. 화면 3 - 수량 확인 화면
   * ------------------------------------------------------------
   * 표시 순서:
   * 수량 → 상품명 → 상품바코드 → 토트바코드
   * ============================================================
   */
  function showConfirmScreen(row) {
    setKeyHandler(function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        showBarcodeScreen(row);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        showScanScreen();
      }
    });

    render(
      `<h1>${CONFIG.text.confirmTitle}</h1>

       <div class="label">${CONFIG.text.labelQuantity}</div>
       <div class="qty">${escapeHtml(row.quantity)}</div>

       <div class="label">${CONFIG.text.labelProduct}</div>
       <div class="product">${escapeHtml(row.skuName)}</div>

       <div class="label">${CONFIG.text.labelSku}</div>
       <div class="sku">${escapeHtml(row.skuBarcode)}</div>

       <div class="label">${CONFIG.text.labelTote}</div>
       <div class="tote">${escapeHtml(row.toteBarcode)}</div>

       <button id="okBtn">${CONFIG.text.okButton}</button>
       <button id="backBtn" class="secondary">${CONFIG.text.backButton}</button>`
    );

    document.getElementById("okBtn").onclick = function () {
      showBarcodeScreen(row);
    };

    document.getElementById("backBtn").onclick = showScanScreen;
  }

  /**
   * ============================================================
   * 12. 화면 4 - 복수 결과 선택 화면
   * ------------------------------------------------------------
   * 숫자키 1 / 2 로 선택할 수 있습니다.
   * ============================================================
   */
  function showSelectScreen(sku, rows) {
    const resultRows = rows || [createQaRow(sku, 1), createQaRow(sku, 2)];

    setKeyHandler(function (event) {
      if (event.key === "1" && resultRows[0]) {
        event.preventDefault();
        showConfirmScreen(resultRows[0]);
      }

      if (event.key === "2" && resultRows[1]) {
        event.preventDefault();
        showConfirmScreen(resultRows[1]);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        showScanScreen();
      }
    });

    let html = `<h1 class="multiTitle">${CONFIG.text.multiTitle}</h1><div class="multiList">`;

    resultRows.forEach(function (row, index) {
      html +=
        `<button class="card" data-index="${index}">
          <div class="q">${index + 1}번 선택 · 수량 ${escapeHtml(row.quantity)}</div>
          <div class="p">${escapeHtml(row.skuName)}</div>
          <div class="s">상품바코드 ${escapeHtml(row.skuBarcode)}</div>
          <div class="t">토트 ${escapeHtml(row.toteBarcode)}</div>
        </button>`;
    });

    html += `</div><button id="backBtn" class="secondary smallBtn">${CONFIG.text.backButton}</button>`;

    render(html);

    document.getElementById("backBtn").onclick = showScanScreen;

    const cards = appRoot.querySelectorAll(".card");

    cards.forEach(function (card) {
      card.onclick = function () {
        const index = Number(card.getAttribute("data-index"));
        showConfirmScreen(resultRows[index]);
      };
    });
  }

  /**
   * ============================================================
   * 13. 화면 5 - PDA 스캔용 바코드 화면
   * ------------------------------------------------------------
   * 이 화면에서는 토트바코드(row.toteBarcode)를 실제 Code128로 생성합니다.
   * ============================================================
   */
  function showBarcodeScreen(row) {
    setKeyHandler(function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        showScanScreen();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeApp();
      }
    });

    render(
      `<h1 class="barcodeTitle">${CONFIG.text.barcodeTitle}</h1>

       <div class="compactSummary">
         <div class="label">${CONFIG.text.labelQuantity}</div>
         <div class="compactQty">${escapeHtml(row.quantity)}</div>

         <div class="label">${CONFIG.text.labelProduct}</div>
         <div class="compactProduct">${escapeHtml(row.skuName)}</div>

         <div class="label">${CONFIG.text.labelTote}</div>
         <div class="compactTote">${escapeHtml(row.toteBarcode)}</div>
       </div>

       <div class="barcodeBox">
         <svg id="toteRealBarcode"></svg>
         <div id="barcodeError" class="msg"></div>
       </div>

       <button id="againBtn" class="smallBtn">${CONFIG.text.firstButton}</button>
       <button id="closeBtn" class="secondary smallBtn">${CONFIG.text.closeButton}</button>`
    );

    document.getElementById("againBtn").onclick = showScanScreen;
    document.getElementById("closeBtn").onclick = closeApp;

    makeBarcode(row.toteBarcode);
  }

  /**
   * ============================================================
   * 14. 화면 6 - 조회 없음 화면
   * ============================================================
   */
  function showEmptyScreen(sku) {
    setKeyHandler(function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        showScanScreen();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeApp();
      }
    });

    render(
      `<h1>${CONFIG.text.emptyTitle}</h1>
       <div class="error">${CONFIG.text.emptyMessage}</div>
       <div class="sku">${escapeHtml(sku)}</div>
       <button id="backBtn">${CONFIG.text.backButton.replace("Esc", "Enter")}</button>
       <button id="closeBtn" class="secondary">${CONFIG.text.closeButton}</button>`
    );

    document.getElementById("backBtn").onclick = showScanScreen;
    document.getElementById("closeBtn").onclick = closeApp;
  }
})();
