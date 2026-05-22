# System Architecture — Digital Local Council Service Management System

## Overview

This system follows a classic **three-tier client-server architecture** deployed on a single shared-hosting server. The choice is deliberate — a modular monolith is easier to deploy, debug, and maintain than microservices for a single-developer semester project running on shared hosting.

---

## Architecture decision record

### ADR-001: Modular monolith over microservices

**Status:** Accepted

**Context:**
The project runs on a single shared hosting account at icuprojects.icu. The team is one developer. Deadlines are tight. Microservices require orchestration infrastructure (Kubernetes, service mesh, separate databases) that adds no academic value and significant operational complexity.

**Decision:**
Use a modular monolith — one Express app with clearly separated route modules — deployed as a single Node.js process alongside a single MySQL instance.

**Consequences:**
- Easier: one deployment, one `.env`, one database connection pool, no inter-service networking
- Harder: no independent scaling per module (not required for this use case)
- Acceptable: exam rubric rewards working functionality, not architectural complexity

---

### ADR-002: React SPA over server-rendered HTML

**Status:** Accepted

**Context:**
The assignment specifies a "web-based system." The examiner will evaluate the frontend by using it. A React SPA gives a professional, interactive experience with minimal page reloads — important for the dashboard and admin panel.

**Decision:**
Use React (Vite) as a Single Page Application. The backend serves only JSON APIs. The frontend is a separate build artifact.

**Consequences:**
- Easier: clear separation between frontend and backend work; Copilot generates React components well
- Harder: requires CORS configuration; first load requires a build step
- On deployment: build the React app (`npm run build`) and serve the `/dist` folder as static files

---

### ADR-003: JWT over session cookies

**Status:** Accepted

**Context:**
Shared hosting often does not support sticky sessions. JWT tokens are stateless — the server does not need to store session data.

**Decision:**
Use signed JWTs (7-day expiry) stored in `localStorage`. Include the role claim in the token payload so the frontend can conditionally show admin UI without an extra API call.

**Consequences:**
- Easier: stateless auth works on any hosting, no Redis or session store needed
- Harder: tokens cannot be revoked before expiry without a deny-list (acceptable for this project)
- Security note: store `JWT_SECRET` in `.env`, never in source code

---

## Three-tier architecture

```
┌─────────────────────────────────────────────┐
│  PRESENTATION TIER — React (Vite) SPA        │
│                                              │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Citizen    │ │ Admin    │ │ Auth      │  │
│  │ portal     │ │ panel    │ │ pages     │  │
│  └────────────┘ └──────────┘ └───────────┘  │
└──────────────────────┬──────────────────────┘
                       │ HTTPS + Bearer JWT
┌──────────────────────▼──────────────────────┐
│  APPLICATION TIER — Node.js / Express        │
│                                              │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐  │
│  │ Auth     │ │Applications│ │ Admin    │  │
│  │ /auth/*  │ │ /apps/*    │ │ /admin/* │  │
│  └──────────┘ └────────────┘ └──────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ Cross-cutting: helmet, CORS, rate    │   │
│  │ limiting, JWT middleware, multer     │   │
│  └──────────────────────────────────────┘   │
└──────────────────────┬──────────────────────┘
                       │ mysql2/promise
┌──────────────────────▼──────────────────────┐
│  DATA TIER — MySQL 8.0                       │
│                                              │
│  users · services · applications             │
│  app_status_logs · feedback                  │
└─────────────────────────────────────────────┘
```

---

## Technology stack

| Layer | Technology | Version | Reason |
|-------|------------|---------|--------|
| Frontend framework | React | 18 | Industry standard, excellent Copilot support |
| Frontend build | Vite | 5 | Fast HMR, simple config, lightweight output |
| Routing | React Router | 6 | Declarative client-side routing |
| HTTP client | Axios | 1.x | Interceptors for auth token injection |
| Backend runtime | Node.js | 18 LTS | Async I/O, npm ecosystem, works on shared hosting |
| Backend framework | Express | 4.x | Minimal, well-documented, Copilot knows it well |
| Database | MySQL | 8.0 | Required by icuprojects hosting environment |
| DB driver | mysql2/promise | 3.x | Promise-based, prepared statements, connection pooling |
| Authentication | JWT (jsonwebtoken) | 9.x | Stateless, no session store required |
| Password hashing | bcryptjs | 2.x | Constant-time comparison, cost factor 12 |
| File uploads | multer | 1.x | Stream-based, file type filtering, size limits |
| Email | Nodemailer | 6.x | Works with Gmail SMTP, configurable transport |
| Input validation | express-validator | 7.x | Declarative, integrates cleanly with Express routes |
| Security headers | helmet | 7.x | Sets X-Frame-Options, CSP, etc. automatically |
| Rate limiting | express-rate-limit | 7.x | Prevents brute-force attacks on auth endpoints |

---

## Module responsibilities

### `server.js`
Entry point. Mounts all middleware (helmet, CORS, rate limiter, body parser). Registers route modules. Starts HTTP listener. Contains global error handler.

### `db.js`
Creates and exports a mysql2 connection pool. All route handlers import this directly — there is no ORM, queries are written in SQL. This is intentional: explicit SQL is easier to debug, easier to explain to an examiner, and has no abstraction overhead.

### `middleware/auth.js`
Two exports:
- `authenticate` — verifies the Bearer JWT, looks up the user in the database, attaches `req.user`
- `authorize(...roles)` — returns a middleware that checks `req.user.role` against an allowed list

### `routes/auth.js`
Handles registration, login, and forgot-password. No authentication required on these routes.

### `routes/applications.js`
All citizen-facing application operations. All routes require `authenticate`. The citizen can only see their own applications — every query filters by `user_id = req.user.id`.

### `routes/admin.js`
Officer/admin operations. All routes require `authenticate` + `authorize('officer', 'admin')`. Officers can see all applications regardless of owner.

### `utils/mailer.js`
Nodemailer transporter singleton. Called by route handlers after status changes.

---

## Security baseline

| Concern | Implementation |
|---------|---------------|
| SQL injection | Parameterised queries via mysql2 (`?` placeholders) everywhere — no string concatenation |
| Password storage | bcrypt, cost factor 12 — never store plain text |
| JWT secret | In `.env` only, never committed to git |
| File uploads | multer restricts MIME type to `application/pdf`, max 5MB |
| Rate limiting | 100 requests per 15 minutes per IP on all `/api` routes |
| CORS | Explicit origin whitelist — only the frontend domain |
| Security headers | helmet() sets X-Frame-Options, X-XSS-Protection, etc. |
| Input validation | express-validator on all POST/PATCH routes before any DB call |
| Role enforcement | Every admin route checks role in middleware, not in controller logic |

---

## Request lifecycle (submit application)

```
Citizen browser
    │  POST /api/applications
    │  Headers: Authorization: Bearer <token>
    │  Body: { service_id, applicant_notes }
    ▼
Express → Rate limiter → CORS check → Body parser
    ▼
authenticate middleware
    │  Verifies JWT signature
    │  Queries DB: SELECT id, role FROM users WHERE id = payload.id
    │  Attaches req.user
    ▼
applications route handler
    │  express-validator: service_id required
    │  Generates reference number LCS-YYYY-NNNN
    │  INSERT INTO applications ...
    │  INSERT INTO app_status_logs ... (status: submitted)
    │  Calls mailer.sendSubmissionEmail(user.email, ref)
    ▼
Response: 201 { data: { id, reference_no } }
    ▼
Citizen browser — redirect to dashboard
```

---

## Deployment architecture (icuprojects.icu)

```
Internet
    │  HTTPS
    ▼
icuprojects.icu shared hosting
    ├── Apache/Nginx (provided by host)
    │   ├── /public_html/          ← React /dist files (static)
    │   └── Proxy /api/* → Node.js on port 3000
    ├── Node.js process
    │   └── backend/server.js
    ├── MySQL 8.0
    │   └── council_db
    └── /uploads/                  ← PDF documents (outside public_html)
```

**Deployment steps summary:**
1. `npm run build` in frontend — produces `dist/` folder
2. Upload `dist/` contents to `public_html/`
3. Upload `backend/` to a non-public folder
4. Create `.env` on server with live credentials
5. Import `schema.sql` via phpMyAdmin
6. Start Node.js via cPanel Node.js app manager or `pm2 start server.js`
7. Configure Apache proxy rule for `/api/` routes

Full walkthrough in `docs/DEPLOYMENT_GUIDE.md`.
