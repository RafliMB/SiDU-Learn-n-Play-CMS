/**
 * SiDU Learn n Play CMS - Frontend Logic
 * Menangani routing SPA sederhana (sembunyikan/tampilkan section), modal form,
 * dan fitur form dinamis.
 */

// ==========================================
// 1. Navigation Helper
// ==========================================
function navigateToPage(targetId, title) {
    const pageSections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');
    
    // Hide all pages
    pageSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target page
    const targetElement = document.getElementById(`page-${targetId}`);
    if (targetElement) {
        targetElement.classList.add('active');
    }
    
    // Update header title
    if (title && pageTitle) {
        pageTitle.textContent = title;
    }
    
    // If returning to a main menu, highlight the sidebar correctly
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(l => {
        l.classList.remove('bg-blue-800', 'text-white', 'active', 'shadow-sm');
        l.classList.add('text-blue-200');
        if (l.getAttribute('data-target') === targetId) {
            l.classList.remove('text-blue-200');
            l.classList.add('bg-blue-800', 'text-white', 'active', 'shadow-sm');
        }
    });
}

function previewImage(event, targetImgId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.getElementById(targetImgId);
            if (imgElement) {
                imgElement.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// 1.5. Global Sorting State
// ==========================================
let sortState = {
    topik: { col: 'id', dir: 'asc' },
    kuis: { col: 'id', dir: 'asc' },
    kuisHarian: { col: 'id', dir: 'desc' },
    siswa: { col: 'id', dir: 'asc' }
};

function handleSort(table, col) {
    if (sortState[table].col === col) {
        // Toggle direction
        sortState[table].dir = sortState[table].dir === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default asc
        sortState[table].col = col;
        sortState[table].dir = 'asc';
    }
    
    // Update Icons
    document.querySelectorAll(`.th-sort-${table}`).forEach(el => {
        const icon = el.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort text-gray-300 ml-1';
        }
    });
    const currentHeader = document.getElementById(`th-${table}-${col}`);
    if (currentHeader) {
        const icon = currentHeader.querySelector('i');
        if (icon) {
            icon.className = sortState[table].dir === 'asc' ? 'fas fa-sort-up text-blue-500 ml-1' : 'fas fa-sort-down text-blue-500 ml-1';
        }
    }
    
    // Re-render
    if (table === 'topik') renderTopik();
    else if (table === 'kuis') renderKuis();
    else if (table === 'kuisHarian') renderKuisHarian();
    else if (table === 'siswa') renderStudents();
}

function applySort(data, table, typeMap = {}) {
    const col = sortState[table].col;
    const dir = sortState[table].dir;
    
    return data.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        
        // Handle undefined or null
        if (valA == null) valA = '';
        if (valB == null) valB = '';
        
        const type = typeMap[col] || 'string';
        
        if (type === 'date-id') {
            // parse DD/MM/YYYY
            const parseDate = (str) => {
                const parts = str.split('/');
                if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]).getTime();
                return 0;
            };
            valA = parseDate(valA);
            valB = parseDate(valB);
        } else if (type === 'number') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }
        
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
    });
}

function applyLimit(data, tableId) {
    const limitEl = document.getElementById(`limit-${tableId}`);
    const limitVal = limitEl ? limitEl.value : 'all';
    
    if (limitVal !== 'all') {
        return data.slice(0, parseInt(limitVal, 10));
    }
    return data;
}

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Navigation Routing (SPA Simulation)
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hapus status 'active' dari semua link di sidebar
            navLinks.forEach(l => {
                l.classList.remove('bg-blue-800', 'text-white', 'active', 'shadow-sm');
                l.classList.add('text-blue-200');
            });
            
            // Tambahkan status 'active' pada link yang diklik
            link.classList.remove('text-blue-200');
            link.classList.add('bg-blue-800', 'text-white', 'active', 'shadow-sm');
            
            // Sembunyikan semua konten halaman
            pageSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Ambil ID target dari atribut data-target dan tampilkan halaman terkait
            const targetId = link.getAttribute('data-target');
            document.getElementById(`page-${targetId}`).classList.add('active');
            
            // Update Teks Judul Header
            const titleText = link.querySelector('span').textContent.trim();
            pageTitle.textContent = titleText;
        });
    });

    // ==========================================
    // 2. Radio Button Group Highlight (Visual fallback if CSS isn't enough, 
    //    though currently handled beautifully by CSS :checked selector).
    //    We can add an event listener here to debug or do additional JS logic when answered.
    // ==========================================
    const radioInputs = document.querySelectorAll('.radio-img-input');
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            console.log(`Kunci Jawaban Dipilih: Opsi ${e.target.value}`);
            // CSS secara otomatis menghandle styling berkat 'peer-checked' atau input:checked + label
        });
    });

    // ==========================================
    // 3. Inisialisasi Datepicker (Format: Hari/Bulan/Tahun)
    // ==========================================
    if (typeof flatpickr !== 'undefined') {
        flatpickr(".datepicker", {
            dateFormat: "d/m/Y",
            allowInput: true
        });
    }
});


// ==========================================
// 3. Modal Toggle Function
// ==========================================
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        // Sedikit animasi fade-in bisa ditambah jika mau
    } else {
        modal.classList.add('hidden');
    }
}


// ==========================================
// 4. Dynamic Form: Tambah Baris Kuis Harian
// ==========================================
function addDailyQuizRow() {
    const container = document.getElementById('dynamic-form-container');
    const rowCount = container.children.length + 1;
    
    // Buat elemen div untuk row baru
    const row = document.createElement('div');
    row.className = 'row-kuis-harian flex flex-col md:flex-row items-end gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm mt-4 animate-[fadeIn_0.3s_ease-in-out]';
    
    // Struktur HTML baris baru
    row.innerHTML = `
        <div class="flex-1 w-full">
            <label class="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Soal #${rowCount}</label>
            <div class="flex items-center gap-2">
                <input type="number" min="0" max="100" step="0.01" oninput="calculateAnswer(this)" placeholder="0 - 100" class="num1 w-full bg-white border border-gray-200 text-gray-800 py-3 px-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center shadow-sm" required>
                <select onchange="calculateAnswer(this)" class="operator w-20 md:w-24 flex-shrink-0 bg-white border border-gray-200 text-blue-600 py-3 px-2 rounded-xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-center cursor-pointer text-xl shadow-sm" style="appearance:none;-webkit-appearance:none;text-align-last:center;" required>
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="*">×</option>
                    <option value="/">÷</option>
                </select>
                <input type="number" min="0" max="100" step="0.01" oninput="calculateAnswer(this)" placeholder="0 - 100" class="num2 w-full bg-white border border-gray-200 text-gray-800 py-3 px-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center shadow-sm" required>
            </div>
        </div>
        
        <div class="font-black text-gray-300 text-3xl hidden md:block mb-3 px-2">=</div>
        
        <div class="w-full md:w-1/4">
            <label class="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Kunci Jawaban Otomatis</label>
            <input type="number" placeholder="Otomatis" class="answer-box w-full bg-gray-100 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-black focus:outline-none text-center shadow-inner cursor-not-allowed" readonly required>
        </div>
        
        <div class="pb-0 w-full md:w-auto text-right mt-4 md:mt-0">
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-white bg-white hover:bg-red-500 border border-gray-200 hover:border-red-500 p-3 rounded-xl transition shadow-sm">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(row);
}

function autoGenerateQuiz() {
    const container = document.getElementById('dynamic-form-container');
    container.innerHTML = ''; // Hapus soal yang ada
    
    const operators = ['+', '-', '*', '/'];
    
    // Generate 3 soal
    for (let i = 0; i < 3; i++) {
        addDailyQuizRow();
        const rows = document.querySelectorAll('.row-kuis-harian');
        const lastRow = rows[rows.length - 1];
        
        const num1El = lastRow.querySelector('.num1');
        const opEl = lastRow.querySelector('.operator');
        const num2El = lastRow.querySelector('.num2');
        
        const op = operators[Math.floor(Math.random() * operators.length)];
        let num1, num2;
        
        if (op === '+') {
            num1 = Math.floor(Math.random() * 50) + 1; // 1-50
            num2 = Math.floor(Math.random() * 50) + 1; // 1-50 (hasil maks 100)
        } else if (op === '-') {
            num1 = Math.floor(Math.random() * 100) + 1; // 1-100
            num2 = Math.floor(Math.random() * num1) + 1; // selalu lebih kecil dari num1
        } else if (op === '*') {
            num1 = Math.floor(Math.random() * 10) + 1; // 1-10
            num2 = Math.floor(Math.random() * 10) + 1; // 1-10 (hasil maks 100)
        } else if (op === '/') {
            num2 = Math.floor(Math.random() * 10) + 1; // pembagi 1-10
            const hasilBulat = Math.floor(Math.random() * 10) + 1; // hasil bulat 1-10
            num1 = num2 * hasilBulat; // num1 = pembagi * hasil
        }
        
        num1El.value = num1;
        opEl.value = op;
        num2El.value = num2;
        
        // Panggil calculateAnswer agar terisi box-nya
        calculateAnswer(num1El);
    }
}

// ==========================================
// 5. Kalkulasi Kunci Jawaban Otomatis
// ==========================================
function calculateAnswer(element) {
    // Cari parent container baris soal ini
    const row = element.closest('.row-kuis-harian');
    if (!row) return;

    // Ambil elemen input
    const num1El = row.querySelector('.num1');
    const operatorEl = row.querySelector('.operator');
    const num2El = row.querySelector('.num2');
    const answerBox = row.querySelector('.answer-box');

    // Parse nilai angka
    let num1 = parseFloat(num1El.value);
    let num2 = parseFloat(num2El.value);
    const op = operatorEl.value;

    // Validasi range 0-100 secara langsung
    if (!isNaN(num1)) {
        if (num1 < 0) { num1 = 0; num1El.value = 0; }
        if (num1 > 100) { num1 = 100; num1El.value = 100; }
    }
    
    if (!isNaN(num2)) {
        if (num2 < 0) { num2 = 0; num2El.value = 0; }
        if (num2 > 100) { num2 = 100; num2El.value = 100; }
    }

    // Jika kedua angka belum diisi lengkap, kosongkan jawaban
    if (isNaN(num1) || isNaN(num2)) {
        answerBox.value = '';
        return;
    }

    // Hitung hasil berdasarkan operator
    let hasil = 0;
    switch (op) {
        case '+': hasil = num1 + num2; break;
        case '-': hasil = num1 - num2; break;
        case '*': hasil = num1 * num2; break;
        case '/': 
            // Hindari pembagian dengan nol
            hasil = num2 !== 0 ? num1 / num2 : 0; 
            break;
    }

    // Masukkan ke kotak jawaban (dibulatkan hingga 2 desimal jika hasil pecahan)
    answerBox.value = Number.isInteger(hasil) ? hasil : hasil.toFixed(2);
}

// ==========================================
// 6. CRUD Manajemen Akun Siswa (Simulasi Demo)
// ==========================================

let studentsData = [
    { id: 'SW-001', nama: 'Raka Anak Hebat', kelas: '5', jk: 'L', tglLahir: '12/04/2015', provinsi: 'Jawa Barat', kota: 'Kota Bekasi', status: true, avatar: 'Felix' },
    { id: 'SW-002', nama: 'Dinda Pintar', kelas: '4', jk: 'P', tglLahir: '22/08/2016', provinsi: 'Dki Jakarta', kota: 'Kota Jakarta Selatan', status: true, avatar: 'Aneka' },
    { id: 'SW-003', nama: 'Budi Santoso', kelas: '4', jk: 'L', tglLahir: '05/01/2016', provinsi: 'Jawa Tengah', kota: 'Kota Semarang', status: false, avatar: 'Jack' }
];

function renderStudents() {
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;
    
    // Ambil nilai filter
    const filterKelasEl = document.getElementById('filter-kelas');
    const searchSiswaEl = document.getElementById('search-siswa');
    
    const filterKelas = filterKelasEl ? filterKelasEl.value : '';
    const searchQuery = searchSiswaEl ? searchSiswaEl.value.toLowerCase() : '';
    
    tbody.innerHTML = '';
    
    // Terapkan filter
    const filteredData = studentsData.filter(student => {
        const matchKelas = filterKelas === '' || student.kelas === filterKelas;
        const matchSearch = student.nama.toLowerCase().includes(searchQuery) || student.id.toLowerCase().includes(searchQuery);
        return matchKelas && matchSearch;
    });
    
    const sortedData = applySort(filteredData, 'siswa', { kelas: 'number' });
    const limitedData = applyLimit(sortedData, 'siswa');
    
    if (limitedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500 font-bold">Data siswa tidak ditemukan.</td></tr>`;
        return;
    }
    
    limitedData.forEach(student => {
        const statusBadge = student.status 
            ? `<span class="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wide">Aktif</span>`
            : `<span class="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-black uppercase tracking-wide">Nonaktif</span>`;
            
        // Tgl Lahir sekarang sudah dalam format DD/MM/YYYY dari form
        let formattedDate = student.tglLahir || '-';
            
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 font-black text-gray-400">#${student.id}</td>
            <td class="px-6 py-4 font-extrabold text-gray-800">
                ${student.nama}
            </td>
            <td class="px-6 py-4 font-bold text-gray-600">${student.kelas}</td>
            <td class="px-6 py-4 font-bold text-gray-600">${student.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
            <td class="px-6 py-4 font-bold text-gray-600">${formattedDate}</td>
            <td class="px-6 py-4 font-bold text-gray-600 text-sm">${student.kota}, ${student.provinsi}</td>
            <td class="px-6 py-4 text-center">${statusBadge}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="openStudentModal('${student.id}')" class="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg mr-1"><i class="fas fa-edit"></i></button>
                <button onclick="deleteStudent('${student.id}')" class="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openStudentModal(id = null) {
    const title = document.getElementById('modal-siswa-title');
    const idInput = document.getElementById('siswa-id');
    const namaInput = document.getElementById('siswa-nama');
    const kelasInput = document.getElementById('siswa-kelas');
    const jkInput = document.getElementById('siswa-jenis-kelamin');
    const tglInput = document.getElementById('siswa-tanggal-lahir');
    const provInput = document.getElementById('siswa-provinsi');
    const kotaInput = document.getElementById('siswa-kota');
    const statusInput = document.getElementById('siswa-status');
    
    if (id) {
        // Mode Edit
        const student = studentsData.find(s => s.id === id);
        if (student) {
            title.textContent = 'Edit Akun Siswa';
            idInput.value = student.id;
            namaInput.value = student.nama;
            kelasInput.value = student.kelas;
            jkInput.value = student.jk || '';
            tglInput.value = student.tglLahir || '';
            provInput.value = student.provinsi || '';
            kotaInput.value = student.kota || '';
            statusInput.checked = student.status;
        }
    } else {
        // Mode Tambah
        title.textContent = 'Tambah Siswa Baru';
        idInput.value = '';
        namaInput.value = '';
        kelasInput.value = '4';
        jkInput.value = '';
        tglInput.value = '';
        provInput.value = '';
        kotaInput.value = '';
        statusInput.checked = true;
    }
    
    toggleModal('modal-siswa');
}

function saveStudent() {
    const idInput = document.getElementById('siswa-id').value;
    const namaInput = document.getElementById('siswa-nama').value;
    const kelasInput = document.getElementById('siswa-kelas').value;
    const jkInput = document.getElementById('siswa-jenis-kelamin').value;
    const tglInput = document.getElementById('siswa-tanggal-lahir').value;
    const provInput = document.getElementById('siswa-provinsi').value;
    const kotaInput = document.getElementById('siswa-kota').value;
    const statusInput = document.getElementById('siswa-status').checked;
    
    if (!namaInput || !kelasInput || !jkInput || !tglInput || !provInput || !kotaInput) {
        alert('Mohon lengkapi semua data siswa!');
        return;
    }
    
    if (idInput) {
        // Update eksisting
        const index = studentsData.findIndex(s => s.id === idInput);
        if (index !== -1) {
            studentsData[index].nama = namaInput;
            studentsData[index].kelas = kelasInput;
            studentsData[index].jk = jkInput;
            studentsData[index].tglLahir = tglInput;
            studentsData[index].provinsi = provInput;
            studentsData[index].kota = kotaInput;
            studentsData[index].status = statusInput;
            alert('Data siswa berhasil diperbarui!');
        }
    } else {
        // Buat baru
        const newId = 'SW-' + String(studentsData.length + 1).padStart(3, '0');
        const avatars = ['Felix', 'Aneka', 'Jack', 'Jocelyn', 'Buster', 'Lucy'];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        
        studentsData.push({
            id: newId,
            nama: namaInput,
            kelas: kelasInput,
            jk: jkInput,
            tglLahir: tglInput,
            provinsi: provInput,
            kota: kotaInput,
            status: statusInput,
            avatar: randomAvatar
        });
        alert('Siswa baru berhasil ditambahkan!');
    }
    
    toggleModal('modal-siswa');
    renderStudents();
}

function deleteStudent(id) {
    if (confirm('Apakah Anda yakin ingin menghapus akun siswa ini?')) {
        studentsData = studentsData.filter(s => s.id !== id);
        renderStudents();
    }
}

// ==========================================
// 7. Leaderboard Rendering & Filtering
// ==========================================

const leaderboardData = [
    { nama: 'Raka Anak Hebat', kelas: '5', avatar: 'Felix', skor: 94.50, s: 96.00, t: 92.00, e: 95.00, m: 95.00 },
    { nama: 'Dinda Pintar', kelas: '4', avatar: 'Aneka', skor: 89.20, s: 90.00, t: 88.00, e: 90.00, m: 88.80 },
    { nama: 'Budi Santoso', kelas: '4', avatar: 'Jack', skor: 85.00, s: 85.00, t: 80.00, e: 90.00, m: 85.00 },
    { nama: 'Siti Aisyah', kelas: '6', avatar: 'Jocelyn', skor: 78.00, s: 75.00, t: 78.00, e: 82.00, m: 77.00 },
    { nama: 'Reza Juara', kelas: '5', avatar: 'Buster', skor: 91.00, s: 95.00, t: 90.00, e: 90.00, m: 89.00 },
    { nama: 'Tiara Indah', kelas: '6', avatar: 'Lucy', skor: 88.50, s: 85.00, t: 90.00, e: 85.00, m: 94.00 }
];

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-table-body');
    if (!tbody) return;
    
    const filterKelasEl = document.getElementById('filter-leaderboard-kelas');
    const filterKelas = filterKelasEl ? filterKelasEl.value : '';
    
    // Filter data berdasarkan kelas
    let filteredData = leaderboardData;
    if (filterKelas !== '') {
        filteredData = leaderboardData.filter(student => student.kelas === filterKelas);
    }
    
    // Sort berdasarkan skor total terbesar
    filteredData.sort((a, b) => b.skor - a.skor);
    
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 font-bold">Belum ada peringkat untuk kelas ini.</td></tr>`;
        return;
    }
    
    filteredData.forEach((student, index) => {
        const rank = index + 1;
        
        let rankHtml = '';
        if (rank === 1) {
            rankHtml = `<div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400 text-white font-black text-xl shadow-md shadow-yellow-200 border-2 border-white">${rank}</div>`;
        } else if (rank === 2) {
            rankHtml = `<div class="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-white font-black text-lg shadow-sm border-2 border-white">${rank}</div>`;
        } else if (rank === 3) {
            rankHtml = `<div class="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-orange-400 text-white font-black text-lg shadow-sm border-2 border-white">${rank}</div>`;
        } else {
            rankHtml = `<div class="mx-auto flex items-center justify-center w-8 h-8 font-extrabold text-gray-500">${rank}</div>`;
        }
        
        // Format skor menjadi string dengan koma sebagai desimal
        const formatScore = (num) => num.toFixed(2).replace('.', ',');
        
        const rowColor = rank === 1 ? 'hover:bg-yellow-50 transition bg-white' : 'hover:bg-gray-50 transition';
        
        const tr = document.createElement('tr');
        tr.className = rowColor;
        tr.innerHTML = `
            <td class="px-6 py-4 text-center">${rankHtml}</td>
            <td class="px-6 py-4 ${rank === 1 ? 'font-extrabold text-gray-800' : 'font-bold text-gray-700'}">
                <div class="flex items-center gap-4">
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${student.avatar}" alt="avatar" class="${rank === 1 ? 'w-12 h-12 bg-blue-100 border-blue-200' : 'w-10 h-10 bg-purple-100 border-purple-200'} rounded-full border-2 p-1">
                    ${student.nama} <span class="text-xs text-gray-400 ml-2">(Kls ${student.kelas})</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center font-black ${rank === 1 ? 'text-2xl text-blue-700 drop-shadow-sm' : (rank <= 3 ? 'text-xl text-blue-600' : 'text-lg text-gray-600')}">
                ${formatScore(student.skor)}
            </td>
            <td class="px-6 py-4">
                <div class="flex justify-center gap-2 text-xs font-bold text-white ${rank > 3 ? 'opacity-90' : ''}">
                    <span class="bg-emerald-400 px-2.5 py-1 rounded-md">S: ${formatScore(student.s)}</span>
                    <span class="bg-blue-400 px-2.5 py-1 rounded-md">T: ${formatScore(student.t)}</span>
                    <span class="bg-purple-400 px-2.5 py-1 rounded-md">E: ${formatScore(student.e)}</span>
                    <span class="bg-rose-400 px-2.5 py-1 rounded-md">M: ${formatScore(student.m)}</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render data pertama kali saat DOM diload
document.addEventListener('DOMContentLoaded', () => {
    renderStudents();
    renderLeaderboard();
    renderTopik();
    renderKuis();
    renderKuisHarian();
});

// ==========================================
// 8. CSV Upload Handler
// ==========================================
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        
        // Asumsi format CSV dipisahkan oleh koma atau titik koma
        // dan setiap baris adalah satu entry.
        // Kita ubah koma/titik koma menjadi delimiter ' | ' agar sesuai dengan format UI.
        const lines = text.split('\n');
        const formattedLines = lines.map(line => {
            // Hapus whitespace berlebih dan quote
            let cleanLine = line.trim().replace(/"/g, '');
            if (!cleanLine) return '';
            
            // Ganti koma (,) atau titik koma (;) dengan ' | '
            // RegExp ini memisahkan berdasarkan , atau ;
            let parts = cleanLine.split(/[,;]/);
            
            // Bersihkan setiap part dan gabungkan ulang
            return parts.map(p => p.trim()).join(' | ');
        }).filter(line => line.length > 0);
        
        // Masukkan ke dalam textarea
        const textarea = document.getElementById('batch-textarea');
        if (textarea) {
            // Jika textarea sudah ada isinya, gabungkan. Jika kosong, timpa.
            if (textarea.value.trim() !== '') {
                textarea.value += '\n' + formattedLines.join('\n');
            } else {
                textarea.value = formattedLines.join('\n');
            }
            alert('File CSV berhasil dimuat! Silakan tinjau kembali data pada kotak teks.');
        }
        
        // Reset input file agar file yang sama bisa diupload ulang jika perlu
        event.target.value = '';
    };
    
    reader.onerror = function() {
        alert('Terjadi kesalahan saat membaca file CSV.');
    };
    
    reader.readAsText(file);
}

// ==========================================
// 9. CRUD Manajemen Topik (Simulasi Demo)
// ==========================================

let topikData = [
    { id: 'TP001', kategori: 'Science', subtopik: 'Mengenal Tata Surya', bulan: '2026-08', status: true },
    { id: 'TP002', kategori: 'Technology', subtopik: 'Dasar Robotika', bulan: '2026-09', status: false }
];

function renderTopik() {
    const tbody = document.getElementById('topik-table-body');
    if (!tbody) return;
    
    const filterKatEl = document.getElementById('filter-kategori-topik');
    const searchEl = document.getElementById('search-topik');
    
    const filterKat = filterKatEl ? filterKatEl.value : '';
    const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
    
    tbody.innerHTML = '';
    
    const filteredTopik = topikData.filter(topik => {
        const matchKat = filterKat === '' || topik.kategori === filterKat;
        const matchSearch = topik.subtopik.toLowerCase().includes(searchVal) || topik.id.toLowerCase().includes(searchVal);
        return matchKat && matchSearch;
    });
    
    const sortedTopik = applySort(filteredTopik, 'topik', {});
    const limitedTopik = applyLimit(sortedTopik, 'topik');
    
    if (limitedTopik.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 font-bold">Belum ada data topik pembelajaran.</td></tr>`;
        return;
    }
    
    const formatBulan = (val) => {
        if (!val || !val.includes('-')) return val;
        const [year, month] = val.split('-');
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthIndex = parseInt(month, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            return `${monthNames[monthIndex]} ${year}`;
        }
        return val;
    };
    
    limitedTopik.forEach(topik => {
        let colorClass = 'text-blue-700'; // Default Science
        if (topik.kategori === 'Technology') colorClass = 'text-purple-700';
        else if (topik.kategori === 'Engineering') colorClass = 'text-orange-600';
        else if (topik.kategori === 'Mathematics') colorClass = 'text-rose-600';

        const statusBadge = topik.status 
            ? `<span class="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wide">Aktif</span>`
            : `<span class="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-black uppercase tracking-wide">Draft</span>`;
            
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 font-black text-gray-400">#${topik.id}</td>
            <td class="px-6 py-4 font-extrabold ${colorClass}">${topik.kategori}</td>
            <td class="px-6 py-4 font-bold text-gray-800">${topik.subtopik}</td>
            <td class="px-6 py-4 font-bold text-gray-600">${formatBulan(topik.bulan)}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-center flex justify-center gap-1">
                <button onclick="openTopikModal('${topik.id}')" class="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg"><i class="fas fa-edit"></i></button>
                <button onclick="deleteTopik('${topik.id}')" class="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openTopikModal(id = null) {
    const title = document.getElementById('modal-topik-title');
    const idInput = document.getElementById('topik-id');
    const kategoriInput = document.getElementById('topik-kategori');
    const subtopikInput = document.getElementById('topik-subtopik');
    const bulanInput = document.getElementById('topik-bulan');
    const statusInput = document.getElementById('topik-status');
    
    if (id) {
        // Edit Mode
        const topik = topikData.find(t => t.id === id);
        if (topik) {
            title.textContent = 'Edit Topik';
            idInput.value = topik.id;
            kategoriInput.value = topik.kategori;
            subtopikInput.value = topik.subtopik;
            bulanInput.value = topik.bulan;
            statusInput.checked = topik.status;
        }
    } else {
        // Add Mode
        title.textContent = 'Topik Baru';
        idInput.value = '';
        kategoriInput.value = '';
        subtopikInput.value = '';
        bulanInput.value = '';
        statusInput.checked = true;
    }
    
    toggleModal('modal-topik');
}

function saveTopik() {
    const idInput = document.getElementById('topik-id').value;
    const kategoriInput = document.getElementById('topik-kategori').value;
    const subtopikInput = document.getElementById('topik-subtopik').value;
    const bulanInput = document.getElementById('topik-bulan').value;
    const statusInput = document.getElementById('topik-status').checked;
    
    if (idInput) {
        // Update existing
        const index = topikData.findIndex(t => t.id === idInput);
        if (index !== -1) {
            topikData[index].kategori = kategoriInput;
            topikData[index].subtopik = subtopikInput;
            topikData[index].bulan = bulanInput;
            topikData[index].status = statusInput;
            alert('Topik berhasil diperbarui!');
        }
    } else {
        // Create new
        const newId = 'TP' + String(topikData.length + 1).padStart(3, '0');
        topikData.push({
            id: newId,
            kategori: kategoriInput,
            subtopik: subtopikInput,
            bulan: bulanInput,
            status: statusInput
        });
        alert('Topik baru berhasil ditambahkan!');
    }
    
    toggleModal('modal-topik');
    renderTopik();
}

function deleteTopik(id) {
    if (confirm('Apakah Anda yakin ingin menghapus topik ini?')) {
        topikData = topikData.filter(t => t.id !== id);
        renderTopik();
    }
}

function saveBatchTopik() {
    const textarea = document.getElementById('batch-textarea');
    if (!textarea || !textarea.value.trim()) return;

    const lines = textarea.value.split('\n');
    let addedCount = 0;

    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            // Pemetaan singkatan ke Kategori penuh
            let kategoriStr = 'Science'; // Default
            const katCode = parts[0].toUpperCase();
            if (katCode === 'S' || katCode === 'SCIENCE') kategoriStr = 'Science';
            else if (katCode === 'T' || katCode === 'TECHNOLOGY') kategoriStr = 'Technology';
            else if (katCode === 'E' || katCode === 'ENGINEERING') kategoriStr = 'Engineering';
            else if (katCode === 'M' || katCode === 'MATHEMATICS') kategoriStr = 'Mathematics';
            
            const newId = 'TP' + String(topikData.length + 1).padStart(3, '0');
            topikData.push({
                id: newId,
                kategori: kategoriStr,
                subtopik: parts[1],
                bulan: parts[2],
                status: false // Draft
            });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        alert('Yey! ' + addedCount + ' topik dalam batch berhasil ditambahkan.');
        textarea.value = ''; // Kosongkan text area
        toggleModal('modal-batch-topik');
        renderTopik();
    } else {
        alert('Format data batch tidak valid. Pastikan format: Kategori | Subtopik | Bulan');
    }
}

// ==========================================
// 10. Toggle Tipe Jawaban Kuis (Gambar / Teks)
// ==========================================
function setAnswerType(type) {
    const btnImg = document.getElementById('btn-ans-img');
    const btnText = document.getElementById('btn-ans-text');
    const labelUtama = document.getElementById('label-opsi-jawaban');
    
    const imgContainers = document.querySelectorAll('.ans-img-container');
    const txtContainers = document.querySelectorAll('.ans-txt-container');

    if (type === 'image') {
        // Update Buttons
        btnImg.className = 'px-5 py-2.5 rounded-lg font-extrabold text-sm bg-white shadow-sm text-blue-700 transition';
        btnText.className = 'px-5 py-2.5 rounded-lg font-extrabold text-sm text-gray-500 hover:text-gray-700 transition';
        
        // Update Label
        if (labelUtama) labelUtama.textContent = 'Opsi Jawaban (Unggah Gambar)';
        
        // Toggle Inputs
        imgContainers.forEach(el => {
            el.classList.remove('hidden');
            const input = el.querySelector('input');
            if(input) input.required = true;
        });
        txtContainers.forEach(el => {
            el.classList.add('hidden');
            const input = el.querySelector('input');
            if(input) input.required = false;
        });

    } else if (type === 'text') {
        // Update Buttons
        btnText.className = 'px-5 py-2.5 rounded-lg font-extrabold text-sm bg-white shadow-sm text-blue-700 transition';
        btnImg.className = 'px-5 py-2.5 rounded-lg font-extrabold text-sm text-gray-500 hover:text-gray-700 transition';
        
        // Update Label
        if (labelUtama) labelUtama.textContent = 'Opsi Jawaban (Teks)';
        
        // Toggle Inputs
        imgContainers.forEach(el => {
            el.classList.add('hidden');
            const input = el.querySelector('input');
            if(input) input.required = false;
        });
        txtContainers.forEach(el => {
            el.classList.remove('hidden');
            const input = el.querySelector('input');
            if(input) input.required = true;
        });
    }
}

// ==========================================
// 11. Populate Dropdown Subtopik di Manajemen Kuis
// ==========================================
function updateSubtopikKuis() {
    const katSelect = document.getElementById('kuis-kategori');
    const subSelect = document.getElementById('kuis-subtopik');
    
    if (!katSelect || !subSelect) return;
    
    const selectedKategori = katSelect.value;
    
    // Clear current options
    subSelect.innerHTML = '<option value="" disabled selected>-- Pilih Sub-Topik --</option>';
    
    if (!selectedKategori) {
        subSelect.disabled = true;
        subSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Topik Terlebih Dahulu --</option>';
        return;
    }
    
    // Filter dari topikData yang aktif
    // Bisa disesuaikan kalau mau ngambil yang draft juga, tapi kita ambil semua aja untuk demo ini
    const filteredTopik = topikData.filter(t => t.kategori === selectedKategori);
    
    if (filteredTopik.length === 0) {
        subSelect.innerHTML = '<option value="" disabled selected>-- Belum ada subtopik untuk kategori ini --</option>';
        subSelect.disabled = true;
        return;
    }
    
    // Populate
    filteredTopik.forEach(t => {
        const option = document.createElement('option');
        option.value = t.subtopik;
        option.textContent = t.subtopik;
        subSelect.appendChild(option);
    });
    
    subSelect.disabled = false;
}

// ==========================================
// 12. CRUD Kuis (Simulasi Demo)
// ==========================================

let kuisData = [
    { id: 'QZ001', kategori: 'Science', subtopik: 'Mengenal Tata Surya', pertanyaan: 'Planet mana yang dijuluki planet merah?' },
    { id: 'QZ002', kategori: 'Mathematics', subtopik: 'Pecahan Desimal', pertanyaan: 'Berapa hasil dari 0.5 + 0.25?' }
];

function renderKuis() {
    const tbody = document.getElementById('kuis-table-body');
    if (!tbody) return;
    
    const filterKatEl = document.getElementById('filter-kategori-kuis');
    const searchEl = document.getElementById('search-kuis');
    
    const filterKat = filterKatEl ? filterKatEl.value : '';
    const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
    
    tbody.innerHTML = '';
    
    const filteredKuis = kuisData.filter(kuis => {
        const matchKat = filterKat === '' || kuis.kategori === filterKat;
        const matchSearch = kuis.subtopik.toLowerCase().includes(searchVal) || kuis.pertanyaan.toLowerCase().includes(searchVal) || kuis.id.toLowerCase().includes(searchVal);
        return matchKat && matchSearch;
    });
    
    const sortedKuis = applySort(filteredKuis, 'kuis', {});
    const limitedKuis = applyLimit(sortedKuis, 'kuis');
    
    if (limitedKuis.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 font-bold">Belum ada soal kuis yang terdaftar.</td></tr>`;
        return;
    }
    
    limitedKuis.forEach(kuis => {
        let colorClass = 'text-blue-700';
        if (kuis.kategori === 'Technology') colorClass = 'text-purple-700';
        else if (kuis.kategori === 'Engineering') colorClass = 'text-orange-600';
        else if (kuis.kategori === 'Mathematics') colorClass = 'text-rose-600';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 font-black text-gray-400">#${kuis.id}</td>
            <td class="px-6 py-4 font-extrabold ${colorClass}">${kuis.kategori}</td>
            <td class="px-6 py-4 font-bold text-gray-800">${kuis.subtopik}</td>
            <td class="px-6 py-4 text-sm font-semibold text-gray-600 truncate max-w-xs">${kuis.pertanyaan}</td>
            <td class="px-6 py-4 text-center flex justify-center gap-1">
                <button onclick="editKuis('${kuis.id}')" class="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg"><i class="fas fa-edit"></i></button>
                <button onclick="deleteKuis('${kuis.id}')" class="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let kuisHarianData = [
    { id: 'QH001', tanggal: '28/09/2026', jumlahSoal: 3 },
    { id: 'QH002', tanggal: '29/09/2026', jumlahSoal: 5 },
    { id: 'QH003', tanggal: '30/09/2026', jumlahSoal: 3 }
];

function renderKuisHarian() {
    const tbody = document.getElementById('kuis-harian-table-body');
    if (!tbody) return;
    
    const filterTanggalEl = document.getElementById('filter-tanggal-kuis-harian');
    const filterTanggal = filterTanggalEl ? filterTanggalEl.value : '';
    const searchEl = document.getElementById('search-kuis-harian');
    const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
    
    tbody.innerHTML = '';
    
    const filteredKuis = kuisHarianData.filter(kuis => {
        const matchTanggal = !filterTanggal || kuis.tanggal === filterTanggal;
        const matchSearch = kuis.id.toLowerCase().includes(searchVal);
        return matchTanggal && matchSearch;
    });
    
    const sortedKuis = applySort(filteredKuis, 'kuisHarian', { tanggal: 'date-id', jumlahSoal: 'number' });
    const limitedKuis = applyLimit(sortedKuis, 'kuisHarian');
    
    if (limitedKuis.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 font-bold">Belum ada riwayat kuis harian.</td></tr>`;
        return;
    }
    
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = dd + '/' + mm + '/' + yyyy;
    
    limitedKuis.forEach(kuis => {
        let editBtn = '';
        if (kuis.tanggal === todayStr) {
            editBtn = `<button onclick="editKuisHarian('${kuis.id}')" class="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg"><i class="fas fa-edit"></i></button>`;
        } else {
            editBtn = `<button onclick="alert('Kuis harian hanya dapat diedit pada hari kuis tersebut dipublikasikan (${todayStr}).')" class="text-gray-400 p-2 bg-gray-50 rounded-lg cursor-not-allowed"><i class="fas fa-edit"></i></button>`;
        }
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 font-black text-gray-400">#${kuis.id}</td>
            <td class="px-6 py-4 font-extrabold text-blue-700">${kuis.tanggal}</td>
            <td class="px-6 py-4 font-bold text-gray-800">${kuis.jumlahSoal} Soal</td>
            <td class="px-6 py-4 text-center flex justify-center gap-1">
                ${editBtn}
                <button onclick="deleteKuisHarian('${kuis.id}')" class="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteKuisHarian(id) {
    if(confirm('Yakin ingin menghapus kuis harian ini?')) {
        kuisHarianData = kuisHarianData.filter(q => q.id !== id);
        renderKuisHarian();
    }
}

function editKuisHarian(id) {
    const kuis = kuisHarianData.find(q => q.id === id);
    if (!kuis) return;
    
    document.getElementById('form-kuis-harian').reset();
    document.getElementById('kuis-harian-id').value = kuis.id;
    
    // Set datepicker value
    const datepickerInput = document.querySelector('#form-kuis-harian .datepicker');
    if (datepickerInput) {
        datepickerInput.value = kuis.tanggal;
        // If flatpickr is used, update its instance
        if (datepickerInput._flatpickr) {
            datepickerInput._flatpickr.setDate(kuis.tanggal);
        }
    }
    
    // Auto-generate some rows to match jumlahSoal
    const container = document.getElementById('dynamic-form-container');
    container.innerHTML = '';
    for (let i = 0; i < kuis.jumlahSoal; i++) {
        addDailyQuizRow();
    }
    
    navigateToPage('kuis-harian', 'Edit Kuis Matematika Harian');
}

function saveKuisHarian() {
    const idInput = document.getElementById('kuis-harian-id').value;
    const tglInput = document.querySelector('#form-kuis-harian .datepicker').value;
    const rowCount = document.querySelectorAll('.row-kuis-harian').length;
    
    if (!tglInput) {
        alert('Mohon tentukan tanggal kuis harian!');
        return;
    }
    
    if (idInput) {
        // Edit mode
        const index = kuisHarianData.findIndex(q => q.id === idInput);
        if (index !== -1) {
            kuisHarianData[index].tanggal = tglInput;
            kuisHarianData[index].jumlahSoal = rowCount;
            alert('Kuis Harian berhasil diperbarui!');
        }
    } else {
        // Create mode
        const newId = 'QH' + String(kuisHarianData.length + 1).padStart(3, '0');
        kuisHarianData.push({
            id: newId,
            tanggal: tglInput,
            jumlahSoal: rowCount
        });
        alert('Kuis Harian untuk tanggal ' + tglInput + ' berhasil disimpan!');
    }
    
    document.getElementById('form-kuis-harian').reset();
    document.getElementById('kuis-harian-id').value = '';
    renderKuisHarian();
    navigateToPage('kuis', 'Manajemen Kuis');
}

function resetKuisForm() {
    document.getElementById('form-manajemen-kuis').reset();
    document.getElementById('kuis-id').value = '';
    
    // Reset Subtopik Dropdown
    const subSelectEl = document.getElementById('kuis-subtopik');
    subSelectEl.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Topik Terlebih Dahulu --</option>';
    subSelectEl.disabled = true;
    
    // Reset image previews to blank transparent pixel
    const blankImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    ['a', 'b', 'c', 'd'].forEach(letter => {
        const img = document.getElementById(`preview-img-${letter}`);
        if (img) img.src = blankImage;
    });
}

function openAddKuisHarian() {
    document.getElementById('form-kuis-harian').reset();
    document.getElementById('kuis-harian-id').value = '';
    
    // Reset datepicker instance if needed
    const datepickerInput = document.querySelector('#form-kuis-harian .datepicker');
    if (datepickerInput && datepickerInput._flatpickr) {
        datepickerInput._flatpickr.clear();
    }
    
    // Clear dynamic form container
    document.getElementById('dynamic-form-container').innerHTML = '';
    
    navigateToPage('kuis-harian', 'Kuis Matematika Harian');
}

function openAddKuis() {
    resetKuisForm();
    navigateToPage('kuis-tambah', 'Buat Kuis Baru');
}

function editKuis(id) {
    const kuis = kuisData.find(q => q.id === id);
    if (!kuis) return;
    
    resetKuisForm();
    
    // Set ID
    document.getElementById('kuis-id').value = kuis.id;
    
    // Set Kategori & trigger subtopik populate
    const katSelect = document.getElementById('kuis-kategori');
    katSelect.value = kuis.kategori;
    updateSubtopikKuis();
    
    // Set Subtopik
    document.getElementById('kuis-subtopik').value = kuis.subtopik;
    
    // Set Pertanyaan
    document.getElementById('kuis-pertanyaan').value = kuis.pertanyaan;
    
    // Tampilkan gambar khusus untuk "Mengenal Tata Surya" (id QZ001)
    if (id === 'QZ001') {
        document.getElementById('preview-img-a').src = 'assets/planet_mars.jpg';
        document.getElementById('preview-img-b').src = 'assets/planet_earth.jpg';
        document.getElementById('preview-img-c').src = 'assets/planet_jupiter.jpg';
        document.getElementById('preview-img-d').src = 'assets/planet_saturn.jpg';
    }
    
    // Navigate to form page
    navigateToPage('kuis-tambah', 'Edit Kuis');
}

function saveKuis() {
    const idInput = document.getElementById('kuis-id').value;
    const katSelect = document.getElementById('kuis-kategori').value;
    const subSelect = document.getElementById('kuis-subtopik').value;
    const pertanyaan = document.getElementById('kuis-pertanyaan').value;
    
    if (!katSelect || !subSelect || !pertanyaan.trim()) {
        alert('Mohon lengkapi semua isian wajib!');
        return;
    }
    
    if (idInput) {
        // Edit Mode
        const index = kuisData.findIndex(q => q.id === idInput);
        if (index !== -1) {
            kuisData[index].kategori = katSelect;
            kuisData[index].subtopik = subSelect;
            kuisData[index].pertanyaan = pertanyaan;
            alert('Sukses! Perubahan Soal Kuis Berhasil Disimpan.');
        }
    } else {
        // Create Mode
        const newId = 'QZ' + String(kuisData.length + 1).padStart(3, '0');
        kuisData.push({
            id: newId,
            kategori: katSelect,
            subtopik: subSelect,
            pertanyaan: pertanyaan
        });
        alert('Sukses! Soal Kuis Baru Berhasil Ditambahkan.');
    }
    
    resetKuisForm();
    renderKuis();
    navigateToPage('kuis', 'Manajemen Kuis');
}

function deleteKuis(id) {
    if (confirm('Apakah Anda yakin ingin menghapus soal kuis ini?')) {
        kuisData = kuisData.filter(q => q.id !== id);
        renderKuis();
    }
}
