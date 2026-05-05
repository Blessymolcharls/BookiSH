# 📚 BookiSH - Library Management System

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![HTML5](https://img.shields.io/badge/HTML5-E34C26?style=flat&logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)]()
[![C](https://img.shields.io/badge/C-00599C?style=flat&logo=c&logoColor=white)]()

---

## 📖 Introduction

**BookiSH** is a modern, user-friendly web-based library management system designed to streamline the process of managing book collections, tracking borrowers, and organizing library operations. Whether you're managing a school library, personal collection, or community book exchange, BookiSH makes it simple and efficient.

The project uses a robust **C-based CGI Backend** that parses and persists data safely via JSON, making it a complete full-stack web application with no external dependencies.

---

## 🎯 Problem Statement

Managing physical book collections and tracking borrowers can be time-consuming and error-prone. BookiSH solves this by providing a centralized platform where librarians and users can:
- Maintain an organized digital catalog
- Track who is borrowing which books
- Quickly check book availability
- Add or remove books with ease

---

## 👥 Target Users

- 📚 **Librarians** - Manage library operations and book inventory
- 🎓 **Students** - Borrow and return books from school/university libraries
- 👨‍👩‍👧 **Community Members** - Access shared book collections
- 🏫 **Educational Institutions** - Manage student borrowing records

---

## ✨ Key Features

✅ **User Authentication** - Secure login system to access the library  
✅ **Book Catalog** - Browse all available books with detailed information  
✅ **Smart Availability Tracking** - See which books are available or borrowed  
✅ **Intelligent Searching** - Filter in real-time by Title, Author, or Book ID  
✅ **Dynamic Datalists** - Auto-suggest available books for borrowing and returning  
✅ **CRUD Capabilities** - Add, View, Borrow, Return, and Delete books safely  
✅ **C CGI Backend** - Native C binary handling REST-like API interactions  
✅ **Responsive UI** - Glassmorphism, animations, and uniform design variables across mobile and desktop  

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Native C (CGI - Common Gateway Interface) |
| **Data Store** | JSON (`books.json`) |
| **Local Server** | Python 3 (`http.server --cgi`) |

---

## 📂 Project Structure

```text
BookiSH/
├── README.md                      # Project documentation
├── .gitignore                     # Git ignore rules
├── index.html                     # 🏠 Welcome landing page
├── login.html                     # 🔐 User authentication
├── library.html                   # 📚 Main library interface
├── books.json                     # 💾 Book database (JSON flat-file)
├── server.c                       # ⚙️  C CGI backend — API router & data handler
├── cgi-bin/
│   └── c_program.exe              # 🔧 Compiled C CGI executable (Windows)
└── assets/
    ├── css/
    │   ├── index.css              # Home page styling
    │   ├── login.css              # Login page styling
    │   └── library.css            # Library page styling
    └── js/
        └── library.js             # Frontend async API calls & DOM manipulation
```

---

## 🚀 Installation & Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- **GCC** compiler (e.g. [MinGW-w64](https://www.mingw-w64.org/) on Windows)
- **Python 3** (for the local CGI dev server)

### Quick Start

**Step 1:** Clone the repository
```bash
git clone https://github.com/Blessymolcharls/BookiSH.git
cd BookiSH
```

**Step 2:** Create the `cgi-bin` directory (if it doesn't already exist)
```bash
mkdir cgi-bin
```

**Step 3:** Compile the C backend

> ⚠️ **Windows:** Compile to `.exe` — Python's CGI server on Windows uses file associations to run scripts, and only `.exe` files execute natively.

```bash
# Windows (MinGW / GCC)
gcc server.c -o cgi-bin/c_program.exe

# Linux / macOS
gcc server.c -o cgi-bin/c_program.cgi
chmod +x cgi-bin/c_program.cgi
```

**Step 4:** Start the local CGI server
```bash
# Run from the project root directory (where books.json lives)
python -m http.server --cgi 8000
```

**Step 5:** Open the app
- Visit `http://localhost:8000`
- Click **Login** to access the library dashboard

---

## 💡 Usage Guide

### Getting Started
1. **Home Page** — Review the project introduction
2. **Login** — Authenticate with your credentials (`admin` / `password`)
3. **Library Dashboard** — Browse and manage books

### Common Tasks

#### 📖 Browsing & Searching
```
Type in the search bar at the top — the book grid filters instantly
by Title, Author, or Book ID.
```

#### ✅ Borrowing a Book
```
1. Scroll to "Borrow a Book".
2. Click the Book ID field — a smart dropdown shows only AVAILABLE books.
3. Enter your name.
4. Press "Borrow". The record is saved immediately to books.json.
```

#### 🔄 Returning a Book
```
1. Scroll to "Return a Book".
2. Select the Book ID from the dropdown (only borrowed books appear).
3. Click "Return". The book is marked available again.
```

#### ➕ Adding & Deleting Books
```
- Add:    Fill in Title and Author under "Add a New Book". An ID is auto-generated.
- Delete: Click the red "Delete Book" button on any book card in the library grid.
```

---

## 📖 Data Structure

### Book Object (`books.json`)
Records are saved persistently by the C backend:

```json
{
  "id": "1234567890",
  "name": "Jane Eyre",
  "author": "Charlotte Brontë",
  "student": "Blessy"
}
```

| Field | Description |
|-------|-------------|
| `id` | Auto-generated unique numeric identifier |
| `name` | Book title |
| `author` | Author name |
| `student` | Current borrower's name — empty string `""` if available |

---

## ⚠️ Known Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| `Operation failed` on borrow/return | JS calling wrong CGI path or CGI not executable | Compile to `.exe` on Windows; ensure server runs from project root |
| Books show "Already Borrowed" incorrectly | `books.json` has Windows CRLF (`\r\n`) line endings — `\r` bleeds into parsed values | The C parser strips trailing `\r` from all extracted fields |
| CGI not found (404) | Server not started from project root | Always run `python -m http.server --cgi 8000` from the `BookiSH/` directory |

---

## 🔮 Future Enhancements

### Phase 2 — Advanced Data Models
- 🗄️ Migration to SQLite via C `sqlite3` API
- 🔑 Session-based or JWT authentication

### Phase 3 — Advanced Features
- 📅 Due date tracking and overdue notifications
- 📊 Admin dashboard with borrowing analytics
- ⭐ Book ratings and reviews

---

## 🤝 Contributors

- **Blessy** — Project Lead & Developer
- **San** — Testing & Documentation

---

## 📋 License

This project is licensed under the **MIT License**.

---

## 🙏 Conclusion

BookiSH modernizes library management using foundational technologies — native C for the backend and Vanilla JS for the frontend — with no heavy frameworks or external dependencies. It serves as a demonstration of how CGI can power a functional full-stack web app from first principles.

**Happy reading! 📚✨**
