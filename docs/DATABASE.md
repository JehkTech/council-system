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

Stores secure tokens for the forgot-password flow. The raw token is emailed to the user; only its SHA-256 hash is stored in the database.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | CHAR(36) | No | UUID() | Primary key |
| `user_id` | CHAR(36) | No | — | FK → users(id) CASCADE DELETE |
| `token_hash` | VARCHAR(255) | No | — | SHA-256 of the emailed raw token |
| `expires_at` | DATETIME | No | — | Set to NOW() + 1 hour on insert |
| `used_at` | DATETIME | Yes | NULL | Set when token is consumed |
| `created_at` | DATETIME | No | NOW() | — |

**Why hash the token?** If the database is compromised, an attacker cannot use stored hashes to reset passwords. Only the recipient of the original email has the raw token.

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
