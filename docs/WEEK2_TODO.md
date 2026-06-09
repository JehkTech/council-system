# Week 2 TODO - Service Engine & Admin

Source: `docs/SPRINT_PLAN.md`

## Week 2 Sprint Goal

Citizens can submit applications, officers can review them, and email notifications work on the sandbox provider.

## Week 2 Working Notes

- SMTP sandbox is already configured in `backend/.env`
- Current mailer uses `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, and `MAIL_FROM`
- A successful forgot-password-otp request should be used as the email smoke test unless a different sandbox inbox is requested
- Week 2 work will be documented here as it is completed

## Task 2.1 - Services API

- [x] `GET /api/services` exists
- [x] Route uses authentication middleware
- [x] Active services are returned in a JSON data envelope

## Task 2.2 - Applications API

- [x] `GET /api/applications` exists
- [x] `POST /api/applications` exists
- [x] `GET /api/applications/:id` exists
- [x] `GET /api/applications/:id/timeline` exists
- [x] `GET /api/applications/:id/document` exists
- [x] Reference number format uses `LCS-YYYY-NNNN`
- [x] Citizen ownership checks are enforced

## Task 2.3 - Admin Panel API

- [x] `GET /api/admin/applications` exists
- [x] `PATCH /api/admin/applications/:id` exists
- [x] Officer/admin authorization is enforced
- [x] PDF upload support is wired through multer

## Task 2.4 - Email Notifications

- [x] `backend/utils/mailer.js` exists
- [x] Sandbox SMTP provider is configured
- [x] Forgot-password flow sends a mail through the configured provider
- [ ] Application submitted email trigger
- [ ] Status change emails for review/approval/rejection

## Task 2.5 - Apply for Service UI

- [x] Service selection screen built
- [x] Notes/file form built
- [x] Review step built
- [x] Apply flow connected to API

## Task 2.6 - Admin Panel UI

- [x] Applications table built
- [x] Review drawer built
- [x] Status badge built
- [x] Admin page connected to API

## Task 2.7 - Server Setup

- [x] Local health check passes
- [x] Backend starts on configured port locally
- [ ] Live host cPanel setup confirmed
- [ ] Upload path verified on live host

## Week 2 Evidence Collected So Far

- [x] Sandbox email flow returns success from `/api/auth/forgot-password-otp`
- [x] Application submission sends a notification email through the configured sandbox provider
- [x] Application status updates send a notification email through the configured sandbox provider
- [x] Browser login redirects to the citizen dashboard
- [x] Existing UI already covers citizen dashboard and auth screens
- [x] Citizen apply flow renders and submits a live application in the browser
- [x] Admin panel renders live application rows in the browser

## Server Setup Notes

- Local backend health check is passing on `/health`
- Backend starts cleanly on the configured local port
- Live cPanel deployment still needs to be confirmed separately
- If the host URL or SSH/FTP access changes, update the deployment notes before testing there
