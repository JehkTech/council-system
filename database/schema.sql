-- ============================================================
-- Digital Local Council Service Management System
-- Database Schema — Task 1
-- ============================================================

-- Drop order respects FK dependencies
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS app_status_logs;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS users;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  NULL,
    role          ENUM('citizen','officer','admin') NOT NULL DEFAULT 'citizen',
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at    DATETIME     NULL
);

CREATE INDEX idx_users_email_deleted ON users(email, deleted_at); -- fast login lookup
CREATE INDEX idx_users_role_deleted  ON users(role, deleted_at);  -- admin panel filter

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE password_reset_tokens (
    id         CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id    CHAR(36)  NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,         -- store SHA-256 of raw token, never raw
    expires_at DATETIME  NOT NULL,
    used_at    DATETIME  NULL,                       -- NULL = not yet used
    created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prt_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);

-- ============================================================
-- SERVICES  (the catalogue — permits, certs, registrations)
-- ============================================================
CREATE TABLE services (
    id          CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    code        VARCHAR(50)  NOT NULL UNIQUE,        -- e.g. 'BUSINESS_PERMIT'
    name        VARCHAR(150) NOT NULL,               -- e.g. 'Business Operating Permit'
    category    ENUM('permit','certificate','registration') NOT NULL,
    description TEXT         NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default services (run after CREATE)
INSERT INTO services (code, name, category) VALUES
  ('BUSINESS_PERMIT',     'Business Operating Permit',       'permit'),
  ('CONSTRUCTION_PERMIT', 'Construction/Building Permit',    'permit'),
  ('EVENT_PERMIT',        'Public Event Permit',             'permit'),
  ('BIRTH_CERT',          'Birth Registration Certificate',  'certificate'),
  ('RESIDENCE_CERT',      'Residence Certificate',           'certificate'),
  ('COMMUNITY_REG',       'Community Organisation Registration', 'registration');

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
    id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    reference_no     VARCHAR(20)  NOT NULL UNIQUE,               -- e.g. LCS-2026-0001
    user_id          CHAR(36)     NOT NULL,
    service_id       CHAR(36)     NOT NULL,
    status           ENUM(
                       'draft',
                       'submitted',
                       'under_review',
                       'pending_info',
                       'approved',
                       'rejected'
                     ) NOT NULL DEFAULT 'submitted',
    applicant_notes  TEXT         NULL,                          -- notes from citizen
    officer_notes    TEXT         NULL,                          -- internal officer remarks
    reviewed_by      CHAR(36)     NULL,                          -- officer who acted
    reviewed_at      DATETIME     NULL,
    document_path    VARCHAR(500) NULL,                          -- relative path on server
    document_name    VARCHAR(255) NULL,
    submitted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at       DATETIME     NULL,
    CONSTRAINT fk_app_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_app_service
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_app_reviewed_by
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_app_user_deleted   ON applications(user_id, deleted_at);
CREATE INDEX idx_app_status_deleted ON applications(status, deleted_at);
CREATE INDEX idx_app_service ON applications(service_id);
CREATE INDEX idx_app_ref     ON applications(reference_no);

-- ============================================================
-- APPLICATION STATUS LOGS  (tracking timeline)
-- ============================================================
CREATE TABLE app_status_logs (
    id             CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    application_id CHAR(36)  NOT NULL,
    changed_by     CHAR(36)  NULL,                               -- NULL = system
    old_status     VARCHAR(20) NULL,
    new_status     VARCHAR(20) NOT NULL,
    note           TEXT      NULL,                               -- reason for change
    created_at     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_changed_by
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_log_app ON app_status_logs(application_id);     -- timeline queries

-- ============================================================
-- FEEDBACK
-- ============================================================
CREATE TABLE feedback (
    id             CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    application_id CHAR(36)     NOT NULL UNIQUE,
    user_id        CHAR(36)     NOT NULL,
    rating         TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT         NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- UNIQUE on application_id ensures one feedback per approved application
