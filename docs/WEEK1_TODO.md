# Week 1 TODO - Foundation & Authentication

Source: `docs/SPRINT_PLAN.md`

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
- [x] `POST /api/auth/forgot-password`
- [x] `POST /api/auth/reset-password`
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
- [x] Raw token reset link emailed
- [x] Reset-password route verifies token hash
- [x] Reset-password route updates password
- [x] Reset-password route marks token as used
- [x] Mailtrap/Gmail test email verified

## Week 1 Definition of Done

- [x] `schema.sql` runs without errors on MySQL 8
- [x] All required tables created and seeded
- [x] `POST /api/auth/register` returns JWT
- [x] `POST /api/auth/login` returns JWT
- [x] `POST /api/auth/forgot-password` returns success message
- [x] React app runs on localhost:5173
- [ ] 5 wireframe screens generated in Stitch
- [ ] Task 1 submitted to `icudepartmentofict@gmail.com` with subject `E-Governance Task One`
