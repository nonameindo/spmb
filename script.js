document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const currentQueueNumberElement = document.getElementById('currentQueueNumber');
    const currentOperatorElement = document.getElementById('currentOperator');
    const currentDestinationElement = document.getElementById('currentDestination');
    const queueNumberInput = document.getElementById('queueNumber');
    const prevQueueButton = document.getElementById('prevQueue');
    const nextQueueButton = document.getElementById('nextQueue');
    const callQueueButton = document.getElementById('callQueue');
    const resetQueueButton = document.getElementById('resetQueue');
    const clearHistoryButton = document.getElementById('clearHistory');
    const historyBody = document.getElementById('historyBody');
    const currentDateElement = document.getElementById('currentDate');
    const currentTimeElement = document.getElementById('currentTime');
    const operatorButtons = document.querySelectorAll('.operator-btn');
    const announcementSound = document.getElementById('announcementSound');
    
    // Data aplikasi
    let currentQueueNumber = 5;
    let selectedOperator = 1;
    let calledHistory = JSON.parse(localStorage.getItem('queueHistory')) || [];
    
    // Inisialisasi
    function init() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        loadQueueHistory();
        updateDisplay();
        
        // Set operator aktif pertama
        setActiveOperator(selectedOperator);
        
        // Event Listeners
        prevQueueButton.addEventListener('click', () => changeQueueNumber(-1));
        nextQueueButton.addEventListener('click', () => changeQueueNumber(1));
        
        callQueueButton.addEventListener('click', callQueue);
        resetQueueButton.addEventListener('click', resetQueue);
        clearHistoryButton.addEventListener('click', clearHistory);
        
        // Event listener untuk operator buttons
        operatorButtons.forEach(button => {
            button.addEventListener('click', function() {
                const operator = parseInt(this.getAttribute('data-operator'));
                setActiveOperator(operator);
            });
        });
        
        // Event listener untuk input nomor antrian
        queueNumberInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) value = 1;
            if (value > 999) value = 999;
            currentQueueNumber = value;
            updateDisplay();
        });
    }
    
    // Update tanggal dan waktu
    function updateDateTime() {
        const now = new Date();
        
        // Format tanggal: Hari, DD Bulan YYYY
        const optionsDate = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const formattedDate = now.toLocaleDateString('id-ID', optionsDate);
        currentDateElement.textContent = formattedDate;
        
        // Format waktu: HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    // Update tampilan antrian saat ini
    function updateDisplay() {
        // Format nomor antrian dengan 3 digit
        const formattedNumber = String(currentQueueNumber).padStart(3, '0');
        currentQueueNumberElement.textContent = formattedNumber;
        queueNumberInput.value = currentQueueNumber;
        
        // Update operator dan tujuan
        currentOperatorElement.textContent = `Operator ${selectedOperator}`;
        currentDestinationElement.textContent = `Loket ${selectedOperator}`;
    }
    
    // Mengubah nomor antrian
    function changeQueueNumber(change) {
        currentQueueNumber += change;
        if (currentQueueNumber < 1) currentQueueNumber = 1;
        if (currentQueueNumber > 999) currentQueueNumber = 999;
        updateDisplay();
    }
    
    // Set operator aktif
    function setActiveOperator(operator) {
        selectedOperator = operator;
        
        // Hapus kelas aktif dari semua tombol
        operatorButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Tambah kelas aktif ke tombol yang dipilih
        const selectedButton = document.querySelector(`.operator-btn[data-operator="${operator}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        updateDisplay();
    }
    
    // Panggil antrian
    function callQueue() {
        // Format nomor antrian
        const formattedNumber = String(currentQueueNumber).padStart(3, '0');
        const operatorText = `Operator ${selectedOperator}`;
        const destinationText = `Loket ${selectedOperator}`;
        
        // Update tampilan
        currentQueueNumberElement.textContent = formattedNumber;
        currentOperatorElement.textContent = operatorText;
        currentDestinationElement.textContent = destinationText;
        
        // Tambah ke riwayat
        addToHistory(formattedNumber, operatorText);
        
        // Mainkan suara pengumuman
        playAnnouncement(formattedNumber, operatorText);
        
        // Auto increment nomor antrian setelah dipanggil
        currentQueueNumber++;
        if (currentQueueNumber > 999) currentQueueNumber = 1;
        updateDisplay();
    }
    
    // Mainkan suara pengumuman
    function playAnnouncement(queueNumber, operator) {
        // Pertama mainkan suara pengumuman bandara
        announcementSound.play();
        
        // Tunggu sebentar sebelum membacakan nomor antrian
        setTimeout(() => {
            // Gunakan SpeechSynthesis API untuk membacakan pengumuman
            if ('speechSynthesis' in window) {
                // Membatalkan semua pengucapan yang sedang berjalan
                speechSynthesis.cancel();
                
                // Buat teks yang akan diucapkan
                const announcementText = `Panggilan nomor antrian ${queueNumber.split('').join(' ')}. Silahkan menuju ke ${operator}.`;
                
                // Buat objek SpeechSynthesisUtterance
                const utterance = new SpeechSynthesisUtterance(announcementText);
                
                // Atur bahasa ke Indonesia
                utterance.lang = 'id-ID';
                
                // Atur suara menjadi wanita (jika tersedia)
                const voices = speechSynthesis.getVoices();
                const femaleVoice = voices.find(voice => 
                    voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
                ) || voices.find(voice => voice.lang.includes('id')) || voices[0];
                
                if (femaleVoice) {
                    utterance.voice = femaleVoice;
                }
                
                // Atur kecepatan dan volume
                utterance.rate = 0.9;
                utterance.volume = 1;
                utterance.pitch = 1;
                
                // Mainkan pengumuman
                speechSynthesis.speak(utterance);
            } else {
                alert('Browser Anda tidak mendukung fitur text-to-speech. Mohon gunakan browser yang lebih baru.');
            }
        }, 2000); // Tunggu 2 detik untuk suara pengumuman bandara
    }
    
    // Tambah ke riwayat
    function addToHistory(queueNumber, operator) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const historyItem = {
            id: Date.now(),
            time: timeString,
            queueNumber: queueNumber,
            operator: operator,
            status: 'Dipanggil'
        };
        
        calledHistory.unshift(historyItem);
        
        // Simpan ke localStorage
        localStorage.setItem('queueHistory', JSON.stringify(calledHistory));
        
        // Update tampilan riwayat
        loadQueueHistory();
    }
    
    // Muat riwayat pemanggilan
    function loadQueueHistory() {
        historyBody.innerHTML = '';
        
        if (calledHistory.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px; color: #6c757d;">
                        <i class="fas fa-history" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                        Belum ada riwayat pemanggilan
                    </td>
                </tr>
            `;
            return;
        }
        
        calledHistory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.time}</td>
                <td><strong>${item.queueNumber}</strong></td>
                <td>${item.operator}</td>
                <td class="status-called">${item.status}</td>
            `;
            historyBody.appendChild(row);
        });
    }
    
    // Reset antrian
    function resetQueue() {
        if (confirm('Apakah Anda yakin ingin mereset nomor antrian ke 1?')) {
            currentQueueNumber = 1;
            updateDisplay();
        }
    }
    
    // Hapus riwayat
    function clearHistory() {
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pemanggilan?')) {
            calledHistory = [];
            localStorage.removeItem('queueHistory');
            loadQueueHistory();
        }
    }
    
    // Inisialisasi aplikasi
    init();
    
    // Memuat suara yang tersedia untuk SpeechSynthesis
    if ('speechSynthesis' in window) {
        // Chrome memerlukan event ini untuk memuat suara
        speechSynthesis.addEventListener('voiceschanged', function() {
            console.log('Suara TTS tersedia:', speechSynthesis.getVoices().length);
        });
    }
});
