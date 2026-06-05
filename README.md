# BookiSH – Library Management System

BookiSH is a lightweight, easy-to-deploy Library Management System built with plain HTML, CSS, JavaScript, and C-based CGI for server-side handling.

## Features

- Add, list, borrow, and return books (client-side UI + CGI-backed actions).
- Minimal server component implemented in C (`server.c` / `c_program.cgi`).
- Static front-end: responsive HTML/CSS with small JavaScript for UX.
- Works with a JSON-backed demo dataset (`books.json`).

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Server-side: C (CGI program) and/or simple static hosting for demo mode
- Data: `books.json` (demo)

## Repository Structure

The project root contains the core HTML pages and assets:

- add.html — UI to add a new book
- borrow.html — Borrowing workflow UI
- return.html — Returning workflow UI
- index.html — Home / landing page
- library.html — Main book listing
- login.html — Simple login page (UI only)
- resources.html — Additional resources/help
- books.json — Demo dataset used by the frontend
- server.c — C server/CGI example (compile & deploy as needed)
- c_program.cgi — Compiled CGI binary (example placed in `cgi-bin/`)
- assets/
  - css/ — stylesheets (`index.css`, `library.css`, `login.css`)
  - js/ — frontend scripts (`library.js`)
- cgi-bin/ — location for CGI executables

Use these files as the basis for customization or replacement with a full backend.

## Quickstart — Run Locally (Static Demo)

For most development and demo purposes you can run the frontend as static files using a simple HTTP server. From the project root run:

```powershell
# Python 3.x
python -m http.server 8000

# then open http://localhost:8000 in your browser
```

The static demo will use `books.json` and client-side logic in `assets/js/library.js` to showcase the UI and flows.

## Quickstart — Run CGI (Linux/macOS or Windows with CGI-capable server)

1. Compile `server.c` or your CGI program on the host that will run it. Example (Linux):

```bash
gcc -o c_program.cgi server.c
chmod +x c_program.cgi
```

2. Place the `c_program.cgi` binary into your server's `cgi-bin` directory and configure your web server (Apache, nginx+fcgiwrap, or other) to allow CGI execution.

3. Restart the server and test the CGI endpoints via the HTML pages.

Notes:
- CGI setup varies by OS and webserver — consult your webserver docs for enabling CGI and configuring `cgi-bin`.
- On Windows, consider using WSL or a webserver that supports CGI for best compatibility.

## Data

This project uses `books.json` as a demo dataset located at the repository root. For production use, replace client-side storage with a proper database and secure server-side endpoints.

## Customization

- Replace the CGI program with a REST API (Node, Python, Go, etc.) and update form action URLs accordingly.
- Migrate `books.json` to an actual database (SQLite/MySQL/Postgres) for persistent storage.
- Improve authentication (the current `login.html` is UI-only and not secure).

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Make your changes and include tests where applicable.
4. Open a pull request describing your changes.

Guidelines:
- Keep changes focused and documented.
- If adding server-side features, include clear setup and run instructions.

