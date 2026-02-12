-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE permission_type AS ENUM ('READ', 'WRITE', 'DELETE', 'UPDATE');

CREATE TYPE otp_purpose_type AS ENUM ('forgot_password', '2fa_verification');

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
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
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
    gender VARCHAR(20),

    -- Authentication
    password_hash TEXT NOT NULL,
    password_changed_at TIMESTAMPTZ,

    -- Security
    last_login_at TIMESTAMPTZ,

    -- 2FA
    is_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_enabled_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
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
    user_id INT NOT NULL UNIQUE,
    role_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ======================================
-- Clinics Table
-- ======================================
CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,

    -- Basic Info
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(100),
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

    -- Ownership & Audit
    added_by_id INT NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_clinics_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinics_logo FOREIGN KEY (logo_id) REFERENCES media_metadata(id) ON DELETE SET NULL
);

-- ======================================
-- User Clinics Table
-- ======================================
CREATE TABLE IF NOT EXISTS user_clinics (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    clinic_id INT NOT NULL,
    user_clinical_role VARCHAR(50) NOT NULL DEFAULT 'doctor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    added_by_id INT NOT NULL,
    CONSTRAINT fk_user_clinics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_clinics_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_clinics_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ======================================
-- Patients Table
-- ======================================
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(100),
    blood_group VARCHAR(5),
    profile_photo_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_patients_profile_photo FOREIGN KEY (profile_photo_id) REFERENCES media_metadata(id) ON DELETE SET NULL
);

-- ======================================
-- Clinic Patients Table
-- ======================================
CREATE TABLE IF NOT EXISTS clinic_patients (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL,
    patient_id INT NOT NULL,
    clinician_id INT NOT NULL,
    added_by_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_clinic_patients_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinic_patients_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinic_patients_clinician FOREIGN KEY (clinician_id) REFERENCES user_clinics(id) ON DELETE CASCADE,
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
    otp_type otp_purpose_type NOT NULL DEFAULT 'forgot_password',
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_otp_type UNIQUE (user_id, otp_type)
);
