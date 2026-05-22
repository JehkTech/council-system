# GitHub Copilot Prompt Cheatsheet — Council System

A reference of effective prompts to use with GitHub Copilot at each stage of the project. Open the relevant file in VS Code before prompting — Copilot uses the open file as context.

---

## General rules for better Copilot output

- Open the file you want Copilot to write into before prompting
- Be specific: name the table, route path, and expected response format
- Give it one task at a time — compound requests produce messy code
- If the output is wrong, add a comment clarifying the constraint and re-prompt

---

## Week 1 — Authentication prompts

**In `routes/auth.js` — register route:**
```
// POST /auth/register
// Validate: full_name required, email must be valid, password min 8 chars (use express-validator)
// Check if email already exists in MySQL users table
// Hash password with bcryptjs cost 12
// Insert new user with UUID id, role='citizen'
// Return 201 { data: { token, user } } where token is signed JWT with 7d expiry
// Return 409 { error: 'EMAIL_IN_USE' } if duplicate
```

**In `routes/auth.js` — login route:**
```
// POST /auth/login
// Validate: email and password required
// Query users table by email where deleted_at IS NULL
// Compare password with bcrypt.compare
// Return 401 { error: 'INVALID_CREDENTIALS' } if no user or wrong password
// Return 200 { data: { token, user } } — exclude password_hash from user object
```

**In `middleware/auth.js` — authenticate:**
```
// Middleware: authenticate
// Extract Bearer token from Authorization header
// Verify with jwt.verify using process.env.JWT_SECRET
// Query DB for user by payload.id, check is_active = 1 and deleted_at IS NULL
// Attach req.user = { id, role }
// Return 401 if no header, 401 if token invalid, 401 if user not found
```

---

## Week 2 — Applications and admin prompts

**In `routes/applications.js` — submit application:**
```
// POST /applications
// Requires: authenticate middleware already applied
// Validate: service_id required (must be a valid UUID string)
// Generate reference number: LCS-{year}-{4-digit-padded-count}
// INSERT into applications: id=UUID, reference_no, user_id=req.user.id, service_id, applicant_notes, status='submitted'
// INSERT into app_status_logs: id=UUID, application_id, changed_by=req.user.id, new_status='submitted'
// Return 201 { data: { id, reference_no } }
```

**In `routes/applications.js` — get timeline:**
```
// GET /applications/:id/timeline
// Requires: authenticate middleware
// Query app_status_logs JOIN users (changed_by) for application_id = req.params.id
// Order by created_at ASC
// Return { data: [ { new_status, old_status, note, created_at, changed_by_name } ] }
// Return 403 if application does not belong to req.user.id (and user is not officer/admin)
```

**In `routes/admin.js` — approve/reject:**
```
// PATCH /admin/applications/:id
// Requires: authenticate + authorize('officer', 'admin') already applied
// Accept multipart/form-data via multer (single file named 'document', PDF only, max 5MB)
// Validate status is one of: under_review, pending_info, approved, rejected
// Get current status from DB for logging old_status
// UPDATE applications: status, officer_notes, reviewed_by=req.user.id, reviewed_at=NOW()
// If file uploaded: also update document_path and document_name
// INSERT into app_status_logs: old_status, new_status, note=officer_notes, changed_by=req.user.id
// Return 200 { data: { updated: true } }
```

---

## Week 3 — Frontend component prompts

**In `src/components/ui/StatusBadge.jsx`:**
```
// React component: StatusBadge
// Props: status (string)
// Maps status to background color:
//   submitted → yellow/amber background, dark amber text
//   under_review → blue background, dark blue text
//   approved → green background, dark green text
//   rejected → red background, dark red text
//   pending_info → orange background, dark orange text
// Returns a <span> pill with the status text, capitalize first letter, replace _ with space
// Use Tailwind CSS classes
```

**In `src/components/ui/TimelineStep.jsx`:**
```
// React component: TimelineStep
// Props: stage (string), status ('completed' | 'current' | 'pending'), timestamp (string or null)
// Renders a vertical timeline step:
//   completed: green filled circle with checkmark SVG icon, dark text, show timestamp
//   current: blue circle with animated pulse ring, bold text, show "In progress"
//   pending: gray empty circle, muted text, no timestamp
// Connect steps with a vertical line (colored green for completed, gray for pending)
// Use Tailwind CSS
```

**In `src/pages/Dashboard.jsx`:**
```
// React page: Dashboard
// On mount, fetch GET /api/applications using applicationsAPI.getAll()
// Show loading spinner while fetching
// Show 3 stat cards: Total, Pending (status=submitted or under_review), Approved (status=approved)
// Show applications in a table: reference_no, service_name, status (StatusBadge), submitted_at, View button
// If status=approved and document_path exists, also show Download button
// Download button calls applicationsAPI.download(id), creates blob URL, triggers file download
// If no applications, show empty state with "No applications yet" message and Apply Now button
// Use React Router Link for navigation
```

**In `src/pages/admin/AdminPanel.jsx`:**
```
// React page: AdminPanel
// On mount, fetch GET /api/admin/applications using adminAPI.getAll()
// Show 4 stat cards: Total, Pending (submitted), Under Review, Approved
// Show applications table with all columns from the API response
// Include status filter dropdown — updates a statusFilter state, filters applications client-side
// Include search input — filters by citizen name or reference_no client-side
// Click Review → open ReviewDrawer component with the selected application
// ReviewDrawer props: application, isOpen, onClose, onUpdate
// Inside ReviewDrawer: officer notes textarea, file upload input, Approve and Reject buttons
// On approve/reject, call adminAPI.update(id, formData), close drawer, re-fetch applications
```

---

## Week 4 — Utility and polish prompts

**Error boundary component:**
```
// React class component: ErrorBoundary
// Catches rendering errors for any wrapped component
// On error: show a simple "Something went wrong" card with a "Reload page" button
// Log error to console
// Reset on navigation (key prop with location.pathname)
```

**Private route component:**
```
// React component: PrivateRoute
// Props: children, allowedRoles (array of strings, default ['citizen', 'officer', 'admin'])
// Get token and user from localStorage
// If no token: redirect to /login using React Router Navigate
// If token exists but user.role not in allowedRoles: redirect to /unauthorized
// Otherwise: render children
```

**Axios error handler:**
```
// In src/services/api.js
// Add a response interceptor that:
//   - On 401: removes token from localStorage and redirects to /login
//   - On 403: redirects to /unauthorized page
//   - On 500: shows a toast notification "Server error. Please try again."
//   - Returns Promise.reject with the error code string from response.data.error
```
