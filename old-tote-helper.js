(function () {
  var APP_ID = "tote-helper-worker-qa";
  var STYLE_ID = APP_ID + "-style";

  var old = document.getElementById(APP_ID);
  if (old) old.remove();

  var oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();

  var keyHandler = null;

  function setKey(fn) {
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler, true);
    }

    keyHandler = fn;

    if (fn) {
      document.addEventListener("keydown", keyHandler, true);
    }
  }

  var style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent =
    "#" + APP_ID + "{position:fixed;inset:0;z-index:2147483647;font-family:Arial,sans-serif;color:#111}" +
    "#" + APP_ID + " .backdrop{width:100%;height:100%;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center}" +
    "#" + APP_ID + " .box{width:940px;max-width:calc(100vw - 40px);max-height:calc(100vh - 24px);overflow:auto;background:#fff;border-radius:28px;padding:30px;box-sizing:border-box;text-align:center;box-shadow:0 26px 80px rgba(0,0,0,.45)}" +
    "#" + APP_ID + " h1{margin:0 0 22px;font-size:54px;line-height:1.1;color:#111;font-weight:900}" +
    "#" + APP_ID + " input{width:100%;box-sizing:border-box;font-size:48px;padding:24px;border:5px solid #111;border-radius:18px;text-align:center;margin:10px 0 26px;font-weight:800}" +
    "#" + APP_ID + " button{font-size:51px;font-weight:900;padding:30px 48px;border:0;border-radius:22px;background:#111;color:#fff;cursor:pointer;margin:10px;min-width:285px}" +
    "#" + APP_ID + " button.secondary{background:#777}" +
    "#" + APP_ID + " button.smallBtn{font-size:42px;padding:22px 38px;border-radius:18px;min-width:250px;margin:6px}" +
    "#" + APP_ID + " .label{font-size:28px;font-weight:900;color:#555;margin-top:22px;margin-bottom:8px}" +
    "#" + APP_ID + " .qty{font-size:122px;font-weight:900;line-height:1;margin:4px 0 20px;color:#111}" +
    "#" + APP_ID + " .product{font-size:48px;font-weight:900;line-height:1.22;margin:4px 0 18px;color:#111}" +
    "#" + APP_ID + " .sku{font-size:48px;font-weight:900;letter-spacing:1px;line-height:1.15;margin:4px 0 18px;color:#111}" +
    "#" + APP_ID + " .tote{font-size:58px;font-weight:900;letter-spacing:2px;line-height:1.15;margin:4px 0 30px;color:#111}" +
    "#" + APP_ID + " .barcodeTitle{font-size:42px;margin:0 0 14px}" +
    "#" + APP_ID + " .compactSummary{background:#f5f5f5;border:3px solid #ddd;border-radius:20px;padding:14px 18px;margin:0 0 14px}" +
    "#" + APP_ID + " .compactSummary .label{font-size:20px;margin-top:6px;margin-bottom:2px}" +
    "#" + APP_ID + " .compactQty{font-size:64px;font-weight:900;line-height:1;color:#111;margin:0 0 8px}" +
    "#" + APP_ID + " .compactProduct{font-size:30px;font-weight:900;line-height:1.18;color:#111;margin:0 0 8px}" +
    "#" + APP_ID + " .compactTote{font-size:38px;font-weight:900;letter-spacing:2px;line-height:1.1;color:#111;margin:0}" +
    "#" + APP_ID + " .multiTitle{font-size:42px;margin:0 0 14px}" +
    "#" + APP_ID + " .multiList{display:flex;flex-direction:column;gap:10px;margin:0 0 12px}" +
    "#" + APP_ID + " .card{display:block;width:100%;text-align:left;background:#fff;color:#111;border:4px solid #ddd;border-radius:18px;padding:14px 18px;margin:0;box-sizing:border-box}" +
    "#" + APP_ID + " .card:hover{border-color:#111}" +
    "#" + APP_ID + " .card .q{font-size:54px;font-weight:900;line-height:1;color:#111;margin-bottom:8px}" +
    "#" + APP_ID + " .card .p{font-size:30px;font-weight:900;line-height:1.18;margin-bottom:6px}" +
    "#" + APP_ID + " .card .s{font-size:28px;font-weight:900;line-height:1.18;margin-bottom:6px}" +
    "#" + APP_ID + " .card .t{font-size:32px;font-weight:900;letter-spacing:1px;line-height:1.18}" +
    "#" + APP_ID + " .error{font-size:42px;font-weight:900;color:#b42318;background:#fff4f2;border:4px solid #f3b7ae;border-radius:22px;padding:34px;margin:24px 0}" +
    "#" + APP_ID + " .barcodeBox{background:#fff;border:4px solid #111;border-radius:14px;padding:12px;margin:12px auto 14px;overflow:hidden}" +
    "#" + APP_ID + " .barcodeBox svg{width:100%;max-width:820px;height:130px!important;max-height:130px}" +
    "#" + APP_ID + " .msg{font-size:22px;color:#b42318;margin-top:8px;font-weight:900}";

  document.head.appendChild(style);

  var app = document.createElement("div");
  app.id = APP_ID;
  document.body.appendChild(app);

  function h(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render(html) {
    app.innerHTML = '<div class="backdrop"><div class="box">' + html + "</div></div>";
  }

  function closeApp() {
    setKey(null);

    var a = document.getElementById(APP_ID);
    var s = document.getElementById(STYLE_ID);

    if (a) a.remove();
    if (s) s.remove();
  }

  function fetchInventory(sku) {
    var url =
      "https://inventory.coupang.com/async/inventory/search" +
      "?searched=true" +
      "&locationType=" +
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
      "&page=0" +
      "&pageSize=20";

    return fetch(url, {
      method: "GET",
      headers: {
        "accept": "*/*",
        "content-type": "application/json",
        "x-requested-with": "XMLHttpRequest"
      },
      credentials: "include"
    }).then(function (res) {
      if (!res.ok) {
        throw new Error("조회 실패: " + res.status);
      }

      return res.json();
    });
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

  function handleInventoryResponse(data, sku) {
    var rows =
      data &&
      data.result &&
      data.result.content
        ? data.result.content
        : [];

    var gcRows = rows.filter(function (row) {
      return row.locationBarcode &&
        row.locationBarcode.indexOf("GC") === 0;
    });

    if (gcRows.length === 0) {
      showEmpty(sku);
      return;
    }

    if (gcRows.length === 1) {
      showBarcode(mapRow(gcRows[0]));
      return;
    }

    showSelect(gcRows);
  }

  function loadBarcode(cb) {
    if (window.JsBarcode) {
      cb();
      return;
    }

    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";

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
        JsBarcode("#toteRealBarcode", value, {
          format: "CODE128",
          width: 3,
          height: 115,
          displayValue: false,
          margin: 8
        });
      } catch (e) {
        var el = document.getElementById("barcodeError");
        if (el) {
          el.textContent = "바코드 생성 오류: " + e.message;
        }
      }
    });
  }

  function showScan() {
    setKey(function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeApp();
      }
    });

    render(
      '<h1>SKU 스캔</h1>' +
      '<input id="toteSkuInput" placeholder="바코드 스캔해주세요.">' +
      '<button id="closeBtn" class="secondary">닫기 Esc</button>'
    );

    var input = document.getElementById("toteSkuInput");

    document.getElementById("closeBtn").onclick = closeApp;

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        var sku = input.value.trim();
        if (!sku) return;

        showLoading(sku, function () {
          fetchInventory(sku)
            .then(function (data) {
              handleInventoryResponse(data, sku);
            })
            .catch(function (err) {
              console.error(err);
              showEmpty(sku);
            });
        });
      }
    });

    setTimeout(function () {
      input.focus();
    }, 100);
  }

  function showLoading(sku, next) {
    setKey(function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        showScan();
      }
    });

    render(
      '<h1>조회 중</h1>' +
      '<div class="sku">' + h(sku) + "</div>" +
      '<button id="cancelBtn" class="secondary">취소 Esc</button>'
    );

    document.getElementById("cancelBtn").onclick = showScan;

    setTimeout(next, 200);
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
      '<h1>수량 확인</h1>' +
      '<div class="label">수량</div>' +
      '<div class="qty">' + h(r.quantity) + "</div>" +
      '<div class="label">상품명</div>' +
      '<div class="product">' + h(r.skuName) + "</div>" +
      '<div class="label">상품바코드</div>' +
      '<div class="sku">' + h(r.skuBarcode) + "</div>" +
      '<div class="label">GC 토트바코드</div>' +
      '<div class="tote">' + h(r.toteBarcode) + "</div>" +
      '<button id="okBtn">맞음 Enter</button>' +
      '<button id="backBtn" class="secondary">다시 Esc</button>'
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
        showBarcode(rows[n - 1]);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        showScan();
      }
    });

    var html =
      '<h1 class="multiTitle">GC 토트를 선택하세요</h1>' +
      '<div class="multiList">';

    for (var i = 0; i < rows.length; i++) {
      html +=
        '<button class="card" data-i="' + i + '">' +
          '<div class="q">' +
            (i + 1) + "번 선택 · 수량 " + h(rows[i].quantity) +
          "</div>" +
          '<div class="p">' +
            h(rows[i].skuName) +
          "</div>" +
          '<div class="s">상품바코드 ' +
            h(rows[i].skuBarcode) +
          "</div>" +
          '<div class="t">GC 토트 ' +
            h(rows[i].toteBarcode) +
          "</div>" +
        "</button>";
    }

    html +=
      "</div>" +
      '<button id="backBtn" class="secondary smallBtn">다시 Esc</button>';

    render(html);

    document.getElementById("backBtn").onclick = showScan;

    var items = app.querySelectorAll(".card");

    for (var j = 0; j < items.length; j++) {
      items[j].onclick = function () {
        showBarcode(rows[Number(this.getAttribute("data-i"))]);
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
      '<h1 class="barcodeTitle">PDA로 스캔</h1>' +
      '<div class="compactSummary">' +
        '<div class="label">수량</div>' +
        '<div class="compactQty">' + h(r.quantity) + "</div>" +
        '<div class="label">상품명</div>' +
        '<div class="compactProduct">' + h(r.skuName) + "</div>" +
        '<div class="label">GC 토트바코드</div>' +
        '<div class="compactTote">' + h(r.toteBarcode) + "</div>" +
      "</div>" +
      '<div class="barcodeBox">' +
        '<svg id="toteRealBarcode"></svg>' +
        '<div id="barcodeError" class="msg"></div>' +
      "</div>" +
      '<button id="againBtn" class="smallBtn">처음으로 Enter</button>' +
      '<button id="closeBtn" class="secondary smallBtn">닫기 Esc</button>'
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
      '<h1>GC 토트 없음</h1>' +
      '<div class="error">해당 SKU의 GC 토트를 찾을 수 없습니다.</div>' +
      '<div class="sku">' + h(sku) + "</div>" +
      '<button id="backBtn">다시 Enter</button>' +
      '<button id="closeBtn" class="secondary">닫기 Esc</button>'
    );

    document.getElementById("backBtn").onclick = showScan;
    document.getElementById("closeBtn").onclick = closeApp;
  }

  showScan();
})();
