-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE permission_type AS ENUM ('READ', 'WRITE', 'DELETE', 'UPDATE');

CREATE TYPE otp_purpose_type AS ENUM ('FORGOT_PASSWORD', 'TWO_FA_VERIFICATION');

CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    requested_api VARCHAR(255),
    app_version VARCHAR(50),
    system_name VARCHAR(100),
    system_version VARCHAR(50),
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    host_name VARCHAR(255),
    table_name VARCHAR(100),
    operation_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- session_id INT REFERENCES sessions(id) ON DELETE SET NULL,
    -- user_id INT REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT operation_type_check CHECK (operation_type IN ('VIEW', 'INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT severity_check CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Indexes for faster lookup based on filters
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON audit_logs(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_operation ON audit_logs(table_name, operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_requested_api ON audit_logs(requested_api);
CREATE INDEX IF NOT EXISTS idx_audit_logs_country ON audit_logs(country);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);


-- DB logs Table
CREATE TABLE IF NOT EXISTS db_audit_logs (
    id SERIAL PRIMARY KEY,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    table_name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(10) NOT NULL,
    db_user VARCHAR(100),
    db_name VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    triggered_by TEXT DEFAULT current_user,
    CONSTRAINT operation_type_check CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Additional Migrations will go from here........

-- ======================================
-- Roles Table
-- ======================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- Modules Table
-- ======================================
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- Permissions Table
-- ======================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_type permission_type NOT NULL,
    description TEXT,
    module_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_permissions_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- ======================================
-- Role Permissions Table
-- ======================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

-- ======================================
-- Media Metadata Table
-- ======================================
CREATE TABLE IF NOT EXISTS media_metadata (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(100) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- Users Table
-- ======================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    -- Basic Info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(100),

    -- Profile
    profile_photo_id INT,
    date_of_birth DATE,
    gender gender_type NOT NULL,

    -- Authentication
    password_hash TEXT NOT NULL,
    password_changed_at TIMESTAMPTZ, -- for tracking last password change

    -- Security
    last_login_at TIMESTAMPTZ,

    -- 2FA
    is_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_enabled_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- for tracking user global active status
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- for tracking user global deleted status
    deleted_at TIMESTAMPTZ,

    -- Audit
    created_by INT,
    updated_by INT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_users_profile_photo FOREIGN KEY (profile_photo_id) REFERENCES media_metadata(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ======================================
-- User Roles Table
-- ======================================
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE, -- one to one mapping with users table
    role_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ======================================
-- Organizations Table
-- ======================================
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    added_by_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_organizations_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ======================================
-- User Organizations Table
-- ======================================
-- Maps users to organizations with their role within that organization
-- Supports: super_admin, org_admin, clinician, researcher, patient roles
CREATE TABLE IF NOT EXISTS user_organizations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    added_by_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_user_organizations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_organizations_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_organizations_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_organizations_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_organizations UNIQUE (user_id, organization_id)
);

-- Indexes for user_organizations table
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role_id ON user_organizations(role_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_active ON user_organizations(is_active) WHERE is_active = TRUE;

-- ======================================
-- Clinics Table
-- ======================================
CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,

    -- Basic Info
    clinic_name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(100),

    -- Contact
    phone VARCHAR(20),
    clinic_email VARCHAR(100),
    website VARCHAR(255),

    -- Regulatory
    registration_number VARCHAR(100) UNIQUE,
    license_number VARCHAR(100),
    registration_valid_till DATE,
    tax_id VARCHAR(50),

    -- Classification
    clinic_type VARCHAR(50),

    -- Branding
    logo_id INT,

    -- Organization
    organization_id INT NOT NULL,

    -- Ownership & Audit
    added_by_id INT NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_clinics_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinics_logo FOREIGN KEY (logo_id) REFERENCES media_metadata(id) ON DELETE SET NULL,
    CONSTRAINT fk_clinics_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- ======================================
-- User Clinics Table
-- ======================================
-- Maps users to clinics. Users can belong to multiple clinics within their organization(s).
CREATE TABLE IF NOT EXISTS user_clinics (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL, -- allows multiple clinic assignments per user
    clinic_id INT NOT NULL,
    organization_id INT NOT NULL, -- Organization that owns the clinic. Added for data integrity and query optimization.
    role_id INT NOT NULL, -- role mapping to roles table
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    added_by_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_clinics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_clinics_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_clinics_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_clinics_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_clinics_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_clinics_user_clinic UNIQUE (user_id, clinic_id) -- User can belong to multiple clinics but only once per clinic
);

-- Index for user_clinics organization_id
CREATE INDEX IF NOT EXISTS idx_user_clinics_org_id ON user_clinics(organization_id);

-- ======================================
-- Patients Table
-- ======================================
CREATE TABLE IF NOT EXISTS patients ( -- patients == subjects
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) NOT NULL , -- not kept email as unique uuid will be used instead
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(100),
    blood_group VARCHAR(5),
    profile_photo_id INT,
    user_id INT, -- Optional reference to users table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_patients_profile_photo FOREIGN KEY (profile_photo_id) REFERENCES media_metadata(id) ON DELETE SET NULL,
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ======================================
-- Clinic Patients Table
-- ======================================
CREATE TABLE IF NOT EXISTS clinic_patients (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL,
    patient_id INT NOT NULL,
    added_by_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_clinic_patients_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinic_patients_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinic_patients_added_by FOREIGN KEY (added_by_id) REFERENCES user_clinics(id) ON DELETE CASCADE,
    CONSTRAINT uq_clinic_patients UNIQUE (clinic_id, patient_id)
);

-- ======================================
-- User OTP Table
-- ======================================
CREATE TABLE IF NOT EXISTS user_otp (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    otp_type otp_purpose_type NOT NULL DEFAULT 'FORGOT_PASSWORD',
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_otp_type UNIQUE (user_id, otp_type)
);

-- ======================================
-- Table Comments for Documentation
-- ======================================
COMMENT ON TABLE user_organizations IS 'Maps users to organizations with their role. Supports multi-tenant architecture where users can belong to multiple organizations with different roles.';
COMMENT ON COLUMN user_organizations.role_id IS 'Role within the organization: super_admin, org_admin, clinician, researcher, or patient';
COMMENT ON COLUMN user_organizations.is_active IS 'Whether the user is currently active in this organization';
COMMENT ON COLUMN user_organizations.is_deleted IS 'Soft delete flag for the user-organization relationship';

COMMENT ON TABLE user_clinics IS 'Maps users to clinics. Users can belong to multiple clinics within their organization(s).';
COMMENT ON COLUMN user_clinics.organization_id IS 'Organization that owns the clinic. Added for data integrity and query optimization.';
COMMENT ON COLUMN user_clinics.role_id IS 'Role within the clinic, references roles table';
