# API Reference — Digital Local Council Service Management System

**Base URL (local):** `http://localhost:3000/api`
**Base URL (live):** `https://yoursite.icuprojects.icu/api`
**Content-Type:** `application/json` (all requests and responses)
**Authentication:** Bearer JWT in `Authorization` header

---

## Response envelope

All responses use this structure:

```json
// Success
{ "data": { ... } }

// Success (list)
{ "data": [ ... ] }

// Error
{ "error": "ERROR_CODE_STRING" }
```

---

## Error codes

| Code | HTTP status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | No token or token expired |
| `TOKEN_INVALID` | 401 | Token signature invalid or malformed |
| `FORBIDDEN` | 403 | Token valid but role not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `EMAIL_IN_USE` | 409 | Registration email already registered |
| `INVALID_CREDENTIALS` | 401 | Login — wrong email or password |
| `INVALID_INPUT` | 400 | Validation failed — see message for detail |
| `INVALID_STATUS` | 400 | Admin patch — status not in allowed list |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error |

---

## Authentication routes

### POST /auth/register

Register a new citizen account.

**Auth required:** No

**Request body:**
```json
{
  "full_name": "John Banda",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+260971234567"
}
```

| Field | Required | Validation |
|-------|----------|------------|
| `full_name` | Yes | Non-empty string |
| `email` | Yes | Valid email format |
| `password` | Yes | Minimum 8 characters |
| `phone` | No | Any string |

**Response 201:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Banda",
      "email": "john@example.com",
      "role": "citizen"
    }
  }
}
```

**Response 409 — email in use:**
```json
{ "error": "EMAIL_IN_USE" }
```

---

### POST /auth/login

Log in with email and password.

**Auth required:** No

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response 200:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Banda",
      "email": "john@example.com",
      "role": "citizen",
      "is_active": 1
    }
  }
}
```

**Response 401:**
```json
{ "error": "INVALID_CREDENTIALS" }
```

---

### POST /auth/forgot-password-otp

Send a 6-digit password reset OTP to the provided email address. Always returns success — does not reveal whether the email exists. Any previous reset tokens for the user are invalidated before a new OTP is issued. OTPs expire after **15 minutes**.

**Auth required:** No

**Request body:**
```json
{ "email": "john@example.com" }
```

**Response 200 (always):**
```json
{
  "data": {
    "message": "If that email exists, an OTP was sent."
  }
}
```

---

### POST /auth/reset-password-otp

Reset a password using the 6-digit OTP sent by email.

**Auth required:** No

**Request body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "newsecurepassword123"
}
```

| Field | Required | Validation |
|-------|----------|------------|
| `email` | Yes | Valid email address |
| `otp` | Yes | Exactly 6 numeric digits |
| `password` | Yes | Minimum 8 characters |

**Response 200:**
```json
{ "data": { "updated": true } }
```

**Response 400:**
```json
{ "error": "TOKEN_INVALID" }
```

---

## Services routes

### GET /services

Get all active service types (used to populate the apply form).

**Auth required:** Yes (citizen, officer, admin)

**Implemented in:** `backend/routes/services.js`

**Response 200:**
```json
{
  "data": [
    {
      "id": "...",
      "code": "BUSINESS_PERMIT",
      "name": "Business Operating Permit",
      "category": "permit",
      "description": "Required for all business operations within council jurisdiction."
    },
    {
      "id": "...",
      "code": "BIRTH_CERT",
      "name": "Birth Registration Certificate",
      "category": "certificate",
      "description": null
    }
  ]
}
```

---

## Applications routes (citizen)

### GET /applications

Get all applications submitted by the currently authenticated citizen.

**Auth required:** Yes (citizen)

**Response 200:**
```json
{
  "data": [
    {
      "id": "abc123",
      "reference_no": "LCS-2026-0001",
      "status": "approved",
      "service_name": "Business Operating Permit",
      "category": "permit",
      "submitted_at": "2026-03-01T08:30:00Z",
      "document_path": "/uploads/abc123.pdf",
      "document_name": "Business_Permit_LCS-2026-0001.pdf"
    }
  ]
}
```

---

### POST /applications

Submit a new service application.

**Auth required:** Yes (citizen)

**Request body:**
```json
{
  "service_id": "service-uuid-here",
  "applicant_notes": "I am applying for a new food vending stall at Kamwala market."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `service_id` | Yes | Must match an active service ID |
| `applicant_notes` | No | Max TEXT length |

**Response 201:**
```json
{
  "data": {
    "id": "new-application-uuid",
    "reference_no": "LCS-2026-0012"
  }
}
```

---

### GET /applications/:id

Get full details of a single application. Citizens can only access their own.

**Auth required:** Yes (citizen — own only; officer/admin — any)

**Response 200:**
```json
{
  "data": {
    "id": "abc123",
    "reference_no": "LCS-2026-0001",
    "status": "approved",
    "applicant_notes": "Applying for food stall permit.",
    "officer_notes": "All documents verified. Permit granted.",
    "document_path": "/uploads/abc123.pdf",
    "document_name": "Business_Permit_LCS-2026-0001.pdf",
    "submitted_at": "2026-03-01T08:30:00Z",
    "reviewed_at": "2026-03-05T14:00:00Z",
    "service_name": "Business Operating Permit"
  }
}
```

---

### GET /applications/:id/timeline

Get the status change history for an application (powers the tracking timeline UI).

**Auth required:** Yes (citizen — own only)

**Response 200:**
```json
{
  "data": [
    {
      "id": "log-1",
      "new_status": "submitted",
      "old_status": null,
      "note": null,
      "created_at": "2026-03-01T08:30:00Z",
      "changed_by_name": "John Banda"
    },
    {
      "id": "log-2",
      "new_status": "under_review",
      "old_status": "submitted",
      "note": null,
      "created_at": "2026-03-03T09:15:00Z",
      "changed_by_name": "Officer Mwale"
    },
    {
      "id": "log-3",
      "new_status": "approved",
      "old_status": "under_review",
      "note": "Documents verified. Permit approved for 1 year.",
      "created_at": "2026-03-05T14:00:00Z",
      "changed_by_name": "Officer Mwale"
    }
  ]
}
```

---

### GET /applications/:id/document

Download the approved PDF document for an application.

**Auth required:** Yes (citizen — own only; officer/admin — any)

**Conditions:** Application status must be `approved` and `document_path` must exist.

**Response 200:** Binary PDF stream with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Business_Permit_LCS-2026-0001.pdf"
```

**Response 403:** Application not approved or document not yet uploaded.

---

## Feedback routes

### POST /feedback

Submit a rating and comment for a completed application. Can only be submitted once per application.

**Auth required:** Yes (citizen)

**Request body:**
```json
{
  "application_id": "abc123",
  "rating": 4,
  "comment": "Process was smooth. Approval came within a week."
}
```

| Field | Required | Validation |
|-------|----------|------------|
| `application_id` | Yes | Must be approved, owned by requester |
| `rating` | Yes | Integer 1–5 |
| `comment` | No | Optional text |

**Response 201:**
```json
{ "data": { "created": true } }
```

**Response 409:** Feedback already submitted for this application.

---

## Admin routes

All routes require role `officer` or `admin`. Citizens receive `403 FORBIDDEN`.

### GET /admin/applications

Get all applications in the system with citizen details.

**Auth required:** Yes (officer, admin)

**Query parameters (optional):**

| Param | Example | Effect |
|-------|---------|--------|
| `status` | `?status=submitted` | Filter by status |
| `service_id` | `?service_id=uuid` | Filter by service type |

**Response 200:**
```json
{
  "data": [
    {
      "id": "abc123",
      "reference_no": "LCS-2026-0001",
      "status": "submitted",
      "submitted_at": "2026-03-01T08:30:00Z",
      "full_name": "John Banda",
      "email": "john@example.com",
      "phone": "+260971234567",
      "service_name": "Business Operating Permit",
      "category": "permit",
      "applicant_notes": "Food stall at Kamwala market.",
      "officer_notes": null
    }
  ]
}
```

---

### PATCH /admin/applications/:id

Update application status. Optionally upload an approved PDF document.

**Auth required:** Yes (officer, admin)

**Content-Type:** `multipart/form-data` (when uploading a file) OR `application/json` (status update only)

**Form fields:**

| Field | Required | Notes |
|-------|----------|-------|
| `status` | Yes | Must be `under_review`, `pending_info`, `approved`, or `rejected` |
| `officer_notes` | No | Reason for decision — important for rejected applications |
| `document` | No (required for approve) | PDF file, max 5MB |

**Request example (approval with file):**
```
PATCH /api/admin/applications/abc123
Content-Type: multipart/form-data

status = approved
officer_notes = All documents verified. Permit valid for 12 months.
document = [PDF file binary]
```

**Response 200:**
```json
{ "data": { "updated": true } }
```

**Response 400 — invalid status:**
```json
{ "error": "INVALID_STATUS" }
```

**Week 1 frontend note:** The local admin panel can update `status` and `officer_notes` without uploading a PDF. A citizen download link appears only when an approved application has a `document_path`.

---

## JWT token payload

The token returned by `/auth/login` and `/auth/register` decodes to:

```json
{
  "id": "user-uuid",
  "role": "citizen",
  "iat": 1711929600,
  "exp": 1712534400
}
```

The `role` field is used by the frontend to show/hide admin navigation and by the backend middleware to protect admin routes.

Store the token in `localStorage` and attach it to every request:

```javascript
// In your Axios instance (src/services/api.js)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
