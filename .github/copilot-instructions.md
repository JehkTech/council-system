# Copilot instructions

## Build and run

**Backend**
- Dev server: `cd backend && npm run dev`
- Start (prod-style): `cd backend && npm start`

**Frontend**
- Dev server: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Preview build: `cd frontend && npm run preview`

## High-level architecture

- Monorepo with `backend/` (Express API), `frontend/` (React + Vite SPA), and `database/` (MySQL schema + seed data).
- Three-tier flow: React SPA → Express JSON API (`/api/*`, Bearer JWT) → MySQL via `mysql2/promise` connection pool.
- Auth is JWT-based; the backend is stateless and roles are enforced in middleware (`authenticate`, `authorize`).
- File uploads are stored under `backend/uploads/` and served via the `/uploads` static route.
- Email notifications are sent from backend routes through a shared Nodemailer transporter in `utils/mailer.js`.

## Key conventions

- API responses are shaped as `{ data: ... }` on success and `{ error: 'CODE' }` on failure.
- Frontend uses a single Axios instance in `frontend/src/services/api.js` and injects `Authorization: Bearer <token>` from `localStorage`.
- Admin/officer capabilities are gated by role middleware; citizen-facing application queries always filter by `user_id = req.user.id`.
- Database access is raw SQL with parameterized queries (`?` placeholders); no ORM is used.
- Application reference numbers follow `LCS-YYYY-####` (see `routes/applications.js`).
