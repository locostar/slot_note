/* ==========================================================================
   1. 전역 상태 및 로컬 스토리지 초기화
   ========================================================================== */
let logs = JSON.parse(localStorage.getItem('workLogs')) || [];
let resvs = JSON.parse(localStorage.getItem('machineResvs')) || [];
let faults = JSON.parse(localStorage.getItem('machineFaults')) || [];
let promos = JSON.parse(localStorage.getItem('promos')) || [];
let lnfs = JSON.parse(localStorage.getItem('lnfLogs')) || [];

// 마스터 데이터
let slotMaster = JSON.parse(localStorage.getItem('slotMasterList')) || [];
let custMaster = JSON.parse(localStorage.getItem('customerMasterList')) || [];

// 필터 상태
let logCategoryFilter = 'ALL';
let logStatusFilter = 'ALL';
let resvFilter = 'ALL';
let faultFilter = 'ALL';
let promoFilter = 'ALL';
let lnfFilter = 'ALL';

let currentMasterTab = 'SLOT'; // 'SLOT' or 'CUSTOMER'
let slotFilter = 'ALL';
let custFilter = 'ALL';

/* ==========================================================================
   2. 네비게이션 & 페이지 전환
   ========================================================================== */
function showPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.add('active');
    if(el) el.classList.add('active');

    if(pageId === 'page1') renderLog();
    if(pageId === 'page2') renderResv();
    if(pageId === 'page3') renderFault();
    if(pageId === 'page4') renderPromo();
    if(pageId === 'page5') renderLnf();
    if(pageId === 'page6') renderMaster();
    updateAllBadges();
}

function toggleSidebar() {
    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    const toggle = document.getElementById('sidebarToggle');
    const label = isCollapsed ? '메뉴 펼치기' : '메뉴 접기';
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    toggle.setAttribute('aria-expanded', String(!isCollapsed));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.innerHTML = `<i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-left'}"></i>`;
    if (window.lucide) window.lucide.createIcons();
}

function toggleDarkMode() { 
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark? 'light' : 'dark'); 
}

function updateAllBadges() {
    document.getElementById('badgeLogCount').innerText = logs.filter(l =>!l.completed).length;
    document.getElementById('badgeResvCount').innerText = resvs.filter(r => r.status!== '종료됨').length;
    document.getElementById('badgeFaultCount').innerText = faults.filter(f => f.status!== '수리완료').length;
    document.getElementById('badgePromoCount').innerText = promos.filter(p =>!p.completed).length;
    document.getElementById('badgeLnfCount').innerText = lnfs.filter(l => l.status === '보관중').length;
    document.getElementById('badgeMasterCount').innerText = slotMaster.length + custMaster.length;
}

function openFile(dataUrl, fileName) {
    if(!dataUrl) return;
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    const blob = new Blob([u8arr], {type: mime});
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
}

function formatNumber(el) {
    let value = el.value.replace(/[^0-9]/g, '');
    el.value = value? Number(value).toLocaleString() : '';
}

/* ==========================================================================
   3. 마스터 데이터 자동완성 & Datalist 동기화
   ========================================================================== */
function refreshMasterDatalists() {
    const smList = document.getElementById('slotMachineDatalist');
    const cmList = document.getElementById('customerDatalist');
    if(smList) {
        smList.innerHTML = slotMaster.map(s => `<option value="${s.mNo}">${s.mTheme} (${s.mLoc} / ${s.denom || ''})</option>`).join('');
    }
    if(cmList) {
        cmList.innerHTML = custMaster.map(c => `<option value="${c.cNo}">${c.cName} [${c.tier || '일반'}] - 호스트: ${c.hName || '미지정'}</option>`).join('');
    }
}

// 머신 번호 입력 시 위치, 테마, Denom 자동 연동
function onMachineNoInput(val, locId, themeId, hintId, denomId) {
    const trimmed = val? val.trim() : '';
    const match = slotMaster.find(m => String(m.mNo).toLowerCase() === trimmed.toLowerCase());
    const hintEl = hintId? document.getElementById(hintId) : null;
    if (match) {
        if (locId && document.getElementById(locId)) document.getElementById(locId).value = match.mLoc || '';
        if (themeId && document.getElementById(themeId)) document.getElementById(themeId).value = match.mTheme || '';
        if (denomId && document.getElementById(denomId)) document.getElementById(denomId).value = match.denom || '';
        if (hintEl) {
            hintEl.style.display = 'flex';
            hintEl.innerHTML = ` <b>마스터 일치:</b> ${match.mTheme} | ${match.mLoc} (${match.denom || 'DENOM 미지정'})`;
        }
    } else {
        if (hintEl) hintEl.style.display = 'none';
    }
}

// 고객 번호 입력 시 고객명, 호스트 자동 연동
function onCustomerNoInput(val, nameId, hostId, hintId) {
    const trimmed = val? val.trim() : '';
    const match = custMaster.find(c => String(c.cNo).toLowerCase() === trimmed.toLowerCase());
    const hintEl = hintId? document.getElementById(hintId) : null;
    if (match) {
        if (nameId && document.getElementById(nameId)) document.getElementById(nameId).value = match.cName || '';
        if (hostId && document.getElementById(hostId)) document.getElementById(hostId).value = match.hName || '';
        if (hintEl) {
            hintEl.style.display = 'flex';
            hintEl.innerHTML = ` <b>마스터 일치:</b> [${match.tier || '고객'}] ${match.cName} (호스트: ${match.hName || '-'})`;
        }
    } else {
        if (hintEl) hintEl.style.display = 'none';
    }
}

/* ==========================================================================
   4. 페이지 1: 업무일지 (Work Log)
   ========================================================================== */
function setLogCategoryFilter(cat, btn) {
    logCategoryFilter = cat;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderLog();
}

function setLogStatusFilter(status, btn) {
    logStatusFilter = (logStatusFilter === status)? 'ALL' : status;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if(logStatusFilter!== 'ALL') btn.classList.add('active');
    else btn.parentElement.querySelector('button').classList.add('active');
    renderLog();
}

function searchLog() { renderLog(); }

function renderLog() {
    const body = document.getElementById('logBody');
    body.innerHTML = '';
    const q = (document.getElementById('searchBar').value || '').toLowerCase();

    // 필터링 적용
    let list = logs.filter(l => {
        const matchQuery = l.content.toLowerCase().includes(q) || l.author.toLowerCase().includes(q);
        if(!matchQuery) return false;

        if (logCategoryFilter!== 'ALL' &&!l.content.includes(`[${logCategoryFilter}]`)) {
            return false;
        }
        if (logStatusFilter === 'PENDING' && l.completed) return false;
        if (logStatusFilter === 'COMPLETED' &&!l.completed) return false;

        return true;
    });

    // 상단 통계 업데이트
    document.getElementById('logStatTotal').innerText = logs.length;
    document.getElementById('logStatPending').innerText = logs.filter(l =>!l.completed).length;
    document.getElementById('logStatDone').innerText = logs.filter(l => l.completed).length;

    if(list.length === 0) {
        body.innerHTML = `<tr><td colspan="8" style="padding:30px; color:#636e72;">등록된 업무일지가 없거나 검색 결과가 없습니다.</td></tr>`;
        updateAllBadges();
        return;
    }

    list.forEach((l, i) => {
        const parts = (l.date || '').split('. ');
        let displayDate = l.date;
        if(parts.length >= 4) displayDate = `${parts[0]}.${parts[1]}.${parts[2]}.<br>${parts[3]}`;
        const fileIcon = l.fileData? `<span onclick="openFile('${l.fileData}', '${l.fileName}')" class="file-link" title="${l.fileName}"></span>` : "";
        const completedClass = l.completed? 'completed-task' : '';
        const statusBadge = l.completed? `<span class="badge badge-success">완료됨</span>` 
            : `<span class="badge badge-warning">진행중</span>`;

        body.innerHTML += `<tr>
            <td>${list.length - i}</td>
            <td>${displayDate}</td>
            <td class="${completedClass}"><b>${escapeHtml(l.author)}</b></td>
            <td class="${completedClass}" style="text-align:left; white-space:pre-wrap; line-height:1.4;">${escapeHtml(l.content)} ${fileIcon}</td>
            <td>${statusBadge}</td>
            <td><button onclick="editLog(${l.id})" class="btn-action" style="background:var(--edit-color);">수정</button></td>
            <td><button onclick="toggleCompleteLog(${l.id})" class="btn-action" style="background:${l.completed? '#636e72' : 'var(--success-color)'};">${l.completed? '취소' : '완료'}</button></td>
            <td><button onclick="deleteLog(${l.id})" class="btn-action" style="background:var(--danger-color);">삭제</button></td>
        </tr>`;
    });
    updateAllBadges();
}

async function handleLog() {
    const author = document.getElementById('author').value.trim();
    const content = document.getElementById('content').value.trim();
    const fileInput = document.getElementById('fileInput');
    if(!author ||!content) return alert("작성자와 업무 내용을 모두 입력하세요!");
    
    let fileData = null, fileName = "";
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName = file.name;
        fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
    const editId = document.getElementById('editId').value;
    if(editId) {
        logs = logs.map(l => l.id == editId? {...l, author, content, fileData: fileData || l.fileData, fileName: fileName || l.fileName } : l);
        cancelEditLog();
    } else {
        logs.unshift({ id: Date.now(), date: new Date().toLocaleString(), author, content, fileData, fileName, completed: false });
        clearLogForm();
    }
    saveLog();
}

function toggleCompleteLog(id) {
    logs = logs.map(l => l.id === id? {...l, completed:!l.completed } : l);
    saveLog();
}

function deleteLog(id) {
    if(confirm("이 업무일지를 삭제하시겠습니까?")) {
        logs = logs.filter(l => l.id!== id);
        saveLog();
    }
}

function saveLog() { 
    localStorage.setItem('workLogs', JSON.stringify(logs)); 
    renderLog(); 
}

function clearLogForm() { 
    document.getElementById('author').value = ''; 
    document.getElementById('content').value = ''; 
    document.getElementById('fileInput').value = ''; 
    document.getElementById('editId').value = '';
}

function editLog(id) { 
    const l = logs.find(x => x.id === id); 
    if(!l) return;
    document.getElementById('author').value = l.author; 
    document.getElementById('content').value = l.content; 
    document.getElementById('editId').value = l.id; 
    document.getElementById('submitBtn').innerText = "일지 수정 완료"; 
    document.getElementById('cancelLogBtn').style.display = 'block';
}

function cancelEditLog() {
    clearLogForm();
    document.getElementById('submitBtn').innerText = "일지 등록"; 
    document.getElementById('cancelLogBtn').style.display = 'none';
}

function addPrefix(t) { 
    const ta = document.getElementById('content'); 
    ta.value = `[${t}] ` + ta.value; 
    ta.focus(); 
}

/* ==========================================================================
   5. 페이지 2: 머신 예약 (Machine Reservation)
   ========================================================================== */
function initResvTime(el) {
    const now = new Date(); 
    const offset = now.getTimezoneOffset() * 60000;
    el.value = new Date(now - offset).toISOString().slice(0,16);
    const end = new Date(now.getTime() + (24*60*60*1000) - offset);
    document.getElementById('resvEnd').value = end.toISOString().slice(0,16);
}

function setResvFilter(status, btn) {
    resvFilter = status;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderResv();
}

function searchResv() { renderResv(); }

function renderResv() {
    const body = document.getElementById('resvBody'); 
    body.innerHTML = '';
    const now = new Date();
    const q = (document.getElementById('resvSearch').value || '').toLowerCase();

    // 통계 계산
    let total = resvs.length;
    let activeCount = resvs.filter(r => r.status === '예약중').length;
    let inUseCount = resvs.filter(r => r.status === '사용중').length;
    let urgentCount = resvs.filter(r => {
        if (r.status === '종료됨') return false;
        const hoursLeft = (new Date(r.end) - now) / (1000 * 60 * 60);
        return hoursLeft <= 8 && hoursLeft > -24;
    }).length;

    document.getElementById('resvStatTotal').innerText = total;
    document.getElementById('resvStatActive').innerText = activeCount;
    document.getElementById('resvStatInUse').innerText = inUseCount;
    document.getElementById('resvStatUrgent').innerText = urgentCount;

    // 필터링
    let list = resvs.filter(r => {
        const matchQ = (r.mNo + ' ' + r.mLoc + ' ' + r.mTheme + ' ' + r.cName + ' ' + r.cNo + ' ' + r.hName + ' ' + r.author).toLowerCase().includes(q);
        if(!matchQ) return false;

        if (resvFilter === 'URGENT') {
            if (r.status === '종료됨') return false;
            const hoursLeft = (new Date(r.end) - now) / (1000 * 60 * 60);
            return hoursLeft <= 8 && hoursLeft > -24;
        } else if (resvFilter!== 'ALL') {
            return r.status === resvFilter;
        }
        return true;
    });

    if(list.length === 0) {
        body.innerHTML = `<tr><td colspan="12" style="padding:30px; color:#636e72;">예약 내역이 없거나 검색 결과가 없습니다.</td></tr>`;
        updateAllBadges();
        return;
    }

    list.forEach((r, i) => {
        const endTime = new Date(r.end);
        const hoursLeft = (endTime - now) / (1000 * 60 * 60);
        const isUrgent = (r.status!== '종료됨' && hoursLeft <= 8 && hoursLeft > -24);
        const urgentClass = isUrgent? 'urgent-row' : '';

        // 남은 시간 뱃지
        let timeLeftBadge = '';
        if(r.status === '종료됨') {
            timeLeftBadge = `<span class="badge badge-gray">종료됨</span>`;
        } else if(hoursLeft <= 0) {
            timeLeftBadge = `<span class="badge badge-danger">기한 초과</span>`;
        } else if(hoursLeft <= 8) {
            timeLeftBadge = `<span class="badge badge-danger"> ${Math.round(hoursLeft)}시간 남음</span>`;
        } else {
            timeLeftBadge = `<span class="badge badge-info">${Math.round(hoursLeft)}시간 남음</span>`;
        }

        body.innerHTML += `<tr class="${urgentClass}">
            <td>${list.length - i}</td>
            <td><b>${escapeHtml(r.mNo)}</b><br><small style="color:#636e72;">${escapeHtml(r.mLoc)}</small></td>
            <td><b>${escapeHtml(r.mTheme)}</b></td>
            <td><b>${escapeHtml(r.cName)}</b><br><small style="color:var(--accent-color);">${escapeHtml(r.cNo)}</small></td>
            <td>${r.start.replace('T', ' ')}</td>
            <td>${r.end.replace('T', ' ')}</td>
            <td>${timeLeftBadge}</td>
            <td>${escapeHtml(r.hName || '-')}</td>
            <td>${escapeHtml(r.author || '-')}</td>
            <td>
                <select class="status-select-list" onchange="updateResvStatus(${r.id}, this.value)">
                    <option value="예약중" ${r.status==='예약중'?'selected':''}> 예약중</option>
                    <option value="사용중" ${r.status==='사용중'?'selected':''}> 사용중</option>
                    <option value="종료됨" ${r.status==='종료됨'?'selected':''}> 종료됨</option>
                </select>
            </td>
            <td><button onclick="editResv(${r.id})" class="btn-action" style="background:var(--edit-color);">수정</button></td>
            <td><button class="btn-close-task" onclick="deleteResv(${r.id})">종료</button></td>
        </tr>`;
    });
    updateAllBadges();
}

function handleResv() {
    const start = document.getElementById('resvStart').value;
    const end = document.getElementById('resvEnd').value;
    const mNo = document.getElementById('mNo').value.trim();
    const mLoc = document.getElementById('mLoc').value.trim();
    const mTheme = document.getElementById('mTheme').value.trim();
    const cName = document.getElementById('cName').value.trim();
    const cNo = document.getElementById('cNo').value.trim();
    const hName = document.getElementById('hName').value.trim();
    const author = document.getElementById('rAuthor').value.trim();
    const manager = document.getElementById('rManager').value.trim();
    const status = document.getElementById('rStatus').value;
    const editId = document.getElementById('resvEditId').value;

    if(!start ||!end ||!mNo) return alert("예약 시간 및 머신 번호는 필수입니다!");

    if(editId) {
        resvs = resvs.map(r => r.id == editId? {...r, start, end, mNo, mLoc, mTheme, cName, cNo, hName, author, manager, status } : r);
        cancelEditResv();
    } else {
        const r = { id: Date.now(), start, end, mNo, mLoc, mTheme, cName, cNo, hName, author, manager, status };
        resvs.unshift(r);
        clearResvForm();
    }
    saveResv();
}

function updateResvStatus(id, s) { 
    resvs = resvs.map(r => r.id === id? {...r, status: s} : r); 
    saveResv(); 
}

function deleteResv(id) { 
    if(confirm("이 예약을 종료 처리하시겠습니까?")) { 
        resvs = resvs.map(r => r.id === id? {...r, status: '종료됨'} : r);
        saveResv(); 
    } 
}

function saveResv() { 
    localStorage.setItem('machineResvs', JSON.stringify(resvs)); 
    renderResv(); 
}

function clearResvForm() {
    document.getElementById('resvStart').value = '';
    document.getElementById('resvEnd').value = '';
    document.getElementById('mNo').value = '';
    document.getElementById('mLoc').value = '';
    document.getElementById('mTheme').value = '';
    document.getElementById('cName').value = '';
    document.getElementById('cNo').value = '';
    document.getElementById('hName').value = '';
    document.getElementById('rAuthor').value = '';
    document.getElementById('rManager').value = '';
    document.getElementById('rStatus').value = '예약중';
    document.getElementById('resvEditId').value = '';
    document.getElementById('resvMachineHint').style.display = 'none';
    document.getElementById('resvCustHint').style.display = 'none';
}

function editResv(id) {
    const r = resvs.find(x => x.id === id);
    if(!r) return;
    document.getElementById('resvEditId').value = r.id;
    document.getElementById('resvStart').value = r.start;
    document.getElementById('resvEnd').value = r.end;
    document.getElementById('mNo').value = r.mNo;
    document.getElementById('mLoc').value = r.mLoc;
    document.getElementById('mTheme').value = r.mTheme;
    document.getElementById('cName').value = r.cName;
    document.getElementById('cNo').value = r.cNo;
    document.getElementById('hName').value = r.hName;
    document.getElementById('rAuthor').value = r.author;
    document.getElementById('rManager').value = r.manager;
    document.getElementById('rStatus').value = r.status || '예약중';
    document.getElementById('resvSubmitBtn').innerText = "예약 수정 완료";
    document.getElementById('resvCancelBtn').style.display = 'block';
}

function cancelEditResv() {
    clearResvForm();
    document.getElementById('resvSubmitBtn').innerText = "예약 등록";
    document.getElementById('resvCancelBtn').style.display = 'none';
}

/* ==========================================================================
   6. 페이지 3: 머신 고장 관리 (Machine Fault)
   ========================================================================== */
function setFaultFilter(status, btn) {
    faultFilter = status;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderFault();
}

function searchFault() { renderFault(); }

function renderFault() {
    const body = document.getElementById('faultBody'); 
    body.innerHTML = '';
    const q = (document.getElementById('faultSearch').value || '').toLowerCase();

    // 통계 계산
    document.getElementById('faultStatTotal').innerText = faults.length;
    document.getElementById('faultStatOpen').innerText = faults.filter(f => f.status === '접수' ||!f.status).length;
    document.getElementById('faultStatProgress').innerText = faults.filter(f => f.status === '진단중' || f.status === '부품대기').length;
    document.getElementById('faultStatDone').innerText = faults.filter(f => f.status === '수리완료').length;

    let list = faults.filter(f => {
        const matchQ = (f.mNo + ' ' + f.denom + ' ' + f.loc + ' ' + f.reason + ' ' + f.result + ' ' + f.author).toLowerCase().includes(q);
        if(!matchQ) return false;
        if(faultFilter!== 'ALL') {
            const st = f.status || '접수';
            return st === faultFilter;
        }
        return true;
    });

    if(list.length === 0) {
        body.innerHTML = `<tr><td colspan="12" style="padding:30px; color:#636e72;">고장 내역이 없거나 검색 결과가 없습니다.</td></tr>`;
        updateAllBadges();
        return;
    }

    list.forEach((f, i) => {
        const currentStatus = f.status || '접수';
        const priorityBadge = f.priority === '최우선'? `<span class="badge badge-danger"> 최우선</span>`
            : f.priority === '긴급'? `<span class="badge badge-warning"> 긴급</span>`
            : `<span class="badge badge-gray">일반</span>`;

        body.innerHTML += `<tr>
            <td>${list.length - i}</td>
            <td>${f.time.replace('T','<br>')}</td>
            <td><b>${escapeHtml(f.mNo)}</b></td>
            <td>${escapeHtml(f.denom || '-')}</td>
            <td>${escapeHtml(f.loc || '-')}</td>
            <td>${priorityBadge}</td>
            <td style="text-align:left; color:var(--danger-dark); font-weight:600;">${escapeHtml(f.reason)}</td>
            <td style="text-align:left; white-space:pre-wrap;">${escapeHtml(f.result || '-')}</td>
            <td>
                <select class="status-select-list" onchange="updateFaultStatus(${f.id}, this.value)">
                    <option value="접수" ${currentStatus==='접수'?'selected':''}> 접수</option>
                    <option value="진단중" ${currentStatus==='진단중'?'selected':''}> 진단중</option>
                    <option value="부품대기" ${currentStatus==='부품대기'?'selected':''}> 부품대기</option>
                    <option value="수리완료" ${currentStatus==='수리완료'?'selected':''}> 수리완료</option>
                </select>
            </td>
            <td>${escapeHtml(f.author)}</td>
            <td><button onclick="editFault(${f.id})" class="btn-action" style="background:var(--edit-color);">수정</button></td>
            <td><button onclick="deleteFault(${f.id})" class="btn-action" style="background:var(--danger-color);">삭제</button></td>
        </tr>`;
    });
    updateAllBadges();
}

function handleFault() {
    const now = new Date(); 
    const offset = now.getTimezoneOffset() * 60000;
    const autoTime = new Date(now - offset).toISOString().slice(0,16);

    const mNo = document.getElementById('fNo').value.trim();
    const denom = document.getElementById('fDenom').value.trim();
    const loc = document.getElementById('fLoc').value.trim();
    const reason = document.getElementById('fReason').value.trim();
    const priority = document.getElementById('fPriority').value;
    const status = document.getElementById('fStatus').value;
    const result = document.getElementById('fResult').value.trim();
    const author = document.getElementById('fAuthor').value.trim();
    const editId = document.getElementById('faultEditId').value;

    if(!mNo ||!reason ||!author) return alert("머신 번호, 고장 증상, 작성자는 필수입니다!");

    if(editId) {
        faults = faults.map(f => f.id == editId? {...f, mNo, denom, loc, reason, priority, status, result, author } : f);
        cancelEditFault();
    } else {
        const f = { id: Date.now(), time: autoTime, mNo, denom, loc, reason, priority, status, result, author };
        faults.unshift(f);
        clearFaultForm();
    }
    saveFault();
}

function updateFaultStatus(id, s) {
    faults = faults.map(f => f.id === id? {...f, status: s } : f);
    saveFault();
}

function deleteFault(id) { 
    if(confirm("이 고장 기록을 완전히 삭제하시겠습니까?")) { 
        faults = faults.filter(x => x.id!== id); 
        saveFault(); 
    } 
}

function saveFault() { 
    localStorage.setItem('machineFaults', JSON.stringify(faults)); 
    renderFault(); 
}

function clearFaultForm() {
    document.getElementById('fNo').value = '';
    document.getElementById('fDenom').value = '';
    document.getElementById('fLoc').value = '';
    document.getElementById('fReason').value = '';
    document.getElementById('fPriority').value = '보통';
    document.getElementById('fStatus').value = '접수';
    document.getElementById('fResult').value = '';
    document.getElementById('fAuthor').value = '';
    document.getElementById('faultEditId').value = '';
    document.getElementById('faultMachineHint').style.display = 'none';
}

function editFault(id) {
    const f = faults.find(x => x.id === id);
    if(!f) return;
    document.getElementById('faultEditId').value = f.id;
    document.getElementById('fNo').value = f.mNo;
    document.getElementById('fDenom').value = f.denom;
    document.getElementById('fLoc').value = f.loc;
    document.getElementById('fReason').value = f.reason;
    document.getElementById('fPriority').value = f.priority || '보통';
    document.getElementById('fStatus').value = f.status || '접수';
    document.getElementById('fResult').value = f.result;
    document.getElementById('fAuthor').value = f.author;
    document.getElementById('faultSubmitBtn').innerText = "고장 리포트 수정 완료";
    document.getElementById('faultCancelBtn').style.display = 'block';
}

function cancelEditFault() {
    clearFaultForm();
    document.getElementById('faultSubmitBtn').innerText = "고장 리포트 등록";
    document.getElementById('faultCancelBtn').style.display = 'none';
}

/* ==========================================================================
   7. 페이지 4: 프로모션 관리 (Promotion)
   ========================================================================== */
function setPromoFilter(status, btn) {
    promoFilter = status;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderPromo();
}

function searchPromo() { renderPromo(); }

const promoPdfSections = [
    { label: '기간', heading: /^(?:(?:이벤트|행사|프로모션)\s*)?(?:(?:진행|운영)\s*)?(?:기간|일정)(?=\s|[:：-]|$)|^(?:event\s*dates?|promotion\s*period|campaign\s*period|validity)\b/i, strip: /^(?:(?:이벤트|행사|프로모션)\s*)?(?:진행|운영)?\s*(?:기간|일정)\s*[:：-]?\s*|^(?:event\s*dates?|promotion\s*period|campaign\s*period|validity)\s*[:：-]?\s*/i },
    { label: '대상', heading: /^(?:(?:참여|적용)\s*)?대상(?:자|고객|회원)?(?=\s|[:：-]|$)|^(?:eligible\s*(?:customers|members|participants)|target\s*audience)\b/i, strip: /^(?:(?:참여|적용)\s*)?대상(?:자|고객|회원)?\s*[:：-]?\s*|^(?:eligible\s*(?:customers|members|participants)|target\s*audience)\s*[:：-]?\s*/i },
    { label: '혜택', heading: /^(?:혜택|보상|리워드|경품|할인|증정)(?=\s|[:：-]|$)|^(?:benefits?|rewards?|prizes?|offers?|bonuses|discounts?)\b/i, strip: /^(?:혜택|보상|리워드|경품|할인|증정|benefits?|rewards?|prizes?|offers?|bonuses|discounts?)\s*[:：-]?\s*/i },
    { label: '참여 방법', heading: /^(?:참여\s*(?:방법|조건|절차)|응모\s*방법|신청\s*방법|이용\s*방법)(?=\s|[:：-]|$)|^(?:how\s*to\s*(?:participate|enter|redeem)|participation\s*(?:method|steps)|entry\s*method)\b/i, strip: /^(?:(?:참여|응모|신청|이용)\s*)?(?:방법|조건|절차)\s*[:：-]?\s*|^(?:how\s*to\s*(?:participate|enter|redeem)|participation\s*(?:method|steps)|entry\s*method)\s*[:：-]?\s*/i },
    { label: '유의사항', heading: /^(?:유의사항|주의사항|제외\s*대상|제한\s*사항)(?=\s|[:：-]|$)|^(?:terms\s*(?:and\s*)?conditions|conditions|restrictions|exclusions)\b/i, strip: /^(?:유의사항|주의사항|제외\s*대상|제한\s*사항|terms\s*(?:and\s*)?conditions|conditions|restrictions|exclusions)\s*[:：-]?\s*/i }
];

function promoDatesIn(text) {
    const dates = [];
    const pattern = /(\d{4})\s*(?:[./]|-|년)\s*(\d{1,2})\s*(?:[./]|-|월)\s*(\d{1,2})\s*일?/g;
    for (const match of text.matchAll(pattern)) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
            dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        }
    }
    return [...new Set(dates)];
}

function classifyPromoFactSheet(lines) {
    const markers = [
        { label: '이벤트명', heading: /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,12}(?:제목|title)/i },
        { label: '목적', heading: /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,12}(?:목적|purpose)/i },
        { label: '대상', heading: /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,24}(?:대상|세그먼트|티어|target|segment|tier)/i },
        { label: '장소', heading: /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,12}(?:장소|위치|location|venue)/i },
        { label: '시행기간', heading: /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,24}(?:시행기간|진행기간|운영기간|기간|schedule|period)/i }
    ];
    const isFactHeading = line => markers.some(marker => marker.heading.test(line)) || /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,24}관련\s*세부\s*사항/i.test(line);
    const valueAfter = marker => {
        const index = lines.findIndex(line => marker.heading.test(line));
        if (index < 0) return '';
        const headingMatch = lines[index].match(marker.heading);
        const inlineValue = headingMatch
            ? lines[index].slice(headingMatch.index + headingMatch[0].length).replace(/^[\s:：&()[\]-]+/, '').trim()
            : '';
        if (inlineValue) return inlineValue;
        for (let next = index + 1; next < lines.length; next++) {
            if (isFactHeading(lines[next])) break;
            if (/^(?:fact\s*sheet|문서\s*기록|버전\s*\d+)/i.test(lines[next])) continue;
            return lines[next].replace(/^[-•*\s]+/, '').trim();
        }
        return '';
    };

    if (!markers.some(marker => marker.heading.test(lines.join(' ')))) return null;

    const values = Object.fromEntries(markers.map(marker => [marker.label, valueAfter(marker)]));
    const eventDates = promoDatesIn(values['시행기간']);
    const details = [];
    for (const label of ['목적', '대상', '장소']) {
        if (values[label]) details.push({ label, value: values[label] });
    }
    if (values['시행기간']) details.push({ label: '시행기간', value: values['시행기간'] });

    const detailStart = lines.findIndex(line => /(?:캠페인|김페인|campaign).{0,24}(?:이벤트|event).{0,24}관련\s*세부\s*사항/i.test(line));
    if (detailStart >= 0) {
        const detailLines = lines.slice(detailStart + 1);
        const pointPeriod = lines.find(line => /(?:엑티비티|액티비티|activity\s*points?|포인트).*(?:적립|earn|accrual).*(?:기간|period)/i.test(line));
        if (pointPeriod) details.push({ label: '포인트 적립 기간', value: pointPeriod.replace(/^[-•*\s]+/, '') });

        const drawDetails = detailLines.filter(line => /추첨|주권|티켓|manual\s*draw|draw\s*(?:date|time)/i.test(line));
        if (drawDetails.length) details.push({ label: '응모·추첨', value: drawDetails.map(line => line.replace(/^[-•*\s]+/, '')).join('\n') });

        const confirmation = detailLines.find(line => /상금\s*확정|prize\s*confirmation|payout\s*(?:confirmation|time)/i.test(line));
        if (confirmation) details.push({ label: '상금 확정', value: confirmation.replace(/^[-•*\s]+/, '') });

        const krwHeader = detailLines.findIndex(line => /^\s*KRW\s*$/i.test(line));
        const prizeStart = krwHeader >= 0 ? krwHeader : detailLines.findIndex(line => /(?:cash\s*mountain.*(?:상품|prize)|상품\s*(?:내역|목록|상금))/i.test(line));
        if (prizeStart >= 0) {
            const prizeLines = detailLines.slice(prizeStart).filter(line => /현금|상금|상품|가방|cash|prize|KRW|누적|억|만원|원|^\d+\s*(?:등|st|nd|rd|th)/i.test(line) && !/^\*/.test(line));
            if (prizeLines.length) details.push({ label: '상품·상금', value: prizeLines.map(line => line.replace(/^[-•*\s]+/, '')).join('\n') });
        }

        const notes = detailLines.filter(line => /^\*/.test(line));
        if (notes.length) details.push({ label: '유의사항', value: notes.map(line => line.replace(/^\*\s*/, '')).join('\n') });
    }

    return {
        name: values['이벤트명'],
        endDate: eventDates.at(-1) || '',
        details,
        description: details.map(detail => `${detail.label}: ${detail.value}`).join('\n\n')
    };
}

function classifyPromoPdfText(text) {
    const lines = text.split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const factSheetResult = classifyPromoFactSheet(lines);
    if (factSheetResult) return factSheetResult;
    const nameHeading = /(?:이벤트|행사|프로모션)\s*(?:명|제목|타이틀)|(?:event|promotion|campaign)\s*(?:name|title)/i;
    const isHeading = line => promoPdfSections.some(section => section.heading.test(line)) || nameHeading.test(line);
    const getSectionText = section => {
        const index = lines.findIndex(line => section.heading.test(line));
        if (index < 0) return '';
        const firstLine = lines[index].replace(section.strip, '').trim();
        const values = firstLine ? [firstLine] : [];
        for (let lineIndex = index + 1; lineIndex < lines.length && values.length < 5; lineIndex++) {
            if (isHeading(lines[lineIndex])) break;
            values.push(lines[lineIndex]);
        }
        return values.join(' ').trim();
    };

    const nameLine = lines.find(line => nameHeading.test(line));
    const nameMatch = nameLine?.match(/(?:(?:이벤트|행사|프로모션)\s*(?:명|제목|타이틀)|(?:event|promotion|campaign)\s*(?:name|title))\s*[:：-]\s*(.+)$/i);
    const extractedName = nameMatch?.[1]?.trim() || '';
    const fallbackName = lines.find(line => line.length <= 60 && !isHeading(line) && !promoDatesIn(line).length);
    const dates = promoDatesIn(lines.join('\n'));
    const endDateLine = lines.find(line => /종료|마감|까지|end|expires?|until|through|\bto\b/i.test(line) && promoDatesIn(line).length);
    const startDateLine = lines.find(line => /시작|개시|부터|오픈|start|begin|from/i.test(line) && promoDatesIn(line).length);
    const endDate = (endDateLine && promoDatesIn(endDateLine).at(-1)) || dates.at(-1) || '';
    const startDate = (startDateLine && promoDatesIn(startDateLine)[0]) || (dates.length > 1 ? dates[0] : '');
    const period = startDate && endDate && startDate !== endDate
        ? `${startDate} ~ ${endDate}`
        : dates.length > 1 ? `${dates[0]} ~ ${dates.at(-1)}` : getSectionText(promoPdfSections[0]);

    const details = [];
    if (period) details.push({ label: '기간', value: period });
    for (const section of promoPdfSections.slice(1)) {
        const value = getSectionText(section);
        if (value) details.push({ label: section.label, value });
    }
    return {
        name: extractedName || fallbackName || '',
        endDate,
        details,
        description: details.map(detail => `${detail.label}: ${detail.value}`).join('\n\n')
    };
}

function showPromoPdfResults(result) {
    const panel = document.getElementById('promoPdfResults');
    panel.hidden = false;
    if (!result.details.length) {
        panel.innerHTML = '<h4>분류 결과</h4><div class="promo-pdf-status">이벤트 세부 항목을 찾지 못했습니다. PDF의 텍스트를 확인하고 직접 입력해 주세요.</div>';
        return;
    }
    panel.innerHTML = `<h4>자동 분류 결과</h4><dl>${result.details.map(detail => `<dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>`).join('')}</dl>`;
}

async function handlePromoPdfUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const status = document.getElementById('promoPdfStatus');
    const panel = document.getElementById('promoPdfResults');
    status.dataset.state = '';
    status.textContent = 'PDF 텍스트를 분석하고 있습니다...';
    panel.hidden = true;

    try {
        if (!window.pdfjsLib) throw new Error('PDF 분석 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pageLines = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const items = (await page.getTextContent()).items.filter(item => item.str?.trim());
            const rows = [];
            for (const item of items) {
                const y = Math.round(item.transform?.[5] || 0);
                let row = rows.find(candidate => Math.abs(candidate.y - y) <= 2);
                if (!row) rows.push(row = { y, items: [] });
                row.items.push({ x: item.transform?.[4] || 0, text: item.str.trim() });
            }
            pageLines.push(rows.sort((a, b) => b.y - a.y).map(row => row.items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ')).join('\n'));
        }

        const extractedText = pageLines.join('\n').trim();
        if (!extractedText) {
            status.dataset.state = 'error';
            status.textContent = 'PDF에서 텍스트를 찾지 못했습니다. 스캔 이미지 PDF는 OCR 처리 후 업로드해 주세요.';
            return;
        }

        const result = classifyPromoPdfText(extractedText);
        if (result.name) document.getElementById('promoName').value = result.name;
        if (result.endDate) document.getElementById('promoEnd').value = result.endDate;
        if (result.description) document.getElementById('promoDesc').value = result.description;
        showPromoPdfResults(result);
        status.dataset.state = result.details.length ? 'success' : 'error';
        status.textContent = result.details.length
            ? `${pdf.numPages}페이지에서 이벤트 세부사항 ${result.details.length}개 항목을 분류했습니다. 저장 전에 내용을 확인해 주세요.`
            : `${pdf.numPages}페이지를 읽었지만 분류할 이벤트 세부사항을 찾지 못했습니다.`;
    } catch (error) {
        status.dataset.state = 'error';
        status.textContent = error.message || 'PDF 분석 중 오류가 발생했습니다.';
    }
}

function renderPromo() {
    const body = document.getElementById('promoBody'); 
    body.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const q = (document.getElementById('promoSearch').value || '').toLowerCase();

    // 통계 계산
    let total = promos.length;
    let activeCount = promos.filter(p =>!p.completed && p.end >= today).length;
    let doneCount = promos.filter(p => p.completed || p.end < today).length;
    let expiringCount = promos.filter(p => {
        if(p.completed) return false;
        const diffDays = Math.ceil((new Date(p.end) - new Date(today)) / (1000*60*60*24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;

    document.getElementById('promoStatTotal').innerText = total;
    document.getElementById('promoStatActive').innerText = activeCount;
    document.getElementById('promoStatExpiring').innerText = expiringCount;
    document.getElementById('promoStatDone').innerText = doneCount;

    let list = promos.filter(p => {
        const matchQ = (p.name + ' ' + p.desc).toLowerCase().includes(q);
        if(!matchQ) return false;
        if(promoFilter === 'ACTIVE') return!p.completed && p.end >= today;
        if(promoFilter === 'EXPIRING') {
            if(p.completed) return false;
            const diff = Math.ceil((new Date(p.end) - new Date(today)) / (1000*60*60*24));
            return diff >= 0 && diff <= 7;
        }
        if(promoFilter === 'COMPLETED') return p.completed || p.end < today;
        return true;
    });

    if(list.length === 0) {
        body.innerHTML = `<tr><td colspan="9" style="padding:30px; color:#636e72;">프로모션이 없거나 검색 결과가 없습니다.</td></tr>`;
        updateAllBadges();
        return;
    }

    list.forEach((p, i) => {
        const diffDays = Math.ceil((new Date(p.end) - new Date(today)) / (1000*60*60*24));
        const isExpired = (p.end < today &&!p.completed);
        const expiredClass = isExpired? 'promo-expired' : '';
        const completedClass = p.completed? 'completed-task' : '';
        const fileIcon = p.fileData? `<span onclick="openFile('${p.fileData}', '${p.fileName}')" class="file-link" title="${p.fileName}"></span>` : "";

        // D-day 뱃지
        let ddayBadge = '';
        if(p.completed) {
            ddayBadge = `<span class="badge badge-gray">완료</span>`;
        } else if(diffDays < 0) {
            ddayBadge = `<span class="badge badge-danger">종료됨</span>`;
        } else if(diffDays === 0) {
            ddayBadge = `<span class="badge badge-danger"> 오늘마감</span>`;
        } else if(diffDays <= 7) {
            ddayBadge = `<span class="badge badge-warning">D-${diffDays}</span>`;
        } else {
            ddayBadge = `<span class="badge badge-info">D-${diffDays}</span>`;
        }

        const statusBadge = p.completed? `<span class="badge badge-gray">완료됨</span>`
            : isExpired? `<span class="badge badge-danger">기간만료</span>`
            : `<span class="badge badge-success">진행중</span>`;

        body.innerHTML += `<tr class="${expiredClass}">
            <td>${list.length - i}</td>
            <td class="${completedClass}"><b>${escapeHtml(p.name)}</b></td>
            <td class="${completedClass}" style="text-align:left; white-space:pre-wrap; line-height:1.4;">${escapeHtml(p.desc)} ${fileIcon}</td>
            <td>${ddayBadge}</td>
            <td class="${completedClass}">${p.end}</td>
            <td>${statusBadge}</td>
            <td><button onclick="editPromo(${p.id})" class="btn-action" style="background:var(--edit-color);">편집</button></td>
            <td><button onclick="toggleCompletePromo(${p.id})" class="btn-action" style="background:${p.completed? '#636e72' : 'var(--success-color)'};">${p.completed?'취소':'완료'}</button></td>
            <td><button onclick="deletePromo(${p.id})" class="btn-action" style="background:var(--danger-color);">삭제</button></td>
        </tr>`;
    });
    updateAllBadges();
}

async function handlePromo() {
    const name = document.getElementById('promoName').value.trim();
    const desc = document.getElementById('promoDesc').value.trim();
    const end = document.getElementById('promoEnd').value;
    const fileInput = document.getElementById('promoFile');
    const editId = document.getElementById('promoEditId').value;
    if(!name ||!desc ||!end) return alert("이벤트명, 상세 설명, 종료 날짜는 필수 입력입니다!");

    let fileData = null, fileName = "";
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0]; 
        fileName = file.name;
        fileData = await new Promise(r => { 
            const reader = new FileReader(); 
            reader.onload = e => r(e.target.result); 
            reader.readAsDataURL(file); 
        });
    }

    if(editId) {
        promos = promos.map(p => p.id == editId? {...p, name, desc, end, fileData: fileData || p.fileData, fileName: fileName || p.fileName } : p);
        cancelEditPromo();
    } else {
        promos.unshift({ id: Date.now(), name, desc, end, fileData, fileName, completed: false });
        clearPromoForm();
    }
    savePromo();
}

function toggleCompletePromo(id) { 
    promos = promos.map(p => p.id === id? {...p, completed:!p.completed } : p); 
    savePromo(); 
}

function deletePromo(id) { 
    if(confirm("이 프로모션을 삭제하시겠습니까?")) { 
        promos = promos.filter(p => p.id!== id); 
        savePromo(); 
    } 
}

function savePromo() { 
    localStorage.setItem('promos', JSON.stringify(promos)); 
    renderPromo(); 
}

function clearPromoForm() { 
    document.getElementById('promoName').value = ''; 
    document.getElementById('promoDesc').value = ''; 
    document.getElementById('promoEnd').value = ''; 
    document.getElementById('promoFile').value = ''; 
    document.getElementById('promoEditId').value = '';
}

function editPromo(id) { 
    const p = promos.find(x => x.id === id); 
    if(!p) return;
    document.getElementById('promoName').value = p.name; 
    document.getElementById('promoDesc').value = p.desc; 
    document.getElementById('promoEnd').value = p.end; 
    document.getElementById('promoEditId').value = p.id; 
    document.getElementById('promoBtn').innerText = "프로모션 수정 완료"; 
    document.getElementById('promoCancelBtn').style.display = 'block';
}

function cancelEditPromo() {
    clearPromoForm();
    document.getElementById('promoBtn').innerText = "프로모션 등록"; 
    document.getElementById('promoCancelBtn').style.display = 'none';
}

/* ==========================================================================
   8. 페이지 5: L&F 로그 (Lost & Found)
   ========================================================================== */
function setLnfFilter(status, btn) {
    lnfFilter = status;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderLnf();
}

function searchLnf() { renderLnf(); }

function renderLnf() {
    const body = document.getElementById('lnfBody'); 
    body.innerHTML = '';
    const q = (document.getElementById('lnfSearch').value || '').toLowerCase();

    // 합계 계산 (미반환 CASH, 미반환 TITO)
    let totalCount = lnfs.length;
    let pendingCount = lnfs.filter(l => l.status === '보관중').length;
    let cashSum = 0;
    let titoSum = 0;

    lnfs.forEach(l => {
        if(l.status === '보관중') {
            const lfVal = parseInt((l.lf || '0').replace(/[^0-9]/g, ''), 10) || 0;
            if(l.type === 'CASH') cashSum += lfVal;
            else if(l.type === 'TITO') titoSum += lfVal;
        }
    });

    document.getElementById('lnfStatTotal').innerText = totalCount;
    document.getElementById('lnfStatCashSum').innerText = '₩ ' + cashSum.toLocaleString();
    document.getElementById('lnfStatTitoSum').innerText = '₩ ' + titoSum.toLocaleString();
    document.getElementById('lnfStatPending').innerText = pendingCount;

    let list = lnfs.filter(l => {
        const matchQ = (l.mNo + ' ' + l.mLoc + ' ' + l.cNo + ' ' + l.author + ' ' + l.type).toLowerCase().includes(q);
        if(!matchQ) return false;
        if(lnfFilter === 'CASH') return l.type === 'CASH';
        if(lnfFilter === 'TITO') return l.type === 'TITO';
        if(lnfFilter === '보관중') return l.status === '보관중';
        if(lnfFilter === '수령완료') return l.status === '수령완료';
        return true;
    });

    if(list.length === 0) {
        body.innerHTML = `<tr><td colspan="13" style="padding:30px; color:#636e72;">L&F 로그가 없거나 검색 결과가 없습니다.</td></tr>`;
        updateAllBadges();
        return;
    }

    list.forEach((l, i) => {
        const isClaimed = l.status === '수령완료';
        const completedClass = isClaimed? 'completed-task' : '';
        const typeBadge = l.type === 'CASH'? `<span class="badge badge-success"> CASH</span>` 
            : `<span class="badge badge-info"> TITO</span>`;
        
        body.innerHTML += `<tr>
            <td>${list.length - i}</td>
            <td>${l.time}</td>
            <td class="${completedClass}"><b>${escapeHtml(l.mNo || '-')}</b></td>
            <td class="${completedClass}">${escapeHtml(l.mLoc || '-')}</td>
            <td class="${completedClass}"><b>${escapeHtml(l.cNo || '-')}</b></td>
            <td class="${completedClass}">${l.uc || '0'}</td>
            <td class="${completedClass}" style="color:var(--accent-color); font-weight:bold;">${l.lf || '0'}</td>
            <td>${typeBadge}</td>
            <td>
                <select class="status-select-list" onchange="updateLnfStatus(${l.id}, this.value)">
                    <option value="보관중" ${l.status==='보관중'?'selected':''}> 보관중</option>
                    <option value="수령완료" ${l.status==='수령완료'?'selected':''}> 수령완료</option>
                    <option value="국고귀속" ${l.status==='국고귀속'?'selected':''}> 귀속/폐기</option>
                </select>
            </td>
            <td class="${completedClass}">${escapeHtml(l.author)}</td>
            <td><button onclick="editLnf(${l.id})" class="btn-action" style="background:var(--edit-color);">수정</button></td>
            <td><button onclick="toggleClaimLnf(${l.id})" class="btn-action" style="background:${isClaimed? '#636e72' : 'var(--success-color)'};">${isClaimed? '취소' : '반환'}</button></td>
            <td><button onclick="deleteLnf(${l.id})" class="btn-action" style="background:var(--danger-color);">삭제</button></td>
        </tr>`;
    });
    updateAllBadges();
}

function handleLnf() {
    const mNo = document.getElementById('lnfMNo').value.trim();
    const mLoc = document.getElementById('lnfMLoc').value.trim();
    const cNo = document.getElementById('lnfCNo').value.trim();
    const uc = document.getElementById('lnfUC').value.trim();
    const lf = document.getElementById('lnfLF').value.trim();
    const type = document.getElementById('lnfType').value;
    const status = document.getElementById('lnfStatus').value;
    const author = document.getElementById('lnfAuthor').value.trim();
    const editId = document.getElementById('lnfEditId').value;

    if(!author) return alert("작성자를 입력하세요.");

    if(editId) {
        lnfs = lnfs.map(l => l.id == editId? {...l, mNo, mLoc, cNo, uc, lf, type, status, author } : l);
        cancelEditLnf();
    } else {
        lnfs.unshift({ 
            id: Date.now(), 
            time: new Date().toLocaleString(), 
            mNo, mLoc, cNo, uc, lf, type, status, author 
        });
        clearLnfForm();
    }
    saveLnf();
}

function updateLnfStatus(id, s) {
    lnfs = lnfs.map(l => l.id === id? {...l, status: s } : l);
    saveLnf();
}

function toggleClaimLnf(id) {
    lnfs = lnfs.map(l => {
        if(l.id === id) {
            const newStatus = l.status === '수령완료'? '보관중' : '수령완료';
            return {...l, status: newStatus };
        }
        return l;
    });
    saveLnf();
}

function deleteLnf(id) { 
    if(confirm("이 L&F 기록을 삭제하시겠습니까?")) { 
        lnfs = lnfs.filter(l => l.id!== id); 
        saveLnf(); 
    } 
}

function saveLnf() { 
    localStorage.setItem('lnfLogs', JSON.stringify(lnfs)); 
    renderLnf(); 
}

function clearLnfForm() { 
    document.getElementById('lnfMNo').value = ''; 
    document.getElementById('lnfMLoc').value = ''; 
    document.getElementById('lnfCNo').value = ''; 
    document.getElementById('lnfUC').value = ''; 
    document.getElementById('lnfLF').value = ''; 
    document.getElementById('lnfType').value = 'CASH'; 
    document.getElementById('lnfStatus').value = '보관중';
    document.getElementById('lnfAuthor').value = ''; 
    document.getElementById('lnfEditId').value = '';
    document.getElementById('lnfMachineHint').style.display = 'none';
    document.getElementById('lnfCustHint').style.display = 'none';
}

function editLnf(id) { 
    const l = lnfs.find(x => x.id === id);
    if(!l) return;
    document.getElementById('lnfMNo').value = l.mNo || ''; 
    document.getElementById('lnfMLoc').value = l.mLoc || ''; 
    document.getElementById('lnfCNo').value = l.cNo || '';
    document.getElementById('lnfUC').value = l.uc || ''; 
    document.getElementById('lnfLF').value = l.lf || ''; 
    document.getElementById('lnfType').value = l.type || 'CASH';
    document.getElementById('lnfStatus').value = l.status || '보관중';
    document.getElementById('lnfAuthor').value = l.author || ''; 
    document.getElementById('lnfEditId').value = l.id;
    document.getElementById('lnfBtn').innerText = "로그 수정 완료";
    document.getElementById('lnfCancelBtn').style.display = 'block';
}

function cancelEditLnf() {
    clearLnfForm();
    document.getElementById('lnfBtn').innerText = "로그 등록";
    document.getElementById('lnfCancelBtn').style.display = 'none';
}

/* ==========================================================================
   9. 페이지 6: 마스터 데이터 관리 (Master Data Management)
   ========================================================================== */
function switchMasterTab(tab) {
    currentMasterTab = tab;
    const slotBtn = document.getElementById('tabSlotMasterBtn');
    const custBtn = document.getElementById('tabCustMasterBtn');
    const slotForm = document.getElementById('slotMasterForm');
    const custForm = document.getElementById('custMasterForm');
    const slotWrap = document.getElementById('slotMasterTableWrap');
    const custWrap = document.getElementById('custMasterTableWrap');
    const slotStats = document.getElementById('masterStatsSlot');
    const custStats = document.getElementById('masterStatsCust');
    const slotFilters = document.getElementById('slotFilterGroup');
    const custFilters = document.getElementById('custFilterGroup');
    const formTitle = document.getElementById('masterFormTitle');

    if(tab === 'SLOT') {
        slotBtn.classList.add('active'); custBtn.classList.remove('active');
        slotForm.style.display = 'grid'; custForm.style.display = 'none';
        slotWrap.style.display = 'block'; custWrap.style.display = 'none';
        slotStats.style.display = 'flex'; custStats.style.display = 'none';
        slotFilters.style.display = 'flex'; custFilters.style.display = 'none';
        formTitle.innerText = " 슬롯머신 개별 등록";
    } else {
        custBtn.classList.add('active'); slotBtn.classList.remove('active');
        custForm.style.display = 'grid'; slotForm.style.display = 'none';
        custWrap.style.display = 'block'; slotWrap.style.display = 'none';
        custStats.style.display = 'flex'; slotStats.style.display = 'none';
        custFilters.style.display = 'flex'; slotFilters.style.display = 'none';
        formTitle.innerText = " 고객정보 개별 등록";
    }
    renderMaster();
}

function setSlotMasterFilter(filter, btn) {
    slotFilter = filter;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderMaster();
}

function setCustMasterFilter(filter, btn) {
    custFilter = filter;
    btn.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderMaster();
}

function searchMaster() { renderMaster(); }

function renderMaster() {
    const q = (document.getElementById('masterSearch').value || '').toLowerCase();

    if(currentMasterTab === 'SLOT') {
        const body = document.getElementById('slotMasterBody');
        body.innerHTML = '';

        // 통계
        document.getElementById('slotStatTotal').innerText = slotMaster.length;
        document.getElementById('slotStatNormal').innerText = slotMaster.filter(s => s.status === '정상가동').length;
        document.getElementById('slotStatCheck').innerText = slotMaster.filter(s => s.status === '점검중').length;
        document.getElementById('slotStatFault').innerText = slotMaster.filter(s => s.status === '고장').length;

        let list = slotMaster.filter(s => {
            const matchQ = (s.mNo + ' ' + s.mTheme + ' ' + s.mLoc + ' ' + s.denom + ' ' + s.maker + ' ' + s.memo).toLowerCase().includes(q);
            if(!matchQ) return false;
            if(slotFilter!== 'ALL') return s.status === slotFilter;
            return true;
        });

        if(list.length === 0) {
            body.innerHTML = `<tr><td colspan="10" style="padding:30px; color:#636e72;">등록된 슬롯머신 마스터가 없거나 검색 결과가 없습니다.<br><button class="btn-secondary-tool" style="margin-top:10px;" onclick="loadSampleMasterData()"> 샘플 데이터 채우기</button></td></tr>`;
            return;
        }

        list.forEach((s, i) => {
            const statusBadge = s.status === '정상가동'? `<span class="badge badge-success"> 정상</span>`
                : s.status === '점검중'? `<span class="badge badge-warning"> 점검중</span>`
                : `<span class="badge badge-danger"> 고장</span>`;

            body.innerHTML += `<tr>
                <td>${list.length - i}</td>
                <td><b>${escapeHtml(s.mNo)}</b></td>
                <td style="font-weight:600; text-align:left;">${escapeHtml(s.mTheme)}</td>
                <td>${escapeHtml(s.mLoc)}</td>
                <td>${escapeHtml(s.denom || '-')}</td>
                <td>${escapeHtml(s.maker || '-')}</td>
                <td>${statusBadge}</td>
                <td style="text-align:left; color:#636e72;">${escapeHtml(s.memo || '-')}</td>
                <td><button onclick="editSlotMaster('${s.mNo}')" class="btn-action" style="background:var(--edit-color);">수정</button></td>
                <td><button onclick="deleteSlotMaster('${s.mNo}')" class="btn-action" style="background:var(--danger-color);">삭제</button></td>
            </tr>`;
        });
    } else {
        const body = document.getElementById('custMasterBody');
        body.innerHTML = '';

        // 통계
        document.getElementById('custStatTotal').innerText = custMaster.length;
        document.getElementById('custStatVip').innerText = custMaster.filter(c => c.tier === 'VVIP' || c.tier === 'VIP').length;
        document.getElementById('custStatHigh').innerText = custMaster.filter(c => c.tier === 'Diamond' || c.tier === 'Platinum').length;
        document.getElementById('custStatNormal').innerText = custMaster.filter(c => c.tier === 'Gold' || c.tier === '일반' ||!c.tier).length;

        let list = custMaster.filter(c => {
            const matchQ = (c.cNo + ' ' + c.cName + ' ' + c.tier + ' ' + c.hName + ' ' + c.contact + ' ' + c.memo).toLowerCase().includes(q);
            if(!matchQ) return false;
            if(custFilter!== 'ALL') return c.tier === custFilter;
            return true;
        });

        if(list.length === 0) {
            body.innerHTML = `<tr><td colspan="9" style="padding:30px; color:#636e72;">등록된 고객 마스터가 없거나 검색 결과가 없습니다.<br><button class="btn-secondary-tool" style="margin-top:10px;" onclick="loadSampleMasterData()"> 샘플 데이터 채우기</button></td></tr>`;
            return;
        }

        list.forEach((c, i) => {
            const tierBadge = c.tier === 'VVIP'? `<span class="badge badge-danger"> VVIP</span>`
                : c.tier === 'VIP'? `<span class="badge badge-purple"> VIP</span>`
                : c.tier === 'Diamond'? `<span class="badge badge-info"> Diamond</span>`
                : c.tier === 'Platinum'? `<span class="badge badge-success"> Platinum</span>`
                : c.tier === 'Gold'? `<span class="badge badge-warning"> Gold</span>`
                : `<span class="badge badge-gray">일반</span>`;

            body.innerHTML += `<tr>
                <td>${list.length - i}</td>
                <td><b>${escapeHtml(c.cNo)}</b></td>
                <td><b>${escapeHtml(c.cName)}</b></td>
                <td>${tierBadge}</td>
                <td>${escapeHtml(c.hName || '-')}</td>
                <td>${escapeHtml(c.contact || '-')}</td>
                <td style="text-align:left; color:#636e72;">${escapeHtml(c.memo || '-')}</td>
                <td><button onclick="editCustMaster('${c.cNo}')" class="btn-action" style="background:var(--edit-color);">수정</button></td>
                <td><button onclick="deleteCustMaster('${c.cNo}')" class="btn-action" style="background:var(--danger-color);">삭제</button></td>
            </tr>`;
        });
    }
    refreshMasterDatalists();
    updateAllBadges();
}

// 슬롯머신 단건 등록/수정
function handleSlotMasterSubmit() {
    const mNo = document.getElementById('smNo').value.trim();
    const denom = document.getElementById('smDenom').value.trim();
    const mTheme = document.getElementById('smTheme').value.trim();
    const mLoc = document.getElementById('smLoc').value.trim();
    const maker = document.getElementById('smMaker').value.trim();
    const status = document.getElementById('smStatus').value;
    const memo = document.getElementById('smMemo').value.trim();
    const editId = document.getElementById('slotMasterEditId').value;

    if(!mNo ||!mTheme ||!mLoc) return alert("머신 번호, 테마명, 위치는 필수입니다!");

    if(editId) {
        // 수정
        slotMaster = slotMaster.map(s => String(s.mNo) === String(editId)? { mNo, denom, mTheme, mLoc, maker, status, memo } : s);
        cancelEditSlotMaster();
    } else {
        // 중복 체크
        if(slotMaster.some(s => String(s.mNo).toLowerCase() === mNo.toLowerCase())) {
            return alert("이미 존재하는 머신 번호입니다!");
        }
        slotMaster.unshift({ mNo, denom, mTheme, mLoc, maker, status, memo });
        clearSlotMasterForm();
    }
    saveSlotMaster();
}

function editSlotMaster(mNo) {
    const s = slotMaster.find(x => String(x.mNo) === String(mNo));
    if(!s) return;
    document.getElementById('slotMasterEditId').value = s.mNo;
    document.getElementById('smNo').value = s.mNo;
    document.getElementById('smDenom').value = s.denom || '';
    document.getElementById('smTheme').value = s.mTheme || '';
    document.getElementById('smLoc').value = s.mLoc || '';
    document.getElementById('smMaker').value = s.maker || '';
    document.getElementById('smStatus').value = s.status || '정상가동';
    document.getElementById('smMemo').value = s.memo || '';
    document.getElementById('smSubmitBtn').innerText = "머신 수정 완료";
    document.getElementById('smCancelBtn').style.display = 'block';
}

function cancelEditSlotMaster() {
    clearSlotMasterForm();
    document.getElementById('smSubmitBtn').innerText = "머신 등록";
    document.getElementById('smCancelBtn').style.display = 'none';
}

function clearSlotMasterForm() {
    document.getElementById('slotMasterEditId').value = '';
    document.getElementById('smNo').value = '';
    document.getElementById('smDenom').value = '';
    document.getElementById('smTheme').value = '';
    document.getElementById('smLoc').value = '';
    document.getElementById('smMaker').value = '';
    document.getElementById('smStatus').value = '정상가동';
    document.getElementById('smMemo').value = '';
}

function deleteSlotMaster(mNo) {
    if(confirm(`머신 [${mNo}]를 마스터에서 삭제하시겠습니까?`)) {
        slotMaster = slotMaster.filter(s => String(s.mNo)!== String(mNo));
        saveSlotMaster();
    }
}

function saveSlotMaster() {
    localStorage.setItem('slotMasterList', JSON.stringify(slotMaster));
    renderMaster();
}

// 고객 단건 등록/수정
function handleCustMasterSubmit() {
    const cNo = document.getElementById('cmNo').value.trim();
    const cName = document.getElementById('cmName').value.trim();
    const tier = document.getElementById('cmTier').value;
    const hName = document.getElementById('cmHost').value.trim();
    const contact = document.getElementById('cmContact').value.trim();
    const memo = document.getElementById('cmMemo').value.trim();
    const editId = document.getElementById('custMasterEditId').value;

    if(!cNo ||!cName) return alert("회원번호와 고객명은 필수입니다!");

    if(editId) {
        custMaster = custMaster.map(c => String(c.cNo) === String(editId)? { cNo, cName, tier, hName, contact, memo } : c);
        cancelEditCustMaster();
    } else {
        if(custMaster.some(c => String(c.cNo).toLowerCase() === cNo.toLowerCase())) {
            return alert("이미 존재하는 회원번호입니다!");
        }
        custMaster.unshift({ cNo, cName, tier, hName, contact, memo });
        clearCustMasterForm();
    }
    saveCustMaster();
}

function editCustMaster(cNo) {
    const c = custMaster.find(x => String(x.cNo) === String(cNo));
    if(!c) return;
    document.getElementById('custMasterEditId').value = c.cNo;
    document.getElementById('cmNo').value = c.cNo;
    document.getElementById('cmName').value = c.cName || '';
    document.getElementById('cmTier').value = c.tier || '일반';
    document.getElementById('cmHost').value = c.hName || '';
    document.getElementById('cmContact').value = c.contact || '';
    document.getElementById('cmMemo').value = c.memo || '';
    document.getElementById('cmSubmitBtn').innerText = "고객 수정 완료";
    document.getElementById('cmCancelBtn').style.display = 'block';
}

function cancelEditCustMaster() {
    clearCustMasterForm();
    document.getElementById('cmSubmitBtn').innerText = "고객 등록";
    document.getElementById('cmCancelBtn').style.display = 'none';
}

function clearCustMasterForm() {
    document.getElementById('custMasterEditId').value = '';
    document.getElementById('cmNo').value = '';
    document.getElementById('cmName').value = '';
    document.getElementById('cmTier').value = '일반';
    document.getElementById('cmHost').value = '';
    document.getElementById('cmContact').value = '';
    document.getElementById('cmMemo').value = '';
}

function deleteCustMaster(cNo) {
    if(confirm(`고객 [${cNo}]를 마스터에서 삭제하시겠습니까?`)) {
        custMaster = custMaster.filter(c => String(c.cNo)!== String(cNo));
        saveCustMaster();
    }
}

function saveCustMaster() {
    localStorage.setItem('customerMasterList', JSON.stringify(custMaster));
    renderMaster();
}

function clearCurrentMaster() {
    const targetName = currentMasterTab === 'SLOT'? '슬롯머신 마스터' : '고객정보 마스터';
    if(confirm(`정말로 모든 [${targetName}] 데이터를 삭제하시겠습니까? (되돌릴 수 없습니다)`)) {
        if(currentMasterTab === 'SLOT') {
            slotMaster = [];
            saveSlotMaster();
        } else {
            custMaster = [];
            saveCustMaster();
        }
    }
}

/* ==========================================================================
   10. 엑셀 & CSV 파일 업로드 및 파싱
   ========================================================================== */
// 드롭존 드래그 이벤트 설정
const dropZone = document.getElementById('dropZone');
if(dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
    });
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if(files.length > 0) processMasterFile(files[0]);
    });
}

function handleMasterFileUpload(e) {
    const file = e.target.files[0];
    if(file) processMasterFile(file);
    e.target.value = '';
}

function processMasterFile(file) {
    const isOverwrite = document.getElementById('masterOverwriteCheck').checked;
    const ext = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    if(ext === 'csv') {
        reader.onload = function(e) {
            parseCSVData(e.target.result, isOverwrite);
        };
        reader.readAsText(file, 'utf-8');
    } else {
        //.xlsx,.xls
        reader.onload = function(e) {
            if(typeof XLSX!== 'undefined') {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
                importParsedRows(rows, isOverwrite);
            } else {
                alert("Excel 파서 라이브러리를 불러오지 못했습니다. CSV 파일로 시도해주세요.");
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

// CSV 텍스트 파서 (따옴표 및 콤마 처리)
function parseCSVData(text, isOverwrite) {
    const lines = text.split(/\r?\n/).filter(line => line.trim()!== '');
    if(lines.length < 2) return alert("파일에 데이터가 없습니다.");

    const headers = parseCSVLine(lines[0]);
    const rows = [];
    for(let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h.trim()] = (cols[idx] || '').trim();
        });
        rows.push(obj);
    }
    importParsedRows(rows, isOverwrite);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for(let i = 0; i < line.length; i++) {
        const char = line[i];
        if(char === '"') {
            if(inQuotes && line[i+1] === '"') {
                current += '"'; i++;
            } else {
                inQuotes =!inQuotes;
            }
        } else if(char === ',' &&!inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// 파싱된 행 데이터를 마스터에 매핑 & 저장
function importParsedRows(rows, isOverwrite) {
    if(!rows || rows.length === 0) return alert("가져올 수 있는 데이터 행이 없습니다.");

    let importedCount = 0;

    if(currentMasterTab === 'SLOT') {
        const newSlotList = isOverwrite? [] : [...slotMaster];

        rows.forEach(r => {
            // 유연한 컬럼 매핑
            const mNo = r['머신번호'] || r['머신 번호'] || r['머신'] || r['번호'] || r['mNo'] || r['MachineNo'] || r['No'] || '';
            if(!mNo) return;

            const mTheme = r['머신명'] || r['테마'] || r['테마명'] || r['mTheme'] || r['Theme'] || r['이름'] || '';
            const mLoc = r['위치'] || r['구역'] || r['머신위치'] || r['mLoc'] || r['Location'] || '';
            const denom = r['DENOM'] || r['denom'] || r['디놈'] || r['권종'] || '';
            const maker = r['제조사'] || r['메이커'] || r['maker'] || r['Manufacturer'] || '';
            const status = r['가동상태'] || r['상태'] || r['status'] || '정상가동';
            const memo = r['비고'] || r['메모'] || r['memo'] || r['Notes'] || '';

            const existingIdx = newSlotList.findIndex(s => String(s.mNo) === String(mNo));
            const item = { mNo: String(mNo), mTheme, mLoc, denom, maker, status, memo };

            if(existingIdx >= 0) {
                newSlotList[existingIdx] = item;
            } else {
                newSlotList.push(item);
            }
            importedCount++;
        });

        slotMaster = newSlotList;
        saveSlotMaster();
        alert(` 슬롯머신 마스터 ${importedCount}건이 성공적으로 ${isOverwrite? '덮어쓰기' : '추가'} 되었습니다!`);
    } else {
        const newCustList = isOverwrite? [] : [...custMaster];

        rows.forEach(r => {
            const cNo = r['회원번호'] || r['고객번호'] || r['고객 번호'] || r['cNo'] || r['CustomerNo'] || r['ID'] || '';
            if(!cNo) return;

            const cName = r['고객명'] || r['이름'] || r['성함'] || r['cName'] || r['Name'] || '';
            const tier = r['등급'] || r['티어'] || r['tier'] || r['Tier'] || '일반';
            const hName = r['담당호스트'] || r['담당 호스트'] || r['호스트'] || r['hName'] || r['Host'] || '';
            const contact = r['연락처'] || r['전화번호'] || r['휴대폰'] || r['contact'] || r['Phone'] || '';
            const memo = r['선호머신'] || r['메모'] || r['비고'] || r['memo'] || r['Notes'] || '';

            const existingIdx = newCustList.findIndex(c => String(c.cNo) === String(cNo));
            const item = { cNo: String(cNo), cName, tier, hName, contact, memo };

            if(existingIdx >= 0) {
                newCustList[existingIdx] = item;
            } else {
                newCustList.push(item);
            }
            importedCount++;
        });

        custMaster = newCustList;
        saveCustMaster();
        alert(` 고객정보 마스터 ${importedCount}건이 성공적으로 ${isOverwrite? '덮어쓰기' : '추가'} 되었습니다!`);
    }
}

/* ==========================================================================
   11. 양식 다운로드, 샘플 데이터 불러오기, 엑셀 내보내기
   ========================================================================== */
// 양식 다운로드 (UTF-8 BOM 포함 CSV 또는 XLSX)
function downloadMasterTemplate() {
    if(currentMasterTab === 'SLOT') {
        const headers = ["머신번호", "머신명", "위치", "DENOM", "제조사", "상태", "비고"];
        const samples = [
            ["101", "드래곤 링크 (Golden Century)", "A구역 01", "100원", "Aristocrat", "정상가동", "인기 VIP 머신"],
            ["102", "버팔로 골드 (Buffalo Gold)", "B구역 05", "50원", "Aristocrat", "정상가동", "일반 존 메인"],
            ["201", "듀오 푸 듀오 차이 (88 Fortunes)", "C구역 10", "10원", "Light & Wonder", "점검중", "부품 점검 예정"]
        ];
        exportCSVFile(headers, samples, "슬롯머신_마스터_업로드양식.csv");
    } else {
        const headers = ["회원번호", "고객명", "등급", "담당호스트", "연락처", "선호머신"];
        const samples = [
            ["C1001", "홍길동", "VVIP", "마이클", "010-1234-5678", "드래곤링크, 고액 바카라"],
            ["C1002", "김철수", "VIP", "제인", "010-9876-5432", "버팔로골드 선호"],
            ["C1003", "박영희", "Gold", "앤디", "010-5555-4444", "주말 오후 방문"]
        ];
        exportCSVFile(headers, samples, "고객정보_마스터_업로드양식.csv");
    }
}

// 현재 마스터 엑셀 내보내기
function exportMasterToExcel() {
    if(currentMasterTab === 'SLOT') {
        if(slotMaster.length === 0) return alert("내보낼 슬롯머신 데이터가 없습니다.");
        const headers = ["머신번호", "머신명", "위치", "DENOM", "제조사", "상태", "비고"];
        const rows = slotMaster.map(s => [s.mNo, s.mTheme, s.mLoc, s.denom, s.maker, s.status, s.memo]);
        exportCSVFile(headers, rows, `슬롯머신_마스터_내보내기_${new Date().toISOString().slice(0,10)}.csv`);
    } else {
        if(custMaster.length === 0) return alert("내보낼 고객 데이터가 없습니다.");
        const headers = ["회원번호", "고객명", "등급", "담당호스트", "연락처", "선호머신"];
        const rows = custMaster.map(c => [c.cNo, c.cName, c.tier, c.hName, c.contact, c.memo]);
        exportCSVFile(headers, rows, `고객정보_마스터_내보내기_${new Date().toISOString().slice(0,10)}.csv`);
    }
}

function exportCSVFile(headers, rows, filename) {
    let csvContent = "\uFEFF"; // 한글 깨짐 방지 UTF-8 BOM
    csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n";
    rows.forEach(row => {
        csvContent += row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(",") + "\r\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 1클릭 샘플 데이터 불러오기
function loadSampleMasterData() {
    if(confirm("실제 카지노 환경의 머신 및 고객 샘플 데이터를 불러오시겠습니까?")) {
        slotMaster = [
            { mNo: "101", mTheme: "드래곤 링크 (Golden Century)", mLoc: "A구역 01", denom: "100원", maker: "Aristocrat", status: "정상가동", memo: "인기 VIP 머신" },
            { mNo: "102", mTheme: "드래곤 링크 (Happy & Prosperous)", mLoc: "A구역 02", denom: "100원", maker: "Aristocrat", status: "정상가동", memo: "고액 배팅 구역" },
            { mNo: "103", mTheme: "라이트닝 링크 (High Stakes)", mLoc: "A구역 03", denom: "500원", maker: "Aristocrat", status: "정상가동", memo: "하이롤러 룸" },
            { mNo: "201", mTheme: "버팔로 골드 (Buffalo Gold)", mLoc: "B구역 01", denom: "50원", maker: "Aristocrat", status: "정상가동", memo: "중앙 통로 명당" },
            { mNo: "202", mTheme: "듀오 푸 듀오 차이 (88 Fortunes)", mLoc: "B구역 02", denom: "10원", maker: "Light & Wonder", status: "점검중", memo: "모니터 터치 점검 필요" },
            { mNo: "203", mTheme: "진지바오시 (Jin Ji Bao Xi)", mLoc: "B구역 03", denom: "10원", maker: "Light & Wonder", status: "정상가동", memo: "연속 당첨 이벤트" },
            { mNo: "301", mTheme: "휠 오브 포춘 (Wheel of Fortune)", mLoc: "C구역 01", denom: "500원", maker: "IGT", status: "정상가동", memo: "대형 휠 잭팟" },
            { mNo: "302", mTheme: "머니 링크 (Money Link)", mLoc: "C구역 02", denom: "100원", maker: "Incredible Tech", status: "고장", memo: "BV 지폐인식기 오류 대기" }
        ];
        custMaster = [
            { cNo: "C1001", cName: "홍길동", tier: "VVIP", hName: "마이클", contact: "010-1234-5678", memo: "드래곤링크 및 고액 잭팟 머신 선호" },
            { cNo: "C1002", cName: "김철수", tier: "VIP", hName: "제인", contact: "010-9876-5432", memo: "주말 방문, 버팔로 골드 50원 배팅 선호" },
            { cNo: "C1003", cName: "박영희", tier: "Diamond", hName: "앤디", contact: "010-5555-4444", memo: "평일 저녁 방문, 티토 보관 요청 잦음" },
            { cNo: "C1004", cName: "이민호", tier: "Platinum", hName: "데이비드", contact: "010-7777-8888", memo: "신규 하이롤러 고객" },
            { cNo: "C1005", cName: "최지우", tier: "Gold", hName: "제인", contact: "010-2222-3333", memo: "프로모션 이벤트 적극 참여" }
        ];
        saveSlotMaster();
        saveCustMaster();
        alert(" 슬롯머신 8대 및 고객정보 5명의 샘플 마스터가 로드되었습니다!");
    }
}

// XSS 방지용 HTML Escape
function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* ==========================================================================
   12. 앱 초기화
   ========================================================================== */
// 마스터 데이터가 비어있다면 최초 1회 샘플 로드 제안 또는 기본 로드
if (slotMaster.length === 0 && custMaster.length === 0) {
    slotMaster = [
        { mNo: "101", mTheme: "드래곤 링크 (Golden Century)", mLoc: "A구역 01", denom: "100원", maker: "Aristocrat", status: "정상가동", memo: "인기 VIP 머신" },
        { mNo: "102", mTheme: "버팔로 골드 (Buffalo Gold)", mLoc: "B구역 01", denom: "50원", maker: "Aristocrat", status: "정상가동", memo: "중앙 통로" },
        { mNo: "103", mTheme: "휠 오브 포춘 (Wheel of Fortune)", mLoc: "C구역 01", denom: "500원", maker: "IGT", status: "정상가동", memo: "대형 휠 잭팟" }
    ];
    custMaster = [
        { cNo: "C1001", cName: "홍길동", tier: "VVIP", hName: "마이클", contact: "010-1234-5678", memo: "드래곤링크 선호" },
        { cNo: "C1002", cName: "김철수", tier: "VIP", hName: "제인", contact: "010-9876-5432", memo: "버팔로골드 선호" }
    ];
    localStorage.setItem('slotMasterList', JSON.stringify(slotMaster));
    localStorage.setItem('customerMasterList', JSON.stringify(custMaster));
}

refreshMasterDatalists();
renderLog();
renderResv();
renderFault();
renderPromo();
renderLnf();
renderMaster();
updateAllBadges();
if (localStorage.getItem('sidebarCollapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
    const toggle = document.getElementById('sidebarToggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 펼치기');
    toggle.title = '메뉴 펼치기';
    toggle.innerHTML = '<i data-lucide="chevron-right"></i>';
}
if (window.lucide) window.lucide.createIcons();
