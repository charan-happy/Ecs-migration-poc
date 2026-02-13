# Core Entities Overview and Relationships (Based on Migration SQL)

This document describes the core data entities, their relationships, and access control flows, based directly on the migration SQL in `@src/db/prisma/migrations/20241017072122_init/migration.sql`.

---

## Entity Relationship Diagram

The following highlights the main tables and key columns that form the foundation of the application's multi-tenant role-based architecture.

```
[users]
- id (PK)
- name
- email (UNIQUE)
- phone (UNIQUE)
- password_hash
- address
- city
- state
- zip_code
- country
- profile_photo_id (FK→media_metadata.id)
- date_of_birth
- gender (gender_type ENUM)
- password_changed_at
- last_login_at
- is_2fa_enabled
- two_fa_enabled_at
- is_deleted (default: false)
- is_active (default: true)
- deleted_at
- created_by (FK→users.id)
- updated_by (FK→users.id)
- created_at
- updated_at

[roles]
- id (PK)
- name (UNIQUE)
- description
- created_at
- updated_at

[user_roles]
- id (PK)
- user_id (FK→users.id, UNIQUE)
- role_id (FK→roles.id)
- created_at
- updated_at

[modules]
- id (PK)
- name (UNIQUE)
- description
- created_at
- updated_at

[permissions]
- id (PK)
- permission_type (permission_type ENUM: READ, WRITE, DELETE, UPDATE)
- description
- module_id (FK→modules.id)
- created_at
- updated_at

[role_permissions]
- id (PK)
- role_id (FK→roles.id)
- permission_id (FK→permissions.id)
- created_at
- updated_at
- UNIQUE (role_id, permission_id)

[organizations]
- id (PK)
- name (UNIQUE)
- description
- added_by_id (FK→users.id)
- created_at
- updated_at

[user_organizations]
- id (PK)
- user_id (FK→users.id)
- organization_id (FK→organizations.id)
- role_id (FK→roles.id)
- is_active (default: true)
- is_deleted (default: false)
- added_by_id (FK→users.id)
- created_at
- updated_at
- UNIQUE (user_id, organization_id)

[clinics]
- id (PK)
- clinic_name
- description
- address
- city
- state
- zip_code
- country
- phone
- clinic_email
- website
- registration_number (UNIQUE)
- license_number
- registration_valid_till
- tax_id
- clinic_type
- logo_id (FK→media_metadata.id)
- organization_id (FK→organizations.id)
- added_by_id (FK→users.id)
- deleted_at
- is_active (default: true)
- created_at
- updated_at

[user_clinics]
- id (PK)
- user_id (FK→users.id)
- clinic_id (FK→clinics.id)
- organization_id (FK→organizations.id)
- role_id (FK→roles.id)
- is_deleted (default: false)
- is_active (default: true)
- added_by_id (FK→users.id)
- created_at
- updated_at
- UNIQUE (user_id, clinic_id)

[patients]
- id (PK)
- name
- gender (gender_type ENUM)
- date_of_birth
- phone
- email (NOT NULL, NOT UNIQUE)
- address
- city
- state
- zip_code
- country
- blood_group
- profile_photo_id (FK→media_metadata.id)
- user_id (FK→users.id, nullable)
- created_at
- updated_at

[clinic_patients]
- id (PK)
- clinic_id (FK→clinics.id)
- patient_id (FK→patients.id)
- added_by_id (FK→user_clinics.id)
- created_at
- updated_at
- is_deleted (default: false)
- is_active (default: true)
- UNIQUE (clinic_id, patient_id)

[media_metadata]
- id (PK)
- file_name
- file_type
- file_url
- file_size
- created_at
- updated_at

[user_otp]
- id (PK)
- user_id (FK→users.id)
- otp
- otp_type (otp_purpose_type ENUM)
- expires_at
- attempts
- locked_at
- locked_until
- consumed_at
- created_at
- updated_at
- UNIQUE (user_id, otp_type)
```

---

### Key Constraints

- `user_roles.user_id` is UNIQUE: Each user can have only one system role.
- `user_organizations` has UNIQUE constraint on `(user_id, organization_id)`: A user can belong to multiple organizations but only once per organization.
- `user_clinics` has UNIQUE constraint on `(user_id, clinic_id)`: A user can belong to multiple clinics but only once per clinic.
- `clinics.registration_number` is UNIQUE.
- `patients.email` is NOT NULL but NOT UNIQUE (as per schema comment: "not kept email as unique uuid will be used instead").
- `clinic_patients` has a UNIQUE constraint on `(clinic_id, patient_id)`, prohibiting duplicate entries.
- `role_permissions` has UNIQUE constraint on `(role_id, permission_id)`.
- Foreign key references between users, organizations, clinics, roles, permissions, and their junction tables enforce referential integrity.

**Soft Delete Columns:**
Most entities have `is_deleted` and `is_active` for soft deletion; data is hidden rather than removed.

**Cascading Deletes:**
- Deleting a user cascades to their `user_roles`, `user_organizations`, and `user_clinics`.
- Deleting an organization cascades to all its `clinics` and `user_organizations`.
- Deleting a clinic removes all its `user_clinics` and `clinic_patients`.
- Deleting a patient removes their `clinic_patients` mappings.
- Deleting a role deletes associated `role_permissions`, `user_roles`, `user_organizations`, and `user_clinics`.
- Deleting a permission deletes associated `role_permissions`.
- Deleting a module cascades to all its `permissions`.

---

## Entity Relationships and Access Control

### Users, Roles, and Permissions

- **Users** → Assigned to **Roles** via `user_roles` (one-to-one: each user has one system role).
- **Roles** → Linked to **Permissions** via `role_permissions` (many-to-many).
- **Permissions** → Grouped under **Modules** via `module_id`.
- **Permissions** have a `permission_type` enum: READ, WRITE, DELETE, UPDATE.

**System Role Flow Example:**
```
users         user_roles       roles          role_permissions       permissions
└── John ───► └── admin ────► └─────────┐  ┌── WRITE:patients ─────►┘
                                        └── READ:patients
```
- Each user has one global/system role, with permissions assigned only through that role.
- All roles, permissions, and mappings are defined during DB setup (seeded); no endpoints exist to modify these.

### Users and Organizations

- **Users** → Assigned to **Organizations** via `user_organizations` (many-to-many).
- Each user-organization relationship has a `role_id` (e.g., org_admin, researcher).
- A user can belong to multiple organizations with different roles.
- Supports multi-tenant architecture.

**Organization Membership Example:**
```
John Doe (user)
├── Organization A (role: org_admin)
└── Organization B (role: researcher)
```

### Organizations and Clinics

- **Clinics** → Belong to **Organizations** via `organization_id` (many-to-one).
- Each clinic must belong to exactly one organization.
- Deleting an organization cascades to all its clinics.

**Organization-Clinic Example:**
```
Organization A
├── Clinic 1
├── Clinic 2
└── Clinic 3
```

### Users and Clinics

- **Users** → Assigned to **Clinics** via `user_clinics` (many-to-many).
- Each user-clinic relationship has a `role_id` (e.g., clinician, clinic_admin).
- A user can belong to multiple clinics within their organization(s).
- Each user-clinic assignment includes `organization_id` for data integrity and query optimization.

**Clinic Membership Example:**
```
John Doe (user)
├── Clinic A (role: clinician, organization: Org A)
└── Clinic B (role: clinic_admin, organization: Org A)
```

### Clinics and Patients

- **Patients** can be connected to multiple **Clinics** (many-to-many via `clinic_patients`).
- Each patient/clinic connection references `added_by_id` (FK to `user_clinics.id`) indicating which clinician added the patient.
- Each clinic-patient association can only exist once per pair.
- Patients can optionally be linked to a user account via `patients.user_id`.

**Clinic-Patient Example:**
```
Jane Smith (patient)
├── Clinic A (added by: Dr. John)
└── Clinic B (added by: Dr. Jane)
```

---

## Permission Models and Resolution Flow

### 1. System-Level Permissions

- Assigned to a user’s role globally.
- Evaluated for actions affecting general (non-clinic-scoped) resources.

### 2. Organization-Level Permissions / Roles

- `user_organizations.role_id` encodes the user's role within an organization (e.g., org_admin, researcher).
- Users can have different roles in different organizations.
- Organization roles are defined in the `roles` table and have associated permissions via `role_permissions`.

### 3. Clinic-Level Permissions / Roles

- `user_clinics.role_id` encodes the user's clinic-specific role (e.g., “nurse”, “doctor”).
- Application logic should map clinical role names to permission sets as seeded in the database (not established via dynamic tables).

### Permission Evaluation

1. **Check system role permissions** (via `user_roles`, `roles`, `role_permissions`, `permissions`).
2. **Check clinic role permissions** according to the user’s `role_id` in the specific clinic context, mapped to seeded permission sets.

**A user is authorized if any mapped permission for their roles (system, organization-level, or clinic-level) grants the action.**

---

## Example: Data Flows

### Single-Clinic User

- User: John Doe
- System Role: doctor (`user_roles`)
- Clinic: City Medical Center (via `user_clinics`)
- Clinic-specific role: "senior_doctor" (string)
- Permissions for both roles (“doctor” and “senior_doctor”) are mapped in seeded data by admin/devs.

### Multi-Clinic User

- User: Jane Smith
- System Role: nurse
- Clinic A: Role in clinic: “nurse”
- Clinic B: Role in clinic: “head_nurse”
- On each request, permissions are resolved from both the user’s system role and their `role_id` for the current clinic context.

---

## Summary

- **Multi-Tenant RBAC** (Role-Based Access Control) is enforced at three levels:
  - **System-level**: Via `user_roles` (one role per user globally)
  - **Organization-level**: Via `user_organizations` (users can belong to multiple organizations with different roles)
  - **Clinic-level**: Via `user_clinics` (users can belong to multiple clinics with different roles)
- **Permissions** are organized by modules and have types: READ, WRITE, DELETE, UPDATE.
- **Roles** are defined in the `roles` table and referenced via `role_id` in all relationship tables (not free-form strings).
- No API exists to modify roles or permissions; all are static and seeded during migrations.
- Soft deletes are used for most relational entities (`is_deleted`, `is_active` flags).
- **Organizations** form the top-level tenant boundary; clinics belong to organizations.
- Users can belong to multiple organizations and multiple clinics within those organizations.
- Patients can be associated with multiple clinics via `clinic_patients`.
- Patients can optionally be linked to user accounts via `patients.user_id`.
- Patients' email is NOT UNIQUE (as per schema design).
- Foreign keys and unique constraints enforce referential integrity throughout the system.

**Key Architectural Points:**
- Multi-tenant architecture with organizations as the primary tenant boundary
- Flexible role assignment at system, organization, and clinic levels
- Users can have different roles in different organizations/clinics
- Permissions are module-based with type-based granularity
- All relationships use role_id references to the roles table for consistency

If you require the exact attribute list or foreign key constraints, refer to the migration SQL at `@src/db/prisma/migrations/20241017072122_init/migration.sql`.
