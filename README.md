# BookiSH

A lightweight, elegant Library Management System built with HTML, CSS, JavaScript, and a C-based CGI backend.

---

##  Project Overview

**BookiSH** is a fast and easy-to-deploy Library Management System designed to streamline daily library operations. It was built to demonstrate a fundamental understanding of web technologies and CGI-based server architecture. The project focuses on providing a clean, responsive user interface alongside a minimal, performant backend written in C.

---

##  Features

###  Library Management
- **Browse Books:** View a complete catalog of available books.
- **Add Books:** Register new books into the library system.
- **Borrow Books:** Seamlessly check out books for users.
- **Return Books:** Process book returns effortlessly.

###  User Interface
- **Responsive Design:** Works beautifully across desktop and mobile devices.
- **Modern UI:** Clean, intuitive, and visually appealing layouts.
- **Easy Navigation:** User-centric workflows for adding, borrowing, and returning books.

###  Backend
- **CGI-based Server:** Minimal backend logic implemented in C (`server.c` / `c_program.cgi`).
- **JSON Database:** Uses `books.json` as a lightweight demo dataset.

---


##  Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Application Structure |
| **CSS3** | Modern Styling & Responsive Layouts |
| **JavaScript** | Dynamic Frontend Logic & Interactivity |
| **C** | CGI Backend Server Logic |
| **JSON** | Demo Database Storage |

---

##  Folder Structure

```text
BookiSH/
├── assets/
│   ├── css/
│   └── js/
├── cgi-bin/
├── add.html
├── borrow.html
├── index.html
├── library.html
├── login.html
├── resources.html
├── return.html
├── books.json
├── server.c
├── c_program.cgi
├── README.md
└── CONTRIBUTING.md
```

##  Installation

### Static Demo

For development and UI testing, you can run the frontend as static files using a simple HTTP server. From the project root, run:

```bash
# Using Python 3.x
python -m http.server --cgi 8080
```
*Then, open `http://localhost:8080` in your web browser to view the application.*

### CGI Version

To run the full application with the C-based backend:

1. **Compile the server code** (Linux/macOS or Windows via WSL):
   ```bash
   gcc -o c_program.cgi server.c
   chmod +x c_program.cgi
   ```

2. **Deploy**:
   - Place the compiled `c_program.cgi` executable into your web server's `cgi-bin/` directory.
   - Ensure your web server (e.g., Apache, Nginx) is configured to allow CGI execution.
   - Restart the server and access the HTML pages through your configured local host.

---

##  Usage

Once the application is running, users can interact with the intuitive interface to perform the following actions:

- **Browse Books:** Navigate to the Library page to see the full list of available titles.
- **Borrow Books:** Use the Borrow section to select a book and mark it as checked out.
- **Return Books:** Go to the Return section to check a book back into the library.
- **Add Books:** Access the Add section to expand the catalog with new book entries.

---

## ⚙️ Configuration

- **`books.json`**: Acts as the primary data source for the frontend. You can manually edit this file to add or remove demo books. Ensure the file has read/write permissions for the server user if the backend modifies it.
- **CGI Server Configuration**: 
  - **Directory Mapping**: Ensure your web server (e.g., Apache/Nginx) maps the `/cgi-bin/` route to the physical directory where `c_program.cgi` resides.
  - **Permissions**: The compiled `c_program.cgi` must have executable permissions (`chmod +x`).
  - **Handler Setup**: Enable the `cgi` or `fcgid` module in Apache, or configure `fcgiwrap` with Nginx to allow `.cgi` file execution.
- **Changing Ports**: If port `8080` is in use, modify the Python server command (e.g., `python -m http.server 3000`).

---

