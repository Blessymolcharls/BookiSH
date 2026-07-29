document.addEventListener('DOMContentLoaded', function () {
    let books = [];
    const addForm    = document.getElementById('addForm');
    const borrowForm = document.getElementById('borrowForm');
    const returnForm = document.getElementById('returnForm');
    const bookList   = document.getElementById('bookList');
    const searchInput = document.getElementById('searchInput');

    const needsBooks = Boolean(
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

    if (needsBooks) {
        loadBooks();
    }

    // ─── FETCH FROM CGI ────────────────────────────────────────────────────
    function loadBooks() {
        window.showLoading();
        fetch('/cgi-bin/c_program.cgi')
            .then(res => {
                if (!res.ok) throw new Error('CGI fetch failed');
                return res.json();
            })
            .then(data => {
                books = data || [];
                populateFilters();
                applyFilters();
                updateDataLists();
                updateStats();
                window.hideLoading();
            })
            .catch(err => {
                console.warn('CGI unavailable, falling back to books.json:', err);
                fetch('books.json')
                    .then(r => r.json())
                    .then(data => {
                        books = data || [];
                        populateFilters();
                        applyFilters();
                        updateDataLists();
                        updateStats();
                        window.hideLoading();
                    })
                    .catch(e => { console.error('Error loading books:', e); window.hideLoading(); });
            });
    }

    // ─── STATS ─────────────────────────────────────────────────────────────
    function updateStats() {
        const total     = books.length;
        const borrowed  = books.filter(b => b.student && b.student.trim()).length;
        const available = total - borrowed;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('statTotal',     total);
        set('statAvailable', available);
        set('statBorrowed',  borrowed);
    }

    // ─── BOOK CARDS ────────────────────────────────────────────────────────
    function render(list) {
        if (!bookList) return;
        bookList.innerHTML = '';

        if (list.length === 0) {
            bookList.innerHTML = `
              <div class="col-span-full flex flex-col items-center justify-center py-20 text-center text-white/50">
                <div class="text-5xl mb-4">📭</div>
                <h3 class="text-lg font-semibold text-white mb-1">No books found</h3>
                <p class="text-sm">Try adjusting your search or add a new book.</p>
              </div>`;
            return;
        }

        list.forEach((book, i) => {
            const borrowed = book.student && book.student.trim().length > 0;
            const card = document.createElement('div');
            card.className = 'product-card fade-up';
            card.style.animationDelay = `${i * 40}ms`;
            
            // Build the card HTML
            if (document.body.dataset.page === 'available') {
                card.innerHTML = `
                  <div class="product-image flex flex-col items-center justify-center bg-black/40 relative overflow-hidden" style="height: 160px;">
                    ${book.cover ? `<img src="${book.cover}" alt="Cover" class="absolute inset-0 w-full h-full object-cover opacity-80" />` : `<div style="font-size: 4rem; z-index: 10;">📖</div>`}
                  </div>
                  <div class="product-info flex flex-col h-full">
                    <div class="product-header">
                      <h3 class="product-title truncate" title="${book.name}">${book.name}</h3>
                    </div>
                    <div class="product-price mt-1 text-sm font-normal text-white/60 truncate" title="${book.author}">
                      By ${book.author}
                    </div>
                    ${book.genre ? `<div class="text-xs text-indigo-400 mt-1">${book.genre}</div>` : ''}
                    
                    <div class="mt-3 flex items-center justify-between">
                      <span class="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${borrowed ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                        ${borrowed ? '● Currently Unavailable' : '● Available'}
                      </span>
                    </div>
                    
                    <div class="product-actions mt-auto pt-4 flex gap-2">
                      <button onclick="Swal.fire({title: \`${book.name.replace(/`/g, '')}\`, text: \`${(book.description || 'No description available.').replace(/`/g, '')}\`, icon: 'info', confirmButtonColor: '#6366f1'})"
                              class="btn-outline flex-1 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/50 flex items-center justify-center gap-2 text-xs py-2">
                        View Details
                      </button>
                    </div>
                  </div>`;
            } else {
                card.innerHTML = `
                  <div class="product-image flex items-center justify-center bg-black/40" style="height: 160px;">
                    <div style="font-size: 4rem;">📖</div>
                  </div>
                  <div class="product-info flex flex-col h-full">
                    <div class="product-header">
                      <h3 class="product-title truncate" title="${book.name}">${book.name}</h3>
                    </div>
                    <div class="product-price mt-1 text-sm font-normal text-white/60 truncate" title="${book.author}">
                      By ${book.author}
                    </div>
                    <div class="text-xs text-white/40 mt-1 font-mono">ID: ${book.id}</div>
                    
                    <div class="mt-3 flex items-center justify-between">
                      <span class="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${borrowed ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                        ${borrowed ? '● Borrowed' : '● Available'}
                      </span>
                    </div>
                    
                    ${borrowed ? `<div class="mt-2 text-xs text-amber-300 truncate">By: ${book.student}</div>` : `<div class="mt-2 text-xs opacity-0">.</div>`}
                    
                    <div class="product-actions mt-auto pt-4 flex gap-2">
                      <button onclick="deleteBook('${book.id}')"
                              class="btn-outline flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 flex items-center justify-center gap-2 text-xs py-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>`;
            }
            bookList.appendChild(card);
        });
    }

    // ─── DATALISTS ─────────────────────────────────────────────────────────
    function updateDataLists() {
        const avail    = document.getElementById('bookIds');
        const borrowed = document.getElementById('borrowedBookIds');
        if (avail)    avail.innerHTML    = books.filter(b => !b.student || !b.student.trim()).map(b => `<option value="${b.id}">${b.name} (${b.author})</option>`).join('');
        if (borrowed) borrowed.innerHTML = books.filter(b => b.student && b.student.trim()).map(b => `<option value="${b.id}">${b.name} (${b.student})</option>`).join('');
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
                        loadBooks();
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
                    loadBooks(); 
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
            showConfirmation('Borrow this book?', 'Are you sure you want to borrow this book?', 'Borrow', 'Cancel')
            .then((result) => {
                if (result.isConfirmed) {
                    window.showLoading();
                    fetch('/cgi-bin/c_program.cgi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'borrow', id: document.getElementById('borrowTitle').value, student: document.getElementById('borrower').value })
                    })
                    .then(r => r.json())
                    .then(res => { 
                        window.hideLoading();
                        if (res.status === 'Borrowed') { 
                            showSuccess('Book Borrowed!', 'The book has been successfully borrowed.');
                            borrowForm.reset(); 
                            loadBooks(); 
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
            showConfirmation('Return this book?', 'Are you sure you want to return this book?', 'Return', 'Cancel')
            .then((result) => {
                if (result.isConfirmed) {
                    window.showLoading();
                    fetch('/cgi-bin/c_program.cgi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'return', id: document.getElementById('returnTitle').value })
                    })
                    .then(r => r.json())
                    .then(res => { 
                        window.hideLoading();
                        if (res.status === 'Returned') { 
                            showSuccess('Book Returned!', 'The book has been successfully returned.');
                            returnForm.reset(); 
                            loadBooks(); 
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
            if (avail === 'available') {
                filtered = filtered.filter(b => !b.student || !b.student.trim());
            } else if (avail === 'borrowed') {
                filtered = filtered.filter(b => b.student && b.student.trim());
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