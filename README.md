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

Recent updates have completely overhauled the project to use a robust **C-based CGI Backend** capable of intelligently parsing and persisting data safely via JSON, making the system a complete full-stack web application.

---

## 🎯 Problem Statement

Managing physical book collections and tracking borrowers can be time-consuming and error-prone. BookiSH solves this by providing a centralized platform where librarians and users can:
- Maintain an organized digital catalog
- Track who borrowing which books
- Quickly check book availability
- Add new books with ease

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
✅ **CRUD Capabilities** - Add, View, Borrow, Return, and Delete Books safely  
✅ **C CGI Backend** - Secure, robust memory-safe native C backend handling REST-like interactions  
✅ **Responsive UI** - Glassmorphism, animations, and beautiful uniform design variables across mobile and desktop  

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Native C (CGI - Common Gateway Interface) |
| **Data Format** | JSON (`books.json`) |
| **Deployment** | Python CGI server, Apache, Nginx |

---

## 📂 Project Structure

```text
FOC-C/
├── README.md                      # Project documentation
├── .gitignore                     # Git ignore rules
├── index.html                     # 🏠 Welcome landing page
├── login.html                     # 🔐 User authentication
├── library.html                   # 📚 Main library interface
├── books.json                     # 💾 Book database
├── server.c                       # ⚙️ C CGI Backend Router & API Server
└── assets/
    ├── css/
    │   ├── index.css              # Home page styling
    │   ├── login.css              # Login page styling
    │   └── library.css            # Library page styling
    └── js/
        └── library.js             # Core frontend async queries & DOM manipulation
```

---

## 🚀 Installation & Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- GCC Compiler (to build the C backend)
- Python (for local testing via CLI)

### Quick Start (4 Steps)

**Step 1:** Clone or download the repository
```bash
git clone https://github.com/yourusername/BookiSH.git
cd BookiSH
```

**Step 2:** Compile the C Backend
Create the expected `cgi-bin` directory and compile the server logic:
```bash
mkdir cgi-bin
gcc server.c -o cgi-bin/c_program.cgi
```
*(On Windows, you might want to name it `c_program.cgi.exe` or simply rely on the `.cgi` extension depending on server mappings)*

**Step 3:** Start a Local CGI Server
You must run a server capable of executing CGI binaries out of the `/cgi-bin` path.
```bash
# Using Python 3 to serve CGI scripts gracefully
python -m http.server --cgi 8000
```

**Step 4:** Navigate and explore
- Visit `http://localhost:8000` 
- Click **Login** to access the library dashboard.

---

## 💡 Usage Guide

### Getting Started
1. **Home Page** - Review project introduction
2. **Login** - Authenticate with your credentials (admin/password)
3. **Library Dashboard** - Browse and manage books

### Common Tasks

#### 📖 Browsing & Searching
```text
To find a specific book, begin typing in the search bar. The grid will instantly filter to match Authors, Titles, or IDs.
```

#### ✅ Borrowing a Book
```text
1. Scroll to "Borrow a Book".
2. Click the Book ID box — a smart datalist dropdown will reveal ONLY available books.
3. Enter your name.
4. Press "Borrow" to confirm. The database locks the book cleanly and securely.
```

#### 🔄 Returning a Book
```text
1. Scroll to the "Return" section.
2. Select your ID from the smart dropdown.
3. Click "Return Book".
```

#### ➕ Managing Inventory (Adding & Deleting)
```text
- To Add: Under "Add Book", supply the title and author. An ID is automatically generated.
- To Delete: Press the red "Delete Book" button featured directly on any Title card in the library.
```

---

## 📖 Data Structure

### Book Object Format
Records are saved persistently by the C backend to `books.json` like this:

```json
{
  "id": "1234567890",               // Unique identifier
  "name": "Jane Eyre",              // Book title
  "author": "Charlotte Brontë",     // Author name
  "student": "San"                  // Current borrower (empty string if available)
}
```

---

## 🔮 Future Enhancements

### Phase 2 - Advanced Data Models
- 🗄️ Migration to SQLite or PostgreSQL via C connect APIs
- 🔑 JWT-based cryptographic authentication headers

### Phase 3 - Advanced Features
- 📅 Due date tracking and automated timestamps
- 📊 Admin dashboard with analytics and borrowing history
- ⭐ Book ratings and reviews system

---

## 🤝 Contributors

- **Blessy** - Project Lead & Developer
- **San** - Testing & Documentation

---

## 📋 License

This project is licensed under the **MIT License**.

---

## 🙏 Conclusion

BookiSH aims to modernize library management using robust foundational technologies like native C parsing arrays and Vanilla JS. It brings library management into the digital age securely. We're committed to continuous improvement and welcome community feedback!

**Happy reading! 📚✨**
