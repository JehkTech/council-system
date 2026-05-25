# Week 3 TODO - Dashboard, Tracking & Feedback

Source: `docs/SPRINT_PLAN.md`

## Week 3 Sprint Goal

Complete the citizen journey end to end. Users can apply, track status, download approved documents, and submit feedback.

## Week 3 Working Notes

- Week 2 backend routes already exist and have been smoke-tested locally
- Week 2 apply and admin screens now use separate page components
- Week 3 work will be documented here as each slice is completed

## Week 3 Planning & Ops

- [x] Start Week 3 planning
- [ ] Verify server setup (hosting, DB, env, /health)
- [ ] Week 1 + Week 2 regression checks (admin + citizen flows)

## Task 3.1 - User Dashboard

- [ ] Summary cards built
- [ ] Applications table built
- [ ] Download button shown only when approved
- [ ] Row click navigates to application detail
- [ ] Refine dashboard pages (layout polish + empty/loading states)

## Task 3.2 - Application Tracking Timeline

- [ ] Timeline component built
- [ ] Submitted / Under Review / Decision states rendered
- [ ] Completed steps show timestamps
- [ ] Current step highlighted clearly
- [ ] Add tracking timeline to application detail page

## Task 3.3 - Feedback System

- [ ] Star rating component built
- [ ] Comment form built
- [ ] Submit button shown only when approved
- [ ] POST /api/feedback wired
- [ ] Add feedback form to application detail page

## Task 3.4 - File Download

- [ ] Approved PDF download works from browser
- [ ] Download uses blob response handling
- [ ] Access control is preserved
- [ ] Prepare download flow (button + filename + error state)

## Task 3.5 - Responsive Polish + Bug Fixes

- [ ] Mobile layout verified at 375px
- [ ] Private routes still redirect correctly
- [ ] Empty states and loading states are present
- [ ] 404 page is present for unknown routes

## Week 3 Evidence Collected So Far

- [x] Citizen dashboard is already functional in the browser
- [x] Apply flow submits a live application in the browser
- [x] Admin panel renders live application rows in the browser
- [x] Backend supports application detail and timeline reads
