# Technical Report — Digital Local Council Service Management System

**Institution:** Information and Communications University
**School:** School of Engineering
**Module:** E-Governance & Digital Marketing
**Academic Year:** 2026
**Student Name:** Jehoiachin Katemangwe
**Student Number:** 2007626359
**Submission Date:** 20 May 2026

---

## 1. Introduction

### 1.1 Project overview

This report documents the design, development, and deployment of a web-based Digital Local Council Service Management System. The system was developed as part of the E-Governance and Digital Marketing project for the 2026 academic year at ICU.

The system enables citizens to access local council services digitally — removing the need to physically visit council offices for routine applications. Citizens can register accounts, apply for permits and certificates, track the status of their applications in real time, and download approved documents. Council officers use a dedicated administrative panel to review, process, and respond to applications.

### 1.2 Problem statement

Traditional local council service delivery requires citizens to visit offices in person, fill out paper forms, and return on separate days to collect approvals. This creates inefficiencies: long queues, lost documents, inconsistent processing times, and limited transparency for citizens waiting on outcomes.

A digital system addresses these problems by centralising applications, automating notifications, and giving citizens 24/7 visibility into their application status.

### 1.3 Project objectives

- Design a relational database that models users, services, applications, and status history
- Implement secure user authentication with role-based access control
- Build a service application module supporting permits, certificates, and registrations
- Develop an administrative panel for officers to review and act on applications
- Create a real-time tracking interface for citizens
- Deploy the system on a live server accessible via public URL

---

## 2. System architecture

### 2.1 Architectural pattern

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

| Tier | Technology | Responsibility |
|------|------------|---------------|
| Presentation | React (Vite) SPA | User interface, client-side routing, state management |
| Application | Node.js + Express | REST API, business logic, authentication, file handling |
| Data | MySQL 8.0 | Persistent storage, relational data, audit logging |

This pattern was chosen over microservices because it matches the deployment constraints of shared hosting, requires no service orchestration infrastructure, and is appropriate for the scale of this application.


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
Handles registration, login, forgot-password OTP, and reset-password OTP. No authentication required on these routes.

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

### 2.2 System diagram

```
[Citizen Browser]              [Admin Browser]
       │                             │
       └──────────HTTPS──────────────┘
                      │
           [React SPA — /public_html/]
                      │
              REST API (JSON)
                      │
        [Node.js / Express — port 3000]
         │          │          │
      /auth/*   /apps/*    /admin/*
                      │
                [MySQL 8.0]
             [users, services,
          applications, logs, feedback]
```

### 2.3 Authentication flow

1. Citizen submits email and password to `POST /api/auth/login`
2. Server verifies password against bcrypt hash in the database
3. Server signs a JWT containing `{ id, role }` with `JWT_SECRET`
4. Client stores the token in `localStorage`
5. All subsequent requests include `Authorization: Bearer <token>` header
6. The `authenticate` middleware verifies the token and attaches `req.user` to every protected request
7. The `authorize` middleware checks `req.user.role` before any admin operation

---

## 3. Database design

### 3.1 Entity relationship overview

# Database Reference — Digital Local Council Service Management System

**Database:** MySQL 8.0
**Character set:** utf8mb4
**Schema file:** `database/schema.sql`

---

## Entity relationship summary

```
users ──────────────────────────────────────────────────┐
  │                                                      │
  │ 1:many                                               │ 1:1 (reviewed_by)
  ▼                                                      │
applications ──── many:1 ──── services                  │
  │                                                      │
  │ 1:many                                               │
  ▼                                                      │
app_status_logs ◄──── changed_by ◄─── users ────────────┘
  
applications ──── 1:1 ──── feedback ◄── user_id ── users

users ──── 1:many ──── password_reset_tokens
```

---

## Table: `users`

Stores all system users — citizens, council officers, and admins. Role determines access level throughout the system.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key — UUID v4 |
| `full_name` | VARCHAR(120) | No | — | Display name |
| `email` | VARCHAR(255) | No | — | Unique, used for login |
| `password_hash` | VARCHAR(255) | No | — | bcrypt hash, cost 12 |
| `phone` | VARCHAR(20) | Yes | NULL | Optional phone number |
| `role` | ENUM | No | `citizen` | `citizen` / `officer` / `admin` |
| `is_active` | TINYINT(1) | No | 1 | Soft disable without deletion |
| `created_at` | DATETIME | No | NOW() | Auto-set on insert |
| `updated_at` | DATETIME | No | NOW() | Auto-updated on change |
| `deleted_at` | DATETIME | Yes | NULL | Soft delete — NULL means active |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY (email)`
- `INDEX idx_users_email` on `email WHERE deleted_at IS NULL`
- `INDEX idx_users_role` on `role WHERE deleted_at IS NULL`

**Role meanings:**

| Role | Can do |
|------|--------|
| `citizen` | Register, apply for services, track own applications, download own documents, submit feedback |
| `officer` | All citizen actions + view all applications, approve/reject, upload documents |
| `admin` | All officer actions + manage users and system configuration |

---

## Table: `password_reset_tokens`

Stores secure OTP hashes for the password reset flow. The raw 6-digit OTP is emailed to the user; only its SHA-256 hash is stored in the database.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key |
| `user_id` | CHAR(36) | No | — | FK → users(id) CASCADE DELETE |
| `token_hash` | VARCHAR(255) | No | — | SHA-256 of the emailed 6-digit OTP |
| `expires_at` | DATETIME | No | — | Set to NOW() + 15 minutes on insert |
| `used_at` | DATETIME | Yes | NULL | Set when OTP is consumed |
| `created_at` | DATETIME | No | NOW() | — |

**Why hash the OTP?** If the database is compromised, an attacker cannot use stored hashes to reset passwords. Only the recipient of the original email has the raw OTP.

---

## Table: `services`

The catalogue of services citizens can apply for. Seeded at schema creation — officers do not need to create these manually.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key |
| `code` | VARCHAR(50) | No | — | Machine-readable key e.g. `BUSINESS_PERMIT` |
| `name` | VARCHAR(150) | No | — | Display name |
| `category` | ENUM | No | — | `permit` / `certificate` / `registration` |
| `description` | TEXT | Yes | NULL | Shown on the apply page |
| `is_active` | TINYINT(1) | No | 1 | Set to 0 to hide without deleting |
| `created_at` | DATETIME | No | NOW() | — |

**Seeded records:**

| Code | Name | Category |
|------|------|----------|
| `BUSINESS_PERMIT` | Business Operating Permit | permit |
| `CONSTRUCTION_PERMIT` | Construction/Building Permit | permit |
| `EVENT_PERMIT` | Public Event Permit | permit |
| `BIRTH_CERT` | Birth Registration Certificate | certificate |
| `RESIDENCE_CERT` | Residence Certificate | certificate |
| `COMMUNITY_REG` | Community Organisation Registration | registration |

---

## Table: `applications`

The core table. Each row is one citizen's application for one service.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key |
| `reference_no` | VARCHAR(20) | No | — | Human-readable e.g. `LCS-2026-0001`. UNIQUE |
| `user_id` | CHAR(36) | No | — | FK → users(id) RESTRICT |
| `service_id` | CHAR(36) | No | — | FK → services(id) RESTRICT |
| `status` | ENUM | No | `submitted` | See status flow below |
| `applicant_notes` | TEXT | Yes | NULL | Notes entered by citizen on submit |
| `officer_notes` | TEXT | Yes | NULL | Internal remarks by reviewing officer |
| `reviewed_by` | CHAR(36) | Yes | NULL | FK → users(id) — officer who acted |
| `reviewed_at` | DATETIME | Yes | NULL | Timestamp of last officer action |
| `document_path` | VARCHAR(500) | Yes | NULL | Relative server path to uploaded PDF |
| `document_name` | VARCHAR(255) | Yes | NULL | Original filename for display |
| `submitted_at` | DATETIME | No | NOW() | — |
| `updated_at` | DATETIME | No | NOW() | Auto-updated |
| `deleted_at` | DATETIME | Yes | NULL | Soft delete |

**Status flow:**

```
submitted → under_review → approved
                        ↘ rejected
                        ↘ pending_info → under_review (loop)
draft (saved, not submitted — optional feature)
```

| Status | Meaning | Who sets it |
|--------|---------|-------------|
| `draft` | Saved but not submitted | Citizen |
| `submitted` | Submitted and awaiting review | System (on POST) |
| `under_review` | Officer has opened it | Officer |
| `pending_info` | Officer requested more info | Officer |
| `approved` | Application granted | Officer |
| `rejected` | Application denied | Officer |

**Indexes:**
- `INDEX idx_app_user` on `user_id WHERE deleted_at IS NULL` — citizen dashboard query
- `INDEX idx_app_status` on `status WHERE deleted_at IS NULL` — admin filter by status
- `INDEX idx_app_service` on `service_id`
- `UNIQUE INDEX idx_app_ref` on `reference_no`

---

## Table: `app_status_logs`

Append-only audit log. One row per status change. Powers the tracking timeline on the citizen dashboard.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key |
| `application_id` | CHAR(36) | No | — | FK → applications(id) CASCADE DELETE |
| `changed_by` | CHAR(36) | Yes | NULL | FK → users(id). NULL = system action |
| `old_status` | VARCHAR(20) | Yes | NULL | NULL on first insert (initial submission) |
| `new_status` | VARCHAR(20) | No | — | The status it changed to |
| `note` | TEXT | Yes | NULL | Officer's reason for this change |
| `created_at` | DATETIME | No | NOW() | Timestamp of the change |

**Index:**
- `INDEX idx_log_app` on `application_id` — timeline query fetches all logs for one application

**Important:** Never update or delete rows in this table. It is an audit trail.

---

## Table: `feedback`

One feedback record per approved application. The `UNIQUE` constraint on `application_id` prevents duplicate submissions.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key |
| `application_id` | CHAR(36) | No | — | FK → applications(id) CASCADE DELETE. UNIQUE |
| `user_id` | CHAR(36) | No | — | FK → users(id) CASCADE DELETE |
| `rating` | TINYINT | No | — | 1–5, enforced by CHECK constraint |
| `comment` | TEXT | Yes | NULL | Optional written feedback |
| `created_at` | DATETIME | No | NOW() | — |

---

## Common queries

### Get citizen's applications with service names
```sql
SELECT
  a.id,
  a.reference_no,
  a.status,
  a.submitted_at,
  s.name   AS service_name,
  s.category
FROM applications a
JOIN services s ON a.service_id = s.id
WHERE a.user_id = ?
  AND a.deleted_at IS NULL
ORDER BY a.submitted_at DESC;
```

### Get full timeline for one application
```sql
SELECT
  l.new_status,
  l.old_status,
  l.note,
  l.created_at,
  u.full_name AS changed_by_name
FROM app_status_logs l
LEFT JOIN users u ON l.changed_by = u.id
WHERE l.application_id = ?
ORDER BY l.created_at ASC;
```

### Admin: get all applications with citizen details
```sql
SELECT
  a.id,
  a.reference_no,
  a.status,
  a.submitted_at,
  a.officer_notes,
  u.full_name,
  u.email,
  u.phone,
  s.name AS service_name,
  s.category
FROM applications a
JOIN users u ON a.user_id = u.id
JOIN services s ON a.service_id = s.id
WHERE a.deleted_at IS NULL
ORDER BY a.submitted_at DESC;
```

### Admin: application count by status
```sql
SELECT
  status,
  COUNT(*) AS count
FROM applications
WHERE deleted_at IS NULL
GROUP BY status;
```

### Average service rating
```sql
SELECT
  s.name,
  ROUND(AVG(f.rating), 1) AS avg_rating,
  COUNT(f.id)             AS total_reviews
FROM services s
JOIN applications a ON a.service_id = s.id
JOIN feedback f ON f.application_id = a.id
GROUP BY s.id
ORDER BY avg_rating DESC;
```

The system uses five core tables:

- **users** — all system accounts (citizens, officers, admins)
- **services** — the catalogue of available council services (seeded)
- **applications** — each citizen application, with status tracking
- **app_status_logs** — append-only audit trail of every status change
- **feedback** — citizen ratings and comments after service completion

The `applications` table is the central entity. It references `users` (applicant and reviewing officer) and `services`. The `app_status_logs` table references `applications` and is populated on every status change — this powers the real-time tracking timeline.

### 3.2 Key design decisions

**UUID primary keys:** All tables use UUID v4 as primary keys (`CHAR(36)`) rather than auto-increment integers. This avoids exposing sequential IDs in URLs and enables safe data merging if the system is expanded.

**Soft deletes:** The `users` and `applications` tables include a `deleted_at` column rather than physical deletion. This preserves audit history and allows recovery from accidental deletion.

**Append-only status log:** The `app_status_logs` table is never updated or deleted. Every status change appends a new row with a timestamp and the name of the officer who made the change. This provides a complete audit trail that satisfies government transparency requirements.

**Separate feedback table:** Feedback is stored in its own table with a `UNIQUE` constraint on `application_id`. This prevents duplicate submissions and keeps the `applications` table focused on application processing data.

---

## 4. Technologies used

| Technology | Version | Role |
|------------|---------|------|
| React | 18 | Frontend user interface |
| Vite | 5 | Frontend build tool and development server |
| React Router | 6 | Client-side routing |
| Axios | 1.x | HTTP client with request/response interceptors |
| Node.js | 18 LTS | Backend JavaScript runtime |
| Express | 4.x | Web framework and API router |
| MySQL | 8.0 | Relational database |
| mysql2/promise | 3.x | MySQL driver with async/await support |
| JSON Web Tokens | 9.x | Stateless authentication |
| bcryptjs | 2.x | Password hashing |
| multer | 1.x | Multipart file upload handling |
| Nodemailer | 6.x | Transactional email delivery |
| helmet | 7.x | HTTP security headers |
| express-rate-limit | 7.x | API rate limiting |
| express-validator | 7.x | Input validation and sanitisation |
| Tailwind CSS | 3.x | Utility-first styling |
| Figma Make | — | UI wireframes and component design |
| GitHub Copilot | — | AI-assisted code generation |

---


## 5. Features implemented

### 5.1 Task 1 — System design and authentication

- System architecture defined (three-tier client-server)
- Full relational database schema with 5 tables, indexes, foreign keys, and seed data
- UI/UX wireframes for 5 screens created via Stitch by Google
- User registration with email validation and bcrypt password hashing
- User login returning a signed JWT
- Forgot-password flow with time-limited token and email delivery
- Role-based access control: citizen / officer / admin

### 5.2 Task 2 — Service requests and admin panel

- Service catalogue API returning 6 pre-seeded council services
- Application submission with auto-generated reference number (LCS-YYYY-NNNN)
- Status change logged automatically on every update
- Admin panel API: view all applications, approve/reject, upload PDF
- File upload restricted to PDF only, maximum 5MB via multer
- Email notifications on submission and status change via Nodemailer

### 5.3 Task 3 — Tracking and user dashboard

- Citizen dashboard showing application list with status badges
- Real-time timeline showing Submitted → Under Review → Decision with timestamps
- PDF download for approved applications (streamed server-side with ownership check)
- Feedback form with 1–5 star rating and comment (one per approved application)
- Admin dashboard with application count statistics

---

## 6. Challenges faced

*This section is critical for marks. Be specific and honest about real problems you encountered.*

### Challenge 1: JWT authentication on shared hosting

**Problem:** The shared hosting server at icuprojects.icu initially rejected requests with a `401 Unauthorized` response even when a valid token was provided. Investigation revealed that the Apache server was stripping the `Authorization` header before passing requests to the Node.js application.

**Solution:** Added an Apache `.htaccess` rule to pass the Authorization header through to the Node.js proxy:
```apache
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```
This required reading the Apache documentation and testing iteratively via SSH. After applying the fix, authentication worked correctly on the live server.

---

### Challenge 2: MySQL UUID() function compatibility

**Problem:** During local development, MySQL 8.0 accepted `DEFAULT (UUID())` as a column default. On the shared hosting server, which was running MySQL 5.7, this syntax was not supported and the schema import failed with `ERROR 1064`.

**Solution:** Removed `DEFAULT (UUID())` from the CREATE TABLE statements and moved UUID generation into the Node.js application code using the `uuid` npm package. The application now calls `const id = uuidv4()` before every INSERT and passes the ID explicitly. This made the schema compatible with both MySQL versions.

---

### Challenge 3: File upload path differences between local and server

**Problem:** PDF documents uploaded by officers were saved to an `uploads/` folder relative to the Node.js working directory. On the local machine this worked correctly. On the server, the working directory was different from what was expected, causing uploaded files to be saved to an inaccessible location and download requests to return 404.

**Solution:** Changed the multer `dest` configuration from a relative path to an absolute path using `path.join(__dirname, '../uploads')`. This anchored the upload directory to the `backend/` folder regardless of where Node.js was started from.

---

### Challenge 4: CORS configuration in production

**Problem:** After deploying the React frontend and Node.js backend as separate processes, the browser blocked all API requests with a CORS error. The backend was configured with `CLIENT_URL=http://localhost:5173` (the development value) and was rejecting requests from the live frontend domain.

**Solution:** Updated the `.env` file on the server to set `CLIENT_URL=https://yoursite.icuprojects.icu`. Also added the subdomain variant as a fallback. This taught me the importance of environment-specific configuration management — never assume development `.env` values will work in production.

---

## 7. Testing

### 7.1 Manual testing approach

Each API endpoint was tested individually using Postman before being integrated into the React frontend. A saved Postman collection was maintained throughout development with example requests for every endpoint.

The following end-to-end flows were tested manually on the live server:

| Flow | Steps | Result |
|------|-------|--------|
| Citizen registration | Register → login → receive JWT → access dashboard | Pass |
| Service application | Select service → submit → confirm reference number appears | Pass |
| Admin approval | Log in as officer → find application → approve → upload PDF | Pass |
| Citizen download | Refresh dashboard → see Approved status → download PDF | Pass |
| Email notification | Submit application → check inbox for confirmation email | Pass |
| Feedback submission | After approval → rate service 4 stars → submit | Pass |
| Role enforcement | Use citizen token on admin route → receive 403 | Pass |

### 7.2 Known limitations

- No automated unit or integration tests — time constraints during the semester prevented implementing a test suite. In a production system, Jest and Supertest would be used for backend route testing.
- Password reset flow was implemented in the backend but the frontend reset form was not completed due to time constraints. The endpoint is functional and can be tested via Postman.

---

## 8. Deployment

The system is deployed at: `https://[your-subdomain].icuprojects.icu`

**Deployment environment:**
- Host: icuprojects.icu shared hosting (purchased March 2026)
- Frontend: React build (`dist/`) served as static files from `public_html/`
- Backend: Node.js Express application running on port 3000, managed via cPanel Node.js manager
- Database: MySQL 8.0 on the shared host, accessed via phpMyAdmin for administration
- File storage: Uploaded PDFs stored in `/home/[account]/uploads/` (outside public web root)

**Deployment steps performed:**
1. Built React app: `npm run build`
2. Uploaded `dist/` contents to `public_html/` via cPanel File Manager
3. Uploaded `backend/` directory to home folder (not public)
4. Created `.env` file on server with production values
5. Imported `schema.sql` via phpMyAdmin
6. Started Node.js app via cPanel Node.js application manager
7. Configured `.htaccess` proxy rules for `/api/` routes

---

## 9. Conclusion

The Digital Local Council Service Management System was successfully designed, developed, and deployed within the project timeframe. The system achieves the core objectives set out in the project brief: citizens can submit applications, track their status, and download approved documents; council officers can manage the full application lifecycle through an administrative panel.

The project deepened practical skills in full-stack web development, database design, RESTful API design, JWT authentication, and cloud deployment. The challenges encountered during deployment — particularly around Apache proxy configuration and MySQL version differences — provided valuable experience with real-world production issues that are not encountered in a purely local development environment.

---

## References

- Express.js Documentation: https://expressjs.com
- JSON Web Tokens: https://jwt.io
- MySQL 8.0 Reference Manual: https://dev.mysql.com/doc/refman/8.0/en/
- React Documentation: https://react.dev
- Nodemailer Documentation: https://nodemailer.com
- bcrypt.js: https://github.com/dcodeIO/bcrypt.js
- ICU Project Brief: E-Governance & Digital Marketing Project Question 2026
