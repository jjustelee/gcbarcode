(function () {
  "use strict";

  // ================================
  // 1. 설정 영역
  // ================================
  var CONFIG = {
    appId: "tote-helper-worker-qa",

    flow: {
      // false: GC 1개면 바로 바코드 화면
      // true: 수량 확인 화면을 거친 뒤 바코드 화면
      confirmBeforeBarcode: false
    },

    wms: {
      baseUrl: "https://inventory.coupang.com/async/inventory/search",
      loginUrl: "https://fc-auth2-wms.coupang.com/choose-your-login",
      locationType: "REAL_CART",
      gcPrefix: "GC",
      page: "0",
      pageSize: "20",
      maxPages: 5,
      headers: {
        "accept": "*/*",
        "content-type": "application/json",
        "x-requested-with": "XMLHttpRequest"
      }
    },

    barcode: {
      libraryUrl: "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js",
      format: "CODE128",
      width: 3,
      height: 115,
      displayValue: false,
      margin: 8,
      svgHeight: "130px"
    },

    text: {
      scanTitle: "SKU 스캔",
      scanPlaceholder: "바코드 스캔해주세요.",

      loadingTitle: "조회 중",
      cancelButton: "취소 Esc",

      confirmTitle: "수량 확인",
      labelQuantity: "수량",
      labelProduct: "상품명",
      labelSku: "상품바코드",
      labelGc: "GC바코드",

      okButton: "맞음 Enter",
      backButton: "다시 Esc",
      closeButton: "닫기 Esc",
      firstButton: "처음으로 Enter",

      selectTitle: "GC를 선택하세요",
      selectNumberSuffix: "번",
      selectQuantityPrefix: "선택 · 수량 ",
      selectGcPrefix: "GC 토트 ",

      barcodeTitle: "PDA로 스캔",

      emptyTitle: "GC바코드 없음",
      emptyMessage: "PS사원님에게 문의해주세요."
    },

    design: {
      colors: {
        text: "#111",
        subText: "#555",
        modalBg: "#fff",

        // 모달 실행 시 뒤 배경: 완전 검정
        backdrop: "#000",

        primaryButtonBg: "#111",
        secondaryButtonBg: "#777",
        buttonText: "#fff",

        border: "#ddd",
        summaryBg: "#f5f5f5",

        errorText: "#b42318",
        errorBg: "#fff4f2",
        errorBorder: "#f3b7ae",

        numberHighlight: "red"
      },

      modal: {
        width: "940px",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 24px)",
        padding: "30px",
        radius: "28px",
        shadow: "0 26px 80px rgba(0,0,0,.45)"
      },

      font: {
        title: "54px",
        input: "48px",
        button: "51px",
        smallButton: "42px",

        label: "28px",

        // 수량 확인 화면
        quantity: "244px",
        product: "120px",
        sku: "48px",
        tote: "58px",

        // 최종 PDA 스캔 화면
        barcodeTitle: "42px",
        compactLabel: "20px",
        compactQuantity: "64px",
        compactProduct: "30px",
        compactTote: "38px",

        // 복수 선택 화면
        multiTitle: "42px",
        multiQuantity: "54px",
        multiProduct: "30px",
        multiSku: "28px",
        multiTote: "32px",

        error: "42px",
        message: "22px"
      },

      input: {
        padding: "24px",
        borderWidth: "5px",
        radius: "18px",
        margin: "10px 0 26px"
      },

      button: {
        padding: "30px 48px",
        radius: "22px",
        margin: "10px",
        minWidth: "285px",

        smallPadding: "22px 38px",
        smallRadius: "18px",
        smallMargin: "6px",
        smallMinWidth: "250px"
      },

      spacing: {
        titleMargin: "0 0 22px",
        labelMarginTop: "22px",
        labelMarginBottom: "8px"
      },

      card: {
        borderWidth: "4px",
        radius: "18px",
        padding: "14px 18px",
        gap: "10px",
        marginBottom: "12px"
      },

      barcodeBox: {
        borderWidth: "4px",
        radius: "14px",
        padding: "12px",
        margin: "12px auto 14px"
      }
    },

    timing: {
      loadingDelayMs: 200,
      focusDelayMs: 100
    }
  };

  // ================================
  // 2. 내부 변수
  // ================================
  var APP_ID = CONFIG.appId;
  var STYLE_ID = APP_ID + "-style";
  var PENDING_SKU_KEY = APP_ID + "-pending-sku";
  var RETURN_URL_KEY = APP_ID + "-return-url";
  var app = null;
  var keyHandler = null;

  removePreviousApp();
  createStyle();
  createAppRoot();
  showScan();

  // ================================
  // 3. 공통 함수
  // ================================
  function removePreviousApp() {
    var old = document.getElementById(APP_ID);
    if (old) old.remove();

    var oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) oldStyle.remove();
  }

  function setKey(fn) {
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler, true);
    }

    keyHandler = fn;

    if (fn) {
      document.addEventListener("keydown", keyHandler, true);
    }
  }

  function h(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render(html) {
    app.innerHTML =
      '<div class="backdrop">' +
        '<div class="box">' +
          html +
        "</div>" +
      "</div>";
  }

  function closeApp() {
    setKey(null);

    var a = document.getElementById(APP_ID);
    var s = document.getElementById(STYLE_ID);

    if (a) a.remove();
    if (s) s.remove();
  }

  function savePendingSku(sku) {
    try {
      sessionStorage.setItem(PENDING_SKU_KEY, sku);
      sessionStorage.setItem(RETURN_URL_KEY, location.href);
    } catch (e) {
      console.warn("SKU 저장 실패", e);
    }
  }

  function loadPendingSku() {
    try {
      return sessionStorage.getItem(PENDING_SKU_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function clearPendingSku() {
    try {
      sessionStorage.removeItem(PENDING_SKU_KEY);
      sessionStorage.removeItem(RETURN_URL_KEY);
    } catch (e) {}
  }

  function createSessionExpiredError() {
    var error = new Error("SESSION_EXPIRED");
    error.code = "SESSION_EXPIRED";
    return error;
  }

  function isSessionExpiredError(error) {
    return error && (error.code === "SESSION_EXPIRED" || error.message === "SESSION_EXPIRED");
  }

  function looksLikeLoginPage(text, responseUrl) {
    return (
      responseUrl.indexOf("fc-auth2-wms.coupang.com") !== -1 ||
      text.indexOf("choose-your-login") !== -1 ||
      text.indexOf("FC LOGIN") !== -1 ||
      text.indexOf("로그인 유형") !== -1
    );
  }

  function redirectToLogin(sku) {
    savePendingSku(sku);
    location.href = CONFIG.wms.loginUrl;
  }

  // ================================
  // 4. 스타일 생성
  // ================================
  function createStyle() {
    var d = CONFIG.design;
    var c = d.colors;
    var f = d.font;
    var m = d.modal;
    var b = d.button;
    var input = d.input;
    var card = d.card;
    var barcodeBox = d.barcodeBox;

    var style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent =
      "#" + APP_ID + "{" +
        "position:fixed;" +
        "inset:0;" +
        "z-index:2147483647;" +
        "font-family:Arial,sans-serif;" +
        "color:" + c.text + ";" +
      "}" +

      "#" + APP_ID + " .backdrop{" +
        "width:100%;" +
        "height:100%;" +
        "background:" + c.backdrop + ";" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
      "}" +

      "#" + APP_ID + " .box{" +
        "width:" + m.width + ";" +
        "max-width:" + m.maxWidth + ";" +
        "max-height:" + m.maxHeight + ";" +
        "overflow:auto;" +
        "background:" + c.modalBg + ";" +
        "border-radius:" + m.radius + ";" +
        "padding:" + m.padding + ";" +
        "box-sizing:border-box;" +
        "text-align:center;" +
        "box-shadow:" + m.shadow + ";" +
      "}" +

      "#" + APP_ID + " h1{" +
        "margin:" + d.spacing.titleMargin + ";" +
        "font-size:" + f.title + ";" +
        "line-height:1.1;" +
        "color:" + c.text + ";" +
        "font-weight:900;" +
      "}" +

      "#" + APP_ID + " input{" +
        "width:100%;" +
        "box-sizing:border-box;" +
        "font-size:" + f.input + ";" +
        "padding:" + input.padding + ";" +
        "border:" + input.borderWidth + " solid " + c.text + ";" +
        "border-radius:" + input.radius + ";" +
        "text-align:center;" +
        "margin:" + input.margin + ";" +
        "font-weight:800;" +
      "}" +

      "#" + APP_ID + " button{" +
        "font-size:" + f.button + ";" +
        "font-weight:900;" +
        "padding:" + b.padding + ";" +
        "border:0;" +
        "border-radius:" + b.radius + ";" +
        "background:" + c.primaryButtonBg + ";" +
        "color:" + c.buttonText + ";" +
        "cursor:pointer;" +
        "margin:" + b.margin + ";" +
        "min-width:" + b.minWidth + ";" +
      "}" +

      "#" + APP_ID + " button.secondary{" +
        "background:" + c.secondaryButtonBg + ";" +
      "}" +

      "#" + APP_ID + " button.smallBtn{" +
        "font-size:" + f.smallButton + ";" +
        "padding:" + b.smallPadding + ";" +
        "border-radius:" + b.smallRadius + ";" +
        "min-width:" + b.smallMinWidth + ";" +
        "margin:" + b.smallMargin + ";" +
      "}" +

      "#" + APP_ID + " .label{" +
        "font-size:" + f.label + ";" +
        "font-weight:900;" +
        "color:" + c.subText + ";" +
        "margin-top:" + d.spacing.labelMarginTop + ";" +
        "margin-bottom:" + d.spacing.labelMarginBottom + ";" +
      "}" +

      "#" + APP_ID + " .qty{" +
        "font-size:" + f.quantity + ";" +
        "font-weight:900;" +
        "line-height:1;" +
        "margin:4px 0 20px;" +
        "color:" + c.text + ";" +
      "}" +

      "#" + APP_ID + " .product{" +
        "font-size:" + f.product + ";" +
        "font-weight:900;" +
        "line-height:1.22;" +
        "margin:4px 0 18px;" +
        "color:" + c.text + ";" +
      "}" +

      "#" + APP_ID + " .sku{" +
        "font-size:" + f.sku + ";" +
        "font-weight:900;" +
        "letter-spacing:1px;" +
        "line-height:1.15;" +
        "margin:4px 0 18px;" +
        "color:" + c.text + ";" +
      "}" +

      "#" + APP_ID + " .tote{" +
        "font-size:" + f.tote + ";" +
        "font-weight:900;" +
        "letter-spacing:2px;" +
        "line-height:1.15;" +
        "margin:4px 0 30px;" +
        "color:" + c.text + ";" +
      "}" +

      "#" + APP_ID + " .barcodeTitle{" +
        "font-size:" + f.barcodeTitle + ";" +
        "margin:0 0 14px;" +
      "}" +

      "#" + APP_ID + " .compactSummary{" +
        "background:" + c.summaryBg + ";" +
        "border:3px solid " + c.border + ";" +
        "border-radius:20px;" +
        "padding:14px 18px;" +
        "margin:0 0 14px;" +
      "}" +

      "#" + APP_ID + " .compactSummary .label{" +
        "font-size:" + f.compactLabel + ";" +
        "margin-top:6px;" +
        "margin-bottom:2px;" +
      "}" +

      "#" + APP_ID + " .compactQty{" +
        "font-size:" + f.compactQuantity + ";" +
        "font-weight:900;" +
        "line-height:1;" +
        "color:" + c.text + ";" +
        "margin:0 0 8px;" +
      "}" +

      "#" + APP_ID + " .compactProduct{" +
        "font-size:" + f.compactProduct + ";" +
        "font-weight:900;" +
        "line-height:1.18;" +
        "color:" + c.text + ";" +
        "margin:0 0 8px;" +
      "}" +

      "#" + APP_ID + " .compactTote{" +
        "font-size:" + f.compactTote + ";" +
        "font-weight:900;" +
        "letter-spacing:2px;" +
        "line-height:1.1;" +
        "color:" + c.text + ";" +
        "margin:0;" +
      "}" +

      "#" + APP_ID + " .multiTitle{" +
        "font-size:" + f.multiTitle + ";" +
        "margin:0 0 14px;" +
      "}" +

      "#" + APP_ID + " .multiList{" +
        "display:flex;" +
        "flex-direction:column;" +
        "gap:" + card.gap + ";" +
        "margin:0 0 " + card.marginBottom + ";" +
      "}" +

      "#" + APP_ID + " .card{" +
        "display:block;" +
        "width:100%;" +
        "text-align:left;" +
        "background:#fff;" +
        "color:" + c.text + ";" +
        "border:" + card.borderWidth + " solid " + c.border + ";" +
        "border-radius:" + card.radius + ";" +
        "padding:" + card.padding + ";" +
        "margin:0;" +
        "box-sizing:border-box;" +
      "}" +

      "#" + APP_ID + " .card:hover{" +
        "border-color:" + c.text + ";" +
      "}" +

      "#" + APP_ID + " .card .q{" +
        "font-size:" + f.multiQuantity + ";" +
        "font-weight:900;" +
        "line-height:1;" +
        "color:" + c.text + ";" +
        "margin-bottom:8px;" +
      "}" +

      "#" + APP_ID + " .card .num{" +
        "color:" + c.numberHighlight + ";" +
      "}" +

      "#" + APP_ID + " .card .p{" +
        "font-size:" + f.multiProduct + ";" +
        "font-weight:900;" +
        "line-height:1.18;" +
        "margin-bottom:6px;" +
      "}" +

      "#" + APP_ID + " .card .s{" +
        "font-size:" + f.multiSku + ";" +
        "font-weight:900;" +
        "line-height:1.18;" +
        "margin-bottom:6px;" +
      "}" +

      "#" + APP_ID + " .card .t{" +
        "font-size:" + f.multiTote + ";" +
        "font-weight:900;" +
        "letter-spacing:1px;" +
        "line-height:1.18;" +
      "}" +

      "#" + APP_ID + " .error{" +
        "font-size:" + f.error + ";" +
        "font-weight:900;" +
        "color:" + c.errorText + ";" +
        "background:" + c.errorBg + ";" +
        "border:4px solid " + c.errorBorder + ";" +
        "border-radius:22px;" +
        "padding:34px;" +
        "margin:24px 0;" +
      "}" +

      "#" + APP_ID + " .barcodeBox{" +
        "background:#fff;" +
        "border:" + barcodeBox.borderWidth + " solid " + c.text + ";" +
        "border-radius:" + barcodeBox.radius + ";" +
        "padding:" + barcodeBox.padding + ";" +
        "margin:" + barcodeBox.margin + ";" +
        "overflow:hidden;" +
      "}" +

      "#" + APP_ID + " .barcodeBox svg{" +
        "width:100%;" +
        "max-width:820px;" +
        "height:" + CONFIG.barcode.svgHeight + "!important;" +
        "max-height:" + CONFIG.barcode.svgHeight + ";" +
      "}" +

      "#" + APP_ID + " .msg{" +
        "font-size:" + f.message + ";" +
        "color:" + c.errorText + ";" +
        "margin-top:8px;" +
        "font-weight:900;" +
      "}";

    document.head.appendChild(style);
  }

  function createAppRoot() {
    app = document.createElement("div");
    app.id = APP_ID;
    document.body.appendChild(app);
  }

  // ================================
  // 5. WMS 조회
  // ================================
  function buildInventoryUrl(sku, page) {
    return (
      CONFIG.wms.baseUrl +
      "?searched=true" +
      "&locationType=" + encodeURIComponent(CONFIG.wms.locationType) +
      "&zone=" +
      "&fromLocation=" +
      "&toLocation=" +
      "&locationBarcode=" +
      "&skuId=" +
      "&externalSkuId=" +
      "&skuBarcode=" + encodeURIComponent(sku) +
      "&lpnId=" +
      "&inventoryId=" +
      "&saleableChangeType=" +
      "&availableInventory=true" +
      "&page=" + page +
      "&pageSize=" + CONFIG.wms.pageSize
    );
  }

  function getInventoryRows(data) {
    return (
      data &&
      data.result &&
      data.result.content
        ? data.result.content
        : []
    );
  }

  function makeInventoryData(rows) {
    return {
      result: {
        content: rows
      }
    };
  }

  function fetchInventoryPage(sku, page) {
    var url = buildInventoryUrl(sku, page);

    return fetch(url, {
      method: "GET",
      headers: CONFIG.wms.headers,
      credentials: "include"
    }).then(function (res) {
      var contentType = res.headers.get("content-type") || "";

      return res.text().then(function (text) {
        if (
          contentType.indexOf("application/json") === -1 ||
          looksLikeLoginPage(text, res.url)
        ) {
          throw createSessionExpiredError();
        }

        if (!res.ok) {
          throw new Error("조회 실패: " + res.status);
        }

        try {
          return JSON.parse(text);
        } catch (e) {
          throw createSessionExpiredError();
        }
      });
    });
  }

  function fetchInventory(sku, onProgress) {
    var startPage = Number(CONFIG.wms.page) || 0;
    var maxPages = Number(CONFIG.wms.maxPages) || 1;
    var pageSize = Number(CONFIG.wms.pageSize) || 20;
    var collectedRows = [];

    function searchPage(pageIndex) {
      var searchedPageCount = pageIndex - startPage + 1;

      if (onProgress) {
        onProgress(searchedPageCount, maxPages);
      }

      return fetchInventoryPage(sku, pageIndex).then(function (data) {
        var rows = getInventoryRows(data);
        var gcRows = rows.filter(isGcRow);

        collectedRows = collectedRows.concat(rows);

        if (
          gcRows.length > 0 ||
          rows.length < pageSize ||
          searchedPageCount >= maxPages
        ) {
          return makeInventoryData(collectedRows);
        }

        return searchPage(pageIndex + 1);
      });
    }

    return searchPage(startPage);
  }

  function mapRow(row) {
    return {
      toteBarcode: row.locationBarcode,
      skuBarcode: row.skuDto ? row.skuDto.skuBarcode : "",
      skuName: row.skuDto ? row.skuDto.skuName : "",
      quantity: row.quantity,
      location: row.locationBarcode,
      lpnBarcode: row.lpnDto ? row.lpnDto.lpnBarcode : ""
    };
  }

  function isGcRow(row) {
    return (
      row.locationBarcode &&
      row.locationBarcode.indexOf(CONFIG.wms.gcPrefix) === 0
    );
  }

  function handleInventoryResponse(data, sku) {
    var rows = getInventoryRows(data);

    var gcRows = rows.filter(isGcRow);

    if (gcRows.length === 0) {
      showEmpty(sku);
      return;
    }

    if (gcRows.length === 1) {
      if (CONFIG.flow.confirmBeforeBarcode) {
        showConfirm(mapRow(gcRows[0]));
      } else {
        showBarcode(mapRow(gcRows[0]));
      }
      return;
    }

    showSelect(gcRows);
  }

  // ================================
  // 6. 바코드 생성
  // ================================
  function loadBarcode(cb) {
    if (window.JsBarcode) {
      cb();
      return;
    }

    var s = document.createElement("script");
    s.src = CONFIG.barcode.libraryUrl;

    s.onload = cb;

    s.onerror = function () {
      var el = document.getElementById("barcodeError");
      if (el) {
        el.textContent = "바코드 생성 실패: CDN 차단 가능";
      }
    };

    document.head.appendChild(s);
  }

  function makeBarcode(value) {
    loadBarcode(function () {
      try {
        window.JsBarcode("#toteRealBarcode", value, {
          format: CONFIG.barcode.format,
          width: CONFIG.barcode.width,
          height: CONFIG.barcode.height,
          displayValue: CONFIG.barcode.displayValue,
          margin: CONFIG.barcode.margin
        });
      } catch (e) {
        var el = document.getElementById("barcodeError");
        if (el) {
          el.textContent = "바코드 생성 오류: " + e.message;
        }
      }
    });
  }

  // ================================
  // 7. 화면
  // ================================
  function showScan() {
    setKey(function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeApp();
      }
    });

    render(
      '<h1>' + CONFIG.text.scanTitle + "</h1>" +
      '<input id="toteSkuInput" placeholder="' + CONFIG.text.scanPlaceholder + '">' +
      '<button id="closeBtn" class="secondary">' + CONFIG.text.closeButton + "</button>"
    );

    var input = document.getElementById("toteSkuInput");
    var pendingSku = loadPendingSku();

    document.getElementById("closeBtn").onclick = closeApp;

    if (pendingSku) {
      input.value = pendingSku;
      input.select();
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        var sku = input.value.trim();
        if (!sku) return;

        clearPendingSku();

        showLoading(sku, function (updateLoadingPage) {
          fetchInventory(sku, updateLoadingPage)
            .then(function (data) {
              handleInventoryResponse(data, sku);
            })
            .catch(function (err) {
              console.error(err);
              if (isSessionExpiredError(err)) {
                redirectToLogin(sku);
                return;
              }
              showEmpty(sku);
            });
        });
      }
    });

    setTimeout(function () {
      input.focus();
    }, CONFIG.timing.focusDelayMs);
  }

  function showLoading(sku, next) {
    setKey(function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        showScan();
      }
    });

    render(
      '<h1>' + CONFIG.text.loadingTitle + "</h1>" +
      '<div class="sku">' + h(sku) + "</div>" +
      '<div id="toteLoadingProgress" class="label"></div>' +
      '<button id="cancelBtn" class="secondary">' + CONFIG.text.cancelButton + "</button>"
    );

    document.getElementById("cancelBtn").onclick = showScan;

    function updateLoadingPage(current, total) {
      var el = document.getElementById("toteLoadingProgress");

      if (el) {
        el.textContent = "재고 목록 " + current + " / " + total + " 페이지 조회 중";
      }
    }

    setTimeout(function () {
      next(updateLoadingPage);
    }, CONFIG.timing.loadingDelayMs);
  }

  function showConfirm(r) {
    setKey(function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        showBarcode(r);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        showScan();
      }
    });

    render(
      '<h1>' + CONFIG.text.confirmTitle + "</h1>" +

      '<div class="label">' + CONFIG.text.labelQuantity + "</div>" +
      '<div class="qty">' + h(r.quantity) + "</div>" +

      '<div class="label">' + CONFIG.text.labelProduct + "</div>" +
      '<div class="product">' + h(r.skuName) + "</div>" +

      '<div class="label">' + CONFIG.text.labelSku + "</div>" +
      '<div class="sku">' + h(r.skuBarcode) + "</div>" +

      '<div class="label">' + CONFIG.text.labelGc + "</div>" +
      '<div class="tote">' + h(r.toteBarcode) + "</div>" +

      '<button id="okBtn">' + CONFIG.text.okButton + "</button>" +
      '<button id="backBtn" class="secondary">' + CONFIG.text.backButton + "</button>"
    );

    document.getElementById("okBtn").onclick = function () {
      showBarcode(r);
    };

    document.getElementById("backBtn").onclick = showScan;
  }

  function showSelect(rawRows) {
    var rows = rawRows.map(mapRow);

    setKey(function (e) {
      var n = Number(e.key);

      if (n >= 1 && n <= rows.length) {
        e.preventDefault();

        if (CONFIG.flow.confirmBeforeBarcode) {
          showConfirm(rows[n - 1]);
        } else {
          showBarcode(rows[n - 1]);
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        showScan();
      }
    });

    var html =
      '<h1 class="multiTitle">' + CONFIG.text.selectTitle + "</h1>" +
      '<div class="multiList">';

    for (var i = 0; i < rows.length; i++) {
      html +=
        '<button class="card" data-i="' + i + '">' +

          '<div class="q">' +
            '<span class="num">' + (i + 1) + CONFIG.text.selectNumberSuffix + "</span>" +
            " " + CONFIG.text.selectQuantityPrefix + h(rows[i].quantity) +
          "</div>" +

          '<div class="p">' +
            h(rows[i].skuName) +
          "</div>" +

          '<div class="s">' +
            CONFIG.text.labelSku + " " + h(rows[i].skuBarcode) +
          "</div>" +

          '<div class="t">' +
            CONFIG.text.selectGcPrefix + h(rows[i].toteBarcode) +
          "</div>" +

        "</button>";
    }

    html +=
      "</div>" +
      '<button id="backBtn" class="secondary smallBtn">' + CONFIG.text.backButton + "</button>";

    render(html);

    document.getElementById("backBtn").onclick = showScan;

    var items = app.querySelectorAll(".card");

    for (var j = 0; j < items.length; j++) {
      items[j].onclick = function () {
        var index = Number(this.getAttribute("data-i"));

        if (CONFIG.flow.confirmBeforeBarcode) {
          showConfirm(rows[index]);
        } else {
          showBarcode(rows[index]);
        }
      };
    }
  }

  function showBarcode(r) {
    setKey(function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        showScan();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        closeApp();
      }
    });

    render(
      '<h1 class="barcodeTitle">' + CONFIG.text.barcodeTitle + "</h1>" +

      '<div class="compactSummary">' +

        '<div class="label">' + CONFIG.text.labelQuantity + "</div>" +
        '<div class="compactQty">' + h(r.quantity) + "</div>" +

        '<div class="label">' + CONFIG.text.labelProduct + "</div>" +
        '<div class="compactProduct">' + h(r.skuName) + "</div>" +

        '<div class="label">' + CONFIG.text.labelGc + "</div>" +
        '<div class="compactTote">' + h(r.toteBarcode) + "</div>" +

      "</div>" +

      '<div class="barcodeBox">' +
        '<svg id="toteRealBarcode"></svg>' +
        '<div id="barcodeError" class="msg"></div>' +
      "</div>" +

      '<button id="againBtn" class="smallBtn">' + CONFIG.text.firstButton + "</button>" +
      '<button id="closeBtn" class="secondary smallBtn">' + CONFIG.text.closeButton + "</button>"
    );

    document.getElementById("againBtn").onclick = showScan;
    document.getElementById("closeBtn").onclick = closeApp;

    makeBarcode(r.toteBarcode);
  }

  function showEmpty(sku) {
    setKey(function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        showScan();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        closeApp();
      }
    });

    render(
      '<h1>' + CONFIG.text.emptyTitle + "</h1>" +
      '<div class="error">' + CONFIG.text.emptyMessage + "</div>" +
      '<div class="sku">' + h(sku) + "</div>" +
      '<button id="backBtn">' + CONFIG.text.backButton.replace("Esc", "Enter") + "</button>" +
      '<button id="closeBtn" class="secondary">' + CONFIG.text.closeButton + "</button>"
    );

    document.getElementById("backBtn").onclick = showScan;
    document.getElementById("closeBtn").onclick = closeApp;
  }
})();
