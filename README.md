# Document & News Management System

A local, LAN-accessible document library and news publishing website built with Node.js, Express, SQLite, HTML, CSS and vanilla JavaScript.


## Latest interface updates

- Dark navy interface with translucent glass-style panels and blur effects.
- Slightly larger typography across the interface.
- Footer copyright year updates automatically based on the visitor's system date.
- Users can add their own document categories and news categories from the corresponding upload forms. Categories are stored in SQLite and remain available after restarting the server.
- Existing categories and previously stored records are preserved when the updated application starts against an existing `data/website.db`.

## Features

### Documents
- Upload files of any extension, up to **2048 MB (2 GB)** per file.
- Add a title, description and category.
- Search by title, original filename, description, category and upload date.
- View browser-previewable files (PDF, common images and plain text); other files open as downloads.
- Download and delete files.
- Deleting a document removes its database record and stored file.

### News
- Publish news with title, category, publication date, photo and full text.
- Photo formats: PNG, JPG and JPEG (maximum 15 MB).
- Search by title/content, category and publication date.
- Newest publication dates appear first.
- Read a full article on its own detail page.
- Delete a news item and its associated photo.

### System
- SQLite database stored at `data/website.db`.
- Uploaded files stored locally in `uploads/documents/` and `uploads/news/`.
- Responsive layout for desktop, tablet and mobile.
- No login system and no admin dashboard, as requested.
- LAN server binds to `0.0.0.0` by default.

## Requirements

- Windows 10 or Windows 11
- Node.js **20 LTS or newer** (includes npm)
- Enough free disk space for your uploads and database

Download Node.js from: https://nodejs.org/

## Install and run

1. Extract the ZIP to a normal writable folder, for example `C:\Document-News-System`.
2. Install Node.js 20 LTS or newer.
3. Double-click `install.bat` (or open a terminal in the project folder and run `npm install`).
4. Double-click `start.bat` (or run `npm start`).
5. On the host PC, open **http://localhost:3000**.

The first run creates the SQLite database automatically. No manual database setup is required.

## Allow other computers on your LAN

1. Keep the server running on the host PC.
2. Find the host PC's IPv4 address:
   - Open Command Prompt.
   - Run `ipconfig`.
   - Find the IPv4 Address under the active Ethernet or Wi-Fi adapter (for example `192.168.1.25`).
3. On another device connected to the same trusted LAN, open `http://192.168.1.25:3000` (replace the example IP with the host PC's actual address).
4. If Windows Defender Firewall asks, allow Node.js on **Private networks only**. If it does not prompt, create an inbound TCP rule for port **3000**, scoped to the Private profile and your local subnet.

Do not expose port 3000 directly to the public internet.

## Important security notice

This project deliberately has **no authentication**, matching the approved requirement. Anyone who can reach the site can upload documents, publish news, and permanently delete documents/news. Run it only on a trusted LAN. Do not port-forward it to the internet or use it on an untrusted public network.

The server does not implement user roles, audit logs, backups or per-user permissions. Back up the entire project `data/` and `uploads/` folders regularly, preferably while the server is stopped.

## Upload limits

- Documents: 2 GiB (2048 MiB) per file.
- News images: 15 MiB per image.

The browser may display progress for document uploads. Actual upload speed depends on the LAN, disk, browser and host PC.

## Data locations

```text
document-news-system/
├── data/
│   └── website.db
├── uploads/
│   ├── documents/
│   └── news/
└── public/
```

Keep `data/website.db` and both upload directories together. Moving only the database or only the uploads will break file references.

## Useful commands

```bash
npm install
npm start
```

For development with Node's watch mode:

```bash
npm run dev
```

Set a custom port before starting (Command Prompt):

```bat
set PORT=8080
npm start
```

## Troubleshooting

- **`node` is not recognized:** install Node.js and reopen Command Prompt.
- **Port 3000 is already in use:** close the other service or set a different `PORT`.
- **Other PCs cannot connect:** verify both devices are on the same LAN, the server is running, and Windows Firewall allows inbound TCP 3000 on Private networks.
- **Upload fails for large files:** check free disk space, browser/network stability and the server console. The server enforces a 2 GiB document limit.
- **Database locked or damaged:** stop the server before restoring a known-good copy of the `data/` directory.

## Notes

- All file extensions are accepted for document uploads, as specified.
- For safety, only PDFs, common image formats and plain text are served inline in the browser. Other file types are downloaded.
- This is intended for a small trusted local network, not as a hardened public-facing service.
