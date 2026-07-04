/* ==========================================================================
   BPDB ENGINEERS SENIORITY DATABASE APP - LOGIC & CALCULATION ENGINE
   ========================================================================== */

// --- Application Configuration & State ---
const CONFIG = {
    CURRENT_DATE: new Date('2026-07-03'), // Fixed current date as per system metadata
    ITEMS_PER_PAGE: 50,
    AUTH_USER: 'BPDB',
    AUTH_PASS_VIEWER: 'Engineers',
    AUTH_PASS_ADMIN: '1091514m@H'
};

let state = {
    engineers: [],
    filteredEngineers: [],
    currentPage: 1,
    userRole: 'viewer', // 'viewer' or 'admin'
    charts: {
        delayChart: null
    },
    activeFilters: {
        search: '',
        rank: 'all',
        prl: 'all',
        delay: 'all',
        sort: 'default'
    }
};

// --- Page & Initialization Lifecycle ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Date Display
    document.getElementById('currentDateDisplay').innerText = formatFriendlyDate(CONFIG.CURRENT_DATE);
    
    // 2. Load and Prepare Seniority Data
    loadDatabase();
    
    // 3. Check Session Security Authentication
    checkAuthSession();
    
    // 4. Setup Event Listeners
    initEventListeners();
});

// Check if user is logged in
function checkAuthSession() {
    const isAuthenticated = sessionStorage.getItem('bpdb_auth') === 'true';
    const userRole = sessionStorage.getItem('bpdb_user_role') || 'viewer';
    state.userRole = userRole;
    
    const authView = document.getElementById('auth-view');
    const appContainer = document.getElementById('app-container');
    
    if (isAuthenticated) {
        authView.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Dynamic access permissions setup
        updatePermissionsUI();
        
        lucide.createIcons();
        renderDashboard();
    } else {
        authView.classList.remove('hidden');
        appContainer.classList.add('hidden');
        lucide.createIcons();
    }
}

// Update admin/viewer components visibility in UI
function updatePermissionsUI() {
    const addBtn = document.getElementById('addEngineerBtn');
    const actionHeader = document.getElementById('actionsHeader');
    
    if (state.userRole === 'admin') {
        if (addBtn) addBtn.classList.remove('hidden');
        if (actionHeader) actionHeader.classList.remove('hidden');
    } else {
        if (addBtn) addBtn.classList.add('hidden');
        if (actionHeader) actionHeader.classList.add('hidden');
    }
}

// Handle login submissions
function handleLogin(event) {
    event.preventDefault();
    const userIdInput = document.getElementById('userId').value.trim();
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    
    // Accept user code/id check
    const isUserValid = (userIdInput === CONFIG.AUTH_USER || userIdInput === '1091514' || userIdInput === 'Minhaj');
    
    if (isUserValid && passwordInput === CONFIG.AUTH_PASS_ADMIN) {
        // Admin role login (Md. Minhajul Haque)
        sessionStorage.setItem('bpdb_auth', 'true');
        sessionStorage.setItem('bpdb_user_role', 'admin');
        errorMsg.classList.add('hidden');
        
        document.getElementById('userId').value = '';
        document.getElementById('password').value = '';
        checkAuthSession();
    } else if (userIdInput === CONFIG.AUTH_USER && passwordInput === CONFIG.AUTH_PASS_VIEWER) {
        // Viewer role login
        sessionStorage.setItem('bpdb_auth', 'true');
        sessionStorage.setItem('bpdb_user_role', 'viewer');
        errorMsg.classList.add('hidden');
        
        document.getElementById('userId').value = '';
        document.getElementById('password').value = '';
        checkAuthSession();
    } else {
        errorMsg.classList.remove('hidden');
    }
}

// Handle logouts
function handleLogout() {
    sessionStorage.removeItem('bpdb_auth');
    sessionStorage.removeItem('bpdb_user_role');
    checkAuthSession();
}

// Load data from LocalStorage or seed from static javascript file
function loadDatabase() {
    const savedData = localStorage.getItem('bpdb_engineers_data');
    if (savedData) {
        try {
            state.engineers = JSON.parse(savedData);
        } catch (e) {
            console.error('Failed to parse localStorage data, resetting to original source.', e);
            state.engineers = [...INITIAL_ENGINEERS_DATA];
            saveDatabase();
        }
    } else {
        state.engineers = [...INITIAL_ENGINEERS_DATA];
        saveDatabase();
    }
    state.filteredEngineers = [...state.engineers];
}

// Save data to LocalStorage
function saveDatabase() {
    localStorage.setItem('bpdb_engineers_data', JSON.stringify(state.engineers));
}

// --- App Event Listeners Setup ---
function initEventListeners() {
    // 1. Navigation Tab Clicks
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Switch between dashboard and seniority list tabs
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
        if (tab.id === `tab-${tabId}`) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    const titleMap = {
        dashboard: 'Dashboard',
        database: 'Seniority Database List'
    };
    document.getElementById('pageTitle').innerText = titleMap[tabId] || 'Dashboard';

    if (tabId === 'dashboard') {
        renderDashboard();
    } else if (tabId === 'database') {
        state.currentPage = 1;
        applyFiltersAndRender();
    }
}

// --- Statistical & Scientific Calculations ---

// Determine dynamic service status based on DOB, current date, and extensions
function getServiceStatus(eng, asOfDate) {
    if (!eng.dob) return 'Active';
    const age = calculateAge(eng.dob, asOfDate);
    
    // Chairman Exception: 1 year extension from PRL Date (exceeding age 59 up to 60)
    if (eng.code === '1-0940' || eng.rank === 'Chairman') {
        const prlDate = new Date(calculatePRLDate(eng.dob));
        const extendedDate = new Date(prlDate.getFullYear() + 1, prlDate.getMonth(), prlDate.getDate());
        if (asOfDate >= prlDate && asOfDate < extendedDate) {
            return 'Extended Service';
        } else if (asOfDate >= extendedDate) {
            return 'Retired';
        }
        return 'Active';
    }
    
    if (age >= 59) {
        return 'Retired';
    }
    
    return 'Active';
}

// Get Age from DOB string
function calculateAge(dobStr, asOfDate) {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    let age = asOfDate.getFullYear() - dob.getFullYear();
    const monthDiff = asOfDate.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

// Calculate retirement date (when turning 59 years)
function calculatePRLDate(dobStr) {
    if (!dobStr) return 'N/A';
    const dob = new Date(dobStr);
    
    // Add 59 years to DOB
    const prlYear = dob.getFullYear() + 59;
    const prlMonth = dob.getMonth();
    const prlDay = dob.getDate();
    
    const prlDate = new Date(prlYear, prlMonth, prlDay);
    return prlDate.toISOString().split('T')[0];
}

// Calculate Service Years from joining date
function calculateServiceYears(joiningStr, asOfDate) {
    if (!joiningStr) return 0;
    const joining = new Date(joiningStr);
    const diffMs = asOfDate - joining;
    return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

// Determine if an engineer has a delayed promotion and by how many years
function getPromotionDelay(eng, asOfDate) {
    if (!eng.joining) return { isDelayed: false, delayYears: 0 };
    
    // Promotee engineers (starts with 11-) are NOT counted in the promotion delay count
    if (eng.code && eng.code.startsWith('11-')) {
        return { isDelayed: false, delayYears: 0 };
    }
    
    // Left Job or Died are NOT counted in promotion delay count
    if (eng.status && (eng.status.toLowerCase() === 'left job' || eng.status.toLowerCase() === 'died')) {
        return { isDelayed: false, delayYears: 0 };
    }
    
    const serviceYears = calculateServiceYears(eng.joining, asOfDate);
    let limit = 0;
    let applies = false;
    
    // Assign thresholds based on current designation rank
    if (eng.rank === 'Assistant Engineer') {
        limit = 5;
        applies = true;
    } else if (eng.rank === 'Sub-Divisional Engineer') {
        limit = 10;
        applies = true;
    } else if (eng.rank === 'Executive Engineer & Assistant Chief Engineer') {
        limit = 15;
        applies = true;
    } else if (eng.rank === 'Superintendent Engineer') {
        limit = 20;
        applies = true;
    }
    
    if (applies && serviceYears > limit) {
        return {
            isDelayed: true,
            delayYears: serviceYears - limit
        };
    }
    
    return { isDelayed: false, delayYears: 0 };
}

// Aggregates delays per rank and computes statistical metrics (min, max, mean, median)
function calculateDelayStats() {
    const delayBuckets = {
        'Assistant Engineer': [],
        'Sub-Divisional Engineer': [],
        'Executive Engineer & Assistant Chief Engineer': [],
        'Superintendent Engineer': []
    };
    
    state.engineers.forEach(eng => {
        const serviceStatus = getServiceStatus(eng, CONFIG.CURRENT_DATE);
        const isRetired = serviceStatus === 'Retired';
        if (!eng.joining || eng.status.toLowerCase() !== 'working' || isRetired) return;
        const delayInfo = getPromotionDelay(eng, CONFIG.CURRENT_DATE);
        if (delayInfo.isDelayed && delayBuckets[eng.rank]) {
            delayBuckets[eng.rank].push(delayInfo.delayYears);
        }
    });

    const stats = {};
    Object.keys(delayBuckets).forEach(rank => {
        const delays = delayBuckets[rank];
        if (delays.length === 0) {
            stats[rank] = { min: 0, max: 0, mean: 0, median: 0, count: 0 };
            return;
        }
        
        // Mathematical aggregation
        const minVal = Math.min(...delays);
        const maxVal = Math.max(...delays);
        const meanVal = delays.reduce((a, b) => a + b, 0) / delays.length;
        
        // Median calculation
        const sorted = [...delays].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const medianVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        
        stats[rank] = {
            min: Number(minVal.toFixed(2)),
            max: Number(maxVal.toFixed(2)),
            mean: Number(meanVal.toFixed(2)),
            median: Number(medianVal.toFixed(2)),
            count: delays.length
        };
    });
    
    return stats;
}

// --- Dashboard Rendering ---
function renderDashboard() {
    // 1. Calculate general stats counts
    let activeCount = 0;
    let upcomingPRLCount = 0;
    let delayedCount = 0;
    
    // AE delayed promotion stats
    let aeTotal = 0;
    let aeDelayed = 0;
    let retiredCount = 0;
    let promoteeCount = 0;
    let leftCount = 0;
    let diedCount = 0;
    
    const designations = {};
    
    state.engineers.forEach(eng => {
        // Calculate dynamic retired status (age >= 59)
        const serviceStatus = getServiceStatus(eng, CONFIG.CURRENT_DATE);
        const isRetired = serviceStatus === 'Retired';
        const isWorking = eng.status.toLowerCase() === 'working' && !isRetired;
        
        if (isWorking) activeCount++;
        
        if (isRetired && eng.status.toLowerCase() === 'working') {
            retiredCount++;
        }
        
        if (eng.code && eng.code.startsWith('11-') && eng.status.toLowerCase() === 'working') {
            promoteeCount++;
        }
        
        if (eng.status) {
            if (eng.status.toLowerCase() === 'left job') {
                leftCount++;
            } else if (eng.status.toLowerCase() === 'died') {
                diedCount++;
            }
        }
        
        // PRL upcoming metrics
        if (eng.dob && isWorking) {
            const age = calculateAge(eng.dob, CONFIG.CURRENT_DATE);
            if (age === 58) {
                upcomingPRLCount++;
            }
        }
        
        // Promotion delays metrics
        let isDelayed = false;
        if (isWorking) {
            const delayInfo = getPromotionDelay(eng, CONFIG.CURRENT_DATE);
            if (delayInfo.isDelayed) {
                delayedCount++;
                isDelayed = true;
            }
        }
        
        // Rank designation aggregates
        if (eng.rank && isWorking) {
            designations[eng.rank] = (designations[eng.rank] || 0) + 1;
            
            // Assistant Engineer statistics
            if (eng.rank === 'Assistant Engineer') {
                aeTotal++;
                if (isDelayed) {
                    aeDelayed++;
                }
            }
        }
    });
    
    // Update counters on UI
    document.getElementById('statTotalActive').innerText = activeCount.toLocaleString();
    document.getElementById('statUpcomingPRL').innerText = upcomingPRLCount.toLocaleString();
    document.getElementById('statDelayedPromotions').innerText = delayedCount.toLocaleString();
    document.getElementById('statTotalRetired').innerText = retiredCount.toLocaleString();
    document.getElementById('statTotalPromotees').innerText = promoteeCount.toLocaleString();
    document.getElementById('statTotalLeftJob').innerText = leftCount.toLocaleString();
    document.getElementById('statTotalDied').innerText = diedCount.toLocaleString();
    
    // Update Assistant Engineers Stagnation Alert stats
    const aePercent = aeTotal > 0 ? (aeDelayed / aeTotal) * 100 : 0;
    document.getElementById('aeTotalCount').innerText = aeTotal.toLocaleString();
    document.getElementById('aeDelayedCount').innerText = aeDelayed.toLocaleString();
    document.getElementById('aeDelayedPercent').innerText = `${aePercent.toFixed(1)}%`;
    document.getElementById('aeDelayedPercentText').innerText = `${aePercent.toFixed(0)}%`;
    
    // 2. Render Designation Breakdown list (hierarchical ranks)
    const rankOrder = [
        'Chairman', 'Member', 'Chief Engineer', 'Additional Chief Engineer',
        'Additional Chief Engineer (In Charge)', 'Superintendent Engineer',
        'Executive Engineer & Assistant Chief Engineer', 'Sub-Divisional Engineer',
        'Assistant Engineer'
    ];
        
    const designationList = document.getElementById('designationList');
    designationList.innerHTML = '';
    
    rankOrder.forEach(rank => {
        const count = designations[rank] || 0;
        const badgeClass = getRankBadgeClass(rank);
        const item = document.createElement('div');
        item.className = 'posting-item';
        item.innerHTML = `
            <span class="rank-badge ${badgeClass}" style="font-size: 11px;">${rank}</span>
            <span class="posting-count">${count}</span>
        `;
        designationList.appendChild(item);
    });
    
    // 3. Render Promotion Delay chart using Chart.js
    renderDelayChart();
}

function renderDelayChart() {
    const stats = calculateDelayStats();
    const ctx = document.getElementById('promotionDelayChart').getContext('2d');
    
    const labels = Object.keys(stats);
    const minData = labels.map(label => stats[label].min);
    const maxData = labels.map(label => stats[label].max);
    const meanData = labels.map(label => stats[label].mean);
    const medianData = labels.map(label => stats[label].median);
    
    // Destroy previous instance to prevent overlapping hover glitches
    if (state.charts.delayChart) {
        state.charts.delayChart.destroy();
    }
    
    state.charts.delayChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Min Delay (Years)',
                    data: minData,
                    backgroundColor: 'rgba(16, 185, 129, 0.45)', // Emerald
                    borderColor: '#10b981',
                    borderWidth: 1
                },
                {
                    label: 'Max Delay (Years)',
                    data: maxData,
                    backgroundColor: 'rgba(239, 68, 68, 0.45)', // Red
                    borderColor: '#ef4444',
                    borderWidth: 1
                },
                {
                    label: 'Mean Delay (Years)',
                    data: meanData,
                    backgroundColor: 'rgba(59, 130, 246, 0.45)', // Blue
                    borderColor: '#3b82f6',
                    borderWidth: 1
                },
                {
                    label: 'Median Delay (Years)',
                    data: medianData,
                    backgroundColor: 'rgba(245, 158, 11, 0.45)', // Amber
                    borderColor: '#f59e0b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 11 }
                    }
                },
                tooltip: {
                    padding: 12,
                    bodyFont: { family: 'Inter' },
                    titleFont: { family: 'Outfit', weight: 'bold' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' },
                    title: {
                        display: true,
                        text: 'Years Over Normal Promotion Threshold',
                        color: '#94a3b8',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Navigates directly to the database view pre-filtering for specific metrics
function viewDatabaseWithFilter(filterType) {
    resetFilters();
    const selectPRL = document.getElementById('filterPRL');
    const selectDelay = document.getElementById('filterDelay');
    
    if (filterType === 'prl') {
        selectPRL.value = 'upcoming';
        state.activeFilters.prl = 'upcoming';
    } else if (filterType === 'delayed') {
        selectDelay.value = 'delayed';
        state.activeFilters.delay = 'delayed';
    } else if (filterType === 'retired') {
        selectPRL.value = 'retired';
        state.activeFilters.prl = 'retired';
    } else if (filterType === 'promotee') {
        document.getElementById('dbSearch').value = '11-';
        state.activeFilters.search = '11-';
    } else if (filterType === 'left-job') {
        document.getElementById('dbSearch').value = 'Left Job';
        state.activeFilters.search = 'left job';
    } else if (filterType === 'died') {
        document.getElementById('dbSearch').value = 'Died';
        state.activeFilters.search = 'died';
    }
    
    switchTab('database');
}

// --- Database Seniority List View ---

// Handle filters/search input changes
function handleFilterChange() {
    state.activeFilters.search = document.getElementById('dbSearch').value.toLowerCase().trim();
    state.activeFilters.rank = document.getElementById('filterRank').value;
    state.activeFilters.prl = document.getElementById('filterPRL').value;
    state.activeFilters.delay = document.getElementById('filterDelay').value;
    state.activeFilters.sort = document.getElementById('filterSort').value;
    
    state.currentPage = 1;
    applyFiltersAndRender();
}

// Reset all filter options
function resetFilters() {
    document.getElementById('dbSearch').value = '';
    document.getElementById('filterRank').value = 'all';
    document.getElementById('filterPRL').value = 'all';
    document.getElementById('filterDelay').value = 'all';
    document.getElementById('filterSort').value = 'default';
    
    state.activeFilters = { search: '', rank: 'all', prl: 'all', delay: 'all', sort: 'default' };
    state.currentPage = 1;
    applyFiltersAndRender();
}

// Apply active filters on memory list and render the table view
function applyFiltersAndRender() {
    state.filteredEngineers = state.engineers.filter(eng => {
        // 1. Search Query Match
        const matchSearch = !state.activeFilters.search || 
            eng.name.toLowerCase().includes(state.activeFilters.search) || 
            eng.code.toLowerCase().includes(state.activeFilters.search) || 
            eng.office.toLowerCase().includes(state.activeFilters.search) || 
            (eng.status && eng.status.toLowerCase().includes(state.activeFilters.search)) || 
            (eng.originalDesignation && eng.originalDesignation.toLowerCase().includes(state.activeFilters.search));
            
        // 2. Rank Category Match
        const matchRank = state.activeFilters.rank === 'all' || eng.rank === state.activeFilters.rank;
        
        // 3. PRL Retirement Match
        let matchPRL = true;
        if (state.activeFilters.prl !== 'all' && eng.dob) {
            const serviceStatus = getServiceStatus(eng, CONFIG.CURRENT_DATE);
            const age = calculateAge(eng.dob, CONFIG.CURRENT_DATE);
            if (state.activeFilters.prl === 'upcoming') {
                matchPRL = (age === 58);
            } else if (state.activeFilters.prl === 'retired') {
                matchPRL = (serviceStatus === 'Retired');
            } else if (state.activeFilters.prl === 'extended') {
                matchPRL = (serviceStatus === 'Extended Service');
            }
        } else if (state.activeFilters.prl !== 'all') {
            matchPRL = false;
        }
        
        // 4. Delay Promotion Match
        let matchDelay = true;
        if (state.activeFilters.delay !== 'all') {
            const delayInfo = getPromotionDelay(eng, CONFIG.CURRENT_DATE);
            if (state.activeFilters.delay === 'delayed') {
                matchDelay = delayInfo.isDelayed;
            } else if (state.activeFilters.delay === 'on-time') {
                matchDelay = !delayInfo.isDelayed;
            }
        }
        
        return matchSearch && matchRank && matchPRL && matchDelay;
    });
    
    // Sort logic (Designation Priority, then Employee ID naturally)
    // Note: Python script already pre-sorted the dataset, but custom additions or modifications require resorting
    sortEngineers(state.filteredEngineers);
    
    renderDatabaseTable();
}

// Natural Sort comparison helper
function naturalSortCompare(a, b) {
    const splitA = a.toLowerCase().split(/(\d+)/);
    const splitB = b.toLowerCase().split(/(\d+)/);
    
    for (let i = 0; i < Math.max(splitA.length, splitB.length); i++) {
        const valA = splitA[i] || '';
        const valB = splitB[i] || '';
        
        if (valA !== valB) {
            const isDigitA = /^\d+$/.test(valA);
            const isDigitB = /^\d+$/.test(valB);
            
            if (isDigitA && isDigitB) {
                return parseInt(valA, 10) - parseInt(valB, 10);
            }
            return valA.localeCompare(valB);
        }
    }
    return 0;
}

// Sorts list elements
function sortEngineers(list) {
    list.sort((a, b) => {
        const aIsPromotee = a.code && a.code.startsWith('11-');
        const bIsPromotee = b.code && b.code.startsWith('11-');
        
        if (aIsPromotee && !bIsPromotee) return 1;
        if (!aIsPromotee && bIsPromotee) return -1;
        
        // If both are promotees or both are not, sort by selected sorting method
        if (state.activeFilters.sort === 'joining-asc') {
            if (!a.joining) return 1;
            if (!b.joining) return -1;
            return new Date(a.joining) - new Date(b.joining);
        } else if (state.activeFilters.sort === 'joining-desc') {
            if (!a.joining) return 1;
            if (!b.joining) return -1;
            return new Date(b.joining) - new Date(a.joining);
        } else {
            const rankPriorityMap = {
                'Chairman': 0,
                'Member': 1,
                'Chief Engineer': 2,
                'Additional Chief Engineer': 3,
                'Additional Chief Engineer (In Charge)': 4,
                'Superintendent Engineer': 5,
                'Executive Engineer & Assistant Chief Engineer': 6,
                'Sub-Divisional Engineer': 7,
                'Assistant Engineer': 8
            };
            const priorityA = rankPriorityMap[a.rank] !== undefined ? rankPriorityMap[a.rank] : 9;
            const priorityB = rankPriorityMap[b.rank] !== undefined ? rankPriorityMap[b.rank] : 9;
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return naturalSortCompare(a.code, b.code);
        }
    });
}

// Render filtered rows for the current page
function renderDatabaseTable() {
    const tbody = document.getElementById('databaseTableBody');
    tbody.innerHTML = '';
    
    const totalRecords = state.filteredEngineers.length;
    document.getElementById('recordCount').innerText = totalRecords.toLocaleString();
    document.getElementById('paginationTotal').innerText = totalRecords.toLocaleString();
    
    if (totalRecords === 0) {
        const colCount = state.userRole === 'admin' ? 10 : 9;
        tbody.innerHTML = `
            <tr>
                <td colspan="${colCount}" style="text-align: center; padding: 48px; color: var(--text-muted);">
                    <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
                    <p>No matching engineer records found.</p>
                </td>
            </tr>
        `;
        document.getElementById('paginationRange').innerText = '0-0';
        document.getElementById('paginationControls').innerHTML = '';
        lucide.createIcons();
        return;
    }
    
    // Pagination Indexing
    const startIndex = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + CONFIG.ITEMS_PER_PAGE, totalRecords);
    document.getElementById('paginationRange').innerText = `${startIndex + 1}-${endIndex}`;
    
    const pageRecords = state.filteredEngineers.slice(startIndex, endIndex);
    
    pageRecords.forEach(eng => {
        const serviceStatus = getServiceStatus(eng, CONFIG.CURRENT_DATE);
        const isRetired = serviceStatus === 'Retired';
        const isExtended = serviceStatus === 'Extended Service';
        
        const tr = document.createElement('tr');
        if (isRetired) {
            tr.className = 'retired-row';
        } else if (isExtended) {
            tr.className = 'extended-row';
        }
        
        // Age Calculation
        const age = eng.dob ? calculateAge(eng.dob, CONFIG.CURRENT_DATE) : null;
        const ageText = age !== null ? `${age} yrs` : 'N/A';
        const dobFormatted = eng.dob ? `${formatSlashDate(eng.dob)} (${ageText})` : 'N/A';
        
        // Service Years Calculation
        const serviceYears = eng.joining ? calculateServiceYears(eng.joining, CONFIG.CURRENT_DATE) : 0;
        const serviceText = serviceYears > 0 ? `${serviceYears.toFixed(1)} yrs` : 'N/A';
        const joiningFormatted = eng.joining ? `${formatSlashDate(eng.joining)} (${serviceText})` : 'N/A';
        
        // PRL Date Calculation
        const prlDate = eng.dob ? calculatePRLDate(eng.dob) : 'N/A';
        const prlFormatted = prlDate !== 'N/A' ? formatSlashDate(prlDate) : 'N/A';
        
        // Promotion Delay indicators or Retired Badge
        const delayInfo = getPromotionDelay(eng, CONFIG.CURRENT_DATE);
        let delayBadgeHtml = '';
        if (isRetired) {
            delayBadgeHtml = `
                <div class="retired-badge" title="Retired (PRL Exceeded)">
                    <i data-lucide="shield-off"></i>
                    <span>Retired</span>
                </div>
            `;
        } else if (delayInfo.isDelayed) {
            delayBadgeHtml = `
                <div class="delay-badge" title="Promotion delayed by ${delayInfo.delayYears.toFixed(1)} years">
                    <i data-lucide="alert-triangle"></i>
                    <span>Delayed +${delayInfo.delayYears.toFixed(1)} Yrs</span>
                </div>
            `;
        }
        
        // Generate designation badge class mapping
        const badgeClass = getRankBadgeClass(eng.rank);
        
        // Status badge HTML
        let statusBadgeHtml = '';
        if (isRetired) {
            statusBadgeHtml = `<span class="status-pill status-retired">Retired</span>`;
        } else if (isExtended) {
            statusBadgeHtml = `<span class="status-pill status-extended">Extended</span>`;
        } else {
            statusBadgeHtml = `<span class="status-pill status-active">Active</span>`;
        }
        
        // Engineer Type status column
        const isPromotee = eng.code && eng.code.startsWith('11-');
        let engineerStatusHtml = '<td>-</td>';
        if (eng.status && eng.status.toLowerCase() === 'left job') {
            engineerStatusHtml = `<td><span class="status-pill status-left">Left Job</span></td>`;
        } else if (eng.status && eng.status.toLowerCase() === 'died') {
            engineerStatusHtml = `<td><span class="status-pill status-died-badge">Died</span></td>`;
        } else if (isPromotee) {
            engineerStatusHtml = `<td><span class="status-pill status-promotee">Promoted from SAE</span></td>`;
        }
        
        let actionsCellHtml = '';
        if (state.userRole === 'admin') {
            actionsCellHtml = `
                <td class="actions-col">
                    <div class="action-buttons-wrap">
                        <button class="btn-table-action btn-edit" title="Edit Engineer" onclick="openEditEngineerModal('${eng.code}')">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-table-action btn-delete" title="Delete Engineer" onclick="deleteEngineer('${eng.code}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
        }
        
        tr.innerHTML = `
            <td><strong>${eng.code}</strong></td>
            <td>
                <div style="font-weight: 500;">${eng.name}</div>
                ${delayBadgeHtml}
            </td>
            <td>${statusBadgeHtml}</td>
            ${engineerStatusHtml}
            <td>
                <span class="rank-badge ${badgeClass}">${eng.rank}</span>
                ${eng.originalDesignation && eng.originalDesignation !== eng.rank ? `<span class="detail-desig">${eng.originalDesignation}</span>` : ''}
            </td>
            <td><span class="text-secondary">${eng.office}</span></td>
            <td><span class="text-secondary">${dobFormatted}</span></td>
            <td><span class="text-secondary">${joiningFormatted}</span></td>
            <td><span class="text-secondary">${prlFormatted}</span></td>
            ${actionsCellHtml}
        `;
        tbody.appendChild(tr);
    });
    
    // Generate navigation pagination controls
    renderPaginationControls(totalRecords);
    lucide.createIcons();
}

function getRankBadgeClass(rank) {
    const maps = {
        'Chairman': 'rank-chairman',
        'Member': 'rank-member',
        'Chief Engineer': 'rank-chief',
        'Additional Chief Engineer': 'rank-add-chief',
        'Additional Chief Engineer (In Charge)': 'rank-add-chief-ic',
        'Superintendent Engineer': 'rank-superintendent',
        'Executive Engineer & Assistant Chief Engineer': 'rank-xen',
        'Sub-Divisional Engineer': 'rank-sde',
        'Assistant Engineer': 'rank-ae'
    };
    return maps[rank] || 'rank-ae';
}

// Generate pagination button controls
function renderPaginationControls(totalRecords) {
    const container = document.getElementById('paginationControls');
    container.innerHTML = '';
    
    const totalPages = Math.ceil(totalRecords / CONFIG.ITEMS_PER_PAGE);
    if (totalPages <= 1) return;
    
    // Previous Page Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.innerHTML = '<i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i>';
    prevBtn.onclick = () => {
        state.currentPage--;
        renderDatabaseTable();
        document.querySelector('.main-content').scrollTop = 0;
    };
    container.appendChild(prevBtn);
    
    // Page Numbers
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === state.currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => {
            state.currentPage = i;
            renderDatabaseTable();
            document.querySelector('.main-content').scrollTop = 0;
        };
        container.appendChild(btn);
    }
    
    // Next Page Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.innerHTML = '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>';
    nextBtn.onclick = () => {
        state.currentPage++;
        renderDatabaseTable();
        document.querySelector('.main-content').scrollTop = 0;
    };
    container.appendChild(nextBtn);
}

// --- CRUD Record Actions ---

// Open Modal for adding a new record
function openAddEngineerModal() {
    if (state.userRole !== 'admin') {
        alert('Unauthorized: Only MD. Minhajul Haque has edit privileges.');
        return;
    }
    document.getElementById('modalTitle').innerText = 'Add New Engineer';
    document.getElementById('engineerForm').reset();
    document.getElementById('editOriginalCode').value = '';
    document.getElementById('engCode').disabled = false;
    
    document.getElementById('engineerModal').classList.remove('hidden');
    lucide.createIcons();
}

// Open Modal for editing a record
function openEditEngineerModal(code) {
    if (state.userRole !== 'admin') {
        alert('Unauthorized: Only MD. Minhajul Haque has edit privileges.');
        return;
    }
    const eng = state.engineers.find(e => e.code === code);
    if (!eng) return;
    
    document.getElementById('modalTitle').innerText = 'Edit Engineer Record';
    document.getElementById('editOriginalCode').value = eng.code;
    
    // Load current values
    document.getElementById('engCode').value = eng.code;
    document.getElementById('engCode').disabled = true; // Disable editing primary key code
    document.getElementById('engName').value = eng.name;
    document.getElementById('engOffice').value = eng.office;
    document.getElementById('engRank').value = eng.rank;
    document.getElementById('engOriginalDesignation').value = eng.originalDesignation || '';
    document.getElementById('engDob').value = eng.dob || '';
    document.getElementById('engJoining').value = eng.joining || '';
    document.getElementById('engStatus').value = eng.status || 'Working';
    
    document.getElementById('engineerModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeEngineerModal() {
    document.getElementById('engineerModal').classList.add('hidden');
}

// Save adding or editing submissions
function saveEngineer(event) {
    event.preventDefault();
    
    if (state.userRole !== 'admin') {
        alert('Unauthorized: Only MD. Minhajul Haque has edit privileges.');
        return;
    }
    
    const originalCode = document.getElementById('editOriginalCode').value;
    const code = document.getElementById('engCode').value.trim();
    const name = document.getElementById('engName').value.trim();
    const office = document.getElementById('engOffice').value.trim();
    const rank = document.getElementById('engRank').value;
    const originalDesignation = document.getElementById('engOriginalDesignation').value.trim() || rank;
    const dob = document.getElementById('engDob').value;
    const joining = document.getElementById('engJoining').value;
    const status = document.getElementById('engStatus').value;
    
    if (originalCode) {
        // Edit Action
        const idx = state.engineers.findIndex(e => e.code === originalCode);
        if (idx !== -1) {
            state.engineers[idx] = {
                ...state.engineers[idx],
                name,
                office,
                rank,
                originalDesignation,
                dob,
                joining,
                status
            };
        }
    } else {
        // Add Action
        // Check duplicate code
        const duplicate = state.engineers.some(e => e.code === code);
        if (duplicate) {
            alert('An engineer record with this Employee Code already exists!');
            return;
        }
        
        state.engineers.push({
            code,
            name,
            office,
            rank,
            originalDesignation,
            dob,
            joining,
            status
        });
    }
    
    saveDatabase();
    closeEngineerModal();
    applyFiltersAndRender();
}

// Delete Record Action
function deleteEngineer(code) {
    if (state.userRole !== 'admin') {
        alert('Unauthorized: Only MD. Minhajul Haque has edit privileges.');
        return;
    }
    const eng = state.engineers.find(e => e.code === code);
    if (!eng) return;
    
    if (confirm(`Are you sure you want to delete the seniority record for ${eng.name} (Code: ${code})?`)) {
        state.engineers = state.engineers.filter(e => e.code !== code);
        saveDatabase();
        applyFiltersAndRender();
    }
}

// --- Date Formatter Utilities ---

function formatFriendlyDate(dateObj) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

// Convert YYYY-MM-DD into DD/MM/YYYY
function formatSlashDate(dateStr) {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
