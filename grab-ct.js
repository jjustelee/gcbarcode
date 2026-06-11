(async () => {
  'use strict';

  const targetContainer = prompt('조회할 컨테이너 바코드를 입력하세요')?.trim();

  if (!targetContainer) {
    alert('컨테이너 바코드가 입력되지 않았습니다.');
    return;
  }

  const CENTER_CODE = 'DON1CFC';
  const CONCURRENCY = 3;
  const DELAY = 500;
  const PAGE_SIZE = 20;
  const MAX_PAGE = 200;
  const DATE_RANGE_DAYS = 30;
  const PANEL_AUTO_CLOSE_MS = 5000;

  const clean = (text) =>
    (text || '')
      .replace(/\s+/g, ' ')
      .trim();

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - DATE_RANGE_DAYS);

  const searchEndDate = formatDate(today);
  const searchStartDate = formatDate(startDate);

  const createProgressPanel = () => {
    const old = document.getElementById('ct-location-progress-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = 'ct-location-progress-panel';
    panel.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 999999;
      width: 360px;
      padding: 14px;
      background: #111827;
      color: #ffffff;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold; font-size:14px; margin-bottom:8px;';
    title.textContent = 'CT Location 조회';

    const container = document.createElement('div');
    container.id = 'ct-progress-container';
    container.style.cssText = 'margin-bottom:6px; color:#d1d5db;';
    container.textContent = `컨테이너: ${targetContainer}`;

    const dateInfo = document.createElement('div');
    dateInfo.style.cssText = 'margin-bottom:6px; color:#d1d5db;';
    dateInfo.textContent = `기간: ${searchStartDate} ~ ${searchEndDate}`;

    const status = document.createElement('div');
    status.id = 'ct-progress-status';
    status.style.cssText = 'margin-bottom:8px;';
    status.textContent = '준비 중...';

    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = `
      width:100%;
      height:8px;
      background:#374151;
      border-radius:4px;
      overflow:hidden;
      margin-bottom:8px;
    `;

    const bar = document.createElement('div');
    bar.id = 'ct-progress-bar';
    bar.style.cssText = `
      width:0%;
      height:100%;
      background:#22c55e;
      transition:width 0.2s;
    `;

    const count = document.createElement('div');
    count.id = 'ct-progress-count';
    count.style.cssText = 'color:#d1d5db;';
    count.textContent = '0 / 0';

    progressWrap.appendChild(bar);
    panel.appendChild(title);
    panel.appendChild(container);
    panel.appendChild(dateInfo);
    panel.appendChild(status);
    panel.appendChild(progressWrap);
    panel.appendChild(count);

    document.body.appendChild(panel);

    const removePanel = () => {
      setTimeout(() => {
        const currentPanel = document.getElementById('ct-location-progress-panel');
        if (currentPanel) currentPanel.remove();
      }, PANEL_AUTO_CLOSE_MS);
    };

    return {
      update: ({ current = 0, total = 0, message = '' }) => {
        const percent = total ? Math.round((current / total) * 100) : 0;

        const status = document.getElementById('ct-progress-status');
        const count = document.getElementById('ct-progress-count');
        const bar = document.getElementById('ct-progress-bar');

        if (status) status.textContent = message;
        if (count) count.textContent = `${current} / ${total} (${percent}%)`;
        if (bar) bar.style.width = `${percent}%`;
      },
      done: (message = '완료') => {
        const status = document.getElementById('ct-progress-status');
        const bar = document.getElementById('ct-progress-bar');

        if (status) status.textContent = message;
        if (bar) {
          bar.style.width = '100%';
          bar.style.background = '#3b82f6';
        }

        removePanel();
      },
      error: (message = '오류 발생') => {
        const status = document.getElementById('ct-progress-status');
        const bar = document.getElementById('ct-progress-bar');

        if (status) status.textContent = message;
        if (bar) {
          bar.style.width = '100%';
          bar.style.background = '#ef4444';
        }

        removePanel();
      }
    };
  };

  const buildListUrl = (pageNo) => {
    const url = new URL('/transfer/admin/operation/paging', location.origin);

    url.searchParams.set('page', String(pageNo));
    url.searchParams.set('skuBarcode', '');
    url.searchParams.set('skuExternalId', '');
    url.searchParams.set('skuId', '');
    url.searchParams.set('vehicleNumber', '');
    url.searchParams.set('status', '');
    url.searchParams.set('containerBarcode', targetContainer);
    url.searchParams.set('transferCartPriority', '');
    url.searchParams.set('toCenterCode', CENTER_CODE);
    url.searchParams.set('centerCode', '');
    url.searchParams.set('transferAllocationType', '');
    url.searchParams.set('transferPlanExternalId', '');
    url.searchParams.set('cartBarcode', '');
    url.searchParams.set('searchDateType', 'PICKING_START_DATE');
    url.searchParams.set('end', searchEndDate);
    url.searchParams.set('start', searchStartDate);

    return url.href;
  };

  const fetchHtml = async (url) => {
    await sleep(DELAY);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
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

  const collectListByPagingUrl = async (progress) => {
    const allRows = [];
    const seenOperationIds = new Set();
    const seenPageSignatures = new Set();

    for (let page = 0; page < MAX_PAGE; page++) {
      progress.update({
        current: page,
        total: 0,
        message: `목록 조회 중: page=${page}`
      });

      const listUrl = buildListUrl(page);

      console.log(`[목록 URL] page=${page}`, listUrl);

      const html = await fetchHtml(listUrl);
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

      console.log(`[목록 추가] page=${page}, 신규 ${addedCount}건, 누적 ${allRows.length}건`);

      if (rows.length < PAGE_SIZE) {
        console.log(`[목록 종료] page=${page} ${PAGE_SIZE}건 미만`);
        break;
      }
    }

    return allRows;
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

  const mapLimit = async (items, limit, worker) => {
    const results = new Array(items.length);
    let index = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const currentIndex = index++;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    });

    await Promise.all(runners);
    return results;
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

  let progress;

  try {
    console.clear();

    progress = createProgressPanel();

    progress.update({
      current: 0,
      total: 0,
      message: '목록 URL 직접 조회 준비 중...'
    });

    const listRows = await collectListByPagingUrl(progress);

    if (listRows.length === 0) {
      progress.error('조회된 목록이 없습니다.');

      alert(
        `조회된 목록이 없습니다.\n` +
        `컨테이너: ${targetContainer}\n` +
        `센터: ${CENTER_CODE}\n` +
        `기간: ${searchStartDate} ~ ${searchEndDate}`
      );

      return;
    }

    const targetRows = listRows.filter(row => {
      if (!Object.prototype.hasOwnProperty.call(row, '컨테이너 바코드')) return true;
      return row['컨테이너 바코드'] === targetContainer;
    });

    if (targetRows.length === 0) {
      progress.error('컨테이너 일치 목록이 없습니다.');

      alert(`${targetContainer} 컨테이너 바코드와 일치하는 목록이 없습니다.`);

      console.table(listRows.map(row => ({
        토트바코드: row['토트바코드'],
        컨테이너바코드: row['컨테이너 바코드'],
        상태: row['상태'],
        상세URL: row.operationDetailUrl
      })));

      return;
    }

    console.log(`[조회 시작] 컨테이너: ${targetContainer}, 대상 토트: ${targetRows.length}건`);
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
      message: `상세 조회 준비: ${targetRows.length}건`
    });

    let completedCount = 0;

    const detailResults = await mapLimit(targetRows, CONCURRENCY, async (row, index) => {
      progress.update({
        current: completedCount,
        total: targetRows.length,
        message: `상세 조회 중: ${row['토트바코드'] || row.operationId}`
      });

      console.log(`[${index + 1}/${targetRows.length}] 상세 조회 중`, {
        토트바코드: row['토트바코드'],
        operationId: row.operationId,
        url: row.operationDetailUrl
      });

      const html = await fetchHtml(row.operationDetailUrl);
      const locations = parseLocations(html);

      completedCount++;

      progress.update({
        current: completedCount,
        total: targetRows.length,
        message: `완료: ${row['토트바코드'] || row.operationId}`
      });

      return {
        컨테이너바코드: row['컨테이너 바코드'] || targetContainer,
        토트바코드: row['토트바코드'] || '',
        목록상태: row['상태'] || '',
        집품수량: row['집품/분배 수량'] || '',
        진열내역: locations
      };
    });

    const flatRows = detailResults
      .flatMap(item => {
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
      })
      .map((row, index) => ({
        번호: index + 1,
        ...row
      }));

    window.containerPutawayResult = flatRows;
    window.containerPutawayListRows = listRows;
    window.containerPutawayTargetRows = targetRows;

    console.log('[최종 결과]');
    console.table(flatRows);

    const now = new Date();

    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const safeContainer = targetContainer.replace(/[\\/:*?"<>|]/g, '_');

    const fileName = `GrabJace_${safeContainer}_${timestamp}.csv`;

    downloadCsv(flatRows, fileName);

    progress.done(`CSV 다운로드 완료: ${flatRows.length}건`);

    alert(
      `CSV 다운로드 완료\n` +
      `컨테이너: ${targetContainer}\n` +
      `센터: ${CENTER_CODE}\n` +
      `기간: ${searchStartDate} ~ ${searchEndDate}\n` +
      `목록 수: ${listRows.length}건\n` +
      `대상 토트 수: ${targetRows.length}건\n` +
      `진열 로케이션 내역: ${flatRows.length}건`
    );

  } catch (error) {
    console.error('[ERROR]', error);

    if (progress) {
      progress.error('조회 실패. Console을 확인하세요.');
    }

    if (error.message === 'SESSION_EXPIRED') {
      alert('세션이 만료되었습니다. WMS 새로고침 및 로그인 후 다시 실행하세요.');
    } else {
      alert(`조회 실패. Console을 확인하세요.\n${error.message || error}`);
    }
  }
})();
