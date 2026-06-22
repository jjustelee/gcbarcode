(async () => {
  'use strict';

  const APP_TITLE = 'CT Location Grab · DON1CFC Jace v0.2';
  const DEFAULT_TO_CENTER_CODE = 'DON1CFC';
  const DEFAULT_SEARCH_DATE_TYPE = 'UPLOAD_COMPLETED_DATE';
  const DEFAULT_SELECTED_STATUSES = ['STOWED'];
  const DEFAULT_QUICK_RANGE = '15';
  const CONCURRENCY = 3;
  const GLOBAL_REQUEST_GAP_MS = 200;
  const RETRY_DELAY_MS = 1800;
  const FETCH_RETRY_COUNT = 1;
  const PAGE_SIZE = 20;
  const MAX_PAGE = 200;
  const MAX_GC_PER_CT = 150;
  const STORAGE_KEY = 'grabCtV4Settings';
  const PANEL_ID = 'ct-location-grab-v4-modal';
  const STYLE_ID = 'ct-location-grab-v4-style';
  const GLOBAL_ABORT_KEY = '__grabCtV4AbortController';
  const RUN_ID_KEY = '__grabCtV4RunId';

  const SEARCH_DATE_TYPES = [
    { value: 'PICKING_START_DATE', label: '집품시작' },
    { value: 'PICKING_COMPLETED_DATE', label: '집품완료' },
    { value: 'UPLOAD_COMPLETED_DATE', label: '상차완료' },
    { value: 'UNLOAD_COMPLETED_DATE', label: '하차완료' },
    { value: 'STOWING_COMPLETED_DATE', label: '진열완료' }
  ];

  const STATUS_OPTIONS = [
    { value: '', label: '전체' },
    { value: 'PICK', label: '집품중' },
    { value: 'PICKED', label: '상차대기' },
    { value: 'PACK', label: '상차패킹' },
    { value: 'LOAD', label: '이동중' },
    { value: 'UNLOAD', label: '진열대기' },
    { value: 'STOW', label: '진열중' },
    { value: 'STOWED', label: '진열완료' }
  ];

  const QUICK_RANGES = [
    { value: '1', label: '오늘', days: 1 },
    { value: '3', label: '3일', days: 3 },
    { value: '7', label: '7일', days: 7 },
    { value: '15', label: '15일', days: 15 }
  ];

  const QUICK_TO_CENTERS = ['DON1CFC', 'DON1'];

  const CENTER_CODES = `
ANS1
ANS4
ANS5
ANS6
ANS8
BUC1
BUC2
BUC3
CHA1
CHA10
CHA2
CHA3
CHA6
CHA8
CHW1
CHW2
CHW3
CHW4
DAE3
DAE4
DAE6
DAE7
DAE8
DAEGU
DAEGU2
DAJ1
DEO2
DON1
DON1CFC
DS01
DS02
ECH1
ECH2
ECH3
ECH4
FFF1
GEW2
GEW4
GMH1
GON1
GON2
GOY1
GOY1CFC
GOY2
GOY3
GOY4
GWJ1
GWJ2
GWJ2CFC
GWJ3
GWJ4
GWJ5
GYS1
GYS3
HOB1
INC11
INC12
INC13
INC14
INC14CFC
INC15
INC16
INC17
INC20
INC22
INC25
INC26
INC28
INC29
INC30
INC31
INC32
INC33
INC36
INC37
INC39
INC4
INC40
INC41
INC42
INC44
INC45
INC47
INC48
INC4_CFC
INC5
KKW1
KKW3
KKW5
KKW6
MAJ1
MCN1
MF01
MF02
MF03
MF04
MF05
MF06
MF07
MF08
MF09
MF10
MF101
MF102
MF103
MF104
MF105
MF11
MF12
MF13
MF14
MF15
MF16
MF17
MF18
MF19
MF20
MF21
MF22
MF23
MF24
MF25
MF26
MF27
MF28
MF29
MF30
MF31
MF32
MF40
MF41
MF42
MF43
MF44
MF45
MF46
MF50
MF51
MF52
MF53
MF54
MF55
MF60
MGMH5
MINC34
PYT1
PYT2
PYT3
PYT5
RGSF1
SAN2
SAN3
SEC1
SEL1
SEN2
SFAPL1
SFAYG1
SFAYG10
SFBSN5
SFBUC3
SFCHA1
SFCHJ1
SFDJN2
SFDJN3
SFGMH1
SFGMP1
SFGNP1
SFGWJ1
SFGWJ2
SFHWS1
SFICH2
SFISN1
SFISN2
SFISN5
SFJAN1
SFJCH1
SFJCH2
SFJEJ1
SFJEJ2
SFJJU1
SFNGH2
SFNHN1
SFNYJ2
SFNYJ3
SFODD1
SFODD2
SFODD3
SFODD4
SFSCH1
SFSPA3
SFSSN1
SFUSN1
SFWBS2
SFWDG1
SFYAT1
SIH1
SIH2
SIH3
SIH5
SIH6
SIH7
SRBUC1
SRINC1
TESTF1
TESTF2
TESTGT1
TESTMF1
TESTMFGEN2
TESTN1
TESTN2
TESTR1
TESTUD1
TESTUD2
TESTUS1
TESTUS2
TESTUS3
TESTUS4
TESTUS5
TESTUS6
TIR1
TW1
TWEX1
TWXC06
VCS1
VF104
VF106
VF107
VF108
VF110
VF113
VF116
VF117
VF12
VF121
VF124
VF125
VF126
VF127
VF128
VF129
VF130
VF131
VF134
VF135
VF137
VF138
VF139
VF140
VF141
VF145
VF146
VF147
VF148
VF149
VF150
VF151
VF154
VF156
VF157
VF16
VF161
VF162
VF168
VF169
VF170
VF172
VF174
VF175
VF176
VF177
VF178
VF179
VF180
VF181
VF182
VF184
VF185
VF186
VF187
VF188
VF189
VF190
VF192
VF194
VF195
VF197
VF199
VF200
VF201
VF202
VF203
VF204
VF205
VF206
VF207
VF208
VF21
VF28
VF33
VF35
VF39
VF4
VF42
VF44
VF46
VF47
VF49
VF50
VF51
VF57
VF58
VF601
VF606
VF609
VF610
VF611
VF63
VF66
VF69
VF7
VF76
VF79
VF80
VF82
VF83
VF88
VF90
VF91
VF94
VF95
VF96
VF97
VF98
VF99
VFR1
VFR2
VFR3
WF02
WF03
WF05
WF06
WF07
WF08
WF09
WF10
WF11
WF21
WF31
WF41
WF43
WF46
WF81
WF82
WI01
WI02
WI03
WI04
WIC1
WIE1
WIE2
WIE3
WIG1
WIS1
WIS2
WIW1
WIW2
XBD1
XC02
XC03
XC04
XC05
XC06
XC07
XC08
XDDJN3
XDDTN1
XDDTN2
XDGMH1
XDGUM1
XDICH1
XDISN2
XDISN3
XDNYJ1
XDSCH1
XDSHG2
XDYIN1
XDmNYJ3
XHB1
XHB2
XHM4
XHM5
XHM6
XHM7
XRC01
XRC02
XRC03
XRC04
XRC05
XRC06
XRC07
XRC08
XRC09
XRC10
XRC11
XRC12
XRC13
XRC14
XRG1
YAN3
YAN4
YAN5
YAN7
YAS1
YEO1
YEO2
YON1
YON3
YON4
YON5
YON6
ZTF1
ZTN1
`.trim().split(/\s+/);

  const cleanupPreviousRun = () => {
    ['__grabCtV2AbortController', '__grabCtV3AbortController', GLOBAL_ABORT_KEY].forEach(key => {
      if (window[key]) {
        window[key].abort();
        window[key] = null;
      }
    });

    [
      'ct-location-grab-v2-modal',
      'ct-location-grab-v2-style',
      'ct-location-grab-v3-modal',
      'ct-location-grab-v3-style',
      PANEL_ID,
      STYLE_ID
    ].forEach(id => {
      document.getElementById(id)?.remove();
    });
  };

  cleanupPreviousRun();
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window[RUN_ID_KEY] = runId;

  const isCurrentRun = () => window[RUN_ID_KEY] === runId;

  const clean = (text) =>
    (text || '')
      .replace(/\s+/g, ' ')
      .trim();

  const createAbortError = () => {
    const error = new Error('ABORTED');
    error.name = 'AbortError';
    return error;
  };

  const isAbortError = (error) =>
    error?.name === 'AbortError' || error?.message === 'ABORTED';

  const isSessionExpired = (error) => error?.message === 'SESSION_EXPIRED';

  const getFriendlyErrorMessage = (error) => {
    const message = error?.message || String(error);
    const status = error?.status || message.match(/FETCH_FAILED_(\d+)/)?.[1];

    if (message === 'CT_REQUIRED') {
      return 'CT 바코드를 입력한 뒤 다시 조회하세요.';
    }

    if (status === 401 || status === '401' || status === 403 || status === '403') {
      return 'WMS 권한 또는 로그인 상태를 확인한 뒤 다시 조회하세요.';
    }

    if (status === 404 || status === '404') {
      return 'WMS 조회 페이지에 연결하지 못했습니다. 현재 WMS 화면 또는 접속 주소를 확인한 뒤 다시 실행하세요.';
    }

    if (status === 502 || status === '502' || status === 503 || status === '503' || status === 504 || status === '504') {
      return 'WMS 응답이 지연되고 있습니다. 잠시 후 다시 조회하세요.';
    }

    if (error instanceof TypeError) {
      return 'WMS에 연결할 수 없습니다. 내부망, VPN, 로그인 상태를 확인한 뒤 다시 조회하세요.';
    }

    return '조회 중 문제가 발생했습니다. WMS 로그인 상태와 조회 조건을 확인한 뒤 다시 시도하세요.';
  };

  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(createAbortError());
    }, { once: true });
  });

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const normalizeDateInputValue = (value) => {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length !== 8) return '';

    const yyyy = digits.slice(0, 4);
    const mm = digits.slice(4, 6);
    const dd = digits.slice(6, 8);
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));

    if (
      date.getFullYear() !== Number(yyyy) ||
      date.getMonth() + 1 !== Number(mm) ||
      date.getDate() !== Number(dd)
    ) {
      return '';
    }

    return `${yyyy}-${mm}-${dd}`;
  };

  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const getQuickDateRange = (quickRange) => {
    const quick = QUICK_RANGES.find(item => item.value === String(quickRange)) ||
      QUICK_RANGES.find(item => item.value === DEFAULT_QUICK_RANGE);
    const today = new Date();
    const startDate = addDays(today, -(quick.days - 1));

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(today)
    };
  };

  const loadSettings = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (error) {
      return {};
    }
  };

  const saveSettings = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('[설정 저장 실패]', error);
    }
  };

  const normalizeCenterCode = (value) => {
    const normalized = clean(value);
    return normalized === '전체' ? '' : normalized;
  };

  const getStatusLabel = (value) =>
    STATUS_OPTIONS.find(option => option.value === value)?.label || value || '전체';

  const getDateTypeLabel = (value) =>
    SEARCH_DATE_TYPES.find(option => option.value === value)?.label || value;

  const sanitizeStatuses = (statuses) => {
    const values = Array.isArray(statuses) ? statuses : DEFAULT_SELECTED_STATUSES;
    const validValues = new Set(STATUS_OPTIONS.map(option => option.value));
    const sanitized = [...new Set(values)].filter(value => validValues.has(value));

    if (!sanitized.length) return [...DEFAULT_SELECTED_STATUSES];
    if (sanitized.includes('')) return [''];

    return sanitized;
  };

  const installStyle = () => {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(17, 24, 39, 0.79);
        font-family: Arial, sans-serif;
        color: #f9fafb;
      }
      #${PANEL_ID} * {
        box-sizing: border-box;
      }
      #${PANEL_ID} .ct-modal {
        width: min(640px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        overflow: auto;
        background: #111827;
        border: 1px solid #374151;
        border-radius: 8px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      }
      #${PANEL_ID} .ct-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #374151;
      }
      #${PANEL_ID} .ct-title {
        font-size: 16px;
        font-weight: 700;
      }
      #${PANEL_ID} .ct-close {
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 6px;
        background: #1f2937;
        color: #e5e7eb;
        cursor: pointer;
        font-weight: 700;
      }
      #${PANEL_ID} .ct-body {
        padding: 14px 16px;
      }
      #${PANEL_ID} label {
        display: block;
        margin: 0 0 5px;
        color: #d1d5db;
        font-size: 12px;
        font-weight: 700;
      }
      #${PANEL_ID} .ct-field {
        margin-bottom: 10px;
      }
      #${PANEL_ID} .ct-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }
      #${PANEL_ID} input[type="text"],
      #${PANEL_ID} input[type="date"] {
        width: 100%;
        height: 34px;
        border: 1px solid #374151;
        border-radius: 6px;
        padding: 0 10px;
        background: #030712;
        color: #ffffff;
        outline: none;
        font-size: 13px;
        color-scheme: dark;
      }
      #${PANEL_ID} input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.9;
        filter: invert(1) brightness(1.4);
      }
      #${PANEL_ID} input.ct-date-picker-native {
        position: absolute;
        right: 6px;
        top: 50%;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-50%);
      }
      #${PANEL_ID} .ct-date-wrap {
        position: relative;
      }
      #${PANEL_ID} .ct-date-wrap input[type="text"] {
        padding-right: 38px;
      }
      #${PANEL_ID} .ct-date-button {
        position: absolute;
        right: 6px;
        top: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: 0;
        border-radius: 5px;
        background: #1f2937;
        color: #e5e7eb;
        cursor: pointer;
        transform: translateY(-50%);
      }
      #${PANEL_ID} .ct-date-button::before {
        content: "";
        width: 13px;
        height: 13px;
        border: 1.5px solid currentColor;
        border-radius: 2px;
        box-shadow: inset 0 4px 0 rgba(229, 231, 235, 0.22);
      }
      #${PANEL_ID} .ct-date-button::after {
        content: "";
        position: absolute;
        top: 7px;
        width: 10px;
        height: 1.5px;
        background: currentColor;
      }
      #${PANEL_ID} .ct-date-button:hover {
        background: #374151;
      }
      #${PANEL_ID} input:focus {
        border-color: #16a34a;
        box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.14);
      }
      #${PANEL_ID} .ct-input-error {
        border-color: #dc2626 !important;
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.12) !important;
      }
      #${PANEL_ID} .ct-section {
        margin-bottom: 10px;
      }
      #${PANEL_ID} .ct-segments,
      #${PANEL_ID} .ct-statuses {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #${PANEL_ID} .ct-segment,
      #${PANEL_ID} .ct-status-chip {
        min-height: 32px;
        border: 1px solid #374151;
        border-radius: 6px;
        padding: 0 10px;
        background: #1f2937;
        color: #d1d5db;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
      }
      #${PANEL_ID} .ct-segment.is-active,
      #${PANEL_ID} .ct-status-chip.is-active {
        border-color: #22c55e;
        background: #064e3b;
        color: #ffffff;
      }
      #${PANEL_ID} .ct-advanced-toggle {
        height: 28px;
        border: 1px solid #374151;
        border-radius: 6px;
        padding: 0 10px;
        background: #111827;
        color: #d1d5db;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
      }
      #${PANEL_ID} .ct-simple-grid {
        display: grid;
        grid-template-columns: 1fr 176px;
        gap: 10px;
        margin-bottom: 8px;
      }
      #${PANEL_ID} .ct-simple-summary {
        margin: 5px 0 9px;
        color: #9ca3af;
        font-size: 12px;
        line-height: 1.35;
      }
      #${PANEL_ID} .ct-advanced {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #374151;
      }
      #${PANEL_ID} .ct-advanced[hidden] {
        display: none;
      }
      #${PANEL_ID} .ct-advanced-range {
        display: none;
      }
      #${PANEL_ID} .ct-options-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 4px 0 10px;
      }
      #${PANEL_ID} .ct-checkbox {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #d1d5db;
        font-size: 13px;
        font-weight: 700;
      }
      #${PANEL_ID} .ct-checkbox input {
        width: 16px;
        height: 16px;
        accent-color: #16a34a;
      }
      #${PANEL_ID} .ct-summary {
        color: #9ca3af;
        font-size: 12px;
      }
      #${PANEL_ID} .ct-status-message {
        min-height: 20px;
        margin: 10px 0 8px;
        padding: 9px 10px;
        border-radius: 6px;
        background: #1f2937;
        color: #f9fafb;
        font-size: 13px;
      }
      #${PANEL_ID} .ct-status-message.is-error {
        background: #7f1d1d;
        color: #fee2e2;
      }
      #${PANEL_ID} .ct-status-message.is-warning {
        background: #78350f;
        color: #fef3c7;
      }
      #${PANEL_ID} .ct-status-message.is-success {
        background: #064e3b;
        color: #dcfce7;
      }
      #${PANEL_ID} .ct-progress-wrap {
        width: 100%;
        height: 8px;
        overflow: hidden;
        border-radius: 4px;
        background: #374151;
      }
      #${PANEL_ID} .ct-progress-bar {
        width: 0%;
        height: 100%;
        background: #16a34a;
        transition: width 0.2s;
      }
      #${PANEL_ID} .ct-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      #${PANEL_ID} .ct-chip {
        padding: 4px 7px;
        border-radius: 999px;
        background: #1f2937;
        color: #d1d5db;
        font-size: 12px;
      }
      #${PANEL_ID} .ct-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid #374151;
        background: #0f172a;
      }
      #${PANEL_ID} .ct-button {
        height: 34px;
        border: 0;
        border-radius: 6px;
        padding: 0 13px;
        color: #ffffff;
        cursor: pointer;
        font-weight: 700;
        font-size: 13px;
      }
      #${PANEL_ID} .ct-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      #${PANEL_ID} .ct-primary {
        background: #16a34a;
      }
      #${PANEL_ID} .ct-danger {
        background: #dc2626;
      }
      #${PANEL_ID} .ct-secondary {
        background: #374151;
      }
      @media (max-width: 640px) {
        #${PANEL_ID} {
          padding: 12px;
          align-items: flex-start;
        }
        #${PANEL_ID} .ct-grid-2 {
          grid-template-columns: 1fr;
        }
        #${PANEL_ID} .ct-simple-grid {
          grid-template-columns: 1fr;
        }
        #${PANEL_ID} .ct-options-row {
          align-items: flex-start;
          flex-direction: column;
        }
        #${PANEL_ID} .ct-footer {
          flex-wrap: wrap;
        }
        #${PANEL_ID} .ct-button {
          flex: 1 1 auto;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const createPanel = () => {
    installStyle();

    const settings = loadSettings();
    const hasSavedDateRange = Boolean(settings.startDate && settings.endDate);
    const initialQuickRange = hasSavedDateRange
      ? String(settings.quickRange || '')
      : String(settings.quickRange || DEFAULT_QUICK_RANGE);
    const initialRange = hasSavedDateRange
      ? { startDate: settings.startDate, endDate: settings.endDate }
      : getQuickDateRange(initialQuickRange || DEFAULT_QUICK_RANGE);
    let selectedSearchDateType = settings.searchDateType || DEFAULT_SEARCH_DATE_TYPE;
    let selectedStatuses = sanitizeStatuses(settings.selectedStatuses);
    let selectedQuickRange = initialQuickRange;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="ct-modal" role="dialog" aria-modal="true" aria-label="${APP_TITLE}">
        <div class="ct-header">
          <div class="ct-title">${APP_TITLE}</div>
          <button type="button" class="ct-close" data-action="close" title="닫기">x</button>
        </div>
        <div class="ct-body">
          <div class="ct-field">
            <label for="ct-container-input">CT 바코드 *</label>
            <input id="ct-container-input" type="text" autocomplete="off" placeholder="CT 바코드 입력">
          </div>

          <div class="ct-field">
            <label for="ct-sku-barcode-input">상품바코드 (선택)</label>
            <input id="ct-sku-barcode-input" type="text" autocomplete="off" placeholder="CT 안에서 특정 상품만 찾을 때 입력">
          </div>

          <div class="ct-simple-grid">
            <div>
              <label>기간</label>
              <div class="ct-segments" data-role="quick-ranges">
                ${QUICK_RANGES.map(item => `
                  <button type="button" class="ct-segment" data-quick-range="${item.value}">${item.label}</button>
                `).join('')}
              </div>
            </div>
            <div>
              <label>받는 센터</label>
              <div class="ct-segments" data-role="to-center-quick">
                ${QUICK_TO_CENTERS.map(code => `
                  <button type="button" class="ct-segment" data-to-center="${code}">${code}</button>
                `).join('')}
                <button type="button" class="ct-segment" data-to-center-custom hidden></button>
              </div>
            </div>
          </div>

          <div class="ct-simple-summary" data-role="simple-summary"></div>
          <button type="button" class="ct-advanced-toggle" data-action="toggle-advanced">상세검색 ▼</button>

          <div class="ct-advanced" data-role="advanced" hidden>
          <div class="ct-grid-2">
            <div>
              <label for="ct-from-center-input">보내는 센터 (직접 입력 가능)</label>
              <input id="ct-from-center-input" type="text" list="ct-center-list" autocomplete="off" placeholder="전체">
            </div>
            <div>
              <label for="ct-to-center-input">받는 센터 (직접 입력 가능)</label>
              <input id="ct-to-center-input" type="text" list="ct-center-list" autocomplete="off" placeholder="${DEFAULT_TO_CENTER_CODE}">
            </div>
          </div>

          <datalist id="ct-center-list">
            <option value="전체"></option>
            ${CENTER_CODES.map(code => `<option value="${code}"></option>`).join('')}
          </datalist>

          <div class="ct-section">
            <label>조회일 기준</label>
            <div class="ct-segments" data-role="date-types">
              ${SEARCH_DATE_TYPES.map(item => `
                <button type="button" class="ct-segment" data-date-type="${item.value}">${item.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="ct-section">
            <label>상태 (복수선택 가능)</label>
            <div class="ct-statuses" data-role="statuses">
              ${STATUS_OPTIONS.map(item => `
                <button type="button" class="ct-status-chip" data-status="${item.value}">${item.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="ct-section ct-advanced-range">
            <label>기간</label>
            <div class="ct-segments" data-role="quick-ranges">
              ${QUICK_RANGES.map(item => `
                <button type="button" class="ct-segment" data-quick-range="${item.value}">${item.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="ct-grid-2">
            <div>
              <label for="ct-start-date-input">시작일</label>
              <div class="ct-date-wrap">
                <input id="ct-start-date-input" type="text" inputmode="numeric" autocomplete="off" placeholder="YYYYMMDD">
                <input id="ct-start-date-picker" class="ct-date-picker-native" type="date" tabindex="-1" aria-hidden="true">
                <button type="button" class="ct-date-button" data-date-picker="start" title="시작일 선택" aria-label="시작일 선택"></button>
              </div>
            </div>
            <div>
              <label for="ct-end-date-input">종료일</label>
              <div class="ct-date-wrap">
                <input id="ct-end-date-input" type="text" inputmode="numeric" autocomplete="off" placeholder="YYYYMMDD">
                <input id="ct-end-date-picker" class="ct-date-picker-native" type="date" tabindex="-1" aria-hidden="true">
                <button type="button" class="ct-date-button" data-date-picker="end" title="종료일 선택" aria-label="종료일 선택"></button>
              </div>
            </div>
          </div>

          <div class="ct-options-row">
            <label class="ct-checkbox">
              <input id="ct-auto-download-input" type="checkbox">
              <span>조회 완료 시 CSV 자동 다운로드</span>
            </label>
            <div class="ct-summary" data-role="condition-summary"></div>
          </div>
          </div>

          <div class="ct-status-message" data-role="status">대기 중</div>
          <div class="ct-progress-wrap">
            <div class="ct-progress-bar" data-role="bar"></div>
          </div>
          <div class="ct-meta">
            <span class="ct-chip" data-role="count">0 / 0 (0%)</span>
            <span class="ct-chip" data-role="list">목록 0</span>
            <span class="ct-chip" data-role="success">성공 0</span>
            <span class="ct-chip" data-role="failure">실패 0</span>
            <span class="ct-chip" data-role="rows">결과 0행</span>
          </div>
        </div>
        <div class="ct-footer">
          <button type="button" class="ct-button ct-primary" data-action="start">조회 시작</button>
          <button type="button" class="ct-button ct-danger" data-action="stop" disabled>중지</button>
          <button type="button" class="ct-button ct-secondary" data-action="download" disabled>CSV 다운로드</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const containerInput = panel.querySelector('#ct-container-input');
    const skuBarcodeInput = panel.querySelector('#ct-sku-barcode-input');
    const fromCenterInput = panel.querySelector('#ct-from-center-input');
    const toCenterInput = panel.querySelector('#ct-to-center-input');
    const startDateInput = panel.querySelector('#ct-start-date-input');
    const endDateInput = panel.querySelector('#ct-end-date-input');
    const startDatePicker = panel.querySelector('#ct-start-date-picker');
    const endDatePicker = panel.querySelector('#ct-end-date-picker');
    const startDateButton = panel.querySelector('[data-date-picker="start"]');
    const endDateButton = panel.querySelector('[data-date-picker="end"]');
    const autoDownloadInput = panel.querySelector('#ct-auto-download-input');
    const startButton = panel.querySelector('[data-action="start"]');
    const stopButton = panel.querySelector('[data-action="stop"]');
    const downloadButton = panel.querySelector('[data-action="download"]');
    const closeButton = panel.querySelector('[data-action="close"]');
    const advancedToggleButton = panel.querySelector('[data-action="toggle-advanced"]');
    const advancedSection = panel.querySelector('[data-role="advanced"]');
    const status = panel.querySelector('[data-role="status"]');
    const bar = panel.querySelector('[data-role="bar"]');
    const count = panel.querySelector('[data-role="count"]');
    const list = panel.querySelector('[data-role="list"]');
    const success = panel.querySelector('[data-role="success"]');
    const failure = panel.querySelector('[data-role="failure"]');
    const rows = panel.querySelector('[data-role="rows"]');
    const conditionSummary = panel.querySelector('[data-role="condition-summary"]');
    const simpleSummary = panel.querySelector('[data-role="simple-summary"]');
    const dateTypeButtons = [...panel.querySelectorAll('[data-date-type]')];
    const statusButtons = [...panel.querySelectorAll('[data-status]')];
    const quickRangeButtons = [...panel.querySelectorAll('[data-quick-range]')];
    const toCenterQuickButtons = [...panel.querySelectorAll('[data-to-center]')];
    const toCenterCustomButton = panel.querySelector('[data-to-center-custom]');

    let advancedOpen = false;

    containerInput.value = '';
    skuBarcodeInput.value = '';
    fromCenterInput.value = settings.fromCenterCode || '전체';
    toCenterInput.value = settings.toCenterCode || DEFAULT_TO_CENTER_CODE;
    startDateInput.value = initialRange.startDate;
    endDateInput.value = initialRange.endDate;
    startDatePicker.value = initialRange.startDate;
    endDatePicker.value = initialRange.endDate;
    autoDownloadInput.checked = settings.autoDownloadCsv !== false;

    const setStatusTone = (tone = '') => {
      status.classList.toggle('is-error', tone === 'error');
      status.classList.toggle('is-warning', tone === 'warning');
      status.classList.toggle('is-success', tone === 'success');
    };

    const refreshDateTypeButtons = () => {
      dateTypeButtons.forEach(button => {
        button.classList.toggle('is-active', button.dataset.dateType === selectedSearchDateType);
      });
    };

    const refreshStatusButtons = () => {
      statusButtons.forEach(button => {
        button.classList.toggle('is-active', selectedStatuses.includes(button.dataset.status));
      });
    };

    const refreshQuickRangeButtons = () => {
      quickRangeButtons.forEach(button => {
        button.classList.toggle('is-active', button.dataset.quickRange === selectedQuickRange);
      });
    };

    const refreshToCenterButtons = () => {
      const rawToCenter = clean(toCenterInput.value);
      const normalizedToCenter = normalizeCenterCode(rawToCenter);
      const selectedToCenter = rawToCenter ? (normalizedToCenter || '전체') : DEFAULT_TO_CENTER_CODE;
      const isQuickCenter = QUICK_TO_CENTERS.includes(selectedToCenter);

      toCenterQuickButtons.forEach(button => {
        button.classList.toggle('is-active', button.dataset.toCenter === selectedToCenter);
      });

      if (toCenterCustomButton) {
        toCenterCustomButton.hidden = !selectedToCenter || isQuickCenter;
        toCenterCustomButton.textContent = selectedToCenter;
        toCenterCustomButton.classList.toggle('is-active', Boolean(selectedToCenter && !isQuickCenter));
      }
    };

    const refreshConditionSummary = () => {
      const statusCount = selectedStatuses.includes('') ? 1 : selectedStatuses.length;
      conditionSummary.textContent = `상태 ${statusCount}개 선택됨 · 목록 조회 ${statusCount}회 예정`;
    };

    const refreshSimpleSummary = () => {
      const fromCenter = normalizeCenterCode(fromCenterInput.value) || '전체';
      const rawToCenter = clean(toCenterInput.value);
      const normalizedToCenter = normalizeCenterCode(rawToCenter);
      const toCenter = rawToCenter ? (normalizedToCenter || '전체') : DEFAULT_TO_CENTER_CODE;
      const statusText = selectedStatuses.map(getStatusLabel).join(', ');
      const skuText = clean(skuBarcodeInput.value) ? ` · 상품바코드 ${clean(skuBarcodeInput.value)}` : '';
      const autoText = autoDownloadInput.checked ? '자동 다운로드 ON' : '자동 다운로드 OFF';

      simpleSummary.textContent =
        `${statusText} · ${getDateTypeLabel(selectedSearchDateType)} 기준 · ` +
        `보내는 센터 ${fromCenter} · 받는 센터 ${toCenter}${skuText} · ${autoText}`;
    };

    const refreshSelections = () => {
      refreshDateTypeButtons();
      refreshStatusButtons();
      refreshQuickRangeButtons();
      refreshToCenterButtons();
      refreshConditionSummary();
      refreshSimpleSummary();
    };

    dateTypeButtons.forEach(button => {
      button.addEventListener('click', () => {
        selectedSearchDateType = button.dataset.dateType;
        refreshSelections();
      });
    });

    advancedToggleButton.addEventListener('click', () => {
      advancedOpen = !advancedOpen;
      advancedSection.hidden = !advancedOpen;
      advancedToggleButton.textContent = advancedOpen ? '상세검색 ▲' : '상세검색 ▼';
    });

    toCenterQuickButtons.forEach(button => {
      button.addEventListener('click', () => {
        toCenterInput.value = button.dataset.toCenter;
        refreshSelections();
      });
    });

    [skuBarcodeInput, fromCenterInput, toCenterInput, autoDownloadInput].forEach(input => {
      input.addEventListener('input', refreshSelections);
      input.addEventListener('change', refreshSelections);
    });

    statusButtons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.status;

        if (value === '') {
          selectedStatuses = [''];
        } else {
          selectedStatuses = selectedStatuses.filter(statusValue => statusValue !== '');

          if (selectedStatuses.includes(value)) {
            selectedStatuses = selectedStatuses.filter(statusValue => statusValue !== value);
          } else {
            selectedStatuses.push(value);
          }

          if (!selectedStatuses.length) {
            selectedStatuses = [...DEFAULT_SELECTED_STATUSES];
          }
        }

        refreshSelections();
      });
    });

    quickRangeButtons.forEach(button => {
      button.addEventListener('click', () => {
        selectedQuickRange = button.dataset.quickRange;
        const range = getQuickDateRange(selectedQuickRange);
        startDateInput.value = range.startDate;
        endDateInput.value = range.endDate;
        startDatePicker.value = range.startDate;
        endDatePicker.value = range.endDate;
        refreshSelections();
      });
    });

    const syncDateTextInput = (textInput, pickerInput) => {
      const normalized = normalizeDateInputValue(textInput.value);

      if (normalized) {
        textInput.value = normalized;
        pickerInput.value = normalized;
      }

      selectedQuickRange = '';
      refreshSelections();
    };

    [
      { textInput: startDateInput, pickerInput: startDatePicker },
      { textInput: endDateInput, pickerInput: endDatePicker }
    ].forEach(({ textInput, pickerInput }) => {
      textInput.addEventListener('input', () => {
        const normalized = normalizeDateInputValue(textInput.value);

        if (!normalized) return;

        textInput.value = normalized;
        pickerInput.value = normalized;
        selectedQuickRange = '';
        refreshSelections();
      });

      textInput.addEventListener('paste', (event) => {
        const pastedText = event.clipboardData?.getData('text') || '';
        const normalized = normalizeDateInputValue(pastedText);

        if (!normalized) return;

        event.preventDefault();
        textInput.value = normalized;
        pickerInput.value = normalized;
        selectedQuickRange = '';
        refreshSelections();
      });

      textInput.addEventListener('blur', () => {
        syncDateTextInput(textInput, pickerInput);
      });

      pickerInput.addEventListener('change', () => {
        textInput.value = pickerInput.value;
        selectedQuickRange = '';
        refreshSelections();
      });
    });

    const openDatePicker = (textInput, pickerInput) => {
      pickerInput.value = normalizeDateInputValue(textInput.value) || pickerInput.value;
      textInput.focus();

      if (typeof pickerInput.showPicker === 'function') {
        pickerInput.showPicker();
      } else {
        pickerInput.click();
      }
    };

    startDateButton.addEventListener('click', () => openDatePicker(startDateInput, startDatePicker));
    endDateButton.addEventListener('click', () => openDatePicker(endDateInput, endDatePicker));

    const getOptions = () => {
      const targetContainer = clean(containerInput.value);
      const skuBarcode = clean(skuBarcodeInput.value);
      const fromCenterCode = normalizeCenterCode(fromCenterInput.value);
      const rawToCenter = clean(toCenterInput.value);
      const toCenterCode = rawToCenter ? normalizeCenterCode(rawToCenter) : DEFAULT_TO_CENTER_CODE;

      return {
        targetContainer,
        skuBarcode,
        fromCenterCode,
        toCenterCode,
        searchDateType: selectedSearchDateType,
        selectedStatuses: sanitizeStatuses(selectedStatuses),
        startDate: normalizeDateInputValue(startDateInput.value) || startDateInput.value,
        endDate: normalizeDateInputValue(endDateInput.value) || endDateInput.value,
        quickRange: selectedQuickRange,
        autoDownloadCsv: autoDownloadInput.checked
      };
    };

    const setFormDisabled = (disabled) => {
      [
        containerInput,
        skuBarcodeInput,
        fromCenterInput,
        toCenterInput,
        startDateInput,
        endDateInput,
        autoDownloadInput,
        advancedToggleButton,
        ...dateTypeButtons,
        ...statusButtons,
        ...quickRangeButtons,
        ...toCenterQuickButtons
      ].forEach(element => {
        element.disabled = disabled;
      });
    };

    const setRunning = (running) => {
      startButton.disabled = running;
      stopButton.disabled = !running;
      setFormDisabled(running);
    };

    const setDownloadEnabled = (enabled) => {
      downloadButton.disabled = !enabled;
    };

    const update = ({
      current = 0,
      total = 0,
      message = '',
      listCount = null,
      successCount = null,
      failureCount = null,
      rowCount = null,
      tone = ''
    }) => {
      const percent = total ? Math.min(100, Math.round((current / total) * 100)) : 0;

      setStatusTone(tone);
      status.textContent = message;
      count.textContent = `${current} / ${total} (${percent}%)`;
      bar.style.width = `${percent}%`;

      if (listCount !== null) list.textContent = `목록 ${listCount}`;
      if (successCount !== null) success.textContent = `성공 ${successCount}`;
      if (failureCount !== null) failure.textContent = `실패 ${failureCount}`;
      if (rowCount !== null) rows.textContent = `결과 ${rowCount}행`;
    };

    const reset = () => {
      containerInput.classList.remove('ct-input-error');
      startDateInput.classList.remove('ct-input-error');
      endDateInput.classList.remove('ct-input-error');
      bar.style.width = '0%';
      bar.style.background = '#16a34a';
      update({
        current: 0,
        total: 0,
        message: '대기 중',
        listCount: 0,
        successCount: 0,
        failureCount: 0,
        rowCount: 0
      });
    };

    const done = (message) => {
      bar.style.width = '100%';
      bar.style.background = '#2563eb';
      setRunning(false);
      update({
        current: 1,
        total: 1,
        message,
        tone: 'success'
      });
    };

    const stopped = (message) => {
      bar.style.background = '#f59e0b';
      setRunning(false);
      setStatusTone('warning');
      status.textContent = message;
    };

    const error = (message) => {
      bar.style.background = '#dc2626';
      setRunning(false);
      setStatusTone('error');
      status.textContent = message;
    };

    const warning = (message) => {
      setStatusTone('warning');
      status.textContent = message;
    };

    const validateOptions = (options) => {
      containerInput.classList.remove('ct-input-error');
      startDateInput.classList.remove('ct-input-error');
      endDateInput.classList.remove('ct-input-error');

      if (!options.targetContainer) {
        containerInput.classList.add('ct-input-error');
        containerInput.focus();
        return 'CT 바코드를 입력하세요.';
      }

      if (!options.startDate || !options.endDate) {
        if (!options.startDate) startDateInput.classList.add('ct-input-error');
        if (!options.endDate) endDateInput.classList.add('ct-input-error');
        return '시작일과 종료일을 입력하세요.';
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(options.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(options.endDate)) {
        startDateInput.classList.add('ct-input-error');
        endDateInput.classList.add('ct-input-error');
        return '날짜는 20260615 또는 2026-06-15 형식으로 입력하세요.';
      }

      if (options.startDate > options.endDate) {
        startDateInput.classList.add('ct-input-error');
        endDateInput.classList.add('ct-input-error');
        return '시작일은 종료일보다 늦을 수 없습니다.';
      }

      return '';
    };

    refreshSelections();

    return {
      panel,
      containerInput,
      startButton,
      stopButton,
      downloadButton,
      closeButton,
      getOptions,
      validateOptions,
      setRunning,
      setDownloadEnabled,
      update,
      reset,
      done,
      stopped,
      error,
      warning
    };
  };

  const tableToObjects = (table) => {
    const headers = [...table.querySelectorAll('thead th')].map(th => clean(th.innerText || th.textContent));

    return [...table.querySelectorAll('tbody tr')]
      .map(tr => {
        const cells = [...tr.querySelectorAll('td')];

        if (cells.length === 1 && cells[0].hasAttribute('colspan')) return null;

        const obj = {};

        headers.forEach((header, index) => {
          obj[header || `col_${index + 1}`] = clean(cells[index]?.innerText || cells[index]?.textContent);
        });

        return obj;
      })
      .filter(Boolean);
  };

  const parseListRows = (doc = document) => {
    const tables = [...doc.querySelectorAll('table')];

    const table = tables.find(tbl =>
      tbl.querySelector('tbody tr td:first-child a[href*="/transfer/admin/operation/detail/"]') ||
      tbl.querySelector('tbody tr a[href*="/transfer/admin/operation/detail/"]')
    );

    if (!table) return [];

    const headers = [...table.querySelectorAll('thead th')].map(th => clean(th.innerText || th.textContent));

    return [...table.querySelectorAll('tbody tr')]
      .map(tr => {
        const cells = [...tr.querySelectorAll('td')];

        if (cells.length === 1 && cells[0].hasAttribute('colspan')) return null;

        const detailLink =
          tr.querySelector('td:first-child a[href*="/transfer/admin/operation/detail/"]') ||
          tr.querySelector('a[href*="/transfer/admin/operation/detail/"]');

        if (!detailLink) return null;

        const rowData = {};

        headers.forEach((header, index) => {
          rowData[header || `col_${index + 1}`] = clean(cells[index]?.innerText || cells[index]?.textContent);
        });

        rowData.operationDetailUrl = new URL(detailLink.getAttribute('href'), location.origin).href;
        rowData.operationId = rowData.operationDetailUrl.match(/\/detail\/(\d+)/)?.[1] || '';

        return rowData;
      })
      .filter(Boolean);
  };

  const getRowsSignature = (rows) => {
    return rows
      .map(row => row.operationId || row.operationDetailUrl || JSON.stringify(row))
      .join('|');
  };

  const findNextTable = (h5) => {
    let el = h5.nextElementSibling;

    while (el) {
      if (el.tagName?.toLowerCase() === 'table') return el;

      const innerTable = el.querySelector?.('table');
      if (innerTable) return innerTable;

      if (el.tagName?.toLowerCase() === 'h5') return null;

      el = el.nextElementSibling;
    }

    return null;
  };

  const parseLocations = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const h5 = [...doc.querySelectorAll('h5')]
      .find(el => clean(el.innerText || el.textContent) === '이관 계획별 진열 내역');

    if (!h5) return [];

    const table = findNextTable(h5);
    if (!table) return [];

    return tableToObjects(table).map(row => ({
      SKU_ID: row['SKU ID'] || '',
      진열_로케이션: row['진열 로케이션'] || '',
      진열_수량: row['수량'] || '',
      진열_완료_일시: row['진열 완료 일시'] || '',
      진열_작업자: row['진열 작업자'] || '',
      진열_오류보고_내역: row['진열 오류보고 내역'] || ''
    }));
  };

  const buildListUrl = ({ pageNo, options, statusValue }) => {
    if (!options.targetContainer) {
      throw new Error('CT_REQUIRED');
    }

    const url = new URL('/transfer/admin/operation/paging', location.origin);

    url.searchParams.set('page', String(pageNo));
    url.searchParams.set('skuBarcode', options.skuBarcode || '');
    url.searchParams.set('skuExternalId', '');
    url.searchParams.set('skuId', '');
    url.searchParams.set('vehicleNumber', '');
    url.searchParams.set('status', statusValue);
    url.searchParams.set('containerBarcode', options.targetContainer);
    url.searchParams.set('transferCartPriority', '');
    url.searchParams.set('toCenterCode', options.toCenterCode);
    url.searchParams.set('centerCode', options.fromCenterCode);
    url.searchParams.set('transferAllocationType', '');
    url.searchParams.set('transferPlanExternalId', '');
    url.searchParams.set('cartBarcode', '');
    url.searchParams.set('searchDateType', options.searchDateType);
    url.searchParams.set('end', options.endDate);
    url.searchParams.set('start', options.startDate);

    return url.href;
  };

  let lastRequestAt = 0;
  let rateLimitChain = Promise.resolve();

  const waitForRequestSlot = async (signal) => {
    const run = rateLimitChain.then(async () => {
      if (signal.aborted) throw createAbortError();

      const now = Date.now();
      const waitMs = Math.max(0, lastRequestAt + GLOBAL_REQUEST_GAP_MS - now);

      if (waitMs > 0) {
        await sleep(waitMs, signal);
      }

      lastRequestAt = Date.now();
    });

    rateLimitChain = run.catch(() => {});
    await run;
  };

  const shouldRetryFetch = (error) => {
    if (isAbortError(error) || isSessionExpired(error)) return false;
    if (error.status === 504 || error.status === 503 || error.status === 502) return true;
    return error instanceof TypeError;
  };

  const fetchHtml = async (url, signal, retryCount = FETCH_RETRY_COUNT) => {
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        await waitForRequestSlot(signal);

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal,
          headers: {
            Accept: 'text/html, */*'
          }
        });

        const html = await response.text();

        if (!response.ok) {
          const error = new Error(`FETCH_FAILED_${response.status}`);
          error.status = response.status;
          throw error;
        }

        if (html.includes('<input') && html.includes('password')) {
          throw new Error('SESSION_EXPIRED');
        }

        return html;
      } catch (error) {
        if (attempt >= retryCount || !shouldRetryFetch(error)) {
          throw error;
        }

        console.warn(`[재시도] ${attempt + 1}/${retryCount}`, url, error);
        await sleep(RETRY_DELAY_MS, signal);
      }
    }

    throw new Error('FETCH_FAILED');
  };

  const mergeUniqueRows = (target, rows, seenKeys) => {
    let addedCount = 0;

    rows.forEach(row => {
      const key = row.operationId || row.operationDetailUrl;

      if (!key || seenKeys.has(key)) return;

      seenKeys.add(key);
      target.push(row);
      addedCount++;
    });

    return addedCount;
  };

  const collectListForStatus = async ({ progress, options, statusValue, signal, allRows, seenKeys }) => {
    const seenPageSignatures = new Set();
    const statusLabel = getStatusLabel(statusValue);

    for (let page = 0; page < MAX_PAGE; page++) {
      if (signal.aborted) throw createAbortError();

      progress.update({
        current: page,
        total: 0,
        message: `목록 조회 중: ${statusLabel} / page=${page}`,
        listCount: allRows.length
      });

      const listUrl = buildListUrl({ pageNo: page, options, statusValue });
      console.log(`[목록 URL] status=${statusValue || 'ALL'}, page=${page}`, listUrl);

      const html = await fetchHtml(listUrl, signal);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = parseListRows(doc);

      console.log(`[목록 수집] status=${statusValue || 'ALL'}, page=${page}, ${rows.length}건`);

      if (rows.length === 0) {
        console.log(`[목록 종료] status=${statusValue || 'ALL'}, page=${page} 결과 없음`);
        break;
      }

      const pageSignature = getRowsSignature(rows);

      if (seenPageSignatures.has(pageSignature)) {
        console.warn(`[목록 종료] status=${statusValue || 'ALL'}, page=${page} 이전 페이지와 동일 데이터 감지`);
        break;
      }

      seenPageSignatures.add(pageSignature);

      const addedCount = mergeUniqueRows(allRows, rows, seenKeys);

      progress.update({
        current: page + 1,
        total: 0,
        message: `목록 누적: ${allRows.length}건`,
        listCount: allRows.length
      });

      console.log(`[목록 추가] status=${statusValue || 'ALL'}, page=${page}, 신규 ${addedCount}건, 누적 ${allRows.length}건`);

      if (rows.length < PAGE_SIZE) {
        console.log(`[목록 종료] status=${statusValue || 'ALL'}, page=${page} ${PAGE_SIZE}건 미만`);
        break;
      }
    }
  };

  const collectListRows = async ({ progress, options, signal }) => {
    const allRows = [];
    const seenKeys = new Set();
    const statuses = options.selectedStatuses.includes('') ? [''] : options.selectedStatuses;

    for (const statusValue of statuses) {
      await collectListForStatus({
        progress,
        options,
        statusValue,
        signal,
        allRows,
        seenKeys
      });
    }

    return allRows;
  };

  const mapLimit = async (items, limit, worker, signal) => {
    const results = new Array(items.length);
    let index = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length && !signal.aborted) {
        const currentIndex = index++;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    });

    await Promise.all(runners);
    return results;
  };

  const makeFlatRows = (item) => {
    if (item.errorMessage) {
      return [{
        컨테이너바코드: item.컨테이너바코드,
        토트바코드: item.토트바코드,
        목록상태: item.목록상태,
        집품수량: item.집품수량,
        SKUID: '',
        진열로케이션: '',
        진열수량: '',
        진열완료일시: '',
        진열작업자: '',
        진열오류보고: `상세 조회 실패: ${item.errorMessage}`
      }];
    }

    if (!item.진열내역.length) {
      return [{
        컨테이너바코드: item.컨테이너바코드,
        토트바코드: item.토트바코드,
        목록상태: item.목록상태,
        집품수량: item.집품수량,
        SKUID: '',
        진열로케이션: '',
        진열수량: '',
        진열완료일시: '',
        진열작업자: '',
        진열오류보고: '진열 내역 없음'
      }];
    }

    return item.진열내역.map(location => ({
      컨테이너바코드: item.컨테이너바코드,
      토트바코드: item.토트바코드,
      목록상태: item.목록상태,
      집품수량: item.집품수량,
      SKUID: location.SKU_ID,
      진열로케이션: location.진열_로케이션,
      진열수량: location.진열_수량,
      진열완료일시: location.진열_완료_일시,
      진열작업자: location.진열_작업자,
      진열오류보고: location.진열_오류보고_내역
    }));
  };

  const addRowNumbers = (rows) => rows.map((row, index) => ({
    번호: index + 1,
    ...row
  }));

  const getTimestamp = () => {
    const now = new Date();

    return (
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    );
  };

  const makeFileName = (targetContainer, suffix = '') => {
    const safeContainer = targetContainer.replace(/[\\/:*?"<>|]/g, '_');
    const suffixText = suffix ? `_${suffix}` : '';
    return `GrabJace_${safeContainer}_${getTimestamp()}${suffixText}.csv`;
  };

  const downloadCsv = (rows, fileName) => {
    const columns = [
      '번호',
      '컨테이너바코드',
      '토트바코드',
      '목록상태',
      '집품수량',
      'SKUID',
      '진열로케이션',
      '진열수량',
      '진열완료일시',
      '진열작업자',
      '진열오류보고'
    ];

    const escapeCsv = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      columns.join(','),
      ...rows.map(row => columns.map(col => escapeCsv(row[col])).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progress = createPanel();

  let abortController = null;
  let running = false;
  let latestFlatRows = [];
  let latestOptions = null;
  let latestListRows = [];
  let latestTargetRows = [];
  let latestFileName = '';

  const downloadLatest = (suffix = '') => {
    if (!latestFlatRows.length || !latestOptions) return '';

    const numberedRows = addRowNumbers(latestFlatRows);
    const fileName = makeFileName(latestOptions.targetContainer, suffix);

    window.containerPutawayResult = numberedRows;
    downloadCsv(numberedRows, fileName);
    latestFileName = fileName;

    return fileName;
  };

  const saveCurrentOptions = (options) => {
    saveSettings({
      fromCenterCode: options.fromCenterCode || '전체',
      toCenterCode: options.toCenterCode || '전체',
      searchDateType: options.searchDateType,
      selectedStatuses: options.selectedStatuses,
      quickRange: options.quickRange,
      startDate: options.startDate,
      endDate: options.endDate,
      autoDownloadCsv: options.autoDownloadCsv
    });
  };

  progress.downloadButton.addEventListener('click', () => {
    const fileName = downloadLatest(running ? 'partial' : '');

    if (fileName) {
      progress.update({
        current: 1,
        total: 1,
        message: `CSV 다운로드 완료: ${fileName}`,
        rowCount: latestFlatRows.length,
        tone: 'success'
      });
    }
  });

  progress.closeButton.addEventListener('click', () => {
    if (abortController) abortController.abort();

    if (window[GLOBAL_ABORT_KEY] === abortController) {
      window[GLOBAL_ABORT_KEY] = null;
    }

    if (isCurrentRun()) {
      window[RUN_ID_KEY] = null;
    }

    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  });

  progress.stopButton.addEventListener('click', () => {
    if (abortController) abortController.abort();
  });

  const runSearch = async () => {
    if (running) return;

    const options = progress.getOptions();
    const validationMessage = progress.validateOptions(options);

    if (validationMessage) {
      progress.error(validationMessage);
      return;
    }

    saveCurrentOptions(options);

    abortController = new AbortController();
    window[GLOBAL_ABORT_KEY] = abortController;
    running = true;
    latestFlatRows = [];
    latestOptions = options;
    latestListRows = [];
    latestTargetRows = [];
    latestFileName = '';

    progress.reset();
    progress.setRunning(true);
    progress.setDownloadEnabled(false);
    progress.update({
      current: 0,
      total: 0,
      message: `목록 조회 준비 중 · 기준 ${getDateTypeLabel(options.searchDateType)} · 상태 ${options.selectedStatuses.map(getStatusLabel).join(', ')}`,
      listCount: 0,
      successCount: 0,
      failureCount: 0,
      rowCount: 0
    });

    let completedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    try {
      console.clear();
      console.log('[조회 조건]', options);

      const listRows = await collectListRows({
        progress,
        options,
        signal: abortController.signal
      });

      latestListRows = listRows;

      if (listRows.length === 0) {
        const skuText = options.skuBarcode ? ` / 상품바코드: ${options.skuBarcode}` : '';
        progress.warning(
          `조회 결과가 없습니다. 상태: ${options.selectedStatuses.map(getStatusLabel).join(', ')} / 기간: ${options.startDate} ~ ${options.endDate}${skuText}`
        );
        return;
      }

      const targetRows = listRows.filter(row => {
        if (!Object.prototype.hasOwnProperty.call(row, '컨테이너 바코드')) return true;
        return row['컨테이너 바코드'] === options.targetContainer;
      });

      const uniqueTargetRows = [];
      const seenTargetKeys = new Set();
      mergeUniqueRows(uniqueTargetRows, targetRows, seenTargetKeys);
      latestTargetRows = uniqueTargetRows;

      if (uniqueTargetRows.length === 0) {
        const skuText = options.skuBarcode ? ` / 상품바코드: ${options.skuBarcode}` : '';
        progress.warning(
          `CT와 일치하는 GC 목록이 없습니다. 상태: ${options.selectedStatuses.map(getStatusLabel).join(', ')} / 기간: ${options.startDate} ~ ${options.endDate}${skuText}`
        );

        console.table(listRows.map(row => ({
          토트바코드: row['토트바코드'],
          컨테이너바코드: row['컨테이너 바코드'],
          상태: row['상태'],
          상세URL: row.operationDetailUrl
        })));

        return;
      }

      if (uniqueTargetRows.length > MAX_GC_PER_CT) {
        progress.warning(`대상 GC가 ${uniqueTargetRows.length}건입니다. CT 최대 GC 수 ${MAX_GC_PER_CT}건을 초과했으니 조회 조건을 확인하세요.`);
      }

      console.log(`[상세 조회 시작] CT: ${options.targetContainer}, 대상 GC: ${uniqueTargetRows.length}건`);
      console.table(uniqueTargetRows.map(row => ({
        토트바코드: row['토트바코드'],
        컨테이너바코드: row['컨테이너 바코드'],
        상태: row['상태'],
        집품수량: row['집품/분배 수량'],
        상세URL: row.operationDetailUrl
      })));

      progress.update({
        current: 0,
        total: uniqueTargetRows.length,
        message: `상세 조회 준비: ${uniqueTargetRows.length}건`,
        listCount: listRows.length,
        successCount,
        failureCount,
        rowCount: latestFlatRows.length
      });

      const detailCache = new Map();

      const detailResults = await mapLimit(uniqueTargetRows, CONCURRENCY, async (row, index) => {
        if (abortController.signal.aborted) return null;

        progress.update({
          current: completedCount,
          total: uniqueTargetRows.length,
          message: `상세 조회 중: ${row['토트바코드'] || row.operationId}`,
          listCount: listRows.length,
          successCount,
          failureCount,
          rowCount: latestFlatRows.length
        });

        console.log(`[${index + 1}/${uniqueTargetRows.length}] 상세 조회 중`, {
          토트바코드: row['토트바코드'],
          operationId: row.operationId,
          url: row.operationDetailUrl
        });

        try {
          let locations;

          if (detailCache.has(row.operationDetailUrl)) {
            locations = detailCache.get(row.operationDetailUrl);
          } else {
            const html = await fetchHtml(row.operationDetailUrl, abortController.signal);
            locations = parseLocations(html);
            detailCache.set(row.operationDetailUrl, locations);
          }

          const item = {
            컨테이너바코드: row['컨테이너 바코드'] || options.targetContainer,
            토트바코드: row['토트바코드'] || '',
            목록상태: row['상태'] || '',
            집품수량: row['집품/분배 수량'] || '',
            진열내역: locations
          };

          latestFlatRows.push(...makeFlatRows(item));
          successCount++;
          progress.setDownloadEnabled(true);

          return item;
        } catch (error) {
          if (isAbortError(error)) return null;

          if (isSessionExpired(error)) {
            abortController.abort();
            throw error;
          }

          const item = {
            컨테이너바코드: row['컨테이너 바코드'] || options.targetContainer,
            토트바코드: row['토트바코드'] || '',
            목록상태: row['상태'] || '',
            집품수량: row['집품/분배 수량'] || '',
            진열내역: [],
            errorMessage: error.message || String(error)
          };

          latestFlatRows.push(...makeFlatRows(item));
          failureCount++;
          progress.setDownloadEnabled(true);

          console.error('[상세 조회 실패]', {
            토트바코드: row['토트바코드'],
            operationId: row.operationId,
            error
          });

          return item;
        } finally {
          if (!abortController.signal.aborted) {
            completedCount++;

            progress.update({
              current: completedCount,
              total: uniqueTargetRows.length,
              message: `완료: ${row['토트바코드'] || row.operationId}`,
              listCount: listRows.length,
              successCount,
              failureCount,
              rowCount: latestFlatRows.length
            });
          }
        }
      }, abortController.signal);

      window.containerPutawayListRows = listRows;
      window.containerPutawayTargetRows = uniqueTargetRows;
      window.containerPutawayDetailResults = detailResults.filter(Boolean);
      window.containerPutawayResult = addRowNumbers(latestFlatRows);
      window.containerPutawayOptions = options;

      if (abortController.signal.aborted) {
        progress.stopped(`중지됨: 성공 ${successCount}건, 실패 ${failureCount}건`);

        if (latestFlatRows.length) {
          progress.setDownloadEnabled(true);
          console.table(window.containerPutawayResult);
        }

        return;
      }

      console.log('[최종 결과]');
      console.table(window.containerPutawayResult);

      let doneMessage = `조회 완료: 결과 ${latestFlatRows.length}행 · 성공 ${successCount}건 · 실패 ${failureCount}건`;

      if (latestFlatRows.length) {
        progress.setDownloadEnabled(true);

        if (options.autoDownloadCsv) {
          const fileName = downloadLatest();
          doneMessage = `조회 완료 및 CSV 다운로드 완료: ${fileName}`;
        }
      }

      progress.done(doneMessage);
      progress.update({
        current: uniqueTargetRows.length,
        total: uniqueTargetRows.length,
        message: doneMessage,
        listCount: listRows.length,
        successCount,
        failureCount,
        rowCount: latestFlatRows.length,
        tone: 'success'
      });
    } catch (error) {
      if (isSessionExpired(error)) {
        console.error('[ERROR]', error);
        progress.error('세션 만료. WMS 새로고침 및 로그인 후 다시 실행하세요.');
        alert('세션이 만료되었습니다. WMS 새로고침 및 로그인 후 다시 실행하세요.');
      } else if (isAbortError(error) || abortController?.signal.aborted) {
        progress.stopped(`중지됨: 성공 ${successCount}건, 실패 ${failureCount}건`);
      } else {
        console.error('[ERROR]', error);
        progress.error(getFriendlyErrorMessage(error));
      }

      progress.setDownloadEnabled(latestFlatRows.length > 0);
    } finally {
      running = false;
      if (isCurrentRun()) {
        progress.setRunning(false);
      }

      if (window[GLOBAL_ABORT_KEY] === abortController) {
        window[GLOBAL_ABORT_KEY] = null;
      }

      if (isCurrentRun()) {
        window[RUN_ID_KEY] = null;
      }

      abortController = null;
    }
  };

  progress.startButton.addEventListener('click', runSearch);
  progress.containerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runSearch();
    }
  });

  progress.containerInput.focus();
})();
