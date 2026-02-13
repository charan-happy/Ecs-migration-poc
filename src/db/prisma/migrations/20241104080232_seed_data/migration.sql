-- ======================================
-- Seed Data Migration
-- ======================================
-- This migration seeds initial data:
-- 1. All system roles
-- 2. All system modules
-- 3. All permissions (READ, WRITE, DELETE, UPDATE) for each module
-- 4. Super admin user account
-- 5. Super admin role assignment

-- ======================================
-- Roles Seed Data
-- ======================================
-- Insert all system roles if they don't exist
INSERT INTO roles (name, description)
VALUES ('super_admin', 'Super administrator with full system access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('org_admin', 'Organization administrator who manages their organization')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('clinician', 'Clinical staff member who treats patients')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('researcher', 'Researcher who accesses research data')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('patient', 'Patient role for accessing personal health records')
ON CONFLICT (name) DO NOTHING;

-- Legacy role names (for backward compatibility if needed)
INSERT INTO roles (name, description)
VALUES ('ADMIN', 'Admin role (legacy)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('CLINIC_ADMIN', 'Clinic admin role (legacy)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('CLINICIAN', 'Clinic staff role (legacy)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES ('RESEARCHER', 'Researcher role (legacy)')
ON CONFLICT (name) DO NOTHING;

-- ======================================
-- Modules Seed Data
-- ======================================
-- Insert all system modules if they don't exist
INSERT INTO modules (name, description)
VALUES ('users', 'User management module for platform users')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('organizations', 'Organization management module')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('clinics', 'Clinic management module')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('patients', 'Patient management module')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('user_organizations', 'User-Organization relationship management')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('user_clinics', 'User-Clinic relationship management')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('clinic_patients', 'Clinic-Patient relationship management')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('roles', 'Role management module')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('permissions', 'Permission management module')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('modules', 'Module management')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('media', 'Media and file management module')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('audit_logs', 'Audit logs and system activity tracking')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name, description)
VALUES ('admin', 'Admin operations module (super admin only)')
ON CONFLICT (name) DO NOTHING;

-- ======================================
-- Permissions Seed Data
-- ======================================
-- Create READ, WRITE (CREATE), UPDATE, DELETE permissions for each module
DO $$
DECLARE
    module_record RECORD;
    perm_type permission_type;
BEGIN
    -- Loop through all modules
    FOR module_record IN SELECT id, name FROM modules LOOP
        -- Create permissions for each permission type
        FOR perm_type IN SELECT unnest(ARRAY['READ', 'WRITE', 'UPDATE', 'DELETE']::permission_type[]) LOOP
            -- Check if permission already exists before inserting
            IF NOT EXISTS (
                SELECT 1 FROM permissions
                WHERE module_id = module_record.id
                AND permission_type = perm_type
            ) THEN
                INSERT INTO permissions (permission_type, description, module_id, created_at, updated_at)
                VALUES (
                    perm_type,
                    CASE perm_type
                        WHEN 'READ' THEN 'Read access to ' || module_record.name
                        WHEN 'WRITE' THEN 'Create access to ' || module_record.name
                        WHEN 'UPDATE' THEN 'Update access to ' || module_record.name
                        WHEN 'DELETE' THEN 'Delete access to ' || module_record.name
                    END,
                    module_record.id,
                    NOW(),
                    NOW()
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ======================================
-- Super Admin User Seed Data
-- ======================================
-- Create super admin user
-- Default password: Admin@123 (MUST be changed on first login)
--
-- IMPORTANT: The password hash below is a bcrypt hash for 'Admin@123'
-- Generated using: bcrypt.hash('Admin@123', 10)
-- To generate a new hash, run in Node.js:
--   const bcrypt = require('bcrypt');
--   bcrypt.hash('your_password', 10).then(hash => console.log(hash));

-- Enable pgcrypto extension if not already enabled (for future password operations)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create super admin user with hashed password
-- Password: Admin@123
INSERT INTO users (
    name,
    email,
    phone,
    gender,
    password_hash,
    is_active,
    is_deleted,
    created_at,
    updated_at
) VALUES (
    'Super Administrator',
    'superadmin@simbex.com',
    '+10000000000',
    'OTHER',
    -- Bcrypt hash for password 'Admin@123' (10 rounds)
    -- Format: $2b$10$[22 char salt][31 char hash]
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    true,
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- ======================================
-- Assign Super Admin Role
-- ======================================
-- Assign super_admin role to the super admin user
INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
SELECT
    u.id,
    r.id,
    NOW(),
    NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'superadmin@simbex.com'
  AND r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- ======================================
-- Seed Data Summary
-- ======================================
-- Roles created:
--   - super_admin: Full system access
--   - org_admin: Organization administrator
--   - clinician: Clinical staff
--   - researcher: Research staff
--   - patient: Patient role
--   - Legacy roles: ADMIN, CLINIC_ADMIN, CLINICIAN, RESEARCHER
--
-- Modules created:
--   - users: User management module
--   - organizations: Organization management module
--   - clinics: Clinic management module
--   - patients: Patient management module
--   - user_organizations: User-Organization relationship management
--   - user_clinics: User-Clinic relationship management
--   - clinic_patients: Clinic-Patient relationship management
--   - roles: Role management module
--   - permissions: Permission management module
--   - modules: Module management
--   - media: Media and file management module
--   - audit_logs: Audit logs and system activity tracking
--   - admin: Admin operations module (super admin only)
--
-- Permissions created:
--   For each module, the following permissions are created:
--   - READ: Read/view access
--   - WRITE: Create access
--   - UPDATE: Update/modify access
--   - DELETE: Delete access
--   Total: 13 modules × 4 permissions = 52 permissions
--
-- Super Admin User:
--   Email: superadmin@simbex.com
--   Password: Admin@123 (MUST be changed on first login)
--   Phone: +10000000000
--
-- IMPORTANT SECURITY NOTES:
-- 1. Change the super admin password immediately after first login
-- 2. The password hash is a bcrypt hash for 'Admin@123' (10 rounds)
-- 3. To generate a new hash, use Node.js:
--    const bcrypt = require('bcrypt');
--    bcrypt.hash('your_password', 10).then(hash => console.log(hash));
-- 4. For production, consider:
--    - Using environment variables for initial admin credentials
--    - Generating a unique password hash during deployment
--    - Implementing password change enforcement on first login
-- 5. Default credentials:
--    Email: superadmin@simbex.com
--    Password: Admin@123
-- 6. Permissions can be assigned to roles via the role_permissions table
--    to implement fine-grained access control
