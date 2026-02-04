# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

# VendorHub Backend Setup 🔧

## Project Structure

```
vendorhub/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Sequelize MySQL connection (reads .env)
│   │   ├── models/               # Sequelize models + associations
│   │   │   ├── User.js
│   │   │   ├── Equipment.js
│   │   │   ├── RFQ.js
│   │   │   ├── Bid.js
│   │   │   └── index.js
│   │   ├── routes/               # API route stubs (auth, rfq, bids)
│   │   ├── middleware/           # auth middleware (JWT)
│   │   ├── controllers/          # controllers (TODO)
│   │   ├── seed.js               # simple seed script (creates users + equipment)
│   │   	└── server.js             # Express + Socket.io server
│   ├── .env.example
│   	└── package.json
```

## Prerequisites

- Node.js (16+ recommended)
- Docker (for local MySQL) or an existing MySQL server

## Quick Start

Backend

1. Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```

2. Copy `.env.example` to `.env` and adjust values if needed:

```bash
copy .env.example .env   # Windows
# or
cp .env.example .env     # macOS / Linux
```

3. Install dependencies (if you haven't already):

```bash
npm install
```

4. Start MySQL (Docker):

```bash
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=vendorhub mysql:8
```

5. Run the seed script to create test users and equipment (this will drop & recreate the DB tables):

```bash
npm run seed
```

6. Start the backend server in dev mode (CORS allowed from the frontend dev origin):

```bash
npm run dev
```

Frontend

1. From the repo root, open a new terminal and run:

```bash
cd vendorhub
npm install
npm run dev
```

2. The Vite dev server proxies `/api` to `http://localhost:5000` for local development. The app runs at `http://localhost:5173` by default in this workspace.

### Test credentials (seeded)

- Client: `client@example.com` / `123`
- Vendor: `vendor1@example.com` / `123`
- Admin: `admin@example.com` / `123`

### Test flow

- Login as client, go to Equipment table, click **Check Vendors** and send RFQ.
- Login as vendor, view **Incoming RFQs**, submit a bid.
- Login as admin, navigate to **Pending Approvals / Bids**, review bids and **Approve** the selected vendor.

## Notes

- API endpoints used by the frontend:
  - `POST /api/auth/login` — body: `{ email, password }` → returns `{ token, user }`
  - `GET /api/equipments`
  - `GET /api/users?role=vendor`
  - `POST /api/rfq/create`
  - `GET /api/rfqs` and `GET /api/rfq/:id`
  - `POST /api/bids/submit`
  - `GET /api/bids/rfq/:rfqId`
  - `POST /api/bids/:id/approve`

If you'd like, I can now polish UI dialogs (use shadcn `Dialog` components for RFQ and Bid forms), add file upload for certificates (`multer`), and add tests. ✅
## Environment Variables

Use `.env.example` as a template:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vendorhub
DB_USER=root
DB_PASS=pass
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Notes

- Models are defined with Sequelize and synchronized on server start (via `sequelize.sync`).
- `seed.js` uses `sequelize.sync({ force: true })` — it will drop tables and recreate them. Use only for development/testing.
- Routes/controllers are scaffolded in `src/routes/`.

## Success Checklist

- ✅ Backend running on `http://localhost:5000` with seeded data (5 equipments, 3 vendors, client/admin users)
- ✅ `GET /api/equipments` returns seeded equipments
- ✅ `GET /api/users?role=vendor` returns seeded vendors
- ✅ Client portal: equipment table and RFQ creation
- ✅ Vendor portal: open RFQs and bid submission
- ✅ Admin portal: bids review and approve

If you want, I can now polish UI dialogs (use shadcn `Dialog` components for RFQ and Bid forms), add file upload for certificates (`multer`), implement Sequelize migrations, and add tests. ✅

---

## Developer Setup & Roadmap 🔧🚀
A concise step-by-step guide for teammates to set up, run, and contribute to VendorHub (frontend + backend). Follow the sections below for quick onboarding.

### Prerequisites
- Node.js 18+ and npm
- Docker (recommended for local MySQL) or an existing MySQL server
- Optional tools: Postman / Insomnia, MySQL Workbench, React DevTools

### Repo structure (high level)
- backend/ — Express + Sequelize API (MySQL)
  - src/config/database.js
  - src/models/* (User, Equipment, RFQ, Bid)
  - src/routes/* (auth, rfq, rfqs, bids, users, equipments, admin)
  - src/middleware/auth.js
  - seed.js (dev seed)
- src/ — Frontend (Vite + React + TypeScript)
  - src/lib/api.ts (axios instance + token handling)
  - src/contexts/AuthContext.tsx
  - src/components/* (equipment, rfq, vendors, admin)

### Environment variables
Copy `.env.example` to `.env` and configure:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vendorhub
DB_USER=root
DB_PASS=pass
JWT_SECRET=your_jwt_secret  # set for dev (or leave as vendorhub_secret fallback)
PORT=5000
```

### Backend — Install & run
1. Open terminal → cd `backend`
2. Install deps:
   - npm install
3. Start local MySQL (recommended):
   - docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=vendorhub mysql:8
4. Seed DB (development only — drops tables):
   - npm run seed
5. Run server (dev):
   - npm run dev
6. Verifications:
   - GET http://localhost:5000/ping → { ok: true }
   - GET http://localhost:5000/api/equipments → 5 items
   - GET http://localhost:5000/api/users?role=vendor → vendor list

Key backend packages (package.json):
- express, cors, dotenv, mysql2, sequelize, sequelize-cli
- bcryptjs, jsonwebtoken (auth), multer (TBD file uploads), socket.io
- dev: nodemon

Security note: Use strong JWT_SECRET in non-dev environments.

### Frontend — Install & run
1. From repo root:
   - cd vendorhub
   - npm install
   - npm run dev
2. Dev server:
   - http://localhost:5173 (vite)
3. Vite proxy (local dev): `/api` → `http://localhost:5000` (see `vite.config.ts`)

Key frontend packages (package.json highlights):
- react, react-dom, react-router-dom, @tanstack/react-query (v5), jwt-decode
- shadcn UI components and Radix primitives, sonner (toasts), tailwindcss

### Authentication flow
- POST /api/auth/login → { token, user }
- Frontend stores token in `localStorage` and axios attaches it as `Authorization: Bearer <token>`
- Protected routes use `authMiddleware` and `requireRole(['client'|'vendor'|'admin'])`

Seeded test accounts (dev):
- Client: client@example.com / 123
- Vendor: vendor1@example.com / 123
- Admin: admin@example.com / 123

### Important API endpoints
- POST /api/auth/login
- GET /api/equipments
- GET /api/users?role=vendor
- POST /api/rfq/create (client only)
- GET /api/rfqs
- GET /api/rfq/:id
- POST /api/bids/submit (vendor only)
- POST /api/bids/:id/approve (admin only)
- GET /api/admin/bids (demo/aggregate for admin UI)

### Migration & compatibility notes
- React Query upgraded to v5: use the object API:
  - useQuery({ queryKey: ['key'], queryFn: () => api.get('/x').then(r=>r.data) })
  - useMutation({ mutationFn: (data) => api.post('/x', data) })
- jwt-decode import: use named import `import { jwtDecode } from 'jwt-decode'` to avoid Vite ESM errors

### Debugging & troubleshooting
- If frontend shows ECONNREFUSED for `/api/*`, ensure backend is running (nodemon) and bound to 0.0.0.0
- If nodemon keeps restarting on every file save: stop with Ctrl+C, make changes, then `npm run dev` (backend)
- To find & kill a process using port 5000 on Windows:
  - netstat -ano | findstr :5000
  - taskkill /PID <PID> /F

### Testing & CI
- Seed script is for local dev only (uses sequelize.sync({ force: true })) — do not run against production
- Add unit & integration tests using Vitest + supertest and Sequelize test DB in CI

### Contribution checklist
- Branch from `main` → `feature/*` or `fix/*`
- Run `npm install` and `npm run dev` for both backend/frontend
- Add tests and run `npm test` before PR
- Keep PR descriptions focused and reference issue number

### Recommended dev tools
- React DevTools, Postman/Insomnia, MySQL Workbench, Docker Desktop

---

If you'd like, I can also:
- Add full Sequelize migrations, file uploads with `multer`, and better cert file handling
- Add automated tests for auth, RFQ, and bids flows
- Add a CONTRIBUTING.md and CODE_OF_CONDUCT for team onboarding

---

**Quick checklist for a teammate** ✅
1. Clone repo → cd backend → `npm install` → copy `.env.example` → start MySQL (Docker) → `npm run seed` → `npm run dev`
2. Open new terminal → cd vendorhub → `npm install` → `npm run dev`
3. Login with seeded accounts and run through flows: equipment → RFQ → vendor bids → admin approve

---



