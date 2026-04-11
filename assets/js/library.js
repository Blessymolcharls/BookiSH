document.addEventListener('DOMContentLoaded', function() {
    let books = [];
    const addForm = document.getElementById('addForm');
    const borrowForm = document.getElementById('borrowForm');
    const returnForm = document.getElementById('returnForm');
    const bookList = document.getElementById('bookList');
    const searchInput = document.getElementById('searchInput');

    // Load books on page load
    loadBooks();

    // Fetch from backend
    function loadBooks() {
        // Try to fetch from backend CGI first
        fetch('/cgi-bin/c_program.exe')
            .then(response => {
                if (!response.ok) throw new Error("CGI fetch failed");
                return response.json();
            })
            .then(data => {
                books = data || [];
                displayBooks(books);
                updateDataLists();
            })
            .catch(error => {
                console.warn('CGI not available, loading from local JSON as fallback:', error);
                // Fallback used during pure static frontend testing without CGI
                fetch('books.json')
                    .then(res => res.json())
                    .then(data => {
                        books = data || [];
                        displayBooks(books);
                        updateDataLists();
                    })
                    .catch(e => console.error("Error loading books:", e));
            });
    }

    // Display books on screen
    function displayBooks(booksToDisplay) {
        if (!bookList) return;
        bookList.innerHTML = '';

        if (booksToDisplay.length === 0) {
             bookList.innerHTML = '<p style="text-align:center; padding:2rem; width:100%;">No books found.</p>';
             return;
        }

        booksToDisplay.forEach(book => {
            const isBorrowed = book.student && book.student.trim().length > 0;
            const div = document.createElement('div');
            div.className = 'book-item';
            div.innerHTML = `
                <h3 style="margin-top:0;">${book.name}</h3>
                <p><strong>Id:</strong> ${book.id}</p>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Status:</strong> ${isBorrowed ? 
                    '<span style="color:#C0392B;">Borrowed by ' + book.student + '</span>' : 
                    '<span style="color:#27AE60;">Available</span>'}</p>
                <button onclick="deleteBook('${book.id}')" style="background-color: #E74C3C; width: auto; padding: 6px 12px; margin-top: 10px; font-size: 0.9em; border-radius: 4px;">Delete Book</button>
            `;
            bookList.appendChild(div);
        });
    }

    // Update <datalist> for suggestions
    function updateDataLists() {
        const bookIdsList = document.getElementById('bookIds');
        const borrowedBookIdsList = document.getElementById('borrowedBookIds');
        
        if (bookIdsList) {
            // Show only available books for borrowing
            bookIdsList.innerHTML = books
                .filter(b => !b.student || b.student.trim() === "")
                .map(b => `<option value="${b.id}">${b.name} (${b.author})</option>`)
                .join('');
        }
        if (borrowedBookIdsList) {
            // Show only borrowed books for returning
            borrowedBookIdsList.innerHTML = books
                .filter(b => b.student && b.student.trim() !== "")
                .map(b => `<option value="${b.id}">${b.name} (Borrowed by: ${b.student})</option>`)
                .join('');
        }
    }

    // Global function to trigger delete
    window.deleteBook = function(id) {
        if (confirm("Are you sure you want to delete this book?")) {
            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: id })
            })
            .then(res => res.json())
            .then(result => {
                if (result.status === 'Deleted') {
                    loadBooks();
                } else {
                    alert('Error: ' + result.status);
                }
            })
            .catch(err => {
                console.error("Local fallback cannot delete:", err);
                alert("Cannot delete in static mode (CGI backend inactive).");
            });
        }
    };

    // Form logic: Add Book
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Generate a 10 digit ID
            const id = Math.floor(Math.random() * 9000000000) + 1000000000;
            
            const payload = {
                action: 'add',
                id: String(id),
                name: document.getElementById('newTitle').value,
                author: document.getElementById('newAuthor').value
            };

            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(result => {
                if(result.status === 'Added') {
                    alert('Book added successfully!');
                    addForm.reset();
                    loadBooks(); 
                } else {
                    alert('Error: ' + result.status);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Operation failed. Ensure CGI server is running.");
            });
        });
    }

    // Form logic: Borrow Book
    if (borrowForm) {
        borrowForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('borrowTitle').value;
            const student = document.getElementById('borrower').value;
            
            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'borrow', id: id, student: student })
            })
            .then(res => res.json())
            .then(result => {
                alert(result.status);
                if (result.status === 'Borrowed') {
                    borrowForm.reset();
                    loadBooks();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Operation failed. Ensure CGI server is running.");
            });
        });
    }

    // Form logic: Return Book
    if (returnForm) {
        returnForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('returnTitle').value;
            
            fetch('/cgi-bin/c_program.exe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'return', id: id })
            })
            .then(res => res.json())
            .then(result => {
                alert(result.status);
                if (result.status === 'Returned') {
                    returnForm.reset();
                    loadBooks();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Operation failed. Ensure CGI server is running.");
            });
        });
    }

    // Dynamic search filtering
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const filteredBooks = books.filter(book => 
                book.name.toLowerCase().includes(searchTerm) || 
                book.author.toLowerCase().includes(searchTerm) ||
                book.id.toLowerCase().includes(searchTerm)
            );
            displayBooks(filteredBooks);
        });
    }
});