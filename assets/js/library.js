document.addEventListener('DOMContentLoaded', function () {
    let books = [];
    const addForm    = document.getElementById('addForm');
    const borrowForm = document.getElementById('borrowForm');
    const returnForm = document.getElementById('returnForm');
    const bookList   = document.getElementById('bookList');
    const searchInput = document.getElementById('searchInput');

    loadBooks();

    // ─── FETCH FROM CGI ────────────────────────────────────────────────────
    function loadBooks() {
        showLoading(true);
        fetch('/cgi-bin/c_program.exe')
            .then(res => {
                if (!res.ok) throw new Error('CGI fetch failed');
                return res.json();
            })
            .then(data => {
                books = data || [];
                render(books);
                updateDataLists();
                updateStats();
                showLoading(false);
            })
            .catch(err => {
                console.warn('CGI unavailable, falling back to books.json:', err);
                fetch('books.json')
                    .then(r => r.json())
                    .then(data => {
                        books = data || [];
                        render(books);
                        updateDataLists();
                        updateStats();
                        showLoading(false);
                    })
                    .catch(e => { console.error('Error loading books:', e); showLoading(false); });
            });
    }

    // ─── LOADING SPINNER ───────────────────────────────────────────────────
    function showLoading(show) {
        const el = document.getElementById('loadingSpinner');
        if (el) el.style.display = show ? 'flex' : 'none';
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
              <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-3xl">📭</div>
                <h3 class="text-base font-semibold text-gray-700 mb-1">No books found</h3>
                <p class="text-sm text-gray-400">Try adjusting your search or add a new book.</p>
              </div>`;
            return;
        }

        list.forEach((book, i) => {
            const borrowed = book.student && book.student.trim().length > 0;
            const card = document.createElement('div');
            card.className = 'book-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ' +
                             'border-l-4 ' + (borrowed ? 'border-l-amber-400' : 'border-l-indigo-500') +
                             ' hover:-translate-y-1 hover:shadow-md transition-all duration-200';
            card.style.animationDelay = `${i * 40}ms`;
            card.innerHTML = `
              <div class="flex items-start justify-between gap-2 mb-3">
                <h3 class="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">${book.name}</h3>
                <span class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                             ${borrowed
                               ? 'bg-amber-100 text-amber-700'
                               : 'bg-emerald-100 text-emerald-700'}">
                  ${borrowed ? '● Borrowed' : '● Available'}
                </span>
              </div>
              <div class="space-y-1.5 text-xs text-gray-500 mb-4">
                <p><span class="font-medium text-gray-700">ID:</span> ${book.id}</p>
                <p><span class="font-medium text-gray-700">Author:</span> ${book.author}</p>
                ${borrowed ? `<p><span class="font-medium text-gray-700">Borrowed by:</span> <span class="text-amber-600 font-medium">${book.student}</span></p>` : ''}
              </div>
              <button onclick="deleteBook('${book.id}')"
                      class="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-white
                             bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500
                             px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>`;
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
        if (!confirm('Delete this book permanently?')) return;
        fetch('/cgi-bin/c_program.exe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        })
        .then(r => r.json())
        .then(res => { if (res.status === 'Deleted') loadBooks(); else alert('Error: ' + res.status); })
        .catch(() => alert('Cannot delete — ensure CGI server is running.'));
    };

    // ─── ADD ───────────────────────────────────────────────────────────────
    if (addForm) {
        addForm.addEventListener('submit', e => {
            e.preventDefault();
            const id = String(Math.floor(Math.random() * 9000000000) + 1000000000);
            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', id, name: document.getElementById('newTitle').value, author: document.getElementById('newAuthor').value })
            })
            .then(r => r.json())
            .then(res => { if (res.status === 'Added') { alert('Book added!'); addForm.reset(); loadBooks(); } else alert('Error: ' + res.status); })
            .catch(() => alert('Operation failed. Ensure CGI server is running.'));
        });
    }

    // ─── BORROW ────────────────────────────────────────────────────────────
    if (borrowForm) {
        borrowForm.addEventListener('submit', e => {
            e.preventDefault();
            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'borrow', id: document.getElementById('borrowTitle').value, student: document.getElementById('borrower').value })
            })
            .then(r => r.json())
            .then(res => { alert(res.status); if (res.status === 'Borrowed') { borrowForm.reset(); loadBooks(); } })
            .catch(() => alert('Operation failed. Ensure CGI server is running.'));
        });
    }

    // ─── RETURN ────────────────────────────────────────────────────────────
    if (returnForm) {
        returnForm.addEventListener('submit', e => {
            e.preventDefault();
            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'return', id: document.getElementById('returnTitle').value })
            })
            .then(r => r.json())
            .then(res => { alert(res.status); if (res.status === 'Returned') { returnForm.reset(); loadBooks(); } })
            .catch(() => alert('Operation failed. Ensure CGI server is running.'));
        });
    }

    // ─── SEARCH ────────────────────────────────────────────────────────────
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const q = e.target.value.toLowerCase().trim();
            render(books.filter(b =>
                b.name.toLowerCase().includes(q) ||
                b.author.toLowerCase().includes(q) ||
                b.id.toLowerCase().includes(q)
            ));
        });
    }
});