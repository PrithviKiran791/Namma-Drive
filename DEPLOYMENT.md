# Deployment (Vercel)

This document explains how to deploy the Namma Drive frontend and backend together on Vercel as a monorepo.

## What we set up
- `vercel.json` at repo root routing `/api/*` to a serverless wrapper at `/api/server.js` and serving the frontend static build from `namma-drive-frontend/dist`.
- A serverless wrapper at `api/server.js` that wraps the existing Express app using `serverless-http`.
- Connection caching in `namma-drive-server/server.js` so Mongoose reuses the connection in serverless environments.

## Environment variables (Vercel Project)
- `MONGODB_URI` — MongoDB connection string
- Any optional secrets (e.g. `JWT_SECRET`) used by the backend
- `VITE_API_URL` — Frontend build-time API url (e.g. `https://<your-vercel-app>.vercel.app/api`)

## Deploy steps (recommended)
1. Push your repository to GitHub (or Git provider).
2. In Vercel, create a new Project and import the repo.
3. In the Vercel project settings:
   - Root `vercel.json` will be used; no special configuration is required for builds.
   - Add Environment Variables `MONGODB_URI`, `JWT_SECRET`, etc.
   - For preview/production, set `VITE_API_URL` to `https://<your-vercel-app>.vercel.app/api`.
4. Deploy. Vercel will:
   - Build the frontend using `namma-drive-frontend/package.json` (`npm run build`) and produce `dist`.
   - Build the Node serverless function at `api/server.js` and expose it under `/api/*`.

## Local test (recommended)
1. Build frontend and run preview to sanity-check the static site:

```bash
# from namma-drive-frontend
npm install
npm run build
npm run preview
```

2. Test the serverless function locally using Vercel CLI (optional):

```bash
# from repo root
# install Vercel CLI if you don't have it
npm i -g vercel
# run local dev server
vercel dev
```

Notes: `vercel dev` may prompt for login the first time. If so, follow the OAuth / token flow the CLI provides.

## Alternate: Host backend separately
If you prefer not to use Vercel serverless functions for the Express API (recommended for long-running DB connections), host the backend on Render / Railway / DigitalOcean App and set `VITE_API_URL` to that service URL.

## Troubleshooting
- SPA 404s on refresh: solved by `vercel.json` rewrite to `index.html`.
- Mongo reconnects/timeouts: connection caching added to `namma-drive-server/server.js`.
- Vercel function cold starts: consider lighter-weight endpoints or migrate heavy work to external services.

If you want, I can:
- Run `vercel dev` locally and report any login prompts/errors.
- Create a small GitHub Actions workflow to automatically deploy on push to `main`.

## GitHub Actions (auto-deploy on push)

You can automatically deploy to Vercel when pushing to `main` using the included GitHub Actions workflow: `.github/workflows/vercel-deploy.yml`.

Required GitHub secrets (Repository Settings → Secrets → Actions):
- `VERCEL_TOKEN` — a Vercel personal token (set to `Read & Deploy` scope)
- `VERCEL_ORG_ID` — your Vercel Organization ID
- `VERCEL_PROJECT_ID` — the Vercel Project ID

Once those are configured, pushing to `main` will trigger the workflow which runs the Vercel CLI and deploys the monorepo configured by `vercel.json`.

Example: create secrets via GitHub UI and push a commit to `main`:

```bash
git add .
git commit -m "chore(ci): add vercel deploy workflow"
git push origin main
```

If you'd like, I can also create a GitHub Action that only deploys the frontend (namma-drive-frontend) and leaves the backend to a separate host (Render/Railway). Tell me which flavor you prefer.
