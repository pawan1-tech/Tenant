# Multi-Tenant SaaS Notes Application

A full-stack multi-tenant Notes app with JWT auth, role-based access, and subscription gating (Free vs Pro). Backend: Node/Express/MongoDB. Frontend: React + Vite.

- Backend entry: [server/api/index.js](server/api/index.js)
- Frontend entry: [client/src/App.jsx](client/src/App.jsx)
- Health route: [server/routes/health.js](server/routes/health.js)
- Notes routes: [server/routes/notes.js](server/routes/notes.js)

## Live Demo
- Frontend: https://tenant-client.vercel.app/
- Backend (API base): https://tenant-server-fawn.vercel.app/

## Project Structure
- server/ (Express API, Mongo models, routes, middleware)
- client/ (React UI with contexts, components)


## Prerequisites
- Node.js 18+
- MongoDB Atlas URI
- Bash (for provided scripts)

## Chosen Architecture & Multi-tenant Strategy

- Strategy: shared schema (one MongoDB database/collection set), each document is tagged with `tenantId` and all queries are scoped by tenant via auth/middleware.
- Why this approach: simplest to operate and deploy, cost efficient, single connection pool.
- Tradeoffs:
  - Pros: low operational overhead, easy onboarding, single code path.
  - Cons: strict discipline to always filter by `tenantId`, potential “noisy neighbor” effects on shared indexes, per-tenant backup/restore is coarser than schema/db-per-tenant.
  - When to consider alternatives: high isolation/compliance needs or very large tenants → schema-per-tenant or db-per-tenant.
  
Subscription model: upgrade requests are stored on the tenant; approval currently grants Pro at user level (`user.isPro`) while retaining shared schema.

## Manual Start
- Backend
  - cd server
  - npm install
  - Ensure server/.env exists 
  - npm run dev
- Frontend
  - cd client
  - npm install
  - Ensure client/.env exists
  - npm run dev

API base (local): http://localhost:3000  
Frontend (local): http://localhost:5173

## Environment
- Backend: server/.env
  - MONGODB_URI, JWT_SECRET, NODE_ENV, PORT, FRONTEND_URL
- Frontend: client/.env
  - VITE_API_URL=http://localhost:3000

## Test Accounts (password: password)
- admin@acme.test (Admin), user@acme.test (Member)
- admin@globex.test (Admin), user@globex.test (Member)

Login via UI or use endpoints below.

## API Endpoints (Local)
- Auth
  - POST /api/auth/login
- Notes (tenant-isolated)
  - GET /api/notes
  - POST /api/notes
  - GET /api/notes/:id
  - PUT /api/notes/:id
  - DELETE /api/notes/:id
- Health
  - GET /api/health
- Upgrade
  - POST /api/upgrade-requests                     → user requests Pro for their tenant
  - GET  /api/upgrade-requests                     → get current tenant’s upgrade status
  - GET  /api/upgrade-requests/pending             → (admin) list all pending requests
  - POST /api/upgrade-requests/:tenantId/approve   → (admin) approve; grants user-level Pro
  - POST /api/upgrade-requests/:tenantId/reject    → (admin) reject request

## How to Deploy to Vercel (manual)

Backend (server)
- Vercel → New Project → Import your GitHub repo
- Root Directory: `server`
- Environment Variables (Project → Settings → Env Vars):
  - `MONGODB_URI` = your Atlas URI
  - `JWT_SECRET` = a strong secret
  - `FRONTEND_URL` = your frontend URL (e.g., https://your-frontend.vercel.app)
  - Optional `FRONTEND_URLS` = comma-separated list for CORS (e.g., preview URLs)
- Deploy, then verify: `GET https://<your-backend>.vercel.app/api/health`

Frontend (client)
- Create separate Vercel project → Root Directory: `client`
- Build Command: `npm run build`, Output Directory: `dist`
- Env Var: `VITE_API_URL` = `https://<your-backend>.vercel.app`
- Deploy, open the site, log in with test accounts.


