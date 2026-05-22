# Digital Local Council Service Management System

> A web-based platform enabling citizens to access local council services online — submit applications, track status, and download approved documents — with a full administrative panel for council officers.

**Institution:** Information and Communications University — School of Engineering
**Module:** E-Governance & Digital Marketing
**Project Year:** 2026
**Stack:** React (Vite) · Node.js / Express · MySQL · JWT Auth

---

## What this system does

Citizens can register, log in, apply for council permits and certificates, track their application through a real-time status timeline, and download approved documents. Council officers use a separate admin panel to review, approve or reject applications, upload signed PDFs, and trigger email notifications automatically.

---

## Project tasks and deadlines

| Task | Description | Marks | Deadline |
|------|-------------|-------|----------|
| Task 1 | System design, DB schema, wireframes, authentication | 10 | 20 Feb 2026 |
| Task 2 | Service requests, admin panel, notifications | 10 | 8 Mar 2026 |
| Task 3 | Dashboard, tracking, feedback, deployment | 20 | 30 Apr 2026 |
| Final | Live deployment + user manual + technical report | 10 | 20 May 2026 |

---

## Repository structure

```
council-system/
├── backend/
│   ├── server.js                  # Express entry point
│   ├── db.js                      # MySQL connection pool
│   ├── .env.example               # Environment variable template
│   ├── middleware/
│   │   └── auth.js                # JWT authenticate + role authorize
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── applications.js        # /api/applications/*
│   │   ├── admin.js               # /api/admin/*
│   │   └── notifications.js       # /api/notify/*
│   ├── controllers/               # Business logic (to be added T2–T3)
│   ├── utils/
│   │   └── mailer.js              # Nodemailer setup
│   └── uploads/                   # Approved PDF documents
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ApplyService.jsx
│   │   │   ├── ApplicationDetail.jsx
│   │   │   └── admin/
│   │   │       └── AdminPanel.jsx
│   │   ├── components/
│   │   │   ├── ui/                # Reusable UI primitives
│   │   │   └── layout/            # Navbar, Sidebar, Layout wrapper
│   │   ├── hooks/                 # useAuth, useApplications
│   │   ├── services/
│   │   │   └── api.js             # Axios instance + all API calls
│   │   └── store/                 # Auth context / state
│   └── index.html
└── database/
    └── schema.sql                 # Full DB schema with seed data
```

---

## Quick start (local development)

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm 9+

### 1. Clone and install

```bash
git clone <your-repo-url>
cd council-system

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# Frontend
cd ../frontend
npm install
```

### 2. Set up the database

```bash
mysql -u root -p
CREATE DATABASE council_db;
USE council_db;
source ../database/schema.sql;
```

### 3. Run locally

```bash
# Terminal 1 — backend
cd backend
npm run dev   # runs on http://localhost:3000

# Terminal 2 — frontend
cd frontend
npm run dev   # runs on http://localhost:5173
```

---

## Deployment to icuprojects.icu

See `docs/DEPLOYMENT_GUIDE.md` for the full step-by-step cPanel deployment walkthrough.

---

## Documentation index

| File | Contents |
|------|----------|
| `docs/SPRINT_PLAN.md` | 4-week sprint breakdown with tasks, skills, and tools |
| `docs/ARCHITECTURE.md` | System architecture, tech decisions, C4 diagrams |
| `docs/DATABASE.md` | Schema reference — all tables, columns, indexes |
| `docs/API_REFERENCE.md` | All REST endpoints with request/response examples |
| `docs/SETUP_GUIDE.md` | Local dev environment setup step by step |
| `docs/STITCH_PROMPTS.md` | Wireframe prompts for Stitch by Google (5 screens) |
| `docs/TECHNICAL_REPORT.md` | Final submission technical report template |
| `docs/USER_MANUAL.md` | Citizen and admin user manual |
| `database/schema.sql` | Production-ready MySQL schema |
