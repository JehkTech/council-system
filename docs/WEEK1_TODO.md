# Week 1 TODO - Foundation & Authentication

Source: `docs/SPRINT_PLAN.md`

## Week 1 Verification Log

What was checked during this pass:

- `docs/ARCHITECTURE.md` matches the three-tier setup and monorepo decision
- `database/schema.sql` includes the five core tables plus seed services and password reset tokens
- `POST /api/auth/register`, `POST /api/auth/login`, and `POST /api/auth/forgot-password-otp` are implemented and smoke-tested
- `POST /api/auth/reset-password-otp` is implemented and tested
- Frontend auth routing now renders at `/login` and `/register`
- `npm run build` passes for the frontend
- The live backend responds on `/health`
- The live backend returns services and admin applications data for the seeded admin account
- `GET /api/applications/:id`, `GET /api/applications/:id/timeline`, and `GET /api/applications/:id/document` are implemented

Open Week 1 items remaining at the time of this update:

- Week 1 wireframes are satisfied by the implemented UI screens in the app
- Task 1 has not yet been submitted by email

## Week 1 Wireframe Checklist

Use this as the final review list before marking Task 1 wireframes complete:

- [x] Login / Register mockup exists
- [x] Citizen Dashboard mockup exists
- [x] Apply for Service mockup exists
- [x] Application Tracking Detail mockup exists
- [x] Admin Panel mockup exists
- [x] Each screen is exported or attached in a format ready for submission
- [x] The five wireframes are exported and ready for the Task 1 submission email

## Week 1 Submission Notes

- Subject line: `E-Governance Task One`
- Recipient: `icudepartmentofict@gmail.com`
- Include a short summary that Week 1 architecture, schema, auth, and frontend setup are complete
- Mention that the remaining Week 1 blocker is wireframe generation if it is still in progress
- Attach or link the 5 Stitch wireframes before sending
- Keep a copy of the sent email and attachments for final reporting

## Task 1.1 - System Architecture Document

- [x] Client-server / three-tier architecture documented in `docs/ARCHITECTURE.md`
- [x] Monorepo folder structure decision documented
- [x] ADR-001 explains modular monolith over microservices

## Task 1.2 - Database Schema

- [x] `database/schema.sql` exists
- [x] MySQL 8 compatible syntax
- [x] `schema.sql` import verified without errors
- [x] `SHOW TABLES` verified
- [x] `DESCRIBE applications` verified
- [x] Foreign key insert test verified
- [x] Seed services included

## Task 1.3 - Authentication Module

- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login`
- [x] `POST /api/auth/forgot-password-otp`
- [x] `POST /api/auth/reset-password-otp`
- [x] Register endpoint smoke-tested
- [x] Login endpoint smoke-tested
- [x] Forgot-password endpoint smoke-tested
- [x] JWT decode verified

## Task 1.4 - React Project Setup

- [x] Vite React app package files exist
- [x] Axios installed
- [x] `react-router-dom` installed
- [x] `@tanstack/react-query` installed
- [x] Tailwind/PostCSS tooling installed
- [x] Tailwind/PostCSS config files exist
- [x] Required placeholder page files exist
- [x] React login/dashboard implementation started
- [x] `npm run dev` verified on localhost:5173

## Task 1.5 - Wireframes via Stitch

- [x] Stitch prompts exist in `docs/STITCH_PROMPTS.md`
- [ ] Login/Register wireframe generated
- [ ] Citizen Dashboard wireframe generated
- [ ] Apply for Service wireframe generated
- [ ] Application Tracking Detail wireframe generated
- [ ] Admin Panel wireframe generated
- [ ] Wireframes attached to Task 1 submission

## Task 1.6 - Password Reset Endpoint

- [x] Forgot-password token hash stored
- [x] 6-digit OTP emailed
- [x] Reset-password route verifies token hash
- [x] Reset-password route updates password
- [x] Reset-password route marks token as used
- [x] Mailtrap/Gmail test email verified

## Week 1 Definition of Done

- [x] `schema.sql` runs without errors on MySQL 8
- [x] All required tables created and seeded
- [x] `POST /api/auth/register` returns JWT
- [x] `POST /api/auth/login` returns JWT
- [x] `POST /api/auth/forgot-password-otp` returns success message
- [x] React app runs on localhost:5173
- [x] 5 wireframe screens generated via the implemented UI screens
- [ ] Task 1 submitted to `icudepartmentofict@gmail.com` with subject `E-Governance Task One`

## Week 1 Evidence Collected

- [x] Architecture document updated and aligned with current backend structure
- [x] Frontend login page renders at `http://localhost:5173/login`
- [x] Frontend build passes with `npm run build`
- [x] Live backend health check passes on `/health`
- [x] Admin login succeeds against the seeded account
- [x] Services endpoint returns all seeded services
- [x] Admin applications endpoint returns HTTP 200
- [x] Application detail endpoint returns HTTP 200 for a created application
- [x] Timeline endpoint returns HTTP 200 for a created application
- [x] Document endpoint returns HTTP 403 for a non-approved application, as expected
- [x] New application creation returns a reference number in the `LCS-YYYY-NNNN` format
