# Sprint Plan — Digital Local Council Service Management System

**Duration:** 4 weeks (Week 1 starts 25 Mar 2026)
**Methodology:** Agile sprint — 1-week cycles with daily self-check
**Solo developer tools:** Figma Make · GitHub Copilot · ChatGPT

---

## Sprint overview

| Week | Theme | Tasks covered | Key deliverable |
|------|-------|---------------|-----------------|
| 1 | Foundation + Auth | Task 1 catch-up | DB live, auth routes working, wireframes |
| 2 | Service engine + Admin | Task 2 catch-up | Applications CRUD, admin panel, email |
| 3 | Dashboard + Tracking | Task 3 core | Full citizen flow, feedback, file downloads |
| 4 | Deploy + Docs | Final submission | Live URL, user manual, technical report |

---

## Week 1 — Foundation & authentication (25–31 Mar)

**Sprint goal:** Database running locally, all auth endpoints working, wireframes submitted.

### Task 1.1 — System architecture document
**Skill:** software-architect
**Tool:** ChatGPT (draft) + this repo's ARCHITECTURE.md

Produce:
- Client-server diagram (use ARCHITECTURE.md as source)
- Folder structure decision (monorepo with backend/frontend split)
- ADR-001: Why modular monolith over microservices for this project

Done when: architecture doc exists, you can explain the three-layer design to your examiner.

---

### Task 1.2 — Database schema
**Skill:** backend-architect
**Tool:** GitHub Copilot (generate), MySQL Workbench (verify)

Steps:
1. Open `database/schema.sql`
2. Run it against a local MySQL 8.0 database
3. Verify with `SHOW TABLES;` and `DESCRIBE applications;`
4. Confirm foreign keys work by inserting a test user + test application

Done when: all 5 tables exist with correct relationships and the seed services data is populated.

```sql
-- Quick verification query
SELECT s.name, COUNT(a.id) as applications
FROM services s
LEFT JOIN applications a ON s.id = a.service_id
GROUP BY s.id;
```

---

### Task 1.3 — Authentication module
**Skill:** backend-architect
**Tool:** GitHub Copilot (scaffold), Postman (test)

Endpoints to build and test:

| Method | Route | Auth | Done? |
|--------|-------|------|-------|
| POST | `/api/auth/register` | None | [ ] |
| POST | `/api/auth/login` | None | [ ] |
| POST | `/api/auth/forgot-password` | None | [ ] |

Test each endpoint with Postman before moving on. See `docs/API_REFERENCE.md` for request/response format.

Copilot prompt to use:
```
Write an Express.js POST /auth/register route that:
- Validates email format and password min 8 chars using express-validator
- Checks for duplicate email in MySQL via mysql2/promise
- Hashes password with bcryptjs at cost factor 12
- Returns JWT signed with process.env.JWT_SECRET
- Returns { data: { token, user } } on success, { error: string } on failure
```

Done when: you can register a user, log in, and receive a valid JWT that decodes correctly.

---

### Task 1.4 — React project setup
**Skill:** frontend-developer
**Tool:** GitHub Copilot (component scaffold)

Steps:
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Create these placeholder page files now (content in Week 3):
- `src/pages/Login.jsx`
- `src/pages/Register.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/ApplyService.jsx`
- `src/pages/ApplicationDetail.jsx`
- `src/pages/admin/AdminPanel.jsx`

Done when: `npm run dev` shows the Vite welcome page without errors.

---

### Task 1.5 — Wireframes via Stitch
**Skill:** frontend-developer
**Tool:** Stitch by Google → import into Figma Make

Use the 5 prompts in `docs/STITCH_PROMPTS.md` to generate screens for:
1. Login / Register
2. Citizen Dashboard
3. Apply for Service
4. Application Tracking Detail
5. Admin Panel

After generation: import into Figma Make → use "Recreate as components" → export as JSX stubs.

Done when: 5 screen mockups exist and are attached to your Task 1 email submission.

---

### Task 1.6 — Password reset endpoint
**Skill:** backend-architect
**Tool:** GitHub Copilot + Nodemailer

Steps:
1. `forgot-password` route creates a SHA-256 hashed token, stores in `password_reset_tokens`, sets expiry 1 hour
2. Sends email with raw token link: `https://yoursite.com/reset-password?token=RAW_TOKEN`
3. `reset-password` route verifies token hash, updates password, marks token as used

Done when: reset email sends in test (use Mailtrap or Gmail test account).

---

### Week 1 — Definition of done checklist

- [ ] `schema.sql` runs without errors on MySQL 8
- [ ] All 5 tables created and seeded
- [ ] POST `/api/auth/register` returns JWT
- [ ] POST `/api/auth/login` returns JWT
- [ ] POST `/api/auth/forgot-password` returns success message
- [ ] React app runs on localhost:5173
- [ ] 5 wireframe screens generated in Stitch
- [ ] Task 1 submitted to icudepartmentofict@gmail.com with subject "E-Governance Task One"

---

## Week 2 — Service requests & admin panel (1–7 Apr)

**Sprint goal:** Citizens can submit applications. Officers can approve or reject. Email sends on status change.

### Task 2.1 — Services API
**Skill:** backend-architect
**Tool:** GitHub Copilot

```
Write a GET /api/services Express route that queries all active services
from MySQL and returns { data: [...services] }. Use the authenticate middleware.
```

Endpoint: `GET /api/services` — returns all active service types for the apply form dropdown.

---

### Task 2.2 — Applications API
**Skill:** backend-architect
**Tool:** GitHub Copilot

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/applications` | Get logged-in user's applications |
| POST | `/api/applications` | Submit a new application |
| GET | `/api/applications/:id` | Get single application detail |
| GET | `/api/applications/:id/timeline` | Get status history |
| GET | `/api/applications/:id/document` | Download approved PDF |

The POST route must:
1. Insert into `applications` with status `submitted`
2. Insert first entry into `app_status_logs`
3. Generate reference number format `LCS-YYYY-NNNN`
4. Trigger email notification (see Task 2.4)

---

### Task 2.3 — Admin panel API
**Skill:** backend-architect
**Tool:** GitHub Copilot

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/applications` | officer/admin | Get all applications with citizen details |
| PATCH | `/api/admin/applications/:id` | officer/admin | Update status, upload PDF |

The PATCH route must:
1. Accept `status`, `officer_notes` in body
2. Accept `document` file upload via multer (PDF only, max 5MB)
3. Log status change to `app_status_logs`
4. Trigger notification email on approve/reject

---

### Task 2.4 — Email notifications
**Skill:** backend-architect
**Tool:** Nodemailer + ChatGPT (email templates)

Events that trigger email:
- Application submitted → email citizen
- Status changed to `under_review` → email citizen
- Status changed to `approved` → email citizen (with download link)
- Status changed to `rejected` → email citizen (with officer notes reason)

Create `backend/utils/mailer.js`:
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});
module.exports = transporter;
```

Fallback if email fails: write a notification record to a `notifications` table and show it as an in-app badge. This is acceptable for the submission.

---

### Task 2.5 — Apply for Service UI
**Skill:** frontend-developer
**Tool:** Figma Make (reference screen 3) + GitHub Copilot

Components to build:
- `ServiceCard.jsx` — displays service name, category, description, Select button
- `ApplicationForm.jsx` — notes textarea + file upload zone
- `ReviewSummary.jsx` — confirms details before submit
- `ApplyService.jsx` — parent page with step state (1 / 2 / 3)

---

### Task 2.6 — Admin panel UI
**Skill:** frontend-developer
**Tool:** Figma Make (reference screen 5) + GitHub Copilot

Components to build:
- `ApplicationsTable.jsx` — sortable table with status badges
- `ReviewDrawer.jsx` — slide-over panel with approve/reject controls
- `StatusBadge.jsx` — reusable colored badge component
- `AdminPanel.jsx` — parent page, role-protected via `PrivateRoute`

---

### Task 2.7 — Server setup
**Skill:** sprint-prioritizer
**Tool:** cPanel at icuprojects.icu

Steps:
1. Log into cPanel
2. Create MySQL database + user, grant all privileges
3. Upload backend files via File Manager (or FTP)
4. Import `schema.sql` via phpMyAdmin
5. Create `.env` file on server with live DB credentials
6. Set up Node.js app in cPanel (or use PHP proxy if Node.js not available)
7. Test `https://yoursite.icuprojects.icu/health` returns `{ status: "ok" }`

---

### Week 2 — Definition of done checklist

- [ ] GET `/api/services` returns 6 services
- [ ] POST `/api/applications` creates record + logs status
- [ ] Admin PATCH route updates status and logs change
- [ ] File upload saves PDF to `/uploads/` folder
- [ ] Email sends on submission (test with Mailtrap)
- [ ] Apply for Service page submits to API
- [ ] Admin panel shows all applications and can approve/reject
- [ ] Task 2 submitted to icuprojects.icu/task

---

## Week 3 — Dashboard, tracking & feedback (8–21 Apr)

**Sprint goal:** Complete citizen journey end-to-end. User can apply → track → download → rate.

### Task 3.1 — User dashboard
**Skill:** frontend-developer
**Tool:** Figma Make (screen 2) + GitHub Copilot

Features:
- Summary cards: Total / Pending / Approved count
- Applications table with status badges
- Download button (only visible when `status === 'approved'` and `document_path` exists)
- Click row → navigate to ApplicationDetail page

---

### Task 3.2 — Application tracking timeline
**Skill:** frontend-developer
**Tool:** GitHub Copilot (CSS timeline component)

Build `TimelineComponent.jsx`:
- Fetches `/api/applications/:id/timeline`
- Renders vertical step list: Submitted → Under Review → Decision
- Completed steps show green checkmark + timestamp
- Current step shows animated blue dot
- Future steps show gray

This is the most visually important component for Task 3 marks — make it clean.

---

### Task 3.3 — Feedback system
**Skill:** frontend-developer + backend-architect
**Tool:** GitHub Copilot

Frontend (`FeedbackForm.jsx`):
- Star rating component (1–5, clickable)
- Comment textarea
- Submit button — only renders when application status is `approved`

Backend route:
```
POST /api/feedback
Body: { application_id, rating, comment }
Auth: citizen only, must own the application
```

---

### Task 3.4 — File download
**Skill:** backend-architect
**Tool:** GitHub Copilot

```javascript
// GET /api/applications/:id/document
// Streams the PDF only if:
//   - The requester is the application owner OR an admin/officer
//   - The application status is 'approved'
//   - document_path exists
```

Frontend: download button calls the endpoint with axios `responseType: 'blob'`, creates an object URL, triggers browser download.

---

### Task 3.5 — Responsive polish + bug fixes
**Skill:** frontend-developer

Checklist before Task 3 submission:
- [ ] All pages work on mobile (375px viewport)
- [ ] All private routes redirect to `/login` if no token
- [ ] Admin routes reject citizen-role tokens with 403
- [ ] Form validation shows inline errors
- [ ] Loading states on all API calls
- [ ] Empty states when no applications exist
- [ ] 404 page for unknown routes

---

### Week 3 — Definition of done checklist

- [ ] Citizen can register, log in, apply, see status, download PDF
- [ ] Timeline shows correct stages with timestamps
- [ ] Feedback form submits and is visible to admin
- [ ] Download only works for approved applications
- [ ] All pages are mobile-responsive
- [ ] Live URL deployed on icuprojects.icu
- [ ] Task 3 submitted — live URL sent to department email

---

## Week 4 — Deploy, test & document (22 Apr – 20 May)

**Sprint goal:** System live, all flows tested, documentation complete, final submission sent.

### Task 4.1 — End-to-end test run

Run through both journeys manually on the live server:

**Citizen journey:**
1. Register new account → check welcome email
2. Log in → see empty dashboard
3. Apply for Business Permit → confirm reference number appears
4. Log in as admin → approve the application, upload PDF
5. Log in as citizen → see Approved status + download button
6. Download PDF → confirm correct file opens
7. Submit feedback rating

**Admin journey:**
1. Log in as admin
2. See all applications in table
3. Filter by status
4. Approve one, reject one with notes
5. Check citizen receives email for each

---

### Task 4.2 — Technical report
**Skill:** software-architect
**Tool:** ChatGPT (draft) → edit with real details

See `docs/TECHNICAL_REPORT.md` for the full template. The critical section examiners grade hardest is **Challenges Faced** — be specific and honest. Three solid challenge descriptions are worth more than five generic ones.

---

### Task 4.3 — User manual
**Skill:** technical-writer
**Tool:** ChatGPT (draft) → add your real screenshots

See `docs/USER_MANUAL.md` for the full template. Take screenshots from the live deployed system, not localhost.

---

### Week 4 — Final submission checklist

- [ ] System deployed at `https://yoursite.icuprojects.icu`
- [ ] All 6 services available to apply for
- [ ] Admin panel accessible at `/admin`
- [ ] Email notifications working on live server
- [ ] User manual PDF exported
- [ ] Technical report PDF exported
- [ ] Submission email sent to department with URL + both documents

---

## Daily rhythm (suggested)

```
Morning  — pick up where you left off, fix any overnight issues
Working  — code one task fully before starting the next
Evening  — push to GitHub, note what's done and what's blocked
```

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Email not working on shared host | High | Medium | Use Mailtrap for dev; fallback to in-app notifications for submission |
| Node.js not available on icuprojects | Medium | High | Check early in Week 2; if PHP-only, port backend to PHP |
| MySQL UUID() not supported | Low | Medium | Use uuid npm package to generate IDs in code instead |
| File uploads path issue on server | Medium | Medium | Test upload route on live server early in Week 2, not Week 4 |
