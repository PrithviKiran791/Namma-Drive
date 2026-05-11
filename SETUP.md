# Local setup (Windows PowerShell)

This file explains how to get the full-stack Namma Drive app running locally on Windows (PowerShell). It assumes Node.js and npm are installed.

1) Verify Node.js and npm

Open PowerShell and run:

```powershell
node -v
npm -v
```

Recommended: Node 18+ or latest LTS.

2) Backend setup (Express + MongoDB)

Change directory into the server folder, install dependencies and create a `.env` file from the example:

```powershell
cd "c:\Users\Tejas Walikar\OneDrive\Desktop\My Projects\Namma-drive\Namma-Drive\namma-drive-server"
npm install
copy .env.example .env
# Edit .env to add your MONGODB_URI credentials (you can use MongoDB Atlas). Use a text editor or run:
notepad .env
```

Start the server in development mode (nodemon) or normal mode:

```powershell
npm run dev
# or
npm start
```

Verify the server is running:

```powershell
Invoke-WebRequest http://localhost:5000/api/health | ConvertFrom-Json
```

3) Frontend setup (React + Vite)

In a new PowerShell window/tab do:

```powershell
cd "c:\Users\Tejas Walikar\OneDrive\Desktop\My Projects\Namma-drive\Namma-Drive\namma-drive-frontend"
npm install
copy .env.example .env
notepad .env
```

Start the frontend dev server:

```powershell
npm run dev
```

Open the provided Vite URL in your browser (typically http://localhost:5173). The frontend expects the backend at `http://localhost:5000` by default (controlled by `VITE_API_URL`).

Troubleshooting

- If MongoDB connection fails, check `MONGODB_URI` for correctness and network access to Atlas.
- If CORS errors occur, ensure the frontend origin (localhost:5173) is allowed by the backend CORS list in `server.js`.
- If Leaflet map tiles fail to load, check network and console for tile server errors.

Notes

- The project uses `import.meta.env.VITE_API_URL` in the frontend. After changing `.env`, restart the Vite dev server.
- To deploy, set the same environment variables on your hosting provider (Render for backend, Vercel for frontend).
