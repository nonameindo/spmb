// Data dan state aplikasi
const appState = {
    currentQueueNumber: "A001",
    nextQueueNumbers: ["A002", "A003", "A004"],
    operators: [
        { id: 1, name: "Operator 1", description: "Pendaftaran", status: "active", currentQueue: null },
        { id: 2, name: "Operator 2", description: "Verifikasi Berkas", status: "idle", currentQueue: null },
        { id: 3, name: "Operator 3", description: "Wawancara", status: "idle", currentQueue: null },
        { id: 4, name: "Operator 4", description: "Tes Akademik", status: "idle", currentQueue: null },
        { id: 5, name: "Operator 5", description: "Konsultasi Jurusan", status: "idle", currentQueue: null },
        { id: 6, name: "Operator 6", description: "Pembayaran", status: "idle", currentQueue: null },
        { id: 7, name: "Operator 7", description: "Pengambilan Kartu", status: "idle", currentQueue: null },
        { id: 8, name: "Operator 8", description: "Layanan Khusus", status: "idle", currentQueue: null }
    ],
    callHistory: [],
    speechSynth: window.speechSynthesis,
    speechVolume: 0.7,
    lastCallData: null,
    announcementType: "airport",
    
    // Tambahan untuk riwayat pemanggilan
    historyPage: 1,
    historyPageSize: 10,
    filteredHistory: [],
    currentFilter: {
        operator: "all",
        date: "today",
        search: ""
    }
};

// DOM Elements tambahan
const publicHistoryList = document.getElementById('public-history-list');
const adminHistoryList = document.getElementById('admin-history-list');
const totalCallsSpan = document.getElementById('total-calls');
const todayCallsSpan = document.getElementById('today-calls');
const filterOperator = document.getElementById('filter-operator');
const filterDate = document.getElementById('filter-date');
const searchHistory = document.getElementById('search-history');
const searchBtn = document.getElementById('search-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfoSpan = document.getElementById('page-info');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Inisialisasi aplikasi
function initApp() {
    // Set nilai awal
    queueNumberInput.value = appState.currentQueueNumber;
    
    // Set volume awal untuk semua audio
    callSound.volume = appState.speechVolume;
    airportSound.volume = appState.speechVolume;
    bellSound.volume = appState.speechVolume;
    
    // Update waktu
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Render operator status
    renderOperatorStatus();
    
    // Render antrian berikutnya
    renderNextQueue();
    
    // Render riwayat panggilan
    renderPublicHistory();
    renderAdminHistory();
    updateHistoryStats();
    
    // Setup event listeners
    setupEventListeners();
    
    // Cek Web Speech API support
    if (!appState.speechSynth) {
        alert("Browser Anda tidak mendukung fitur suara. Beberapa fungsi mungkin tidak berjalan optimal.");
    }
    
    // Preload suara
    preloadSounds();
    
    // Load riwayat dari localStorage jika ada
    loadHistoryFromStorage();
}

// Load history dari localStorage
function loadHistoryFromStorage() {
    const savedHistory = localStorage.getItem('queueHistory');
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            
            // Convert string dates back to Date objects
            parsedHistory.forEach(item => {
                if (item.timestamp) {
                    item.timestamp = new Date(item.timestamp);
                }
            });
            
            appState.callHistory = parsedHistory;
            
            // Update last call data
            if (appState.callHistory.length > 0) {
                appState.lastCallData = appState.callHistory[appState.callHistory.length - 1];
                
                // Update display
                if (appState.lastCallData.operatorId !== 0) {
                    updateLastCalledDisplay(
                        appState.lastCallData.queueNumber,
                        appState.lastCallData.operatorName
                    );
                }
            }
            
            renderPublicHistory();
            renderAdminHistory();
            updateHistoryStats();
            
            console.log("Riwayat berhasil dimuat dari localStorage:", appState.callHistory.length, "panggilan");
        } catch (error) {
            console.error("Error loading history from localStorage:", error);
        }
    }
}

// Save history ke localStorage
function saveHistoryToStorage() {
    try {
        localStorage.setItem('queueHistory', JSON.stringify(appState.callHistory));
    } catch (error) {
        console.error("Error saving history to localStorage:", error);
    }
}

// ... (fungsi-fungsi sebelumnya tetap sama) ...

// Render riwayat pemanggilan publik
function renderPublicHistory() {
    publicHistoryList.innerHTML = '';
    
    if (appState.callHistory.length === 0) {
        publicHistoryList.innerHTML = '<div class="history-empty">Belum ada riwayat panggilan</div>';
        return;
    }
    
    // Ambil 5 riwayat terbaru untuk tampilan publik
    const recentHistory = appState.callHistory.slice(-5).reverse();
    
    recentHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'public-history-item';
        
        const time = new Date(item.timestamp);
        const timeString = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        const dateString = `${String(time.getDate()).padStart(2, '0')}/${String(time.getMonth() + 1).padStart(2, '0')}`;
        
        historyItem.innerHTML = `
            <div class="public-history-number">${item.queueNumber}</div>
            <div class="public-history-details">
                <div class="public-history-operator">${item.operatorName}</div>
                <div class="public-history-time">${dateString} ${timeString}</div>
                ${item.announcement ? `<div class="public-history-announcement">${item.announcement}</div>` : ''}
            </div>
        `;
        
        publicHistoryList.appendChild(historyItem);
    });
}

// Filter riwayat berdasarkan kriteria
function filterHistory() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    appState.filteredHistory = appState.callHistory.filter(item => {
        const itemDate = new Date(item.timestamp);
        
        // Filter berdasarkan operator
        if (appState.currentFilter.operator !== "all") {
            if (appState.currentFilter.operator === "skipped") {
                if (item.operatorId !== 0) return false;
            } else if (item.operatorId !== parseInt(appState.currentFilter.operator)) {
                return false;
            }
        }
        
        // Filter berdasarkan tanggal
        switch(appState.currentFilter.date) {
            case "today":
                if (itemDate < today) return false;
                break;
            case "yesterday":
                if (itemDate < yesterday || itemDate >= today) return false;
                break;
            case "week":
                if (itemDate < weekAgo) return false;
                break;
            case "all":
                // Tidak filter tanggal
                break;
        }
        
        // Filter berdasarkan pencarian
        if (appState.currentFilter.search) {
            const searchTerm = appState.currentFilter.search.toLowerCase();
            if (!item.queueNumber.toLowerCase().includes(searchTerm) &&
                !item.operatorName.toLowerCase().includes(searchTerm) &&
                !(item.announcement && item.announcement.toLowerCase().includes(searchTerm))) {
                return false;
            }
        }
        
        return true;
    });
    
    // Reverse untuk menampilkan yang terbaru dulu
    appState.filteredHistory.reverse();
}

// Render riwayat pemanggilan admin
function renderAdminHistory() {
    adminHistoryList.innerHTML = '';
    
    // Filter history
    filterHistory();
    
    if (appState.filteredHistory.length === 0) {
        adminHistoryList.innerHTML = '<div class="history-empty">Tidak ada riwayat yang sesuai dengan filter</div>';
        updatePaginationControls();
        return;
    }
    
    // Hitung pagination
    const totalPages = Math.ceil(appState.filteredHistory.length / appState.historyPageSize);
    appState.historyPage = Math.min(appState.historyPage, totalPages);
    appState.historyPage = Math.max(1, appState.historyPage);
    
    // Ambil data untuk halaman saat ini
    const startIndex = (appState.historyPage - 1) * appState.historyPageSize;
    const endIndex = startIndex + appState.historyPageSize;
    const pageData =