/**
 * my-books.js — Student "My Borrowed Books" page logic
 * Reads studentId + studentName from localStorage (set by login.js on sign-in).
 * Fetches borrows from CGI (falls back to borrows.json) and books for cover images.
 * All fine calculations are done client-side.
 */

const FINE_RATE_PER_DAY = 10;   // ₹ per day overdue
const DUE_SOON_DAYS = 3;   // days threshold for "Due Soon"

// ── Auth guard ─────────────────────────────────────────────────────────────
const studentId = localStorage.getItem('studentId');
const studentName = localStorage.getItem('studentName') || 'Student';
if (!studentId || localStorage.getItem('userRole') !== 'Student') {
    window.location.href = 'login.html';
}

// ── State ──────────────────────────────────────────────────────────────────
let allBorrows = [];   // all borrows for this student
let booksMap = {};   // bookId → book object (for cover)
let activeTab = 'active'; // 'active' | 'history'
let searchQuery = '';
let filterStatus = '';
let sortField = 'due_date';
let sortDir = 'asc';
let modalRecord = null;

// ── Utility helpers ────────────────────────────────────────────────────────
function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function parseDate(str) {
    if (!str) return null;
    const d = new Date(str);
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysDiff(from, to) {
    return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

/**
 * Compute real-time status and fine for a borrow record.
 * Returns enriched record — does NOT mutate the original.
 */
function enrich(borrow) {
    const b = { ...borrow };
    const now = today();

    if (b.status === 'Returned') {
        b.computedStatus = 'Returned';
        b.daysRemaining = null;
        b.computedFine = parseFloat(b.fine) || 0;
        return b;
    }

    const due = parseDate(b.due_date);
    if (!due) { b.computedStatus = 'Borrowed'; b.daysRemaining = null; b.computedFine = 0; return b; }

    const diff = daysDiff(now, due); // positive = days left, negative = days overdue

    if (diff < 0) {
        b.computedStatus = 'Overdue';
        b.daysRemaining = diff;                        // e.g. -3
        b.computedFine = Math.abs(diff) * FINE_RATE_PER_DAY;
    } else if (diff <= DUE_SOON_DAYS) {
        b.computedStatus = 'Due Soon';
        b.daysRemaining = diff;
        b.computedFine = 0;
    } else {
        b.computedStatus = 'Borrowed';
        b.daysRemaining = diff;
        b.computedFine = 0;
    }
    return b;
}

function badgeClass(status) {
    switch (status) {
        case 'Borrowed': return 'badge-borrowed';
        case 'Due Soon': return 'badge-due-soon';
        case 'Overdue': return 'badge-overdue';
        case 'Returned': return 'badge-returned';
        default: return 'badge-returned';
    }
}

function fmtDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function coverFor(bookId) {
    const book = booksMap[bookId];
    if (book && book.cover) return `<img src="${book.cover}" alt="" style="width:36px;height:50px;object-fit:cover;border-radius:6px;">`;
    return `<span style="font-size:1.6rem;">📖</span>`;
}

// ── Data loading ───────────────────────────────────────────────────────────
async function loadData() {
    window.showLoading && window.showLoading();
    try {
        const [borrowsRaw, booksRaw] = await Promise.all([
            fetch('/cgi-bin/c_program.cgi?type=borrows')
                .then(r => r.json())
                .catch(() => fetch('borrows.json').then(r => r.json())),
            fetch('/cgi-bin/c_program.cgi')
                .then(r => r.json())
                .catch(() => fetch('books.json').then(r => r.json()))
        ]);

        // Build books lookup map
        (booksRaw || []).forEach(b => { booksMap[b.id] = b; });

        // Filter to this student only, then enrich
        allBorrows = (borrowsRaw || [])
            .filter(b => b.student_id === studentId)
            .map(enrich);

        renderAll();
    } catch (e) {
        console.error('Load error:', e);
        window.showError && window.showError('Load Error', 'Could not load borrowing data.');
    } finally {
        window.hideLoading && window.hideLoading();
    }
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderAll() {
    renderStudentChip();
    renderSummaryCards();
    renderTable();
}

function renderStudentChip() {
    const el = document.getElementById('studentChip');
    if (el) el.textContent = studentName;
}

function renderSummaryCards() {
    const active = allBorrows.filter(b => b.status !== 'Returned');
    const borrowed = active.filter(b => b.computedStatus === 'Borrowed');
    const dueSoon = active.filter(b => b.computedStatus === 'Due Soon');
    const overdue = active.filter(b => b.computedStatus === 'Overdue');
    const fine = active.reduce((s, b) => s + (b.computedFine || 0), 0);

    setText('cardBorrowed', borrowed.length);
    setText('cardDueSoon', dueSoon.length);
    setText('cardOverdue', overdue.length);
    setText('cardFine', fine > 0 ? `₹${fine}` : '₹0');

    // Colour the fine card red when there's outstanding fine
    const fineCard = document.getElementById('cardFineWrap');
    if (fineCard) {
        fineCard.style.borderColor = fine > 0 ? 'rgba(239,68,68,0.4)' : '';
        const val = document.getElementById('cardFine');
        if (val) val.style.color = fine > 0 ? '#f87171' : '';
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function filteredRecords() {
    const isActive = activeTab === 'active';
    let records = allBorrows.filter(b => isActive ? b.status !== 'Returned' : b.status === 'Returned');

    // Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        records = records.filter(b =>
            b.book_title.toLowerCase().includes(q) ||
            b.book_id.toLowerCase().includes(q) ||
            (booksMap[b.book_id]?.author || '').toLowerCase().includes(q)
        );
    }

    // Status filter (active tab only)
    if (filterStatus && isActive) {
        records = records.filter(b => b.computedStatus === filterStatus);
    }

    // Sort
    records.sort((a, b) => {
        let va, vb;
        switch (sortField) {
            case 'title': va = a.book_title; vb = b.book_title; break;
            case 'borrow_date': va = a.borrow_date; vb = b.borrow_date; break;
            case 'due_date': va = a.due_date; vb = b.due_date; break;
            case 'status': va = a.computedStatus; vb = b.computedStatus; break;
            case 'fine': va = a.computedFine; vb = b.computedFine; break;
            default: va = a.due_date; vb = b.due_date;
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    return records;
}

function renderTable() {
    const isActive = activeTab === 'active';
    const records = filteredRecords();
    const tbody = document.getElementById('tableBody');
    const emptyEl = document.getElementById('tableEmpty');
    if (!tbody) return;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });

    // Show/hide history-only header columns
    document.querySelectorAll('.col-return').forEach(el => {
        el.style.display = isActive ? 'none' : '';
    });
    document.querySelectorAll('.col-fine').forEach(el => {
        el.style.display = isActive ? '' : 'none';
    });

    if (records.length === 0) {
        tbody.innerHTML = '';
        emptyEl.classList.remove('hidden');
        emptyEl.textContent = searchQuery || filterStatus
            ? 'No records match your search or filter.'
            : isActive ? 'You have no active borrowed books.' : 'No borrowing history yet.';
        return;
    }
    emptyEl.classList.add('hidden');

    tbody.innerHTML = records.map(b => {
        const author = booksMap[b.book_id]?.author || '—';
        const badge = `<span class="badge ${badgeClass(b.computedStatus)}">${b.computedStatus}</span>`;
        const daysCell = daysRemainingCell(b);
        const fineCell = b.computedFine > 0
            ? `<span style="color:#f87171;font-weight:600;">₹${b.computedFine}</span>`
            : `<span style="color:var(--text-muted);">₹0</span>`;
        const returnCell = b.return_date
            ? `<td class="col-return">${fmtDate(b.return_date)}</td>`
            : `<td class="col-return">—</td>`;

        return `<tr>
          <td style="width:52px;">${coverFor(b.book_id)}</td>
          <td>
            <div style="font-weight:600;line-height:1.3;">${b.book_title}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${b.book_id}</div>
          </td>
          <td style="color:var(--text-muted);">${author}</td>
          <td>${fmtDate(b.borrow_date)}</td>
          <td>${fmtDate(b.due_date)}</td>
          <td>${daysCell}</td>
          <td>${badge}</td>
          <td class="col-fine">${fineCell}</td>
          ${returnCell}
          <td>
            <button onclick="openModal('${b.borrow_id}')" class="btn-outline" style="font-size:0.78rem;padding:0.3rem 0.75rem;">Details</button>
          </td>
        </tr>`;
    }).join('');
}

function daysRemainingCell(b) {
    if (b.status === 'Returned') return `<span style="color:var(--text-muted);">—</span>`;
    if (b.daysRemaining === null) return `<span style="color:var(--text-muted);">—</span>`;
    if (b.daysRemaining < 0) {
        return `<span style="color:#f87171;font-weight:600;">${Math.abs(b.daysRemaining)}d late</span>`;
    }
    if (b.daysRemaining === 0) {
        return `<span style="color:#fbbf24;font-weight:600;">Due today</span>`;
    }
    if (b.daysRemaining <= DUE_SOON_DAYS) {
        return `<span style="color:#fbbf24;">${b.daysRemaining}d left</span>`;
    }
    return `<span style="color:var(--text-muted);">${b.daysRemaining}d left</span>`;
}

// ── Modal ─────────────────────────────────────────────────────────────────
window.openModal = function (borrowId) {
    modalRecord = allBorrows.find(b => b.borrow_id === borrowId);
    if (!modalRecord) return;
    const b = modalRecord;
    const author = booksMap[b.book_id]?.author || '—';

    document.getElementById('modalTitle').textContent = b.book_title;
    document.getElementById('modalAuthor').textContent = author;
    document.getElementById('modalBorrowId').textContent = b.borrow_id;
    document.getElementById('modalBookId').textContent = b.book_id;
    document.getElementById('modalBorrowed').textContent = fmtDate(b.borrow_date);
    document.getElementById('modalDue').textContent = fmtDate(b.due_date);
    document.getElementById('modalReturn').textContent = b.return_date ? fmtDate(b.return_date) : '—';
    document.getElementById('modalStatus').innerHTML = `<span class="badge ${badgeClass(b.computedStatus)}">${b.computedStatus}</span>`;
    document.getElementById('modalDaysInfo').textContent = daysRemainingText(b);

    // Fine breakdown
    const fineSection = document.getElementById('modalFineSection');
    if (b.computedFine > 0) {
        const days = Math.abs(b.daysRemaining || parseInt(b.days_late) || 0);
        document.getElementById('modalFineBreakdown').textContent =
            `${days} day${days !== 1 ? 's' : ''} × ₹${FINE_RATE_PER_DAY}/day`;
        document.getElementById('modalFineTotal').textContent = `₹${b.computedFine}`;
        fineSection.classList.remove('hidden');
    } else {
        fineSection.classList.add('hidden');
    }


    document.getElementById('bookModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.closeModal = function () {
    document.getElementById('bookModal').classList.add('hidden');
    document.body.style.overflow = '';
    modalRecord = null;
};

function daysRemainingText(b) {
    if (b.status === 'Returned') return 'Returned';
    if (b.daysRemaining === null) return '—';
    if (b.daysRemaining < 0) return `${Math.abs(b.daysRemaining)} day(s) overdue`;
    if (b.daysRemaining === 0) return 'Due today!';
    return `${b.daysRemaining} day(s) remaining`;
}

// ── Event wiring ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeTab = btn.dataset.tab;
            filterStatus = '';
            document.getElementById('filterStatus').value = '';
            renderTable();
        });
    });

    // Search
    document.getElementById('searchInput')?.addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        renderTable();
    });

    // Status filter
    document.getElementById('filterStatus')?.addEventListener('change', e => {
        filterStatus = e.target.value;
        renderTable();
    });

    // Sort
    document.getElementById('sortField')?.addEventListener('change', e => {
        const [field, dir] = e.target.value.split(':');
        sortField = field;
        sortDir = dir;
        renderTable();
    });

    // Modal backdrop click to close
    document.getElementById('bookModal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('bookModal')) closeModal();
    });


    // Escape key to close modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    loadData();
});
