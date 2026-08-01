document.addEventListener('DOMContentLoaded', function () {
    let books = [];
    let borrows = [];
    const addForm    = document.getElementById('addForm');
    const borrowForm = document.getElementById('borrowForm');
    const returnForm = document.getElementById('returnForm');
    const bookList   = document.getElementById('bookList');
    const searchInput = document.getElementById('searchInput');

    const needsData = Boolean(
        bookList ||
        addForm ||
        borrowForm ||
        returnForm ||
        document.getElementById('bookIds') ||
        document.getElementById('borrowedBookIds') ||
        document.getElementById('statTotal') ||
        document.getElementById('statAvailable') ||
        document.getElementById('statBorrowed')
    );

    if (needsData) {
        loadData();
    }

    // Role-based UI constraints
    if (localStorage.getItem('userRole') === 'Student') {
        document.querySelectorAll('a[href="add.html"], a[href="return.html"], a[href="library.html"]').forEach(el => el.style.display = 'none');
        // Hide Admin username/avatar info in the sidebar and replace with Student info
        const userSpan = document.querySelector('.mt-auto .flex.items-center.gap-2.text-sm');
        if (userSpan) {
            userSpan.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> ${localStorage.getItem('studentName') || 'Student'}`;
        }
    }

    function getISODate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function calculateLateDays(dueDateStr) {
        const due = new Date(dueDateStr);
        const now = new Date();
        now.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        const diff = now.getTime() - due.getTime();
        const days = Math.floor(diff / (1000 * 3600 * 24));
        return days > 0 ? days : 0;
    }
    
    function getDaysRemaining(dueDateStr) {
        const due = new Date(dueDateStr);
        const now = new Date();
        now.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        const diff = due.getTime() - now.getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    }

    // ─── FETCH FROM CGI ────────────────────────────────────────────────────
    function loadData() {
        window.showLoading();
        Promise.all([
            fetch('/cgi-bin/c_program.cgi').then(r => r.json()).catch(() => fetch('books.json').then(r => r.json())),
            fetch('/cgi-bin/c_program.cgi?type=borrows').then(r => r.json()).catch(() => fetch('borrows.json').then(r => r.json())),
            fetch('students.json').then(r => r.json()).catch(() => [])
        ]).then(([booksData, borrowsData, studentsData]) => {
            books = booksData || [];
            borrows = borrowsData || [];
            let students = studentsData || [];
            
            // Dynamically check overdues
            const now = new Date();
            now.setHours(0,0,0,0);
            borrows.forEach(b => {
                if (b.status === 'Borrowed' && b.due_date) {
                    const due = new Date(b.due_date);
                    due.setHours(0,0,0,0);
                    if (now > due) {
                        b.status = 'Overdue';
                    }
                }
            });

            populateFilters();
            applyFilters();
            updateDataLists();
            updateStats();
            
            if (document.body.dataset.page === 'borrow') {
                renderActiveBorrows();
                if (students.length === 0) {
                    const btn = document.querySelector('#borrowForm button[type="submit"]');
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                        btn.innerHTML = 'No Students Available';
                    }
                    const form = document.getElementById('borrowForm');
                    if (form) {
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'text-red-400 text-sm mt-2 text-center bg-red-500/10 py-2 rounded';
                        alertDiv.innerText = 'No students found. Students must register before borrowing books.';
                        form.appendChild(alertDiv);
                    }
                }
            }
            if (document.body.dataset.page === 'return') renderReturnHistory();
            if (document.body.dataset.page === 'library') renderOverdueSection();
            
            window.hideLoading();
        }).catch(err => {
            console.error('Data load error:', err);
            window.hideLoading();
            showError('Load Error', 'Failed to load library data.');
        });
    }

    // ─── STATS ─────────────────────────────────────────────────────────────
    function updateStats() {
        const total     = books.length;
        const activeBorrowedIds = new Set(
            borrows.filter(b => b.status === 'Borrowed' || b.status === 'Overdue').map(b => b.book_id)
        );
        const borrowed  = activeBorrowedIds.size;
        const available = total - borrowed;
        
        let dueToday = 0;
        let overdueCount = 0;
        let totalFines = 0;
        
        const nowIso = getISODate(new Date());
        
        borrows.forEach(b => {
            if ((b.status === 'Borrowed' || b.status === 'Overdue') && b.due_date === nowIso) {
                dueToday++;
            }
            if (b.status === 'Overdue') {
                overdueCount++;
                const lateDays = calculateLateDays(b.due_date);
                totalFines += lateDays * 10;
            } else if (b.status === 'Returned' || b.status === 'Returned Late') {
                if (b.fine) {
                    totalFines += parseInt(b.fine);
                }
            }
        });
        
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('statTotal',     total);
        set('statAvailable', available);
        set('statBorrowed',  borrowed);
        set('statDueToday',  dueToday);
        set('statOverdue',   overdueCount);
        set('statFines',     '₹' + totalFines);
    }

    // ─── BOOK CARDS ────────────────────────────────────────────────────────
    function render(list) {
        if (!bookList) return;
        bookList.innerHTML = '';

        if (list.length === 0) {
            bookList.innerHTML = `
              <div class="col-span-full flex flex-col items-center justify-center py-20 text-center text-secondary">
                <div class="text-5xl mb-4">📭</div>
                <h3 class="text-lg font-semibold text-primary mb-1">No books found</h3>
                <p class="text-sm">Try adjusting your search or add a new book.</p>
              </div>`;
            return;
        }

        const activeBorrowedBookIds = new Set(
            borrows.filter(b => b.status === 'Borrowed' || b.status === 'Overdue').map(b => b.book_id)
        );

        list.forEach((book, i) => {
            const isAvailable = !activeBorrowedBookIds.has(book.id);
            let borrowInfoHtml = `<div class="mt-2 text-xs opacity-0">.</div>`;
            
            const card = document.createElement('div');
            card.className = 'product-card fade-up';
            card.style.animationDelay = `${i * 40}ms`;

            let actionHtml = '';
            if (document.body.dataset.page === 'available') {
                // Read-only catalog: no action buttons for students to borrow here.
            } else {
                if (localStorage.getItem('userRole') === 'Admin') {
                    actionHtml = `
                        <button onclick="deleteBook('${book.id}')"
                                class="btn-outline flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 flex items-center justify-center gap-2 text-xs py-1.5 transition-colors w-full">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          Delete
                        </button>
                    `;
                }
            }
            
            card.innerHTML = `
              <div class="product-info flex flex-col h-full relative gap-1">
                <div class="flex items-start justify-between gap-3 mb-1">
                  <h3 class="card-title font-bold text-lg leading-tight" title="${book.name}">${book.name}</h3>
                  <span class="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${!isAvailable ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'} whitespace-nowrap">
                    ${!isAvailable ? '● Borrowed' : '● Available'}
                  </span>
                </div>
                
                <div class="card-book-id text-xs text-primary font-bold">${book.genre}</div>
                <div class="card-author text-sm font-normal text-secondary mt-0.5" title="${book.author}">
                  Author: ${book.author}
                </div>
                <div class="text-xs text-muted mt-0.5">ID: ${book.id}</div>
                
                ${borrowInfoHtml}
                
                ${actionHtml ? `
                <div class="product-actions mt-auto pt-3 flex gap-2 w-full border-t border-subtle mt-3">
                  ${actionHtml}
                </div>` : ''}
              </div>`;

            bookList.appendChild(card);
        });
    }

    // ─── DATALISTS ─────────────────────────────────────────────────────────
    function updateDataLists() {
        const avail    = document.getElementById('bookIds');
        const borrowed = document.getElementById('borrowedBookIds');

        // Available books for borrowing: books NOT currently in an active borrow
        const activeBorrowedBookIds = new Set(
            borrows.filter(b => b.status === 'Borrowed' || b.status === 'Overdue').map(b => b.book_id)
        );
        if (avail) {
            avail.innerHTML = books
                .filter(b => !activeBorrowedBookIds.has(b.id))
                .map(b => `<option value="${b.id}">${b.name} (${b.author})</option>`)
                .join('');
        }

        // Borrowed books for returning: sourced from active borrows records
        if (borrowed) {
            borrowed.innerHTML = borrows
                .filter(b => b.status === 'Borrowed' || b.status === 'Overdue')
                .map(b => `<option value="${b.book_id}">${b.book_title} — ${b.student_name} (${b.student_id})</option>`)
                .join('');
        }
    }

    // ─── DELETE ────────────────────────────────────────────────────────────
    window.deleteBook = function (id) {
        showConfirmation('Delete Book?', 'Are you sure you want to permanently delete this book?', 'Delete', 'Cancel')
        .then((result) => {
            if (result.isConfirmed) {
                window.showLoading();
                fetch('/cgi-bin/c_program.cgi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id })
                })
                .then(r => r.json())
                .then(res => { 
                    window.hideLoading();
                    if (res.status === 'Deleted') {
                        showToast('Book deleted', 'success');
                        loadData();
                    } else {
                        showError('Error', res.status);
                    }
                })
                .catch(() => {
                    window.hideLoading();
                    showError('Error', 'Cannot delete — ensure CGI server is running.');
                });
            }
        });
    };

    // ─── ADD ───────────────────────────────────────────────────────────────
    if (addForm) {
        addForm.addEventListener('submit', e => {
            e.preventDefault();
            const id = String(Math.floor(Math.random() * 9000000000) + 1000000000);
            window.showLoading();
            fetch('/cgi-bin/c_program.cgi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', id, name: document.getElementById('newTitle').value, author: document.getElementById('newAuthor').value })
            })
            .then(r => r.json())
            .then(res => { 
                window.hideLoading();
                if (res.status === 'Added') { 
                    showSuccess('Book Added!', 'The book has been successfully added to the catalog.'); 
                    addForm.reset(); 
                    loadData(); 
                } else {
                    showError('Add Failed', res.status);
                } 
            })
            .catch(() => {
                window.hideLoading();
                showError('Network Error', 'Operation failed. Ensure CGI server is running.');
            });
        });
    }

    // ─── BORROW ────────────────────────────────────────────────────────────
    if (borrowForm) {

        borrowForm.addEventListener('submit', e => {
            e.preventDefault();
            
            const borrow_id = 'BRW-' + Math.floor(Math.random() * 1000000);
            const borrow_date = getISODate(new Date());
            const due = new Date();
            due.setDate(due.getDate() + 14);
            const due_date = getISODate(due);
            const student_idElement = document.getElementById('studentId');
            const student_id = student_idElement ? student_idElement.value : 'N/A';
            
            showConfirmation('Borrow this book?', `Are you sure you want to borrow this book? It will be due on ${due_date}.`, 'Borrow', 'Cancel')
            .then((result) => {
                if (result.isConfirmed) {
                    window.showLoading();
                    fetch('/cgi-bin/c_program.cgi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'borrow', 
                            id: document.getElementById('borrowTitle').value, 
                            student: document.getElementById('borrower').value,
                            borrow_id: borrow_id,
                            student_id: student_id,
                            borrow_date: borrow_date,
                            due_date: due_date
                        })
                    })
                    .then(r => r.json())
                    .then(res => { 
                        window.hideLoading();
                        if (res.status === 'Borrowed') { 
                            showSuccess('Book Borrowed!', 'The book has been successfully borrowed.');
                            borrowForm.reset(); 
                            loadData(); 
                        } else {
                            showError('Borrow Failed', res.status);
                        }
                    })
                    .catch(() => {
                        window.hideLoading();
                        showError('Network Error', 'Operation failed. Ensure CGI server is running.');
                    });
                }
            });
        });
    }

    // ─── RETURN ────────────────────────────────────────────────────────────
    if (returnForm) {
        returnForm.addEventListener('submit', e => {
            e.preventDefault();
            const bookId = document.getElementById('returnTitle').value;
            const activeBorrow = borrows.find(b => b.book_id === bookId && (b.status === 'Borrowed' || b.status === 'Overdue'));

            if (!activeBorrow) {
                showError('Error', 'No active borrow found for this book.');
                return;
            }

            const late_days = calculateLateDays(activeBorrow.due_date);
            const fine = late_days * 10;
            
            const confirmText = fine > 0 
                ? `This book is ${late_days} days late. A fine of ₹${fine} is due.`
                : 'Are you sure you want to return this book?';

            showConfirmation('Return this book?', confirmText, 'Return', 'Cancel')
            .then((result) => {
                if (result.isConfirmed) {
                    window.showLoading();
                    fetch('/cgi-bin/c_program.cgi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'return', 
                            id: bookId,
                            return_date: getISODate(new Date()),
                            days_late: late_days.toString(),
                            fine: fine.toString(),
                            status: late_days > 0 ? 'Returned Late' : 'Returned'
                        })
                    })
                    .then(r => r.json())
                    .then(res => { 
                        window.hideLoading();
                        if (res.status === 'Returned') { 
                            showSuccess('Book Returned!', 'The book has been successfully returned.');
                            returnForm.reset(); 
                            loadData(); 
                        } else {
                            showError('Return Failed', res.status);
                        }
                    })
                    .catch(() => {
                        window.hideLoading();
                        showError('Network Error', 'Operation failed. Ensure CGI server is running.');
                    });
                }
            });
        });
    }

    // ─── RENDERING MODULES ─────────────────────────────────────────────────
    
    function getStatusBadge(status, remDays) {
        if (status === 'Overdue') return `<span class="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold uppercase border border-red-500/30">Overdue</span>`;
        if (status === 'Returned' || status === 'Returned Late') return `<span class="bg-slate-500/20 text-slate-400 px-2 py-1 rounded text-xs font-bold uppercase border border-slate-500/30">${status}</span>`;
        if (status === 'Borrowed' && remDays <= 3 && remDays >= 0) return `<span class="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-bold uppercase border border-orange-500/30">Due Soon</span>`;
        if (status === 'Borrowed') return `<span class="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold uppercase border border-blue-500/30">Borrowed</span>`;
        return `<span class="bg-slate-500/20 text-slate-400 px-2 py-1 rounded text-xs font-bold uppercase border border-slate-500/30">${status}</span>`;
    }

    function renderActiveBorrows() {
        const container = document.getElementById('activeBorrowsList');
        if (!container) return;
        
        const active = borrows.filter(b => b.status === 'Borrowed' || b.status === 'Overdue');
        if (active.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4">There are no active borrow records.</div>';
            return;
        }
        
        container.innerHTML = `
        <table class="w-full text-left text-sm text-secondary">
            <thead class="text-xs uppercase bg-card border-b border-subtle">
                <tr>
                    <th class="px-4 py-3">Book Title</th>
                    <th class="px-4 py-3">Student Name</th>
                    <th class="px-4 py-3">Borrow Date</th>
                    <th class="px-4 py-3">Due Date</th>
                    <th class="px-4 py-3 text-center">Remaining</th>
                    <th class="px-4 py-3 text-right">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                ${active.map(b => {
                    const remDays = getDaysRemaining(b.due_date);
                    const rowClass = b.status === 'Overdue' ? 'bg-red-500/5' : (remDays <= 3 && remDays >= 0 ? 'bg-orange-500/5' : '');
                    return `
                    <tr class="${rowClass} hover:bg-card transition-colors">
                        <td class="px-4 py-3 font-medium text-primary">${b.book_title || '-'}</td>
                        <td class="px-4 py-3">${b.student_name} (${b.student_id})</td>
                        <td class="px-4 py-3 font-mono text-xs">${b.borrow_date}</td>
                        <td class="px-4 py-3 font-mono text-xs">${b.due_date}</td>
                        <td class="px-4 py-3 text-center font-mono ${remDays < 0 ? 'text-red-400' : 'text-blue-300'}">${remDays < 0 ? 'Late' : remDays + 'd'}</td>
                        <td class="px-4 py-3 text-right">${getStatusBadge(b.status, remDays)}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    }

    function renderReturnHistory() {
        const container = document.getElementById('returnHistoryList');
        if (!container) return;
        
        const history = borrows.filter(b => b.status === 'Returned' || b.status === 'Returned Late');
        if (history.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4">No returned books yet.</div>';
            return;
        }
        
        container.innerHTML = `
        <table class="w-full text-left text-sm text-secondary">
            <thead class="text-xs uppercase bg-card border-b border-subtle">
                <tr>
                    <th class="px-4 py-3">Book Title</th>
                    <th class="px-4 py-3">Student</th>
                    <th class="px-4 py-3">Borrow Date</th>
                    <th class="px-4 py-3">Return Date</th>
                    <th class="px-4 py-3 text-center">Fine</th>
                    <th class="px-4 py-3 text-right">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                ${history.map(b => `
                    <tr class="hover:bg-card transition-colors">
                        <td class="px-4 py-3 font-medium text-primary">${b.book_title || '-'}</td>
                        <td class="px-4 py-3">${b.student_name}</td>
                        <td class="px-4 py-3 font-mono text-xs">${b.borrow_date}</td>
                        <td class="px-4 py-3 font-mono text-xs">${b.return_date}</td>
                        <td class="px-4 py-3 text-center font-mono ${b.fine > 0 ? 'text-amber-400' : 'text-emerald-400'}">₹${b.fine}</td>
                        <td class="px-4 py-3 text-right">${getStatusBadge(b.status, 0)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    function renderOverdueSection() {
        const container = document.getElementById('overdueBooksList');
        if (!container) return;
        
        const overdue = borrows.filter(b => b.status === 'Overdue');
        if (overdue.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl overflow-hidden">
            <div class="p-4 bg-red-500/20 border-b border-red-500/30">
                <h3 class="text-red-400 font-bold flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Overdue Books</h3>
            </div>
            <table class="w-full text-left text-sm text-red-100/70">
                <thead class="text-xs uppercase bg-card border-b border-red-500/30">
                    <tr>
                        <th class="px-4 py-3 text-red-300">Student Name</th>
                        <th class="px-4 py-3 text-red-300">Book Title</th>
                        <th class="px-4 py-3 text-red-300">Due Date</th>
                        <th class="px-4 py-3 text-center text-red-300">Days Overdue</th>
                        <th class="px-4 py-3 text-right text-red-300">Current Fine</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-red-500/20">
                    ${overdue.map(b => {
                        const lateDays = calculateLateDays(b.due_date);
                        const fine = lateDays * 10;
                        
                        return `
                        <tr class="border-b border-white/5 hover:bg-red-500/10 transition-colors">
                            <td class="px-4 py-3 font-medium text-red-100">${b.student_name}</td>
                            <td class="px-4 py-3 text-red-200">${b.book_title || '-'}</td>
                            <td class="px-4 py-3 font-mono text-xs">${b.due_date}</td>
                            <td class="px-4 py-3 text-center font-bold text-red-400">${lateDays}</td>
                            <td class="px-4 py-3 text-right font-mono text-red-300">₹${fine}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    // ─── SEARCH & FILTER ───────────────────────────────────────────────────
    function populateFilters() {
        const catFilter = document.getElementById('filterCategory');
        if (catFilter) {
            const genres = [...new Set(books.map(b => b.genre).filter(g => g))].sort();
            catFilter.innerHTML = '<option value="">All Categories</option>' + 
                genres.map(g => `<option value="${g}">${g}</option>`).join('');
        }
    }

    function applyFilters() {
        let filtered = [...books];
        
        const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
        if (q) {
            filtered = filtered.filter(b => 
                b.name.toLowerCase().includes(q) || 
                b.author.toLowerCase().includes(q) || 
                (document.body.dataset.page !== 'available' && b.id.toLowerCase().includes(q))
            );
        }
        
        if (document.body.dataset.page === 'available') {
            const cat = document.getElementById('filterCategory')?.value;
            if (cat) {
                filtered = filtered.filter(b => b.genre === cat);
            }
            const avail = document.getElementById('filterAvailability')?.value;
            if (avail === 'available' || avail === 'borrowed') {
                const activeBorrowedIds = new Set(
                    borrows.filter(b => b.status === 'Borrowed' || b.status === 'Overdue').map(b => b.book_id)
                );
                if (avail === 'available') {
                    filtered = filtered.filter(b => !activeBorrowedIds.has(b.id));
                } else {
                    filtered = filtered.filter(b => activeBorrowedIds.has(b.id));
                }
            }
        }
        
        render(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    const catFilter = document.getElementById('filterCategory');
    if (catFilter) catFilter.addEventListener('change', applyFilters);
    const availFilter = document.getElementById('filterAvailability');
    if (availFilter) availFilter.addEventListener('change', applyFilters);
});