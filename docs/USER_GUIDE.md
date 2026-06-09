# User Guide — Digital Local Council System

## Quick Start

### Logging In

#### Admin/Officer Account
- **Email:** `admin@council.local`
- **Password:** `adminpass123`
- **Role:** Admin (full access to officer panel)

#### Dummy Citizen Accounts (Local Dev)
Only the admin user is seeded by default. Create dummy citizens in one of these ways:

1. **Register in the UI**
   - Go to `http://localhost:5173`
   - Click **Register**
   - Use any unique email + 8+ character password

2. **Insert a test user in MySQL**
   - Generate a bcrypt hash:
     ```bash
     node -e "const b=require('bcryptjs'); b.hash('testpass123', 12).then(console.log)"
     ```
   - Insert the user:
     ```sql
     INSERT INTO users (id, full_name, email, password_hash, role)
     VALUES (UUID(), 'Test Citizen', 'test.citizen@example.com', '<PASTE_HASH_HERE>', 'citizen');
     ```

Register new citizens by clicking the **Register** tab on the login page and filling in:
- Full name (required)
- Email (required, must be unique)
- Phone (optional)
- Password (minimum 8 characters)

### Accessing the Application

- **Frontend URL (local dev):** `http://localhost:5173`
- **Backend API URL (local dev):** `http://localhost:3000/api`

---

## User Workflows

### Citizen Workflow

1. **Register or Login**
   - Go to `http://localhost:5173`
   - Enter your email and password, or register a new account

2. **View Your Dashboard**
   - After login, you see your dashboard with:
     - Total applications count
     - Submitted applications count
     - Approved applications count
     - Table of all your applications with status, reference number, and submission date

3. **Apply for a Service**
   - Click the **"Apply for Service"** button
   - Select a service from the grid (e.g., Business Operating Permit)
   - Add optional notes in the "Applicant notes" field
   - Click **"Submit application"**
   - A success message shows your reference number (e.g., `LCS-2026-0001`)

4. **Track Your Application**
   - Return to the dashboard to see the new application in your table
   - Status updates from the officer will be visible in real time

5. **Download Approved Documents**
   - Once your application is **Approved** and a document is uploaded by an officer:
     - A **"Download"** link appears in the Document column
     - Click to download the PDF to your computer

---

### Officer/Admin Workflow

1. **Log In as Admin**
   - Go to `http://localhost:5173`
   - Email: `admin@council.local`
   - Password: `adminpass123`

2. **View All Applications**
   - After login, you see the **Officer Workspace**
   - The admin panel shows a table with:
     - Reference number
     - Citizen name and email
     - Service name
     - Current status

3. **Review an Application**
   - Click the **"Review"** button to view details
   - The review panel shows the applicant details and service information

4. **Approve an Application**
   - Click the **"Approve"** button
   - The citizen receives an approval email automatically
   - The application status changes to "Approved"

5. **Reject an Application**
   - Click the **"Reject"** button
   - The citizen receives a rejection email with any officer notes
   - The application status changes to "Rejected"

6. **Mark as Under Review**
   - Click the **"Review"** button to move to "Under Review" status
   - The citizen receives a notification email

---

## Database Guide — Viewing Updates in MySQL

### Connecting to MySQL

```bash
mysql -u council_user -p
# When prompted, enter the password from .env (default: council_pass)
# Then select the database:
USE council_db;
```

Or use MySQL Workbench:
1. Host: `localhost`
2. Port: `3306`
3. Username: `council_user` (from `.env`)
4. Password: (from `.env`)
5. Database: `council_db`

### Key Tables to Monitor

#### 1. **View All Users**
```sql
SELECT id, full_name, email, role, is_active, created_at FROM users;
```

#### 2. **View All Applications**
```sql
SELECT 
  a.reference_no,
  u.full_name,
  s.name as service_name,
  a.status,
  a.submitted_at,
  a.reviewed_at,
  a.officer_notes
FROM applications a
JOIN users u ON a.user_id = u.id
JOIN services s ON a.service_id = s.id
WHERE a.deleted_at IS NULL
ORDER BY a.submitted_at DESC;
```

#### 3. **View Application Timeline (Status History)**
```sql
SELECT 
  a.reference_no,
  asl.old_status,
  asl.new_status,
  asl.note,
  asl.created_at,
  u.full_name as changed_by
FROM app_status_logs asl
JOIN applications a ON asl.application_id = a.id
LEFT JOIN users u ON asl.changed_by = u.id
ORDER BY asl.created_at ASC;
```

#### 4. **View Specific Citizen's Applications**
```sql
SELECT 
  a.reference_no,
  s.name,
  a.status,
  a.submitted_at
FROM applications a
JOIN services s ON a.service_id = s.id
WHERE a.user_id = (SELECT id FROM users WHERE email = 'test.citizen@example.com')
  AND a.deleted_at IS NULL
ORDER BY a.submitted_at DESC;
```

#### 5. **View All Services Available**
```sql
SELECT code, name, category, is_active FROM services;
```

#### 6. **View Feedback (When Available)**
```sql
SELECT 
  f.rating,
  f.comment,
  f.created_at,
  u.full_name,
  a.reference_no
FROM feedback f
JOIN users u ON f.user_id = u.id
JOIN applications a ON f.application_id = a.id
ORDER BY f.created_at DESC;
```

### Common Tasks

#### Count Applications by Status
```sql
SELECT status, COUNT(*) as count
FROM applications
WHERE deleted_at IS NULL
GROUP BY status;
```

#### Find Applications Waiting for Officer Response
```sql
SELECT reference_no, full_name, service_name, submitted_at
FROM (
  SELECT 
    a.reference_no,
    u.full_name,
    s.name as service_name,
    a.submitted_at
  FROM applications a
  JOIN users u ON a.user_id = u.id
  JOIN services s ON a.service_id = s.id
  WHERE a.status IN ('submitted', 'pending_info')
    AND a.deleted_at IS NULL
) as pending
ORDER BY submitted_at ASC;
```

#### Reset a User's Password (Manual Testing Only)
```sql
-- Note: Passwords are hashed with bcrypt. Use the app's OTP forgot-password flow in production.
-- This is for testing only.
UPDATE users 
SET password_hash = '$2b$12$HKrMO9yhPyeBUE5SLdIMgOv69KEsqdYCxsqojqn/EMfn/Urq2.uUW'
WHERE email = 'test@example.com';
-- Password is now: testpass123
```

---

## Email Testing

### Sandbox Provider
- **Provider:** Mailtrap (configured in `.env`)
- **Inbox:** Check your Mailtrap dashboard at `https://mailtrap.io`
- **Emails sent for:**
  - User registration (not yet implemented)
  - Application submission
  - Status changes (under_review, approved, rejected)
  - Password reset

### Testing Email Flow

1. **Application Submission Email**
   - Submit a new application as a citizen
   - Check Mailtrap for an email with subject: `"Application submitted - LCS-2026-XXXX"`

2. **Status Change Email**
   - As admin, click "Approve" on an application
   - Check Mailtrap for an email with subject: `"Your application has been approved"`
   - The email includes a download link if a document was attached

3. **Rejection Email**
   - As admin, click "Reject" on an application
   - Add officer notes (e.g., "Missing supporting documents")
   - Check Mailtrap for rejection email with the notes included

---

## Common Issues & Troubleshooting

### "Cannot connect to backend"
- Ensure the backend is running: `npm start` in the `backend/` folder
- Backend should be on port 3000
- Check `.env` has `PORT=3000`

### "Email not sending"
- Verify SMTP credentials in `.env` are correct
- Check Mailtrap inbox for delivery status
- Emails are sent asynchronously; give them 2-3 seconds to appear

### "Cannot log in"
- Ensure email is exactly correct (case-insensitive but spaces matter)
- Password must be at least 8 characters
- Check that the user exists in the database: `SELECT * FROM users WHERE email = 'your.email@example.com';`

### MySQL Connection Refused
- Ensure MySQL is running: `mysql --version`
- Default port is 3306; check in `.env`
- Verify username and password in `.env` match your MySQL setup

---

## Demo Flow (5 Minutes)

1. **Register a new citizen account** (30 sec)
   - Click Register → Fill form → Create account

2. **Submit an application** (30 sec)
   - Click "Apply for Service" → Select "Business Operating Permit" → Add notes → Submit

3. **Login as admin** (30 sec)
   - Logout → Login as admin@council.local

4. **Approve the application** (30 sec)
   - Click "Approve" button on the application

5. **Check the database** (2 min)
   - Open MySQL → Run the "View All Applications" query
   - See the status changed from "submitted" to "approved"
   - Check Mailtrap for approval email

---

**You're all set! Enjoy exploring the system. 🎉**
### Quick "Latest Updates" Queries

#### Latest Applications (most recently updated)
```sql
SELECT reference_no, status, updated_at
FROM applications
WHERE deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 10;
```

#### Latest Status Changes
```sql
SELECT application_id, new_status, note, created_at
FROM app_status_logs
ORDER BY created_at DESC
LIMIT 10;
```
