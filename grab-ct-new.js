(async () => {
  'use strict';

  const DEFAULT_CENTER_CODE = 'DON1CFC';
  const CONCURRENCY = 3;
  const DELAY = 500;
  const PAGE_SIZE = 20;
  const MAX_PAGE = 200;
  const DEFAULT_DATE_RANGE_DAYS = 30;
  const PANEL_AUTO_CLOSE_MS = 5000;
  const STORAGE_KEY = 'grabCtPanelSettings';
  const PANEL_ID = 'ct-location-progress-panel';
  const STYLE_ID = 'ct-location-progress-style';
  const GLOBAL_ABORT_KEY = '__grabCtAbortController';

  if (window[GLOBAL_ABORT_KEY]) {
    window[GLOBAL_ABORT_KEY].abort();
  }

  const oldPanel = document.getElementById(PANEL_ID);
  if (oldPanel) oldPanel.remove();

  const oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();

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

  const getDateRange = (dateRangeDays) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - dateRangeDays);

    return {
      searchEndDate: formatDate(today),
      searchStartDate: formatDate(startDate)
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

  const installStyle = () => {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999999;
        width: 380px;
        box-sizing: border-box;
        padding: 14px;
        background: #111827;
        color: #ffffff;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      }
      #${PANEL_ID} * {
        box-sizing: border-box;
      }
      #${PANEL_ID} .ct-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      #${PANEL_ID} .ct-panel-title {
        font-weight: 700;
        font-size: 14px;
      }
      #${PANEL_ID} .ct-icon-button {
        border: 0;
        width: 26px;
        height: 26px;
        border-radius: 6px;
        background: #1f2937;
        color: #e5e7eb;
        cursor: pointer;
        line-height: 26px;
        padding: 0;
      }
      #${PANEL_ID} label {
        display: block;
        margin: 8px 0 4px;
        color: #d1d5db;
        font-size: 12px;
      }
      #${PANEL_ID} input {
        width: 100%;
        height: 34px;
        border: 1px solid #374151;
        border-radius: 6px;
        padding: 0 10px;
        background: #030712;
        color: #ffffff;
        outline: none;
      }
      #${PANEL_ID} input:focus {
        border-color: #22c55e;
      }
      #${PANEL_ID} .ct-row {
        display: grid;
        grid-template-columns: 1fr 116px;
        gap: 10px;
      }
      #${PANEL_ID} .ct-segments {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      #${PANEL_ID} .ct-segment {
        height: 32px;
        border: 1px solid #374151;
        border-radius: 6px;
        background: #1f2937;
        color: #d1d5db;
        cursor: pointer;
      }
      #${PANEL_ID} .ct-segment.is-active {
        border-color: #22c55e;
        background: #064e3b;
        color: #ffffff;
      }
      #${PANEL_ID} .ct-actions {
        display: grid;
        grid-template-columns: 1fr 82px 110px;
        gap: 8px;
        margin-top: 12px;
      }
      #${PANEL_ID} .ct-button {
        height: 34px;
        border: 0;
        border-radius: 6px;
        padding: 0 10px;
        color: #ffffff;
        cursor: pointer;
        font-weight: 700;
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
      #${PANEL_ID} .ct-status {
        min-height: 18px;
        margin-top: 10px;
        color: #ffffff;
      }
      #${PANEL_ID} .ct-progress-wrap {
        width: 100%;
        height: 8px;
        background: #374151;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 8px;
      }
      #${PANEL_ID} .ct-progress-bar {
        width: 0%;
        height: 100%;
        background: #22c55e;
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
    `;
    document.head.appendChild(style);
  };

  const createPanel = () => {
    installStyle();

    const settings = loadSettings();
    const initialDays = String(settings.dateRangeDays || DEFAULT_DATE_RANGE_DAYS);

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="ct-panel-header">
        <div class="ct-panel-title">CT Location 조회</div>
        <button type="button" class="ct-icon-button" data-action="close" title="닫기">x</button>
      </div>

      <label for="ct-container-input">컨테이너 바코드</label>
      <input id="ct-container-input" type="text" autocomplete="off" placeholder="컨테이너 바코드 입력">

      <div class="ct-row">
        <div>
          <label>조회 기간</label>
          <div class="ct-segments">
            <button type="button" class="ct-segment" data-days="7">7일</button>
            <button type="button" class="ct-segment" data-days="30">30일</button>
            <button type="button" class="ct-segment" data-days="60">60일</button>
          </div>
        </div>
        <div>
          <label for="ct-center-input">센터</label>
          <input id="ct-center-input" type="text" autocomplete="off">
        </div>
      </div>

      <div class="ct-actions">
        <button type="button" class="ct-button ct-primary" data-action="start">조회 시작</button>
        <button type="button" class="ct-button ct-danger" data-action="stop" disabled>중지</button>
        <button type="button" class="ct-button ct-secondary" data-action="download" disabled>CSV 다운로드</button>
      </div>

      <div class="ct-status" data-role="status">대기 중</div>
      <div class="ct-progress-wrap">
        <div class="ct-progress-bar" data-role="bar"></div>
      </div>
      <div class="ct-meta">
        <span class="ct-chip" data-role="count">0 / 0 (0%)</span>
        <span class="ct-chip" data-role="list">목록 0</span>
        <span class="ct-chip" data-role="success">성공 0</span>
        <span class="ct-chip" data-role="failure">실패 0</span>
      </div>
    `;

    document.body.appendChild(panel);

    const containerInput = panel.querySelector('#ct-container-input');
    const centerInput = panel.querySelector('#ct-center-input');
    const startButton = panel.querySelector('[data-action="start"]');
    const stopButton = panel.querySelector('[data-action="stop"]');
    const downloadButton = panel.querySelector('[data-action="download"]');
    const closeButton = panel.querySelector('[data-action="close"]');
    const status = panel.querySelector('[data-role="status"]');
    const bar = panel.querySelector('[data-role="bar"]');
    const count = panel.querySelector('[data-role="count"]');
    const list = panel.querySelector('[data-role="list"]');
    const success = panel.querySelector('[data-role="success"]');
    const failure = panel.querySelector('[data-role="failure"]');
    const segments = [...panel.querySelectorAll('.ct-segment')];

    containerInput.value = settings.targetContainer || '';
    centerInput.value = settings.centerCode || DEFAULT_CENTER_CODE;

    const setActiveDays = (days) => {
      segments.forEach(button => {
        button.classList.toggle('is-active', button.dataset.days === String(days));
      });
    };

    setActiveDays(initialDays);

    segments.forEach(button => {
      button.addEventListener('click', () => setActiveDays(button.dataset.days));
    });

    const getOptions = () => {
      const selected = segments.find(button => button.classList.contains('is-active'));

      return {
        targetContainer: containerInput.value.trim(),
        centerCode: centerInput.value.trim() || DEFAULT_CENTER_CODE,
        dateRangeDays: Number(selected?.dataset.days || DEFAULT_DATE_RANGE_DAYS)
      };
    };

    const setRunning = (running) => {
      startButton.disabled = running;
      stopButton.disabled = !running;
      containerInput.disabled = running;
      centerInput.disabled = running;
      segments.forEach(button => {
        button.disabled = running;
      });
    };

    const setDownloadEnabled = (enabled) => {
      downloadButton.disabled = !enabled;
    };

    const update = ({ current = 0, total = 0, message = '', listCount = null, successCount = null, failureCount = null }) => {
      const percent = total ? Math.round((current / total) * 100) : 0;

      status.textContent = message;
      count.textContent = `${current} / ${total} (${percent}%)`;
      bar.style.width = `${percent}%`;

      if (listCount !== null) list.textContent = `목록 ${listCount}`;
      if (successCount !== null) success.textContent = `성공 ${successCount}`;
      if (failureCount !== null) failure.textContent = `실패 ${failureCount}`;
    };

    const done = (message = '완료') => {
      status.textContent = message;
      bar.style.width = '100%';
      bar.style.background = '#3b82f6';
      setRunning(false);
    };

    const stopped = (message = '중지됨') => {
      status.textContent = message;
      bar.style.background = '#f59e0b';
      setRunning(false);
    };

    const error = (message = '오류 발생') => {
      status.textContent = message;
      bar.style.width = '100%';
      bar.style.background = '#ef4444';
      setRunning(false);
    };

    const resetBar = () => {
      bar.style.width = '0%';
      bar.style.background = '#22c55e';
    };

    const closeLater = () => {
      setTimeout(() => {
        const currentPanel = document.getElementById(PANEL_ID);
        if (currentPanel) currentPanel.remove();
      }, PANEL_AUTO_CLOSE_MS);
    };

    return {
      panel,
      startButton,
      stopButton,
      downloadButton,
      closeButton,
      containerInput,
      getOptions,
      setRunning,
      setDownloadEnabled,
      update,
      done,
      stopped,
      error,
      resetBar,
      closeLater
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

  const buildListUrl = ({ pageNo, targetContainer, centerCode, searchStartDate, searchEndDate }) => {
    const url = new URL('/transfer/admin/operation/paging', location.origin);

    url.searchParams.set('page', String(pageNo));
    url.searchParams.set('skuBarcode', '');
    url.searchParams.set('skuExternalId', '');
    url.searchParams.set('skuId', '');
    url.searchParams.set('vehicleNumber', '');
    url.searchParams.set('status', '');
    url.searchParams.set('containerBarcode', targetContainer);
    url.searchParams.set('transferCartPriority', '');
    url.searchParams.set('toCenterCode', centerCode);
    url.searchParams.set('centerCode', '');
    url.searchParams.set('transferAllocationType', '');
    url.searchParams.set('transferPlanExternalId', '');
    url.searchParams.set('cartBarcode', '');
    url.searchParams.set('searchDateType', 'PICKING_START_DATE');
    url.searchParams.set('end', searchEndDate);
    url.searchParams.set('start', searchStartDate);

    return url.href;
  };

  const fetchHtml = async (url, signal) => {
    await sleep(DELAY, signal);

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
      throw new Error(`FETCH_FAILED_${response.status}`);
    }

    if (html.includes('<input') && html.includes('password')) {
      throw new Error('SESSION_EXPIRED');
    }

    return html;
  };

  const collectListByPagingUrl = async ({ progress, options, dateRange, signal }) => {
    const allRows = [];
    const seenOperationIds = new Set();
    const seenPageSignatures = new Set();

    for (let page = 0; page < MAX_PAGE; page++) {
      if (signal.aborted) throw createAbortError();

      progress.update({
        current: page,
        total: 0,
        message: `목록 조회 중: page=${page}`,
        listCount: allRows.length
      });

      const listUrl = buildListUrl({
        pageNo: page,
        targetContainer: options.targetContainer,
        centerCode: options.centerCode,
        searchStartDate: dateRange.searchStartDate,
        searchEndDate: dateRange.searchEndDate
      });

      console.log(`[목록 URL] page=${page}`, listUrl);

      const html = await fetchHtml(listUrl, signal);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = parseListRows(doc);

      console.log(`[목록 수집] page=${page}, ${rows.length}건`);

      if (rows.length === 0) {
        console.log(`[목록 종료] page=${page} 결과 없음`);
        break;
      }

      const pageSignature = getRowsSignature(rows);

      if (seenPageSignatures.has(pageSignature)) {
        console.warn(`[목록 종료] page=${page} 이전 페이지와 동일 데이터 감지`);
        break;
      }

      seenPageSignatures.add(pageSignature);

      let addedCount = 0;

      rows.forEach(row => {
        const key = row.operationId || row.operationDetailUrl;

        if (!key || seenOperationIds.has(key)) return;

        seenOperationIds.add(key);
        allRows.push(row);
        addedCount++;
      });

      progress.update({
        current: page + 1,
        total: 0,
        message: `목록 누적: ${allRows.length}건`,
        listCount: allRows.length
      });

      console.log(`[목록 추가] page=${page}, 신규 ${addedCount}건, 누적 ${allRows.length}건`);

      if (rows.length < PAGE_SIZE) {
        console.log(`[목록 종료] page=${page} ${PAGE_SIZE}건 미만`);
        break;
      }
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

    const bom = '\uFEFF';

    const blob = new Blob([bom + csv], {
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

  const makeFileName = (targetContainer, suffix = '') => {
    const safeContainer = targetContainer.replace(/[\\/:*?"<>|]/g, '_');
    const suffixText = suffix ? `_${suffix}` : '';
    return `GrabJace_${safeContainer}_${getTimestamp()}${suffixText}.csv`;
  };

  const progress = createPanel();

  let abortController = null;
  let running = false;
  let latestFlatRows = [];
  let latestOptions = null;
  let latestListRows = [];
  let latestTargetRows = [];

  const downloadLatest = (suffix = '') => {
    if (!latestFlatRows.length || !latestOptions) return;

    const numberedRows = addRowNumbers(latestFlatRows);
    const fileName = makeFileName(latestOptions.targetContainer, suffix);

    window.containerPutawayResult = numberedRows;
    downloadCsv(numberedRows, fileName);
  };

  progress.downloadButton.addEventListener('click', () => {
    downloadLatest(running ? 'partial' : '');
  });

  progress.closeButton.addEventListener('click', () => {
    if (abortController) abortController.abort();
    progress.panel.remove();
  });

  progress.stopButton.addEventListener('click', () => {
    if (abortController) abortController.abort();
  });

  const runSearch = async () => {
    if (running) return;

    const options = progress.getOptions();

    if (!options.targetContainer) {
      alert('컨테이너 바코드가 입력되지 않았습니다.');
      progress.containerInput.focus();
      return;
    }

    saveSettings(options);

    const dateRange = getDateRange(options.dateRangeDays);

    abortController = new AbortController();
    window[GLOBAL_ABORT_KEY] = abortController;
    running = true;
    latestFlatRows = [];
    latestOptions = options;
    latestListRows = [];
    latestTargetRows = [];

    progress.resetBar();
    progress.setRunning(true);
    progress.setDownloadEnabled(false);
    progress.update({
      current: 0,
      total: 0,
      message: '목록 URL 직접 조회 준비 중...',
      listCount: 0,
      successCount: 0,
      failureCount: 0
    });

    let completedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    try {
      console.clear();

      const listRows = await collectListByPagingUrl({
        progress,
        options,
        dateRange,
        signal: abortController.signal
      });

      latestListRows = listRows;

      if (listRows.length === 0) {
        progress.error('조회된 목록이 없습니다.');

        alert(
          `조회된 목록이 없습니다.\n` +
          `컨테이너: ${options.targetContainer}\n` +
          `센터: ${options.centerCode}\n` +
          `기간: ${dateRange.searchStartDate} ~ ${dateRange.searchEndDate}`
        );

        return;
      }

      const targetRows = listRows.filter(row => {
        if (!Object.prototype.hasOwnProperty.call(row, '컨테이너 바코드')) return true;
        return row['컨테이너 바코드'] === options.targetContainer;
      });

      latestTargetRows = targetRows;

      if (targetRows.length === 0) {
        progress.error('컨테이너 일치 목록이 없습니다.');

        alert(`${options.targetContainer} 컨테이너 바코드와 일치하는 목록이 없습니다.`);

        console.table(listRows.map(row => ({
          토트바코드: row['토트바코드'],
          컨테이너바코드: row['컨테이너 바코드'],
          상태: row['상태'],
          상세URL: row.operationDetailUrl
        })));

        return;
      }

      console.log(`[조회 시작] 컨테이너: ${options.targetContainer}, 대상 토트: ${targetRows.length}건`);
      console.table(targetRows.map(row => ({
        토트바코드: row['토트바코드'],
        컨테이너바코드: row['컨테이너 바코드'],
        상태: row['상태'],
        집품수량: row['집품/분배 수량'],
        상세URL: row.operationDetailUrl
      })));

      progress.update({
        current: 0,
        total: targetRows.length,
        message: `상세 조회 준비: ${targetRows.length}건`,
        listCount: listRows.length,
        successCount,
        failureCount
      });

      const detailResults = await mapLimit(targetRows, CONCURRENCY, async (row, index) => {
        if (abortController.signal.aborted) return null;

        progress.update({
          current: completedCount,
          total: targetRows.length,
          message: `상세 조회 중: ${row['토트바코드'] || row.operationId}`,
          listCount: listRows.length,
          successCount,
          failureCount
        });

        console.log(`[${index + 1}/${targetRows.length}] 상세 조회 중`, {
          토트바코드: row['토트바코드'],
          operationId: row.operationId,
          url: row.operationDetailUrl
        });

        try {
          const html = await fetchHtml(row.operationDetailUrl, abortController.signal);
          const locations = parseLocations(html);

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

          if (error.message === 'SESSION_EXPIRED') {
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
              total: targetRows.length,
              message: `완료: ${row['토트바코드'] || row.operationId}`,
              listCount: listRows.length,
              successCount,
              failureCount
            });
          }
        }
      }, abortController.signal);

      window.containerPutawayListRows = listRows;
      window.containerPutawayTargetRows = targetRows;
      window.containerPutawayDetailResults = detailResults.filter(Boolean);
      window.containerPutawayResult = addRowNumbers(latestFlatRows);

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

      if (latestFlatRows.length) {
        downloadLatest();
      }

      progress.done(`CSV 다운로드 완료: ${latestFlatRows.length}건`);

      alert(
        `CSV 다운로드 완료\n` +
        `컨테이너: ${options.targetContainer}\n` +
        `센터: ${options.centerCode}\n` +
        `기간: ${dateRange.searchStartDate} ~ ${dateRange.searchEndDate}\n` +
        `목록 수: ${listRows.length}건\n` +
        `대상 토트 수: ${targetRows.length}건\n` +
        `성공: ${successCount}건\n` +
        `실패: ${failureCount}건\n` +
        `진열 로케이션 내역: ${latestFlatRows.length}건`
      );

      progress.closeLater();
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        console.error('[ERROR]', error);
        progress.error('세션 만료. 다시 로그인하세요.');
        alert('세션이 만료되었습니다. WMS 새로고침 및 로그인 후 다시 실행하세요.');
      } else if (isAbortError(error) || abortController?.signal.aborted) {
        progress.stopped(`중지됨: 성공 ${successCount}건, 실패 ${failureCount}건`);
      } else {
        console.error('[ERROR]', error);
        progress.error('조회 실패. Console을 확인하세요.');
        alert(`조회 실패. Console을 확인하세요.\n${error.message || error}`);
      }

      progress.setDownloadEnabled(latestFlatRows.length > 0);
    } finally {
      running = false;
      progress.setRunning(false);
      if (window[GLOBAL_ABORT_KEY] === abortController) {
        window[GLOBAL_ABORT_KEY] = null;
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
