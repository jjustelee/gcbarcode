(() => {
  'use strict';

  const APP_ID = 'jace-worker-batch-checkin';
  const STYLE_ID = `${APP_ID}-style`;
  const APP_TITLE = 'Batch Check-in';
  const APP_VERSION = 'Jace v0.1';
  const REQUIRED_HOST = 'fc-auth.coupang.com';
  const REQUIRED_PATH = '/worker/indirect/register';
  const CHECK_IN_ENDPOINT = '/worker/indirect/check/in';
  const MAX_BATCH_SIZE = 100;
  const REQUEST_DELAY_MS = 150;

  const existing = document.getElementById(APP_ID);
  if (existing) {
    existing.dataset.collapsed = 'false';
    existing.querySelector('[data-role="collapse"]')?.setAttribute('aria-expanded', 'true');
    existing.querySelector('[data-role="batch-body"]')?.removeAttribute('hidden');
    existing.__batchCheckinRefresh?.();
    existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
    existing.querySelector('[data-role="barcodes"]')?.focus();
    return;
  }

  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  if (location.hostname !== REQUIRED_HOST || currentPath !== REQUIRED_PATH) {
    alert('작업자 체크인 페이지에서 실행해 주세요.');
    return;
  }

  const nativeBarcodeInput = document.querySelector('input[name="barcode"]');
  if (!nativeBarcodeInput) {
    alert('기존 작업자 바코드 입력 영역을 찾지 못했습니다. 페이지를 새로고침한 후 다시 실행해 주세요.');
    return;
  }

  const anchor = document.querySelector('#assign-result') || nativeBarcodeInput.closest('.row');
  if (!anchor) {
    alert('일괄 체크인 영역을 표시할 위치를 찾지 못했습니다.');
    return;
  }

  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${APP_ID}, #${APP_ID} * {
      box-sizing: border-box;
    }

    #${APP_ID} {
      width: 100%;
      margin: 0 0 16px;
      border: 1px solid #c9d7e5;
      border-radius: 5px;
      background: #ffffff;
      color: #25364a;
      font-family: Arial, "Noto Sans KR", sans-serif;
      font-size: 13px;
      line-height: 1.45;
    }

    #${APP_ID}[data-state="error"] {
      border-color: #e6b5b5;
    }

    #${APP_ID} button,
    #${APP_ID} textarea {
      font: inherit;
    }

    #${APP_ID} .jbc-header {
      min-height: 42px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 14px;
      border-bottom: 1px solid #e0e7ef;
    }

    #${APP_ID}[data-collapsed="true"] .jbc-header {
      border-bottom: 0;
    }

    #${APP_ID} .jbc-title {
      margin: 0;
      color: #17283c;
      font-size: 15px;
      font-weight: 700;
    }

    #${APP_ID} .jbc-meta {
      margin-left: auto;
      color: #7b8794;
      font-size: 10px;
      font-weight: 400;
      white-space: nowrap;
    }

    #${APP_ID} .jbc-icon-button {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: #4d5d6c;
      cursor: pointer;
    }

    #${APP_ID} .jbc-icon-button:hover {
      background: #eef3f8;
    }

    #${APP_ID} .jbc-collapse-mark {
      display: inline-block;
      font-size: 15px;
      line-height: 1;
      transition: transform 0.15s ease;
    }

    #${APP_ID}[data-collapsed="true"] .jbc-collapse-mark {
      transform: rotate(180deg);
    }

    #${APP_ID} .jbc-body {
      padding: 12px 14px 14px;
    }

    #${APP_ID} .jbc-selection {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 36px;
      margin-bottom: 12px;
      padding: 7px 10px;
      border: 1px solid #cfe0ef;
      border-radius: 4px;
      background: #eef7fc;
    }

    #${APP_ID} .jbc-selection-label {
      flex: 0 0 auto;
      color: #637487;
      font-size: 12px;
    }

    #${APP_ID} .jbc-selection-value {
      min-width: 0;
      color: #276b9d;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    #${APP_ID} .jbc-selection[data-valid="false"] .jbc-selection-value {
      color: #b42318;
    }

    #${APP_ID} .jbc-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: end;
    }

    #${APP_ID} .jbc-field-label {
      display: block;
      margin-bottom: 5px;
      color: #384b5e;
      font-size: 12px;
      font-weight: 700;
    }

    #${APP_ID} .jbc-textarea {
      width: 100%;
      min-height: 82px;
      max-height: 180px;
      display: block;
      resize: vertical;
      padding: 8px 10px;
      border: 1px solid #b8c6d4;
      border-radius: 4px;
      outline: none;
      background: #ffffff;
      color: #1f2d3d;
      font-family: Consolas, "Courier New", monospace;
      font-size: 14px;
      line-height: 1.4;
    }

    #${APP_ID} .jbc-textarea:focus {
      border-color: #3f86bc;
      box-shadow: 0 0 0 2px rgba(63, 134, 188, 0.14);
    }

    #${APP_ID} .jbc-textarea:disabled {
      background: #f4f6f8;
      color: #66717d;
    }

    #${APP_ID} .jbc-helper {
      min-height: 20px;
      margin-top: 5px;
      color: #778696;
      font-size: 11px;
    }

    #${APP_ID} .jbc-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 20px;
      white-space: nowrap;
    }

    #${APP_ID} .jbc-button {
      min-height: 38px;
      padding: 8px 15px;
      border: 1px solid #aebdca;
      border-radius: 4px;
      background: #ffffff;
      color: #33485c;
      font-weight: 700;
      cursor: pointer;
    }

    #${APP_ID} .jbc-button:hover:not(:disabled) {
      background: #f3f6f9;
    }

    #${APP_ID} .jbc-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    #${APP_ID} .jbc-button-primary {
      min-width: 112px;
      border-color: #2f78ad;
      background: #337fb7;
      color: #ffffff;
    }

    #${APP_ID} .jbc-button-primary:hover:not(:disabled) {
      background: #286d9f;
    }

    #${APP_ID} .jbc-button-danger {
      display: none;
      border-color: #d6a4a4;
      color: #a52828;
    }

    #${APP_ID}[data-running="true"] .jbc-button-danger {
      display: inline-flex;
      align-items: center;
    }

    #${APP_ID} .jbc-notice {
      display: none;
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 12px;
    }

    #${APP_ID} .jbc-notice[data-visible="true"] {
      display: block;
    }

    #${APP_ID} .jbc-notice[data-type="info"] {
      border: 1px solid #b7d5ea;
      background: #edf7fd;
      color: #28648c;
    }

    #${APP_ID} .jbc-notice[data-type="error"] {
      border: 1px solid #ecc5c5;
      background: #fff1f1;
      color: #a32626;
    }

    #${APP_ID} .jbc-results {
      margin-top: 12px;
      border: 1px solid #dde5ec;
      border-radius: 4px;
      overflow: hidden;
    }

    #${APP_ID} .jbc-results-header {
      min-height: 36px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-bottom: 1px solid #e3e9ef;
      background: #f8fafc;
    }

    #${APP_ID} .jbc-results-title {
      color: #304255;
      font-size: 12px;
      font-weight: 700;
    }

    #${APP_ID} .jbc-results-summary {
      color: #667789;
      font-size: 11px;
    }

    #${APP_ID} .jbc-result-list {
      max-height: 230px;
      margin: 0;
      padding: 0;
      overflow: auto;
      list-style: none;
      background: #ffffff;
    }

    #${APP_ID} .jbc-result-empty {
      padding: 13px 10px;
      color: #8491a0;
      text-align: center;
      font-size: 12px;
    }

    #${APP_ID} .jbc-result-item {
      display: grid;
      grid-template-columns: 58px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
      padding: 9px 10px;
      border-top: 1px solid #edf1f5;
    }

    #${APP_ID} .jbc-result-item:first-child {
      border-top: 0;
    }

    #${APP_ID} .jbc-result-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 24px;
      padding: 2px 7px;
      border: 1px solid currentColor;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
    }

    #${APP_ID} .jbc-result-item[data-status="success"] .jbc-result-status {
      color: #25863b;
      background: #f1fbf3;
    }

    #${APP_ID} .jbc-result-item[data-status="failure"] .jbc-result-status {
      color: #b42318;
      background: #fff4f2;
    }

    #${APP_ID} .jbc-result-message {
      min-width: 0;
      color: #33475b;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    @media (max-width: 760px) {
      #${APP_ID} .jbc-main {
        grid-template-columns: 1fr;
      }

      #${APP_ID} .jbc-actions {
        justify-content: flex-end;
        padding-bottom: 0;
        flex-wrap: wrap;
      }

      #${APP_ID} .jbc-meta {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = APP_ID;
  root.dataset.collapsed = 'false';
  root.dataset.running = 'false';
  root.dataset.state = 'ready';
  root.innerHTML = `
    <div class="jbc-header">
      <h3 class="jbc-title">작업자 일괄 체크인</h3>
      <span class="jbc-meta">${APP_TITLE} · ${APP_VERSION}</span>
      <button type="button" class="jbc-icon-button" data-role="collapse" aria-label="접기" aria-expanded="true" title="접기">
        <span class="jbc-collapse-mark" aria-hidden="true">▲</span>
      </button>
    </div>
    <div class="jbc-body" data-role="batch-body">
      <div class="jbc-selection" data-role="selection" data-valid="false">
        <span class="jbc-selection-label">현재 선택</span>
        <strong class="jbc-selection-value" data-role="selection-value">층과 작업유형을 선택하세요.</strong>
      </div>
      <div class="jbc-main">
        <div class="jbc-field">
          <label class="jbc-field-label" for="${APP_ID}-barcodes">작업자 바코드</label>
          <textarea
            id="${APP_ID}-barcodes"
            class="jbc-textarea"
            data-role="barcodes"
            placeholder="작업자 바코드를 줄바꿈 또는 쉼표로 입력하세요"
            autocomplete="off"
            spellcheck="false"
          ></textarea>
          <div class="jbc-helper" data-role="helper">줄바꿈·쉼표 입력 가능 · 유효 0명 · 중복 0명</div>
        </div>
        <div class="jbc-actions">
          <button type="button" class="jbc-button" data-role="clear">입력 지우기</button>
          <button type="button" class="jbc-button jbc-button-danger" data-role="stop">중지</button>
          <button type="button" class="jbc-button jbc-button-primary" data-role="submit" disabled>0명 체크인</button>
        </div>
      </div>
      <div class="jbc-notice" data-role="notice" data-visible="false" data-type="info"></div>
      <div class="jbc-results">
        <div class="jbc-results-header">
          <span class="jbc-results-title">최근 처리 결과</span>
          <span class="jbc-results-summary" data-role="result-summary">처리 결과가 없습니다.</span>
        </div>
        <ul class="jbc-result-list" data-role="result-list">
          <li class="jbc-result-empty">체크인 결과가 여기에 표시됩니다.</li>
        </ul>
      </div>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', root);

  const collapseButton = root.querySelector('[data-role="collapse"]');
  const body = root.querySelector('[data-role="batch-body"]');
  const selectionEl = root.querySelector('[data-role="selection"]');
  const selectionValueEl = root.querySelector('[data-role="selection-value"]');
  const textarea = root.querySelector('[data-role="barcodes"]');
  const helperEl = root.querySelector('[data-role="helper"]');
  const clearButton = root.querySelector('[data-role="clear"]');
  const stopButton = root.querySelector('[data-role="stop"]');
  const submitButton = root.querySelector('[data-role="submit"]');
  const noticeEl = root.querySelector('[data-role="notice"]');
  const resultSummaryEl = root.querySelector('[data-role="result-summary"]');
  const resultListEl = root.querySelector('[data-role="result-list"]');

  let isRunning = false;
  let stopRequested = false;
  let lockedSelection = null;

  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const isVisible = (element) => Boolean(
    element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  );

  const getVisibleActiveButton = (name, dataAttribute) => {
    const buttons = [...document.querySelectorAll(
      `button[name="${name}"].active[${dataAttribute}]`
    )].filter(isVisible);

    return buttons.length === 1 ? buttons[0] : null;
  };

  const readSelection = () => {
    const floorButton = getVisibleActiveButton('btnFloor', 'data-floor-id');
    const jobButton = getVisibleActiveButton('btnJob', 'data-job-id');

    if (!floorButton) {
      return { valid: false, message: '층을 선택하세요.' };
    }

    if (!jobButton) {
      return { valid: false, message: '현재 펼친 작업에서 세부 작업유형을 선택하세요.' };
    }

    return {
      valid: true,
      floorId: floorButton.dataset.floorId,
      floorLabel: clean(floorButton.textContent),
      workTypeId: jobButton.dataset.jobId,
      jobLabel: clean(jobButton.textContent)
    };
  };

  const updateSelection = () => {
    const selection = lockedSelection || readSelection();
    selectionEl.dataset.valid = String(Boolean(selection.valid));

    if (selection.valid) {
      selectionValueEl.textContent = `${selection.floorLabel} · ${selection.jobLabel}`;
      selectionValueEl.title = `floorId: ${selection.floorId} / workTypeId: ${selection.workTypeId}`;
    } else {
      selectionValueEl.textContent = selection.message;
      selectionValueEl.removeAttribute('title');
    }

    return selection;
  };

  const validateBarcode = (rawBarcode) => {
    const barcode = String(rawBarcode || '').trim();

    if (!barcode) return { valid: false, barcode, reason: '값 없음' };
    if (/[ㄱ-힣]/.test(barcode)) return { valid: false, barcode, reason: '한글 포함' };
    if (barcode.length < 2) return { valid: false, barcode, reason: '2글자 미만' };
    if (barcode === 'USR') return { valid: false, barcode, reason: '사용할 수 없는 값' };

    return { valid: true, barcode, reason: '' };
  };

  const parseBarcodes = () => {
    const rawItems = textarea.value
      .split(/[\r\n,;\t]+/)
      .map(value => value.trim())
      .filter(Boolean);
    const seen = new Set();
    const items = [];
    const invalidItems = [];
    let duplicateCount = 0;

    rawItems.forEach(rawBarcode => {
      const key = rawBarcode.toUpperCase();
      if (seen.has(key)) {
        duplicateCount++;
        return;
      }

      seen.add(key);
      const validation = validateBarcode(rawBarcode);
      if (validation.valid) {
        items.push(validation.barcode);
      } else {
        invalidItems.push(validation);
      }
    });

    return { items, invalidItems, duplicateCount, rawCount: rawItems.length };
  };

  const updateInputState = () => {
    const parsed = parseBarcodes();
    const invalidText = parsed.invalidItems.length
      ? ` · 확인 필요 ${parsed.invalidItems.length}명`
      : '';

    helperEl.textContent = `줄바꿈·쉼표 입력 가능 · 유효 ${parsed.items.length}명 · 중복 ${parsed.duplicateCount}명${invalidText}`;
    submitButton.textContent = `${parsed.items.length}명 체크인`;
    submitButton.disabled = isRunning || parsed.items.length === 0 || parsed.invalidItems.length > 0;
    clearButton.disabled = isRunning || parsed.rawCount === 0;
    return parsed;
  };

  const setNotice = (message = '', type = 'info') => {
    noticeEl.textContent = message;
    noticeEl.dataset.type = type;
    noticeEl.dataset.visible = String(Boolean(message));
    root.dataset.state = type === 'error' && message ? 'error' : 'ready';
  };

  const clearResults = () => {
    resultListEl.replaceChildren();
  };

  const appendResult = ({ status, message }) => {
    const item = document.createElement('li');
    item.className = 'jbc-result-item';
    item.dataset.status = status;

    const statusEl = document.createElement('span');
    statusEl.className = 'jbc-result-status';
    statusEl.textContent = status === 'success' ? '성공' : '실패';

    const messageEl = document.createElement('span');
    messageEl.className = 'jbc-result-message';
    messageEl.textContent = message;

    item.appendChild(statusEl);
    item.appendChild(messageEl);
    resultListEl.appendChild(item);
  };

  const setRunning = (running) => {
    isRunning = running;
    root.dataset.running = String(running);
    textarea.disabled = running;
    clearButton.disabled = running;
    submitButton.disabled = running;
    stopButton.disabled = false;
    collapseButton.disabled = false;

    if (!running) updateInputState();
  };

  const getNetworkFallbackMessage = (response) => {
    if (response?.status === 401) return '응답 없음 · 로그인 상태를 확인하세요. (HTTP 401)';
    if (response?.status === 403) return '응답 없음 · 체크인 권한 또는 로그인 상태를 확인하세요. (HTTP 403)';
    if (response?.status) return `응답 없음 · WMS 요청에 실패했습니다. (HTTP ${response.status})`;
    return '응답 없음 · WMS 연결 상태를 확인하세요.';
  };

  const requestCheckIn = async ({ selection, userBarcode }) => {
    let response;

    try {
      response = await fetch(CHECK_IN_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          floorId: selection.floorId,
          workTypeId: selection.workTypeId,
          userBarcode
        })
      });
    } catch (error) {
      return {
        success: false,
        message: getNetworkFallbackMessage(null),
        serverMessage: false,
        error
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return {
        success: false,
        message: getNetworkFallbackMessage(response),
        serverMessage: false
      };
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      return {
        success: false,
        message: '응답 없음 · WMS 응답 형식을 확인할 수 없습니다.',
        serverMessage: false,
        error
      };
    }

    const hasServerMessage = typeof result?.message === 'string' && result.message.length > 0;
    return {
      success: response.ok && result?.code === 'SUCCESS',
      message: hasServerMessage ? result.message : getNetworkFallbackMessage(response),
      serverMessage: hasServerMessage,
      code: result?.code
    };
  };

  const runBatch = async () => {
    if (isRunning) return;

    setNotice();
    const selection = updateSelection();
    if (!selection.valid) {
      setNotice(selection.message, 'error');
      return;
    }

    const parsed = updateInputState();
    if (!parsed.items.length) {
      setNotice('체크인할 작업자 바코드를 입력하세요.', 'error');
      return;
    }

    if (parsed.invalidItems.length) {
      const details = parsed.invalidItems
        .map(item => `${item.barcode || '(빈 값)'}: ${item.reason}`)
        .join(', ');
      setNotice(`입력값을 확인하세요. ${details}`, 'error');
      return;
    }

    if (parsed.items.length > MAX_BATCH_SIZE) {
      setNotice(`한 번에 최대 ${MAX_BATCH_SIZE}명까지 체크인할 수 있습니다.`, 'error');
      return;
    }

    const confirmed = confirm(
      `현재 선택으로 체크인할까요?\n\n` +
      `층: ${selection.floorLabel}\n` +
      `작업유형: ${selection.jobLabel}\n` +
      `작업자: ${parsed.items.length}명`
    );

    if (!confirmed) {
      textarea.focus();
      return;
    }

    lockedSelection = { ...selection };
    stopRequested = false;
    clearResults();
    resultSummaryEl.textContent = `처리 중 · 0 / ${parsed.items.length}명`;
    setRunning(true);
    updateSelection();
    setNotice('체크인을 순차 처리하고 있습니다.', 'info');

    const failedBarcodes = [];
    const unprocessedBarcodes = [];
    let successCount = 0;
    let failureCount = 0;
    let processedCount = 0;

    for (let index = 0; index < parsed.items.length; index++) {
      if (stopRequested) {
        unprocessedBarcodes.push(...parsed.items.slice(index));
        break;
      }

      const userBarcode = parsed.items[index];
      const result = await requestCheckIn({
        selection: lockedSelection,
        userBarcode
      });

      processedCount++;
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        failedBarcodes.push(userBarcode);
      }

      appendResult({
        status: result.success ? 'success' : 'failure',
        message: result.message
      });
      resultSummaryEl.textContent = `처리 중 · ${processedCount} / ${parsed.items.length}명 · 성공 ${successCount}명 · 실패 ${failureCount}명`;
      resultListEl.scrollTop = resultListEl.scrollHeight;

      if (index < parsed.items.length - 1 && !stopRequested) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    const remainingBarcodes = [...failedBarcodes, ...unprocessedBarcodes];
    textarea.value = remainingBarcodes.join('\n');

    const stoppedText = unprocessedBarcodes.length
      ? ` · 미처리 ${unprocessedBarcodes.length}명`
      : '';
    resultSummaryEl.textContent = `성공 ${successCount}명 · 실패 ${failureCount}명${stoppedText}`;

    if (unprocessedBarcodes.length) {
      setNotice('현재 요청 완료 후 중지했습니다. 실패 및 미처리 작업자만 입력란에 남았습니다.', 'info');
    } else if (failureCount) {
      setNotice('실패한 작업자만 입력란에 남았습니다. 서버 응답 메시지를 확인하세요.', 'error');
    } else {
      setNotice(`체크인 완료 · 성공 ${successCount}명`, 'info');
    }

    lockedSelection = null;
    setRunning(false);
    updateSelection();
    textarea.focus();
  };

  collapseButton.addEventListener('click', () => {
    const collapsed = root.dataset.collapsed === 'true';
    root.dataset.collapsed = String(!collapsed);
    collapseButton.setAttribute('aria-expanded', String(collapsed));
    collapseButton.setAttribute('aria-label', collapsed ? '접기' : '펼치기');
    collapseButton.title = collapsed ? '접기' : '펼치기';
    body.hidden = !collapsed;

    if (collapsed && !isRunning) textarea.focus();
  });

  textarea.addEventListener('input', () => {
    setNotice();
    updateInputState();
  });

  textarea.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;

    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      runBatch();
    }
  });

  clearButton.addEventListener('click', () => {
    if (isRunning) return;
    textarea.value = '';
    setNotice();
    updateInputState();
    textarea.focus();
  });

  stopButton.addEventListener('click', () => {
    if (!isRunning || stopRequested) return;
    stopRequested = true;
    stopButton.disabled = true;
    setNotice('현재 요청의 응답을 확인한 후 중지합니다.', 'info');
  });

  submitButton.addEventListener('click', runBatch);

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest(
      'button[name="btnFloor"], button[name="btnProcess"], button[name="btnJob"]'
    )) return;

    setTimeout(() => {
      if (!isRunning) updateSelection();
    }, 0);
  });

  root.__batchCheckinRefresh = () => {
    updateSelection();
    updateInputState();
  };

  updateSelection();
  updateInputState();
  root.scrollIntoView({ behavior: 'smooth', block: 'center' });
  textarea.focus();
})();
