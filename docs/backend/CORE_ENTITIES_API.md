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
- password
- phone (UNIQUE)
- address
- city
- state
- zip_code
- country
- is_2fa_enabled
- is_deleted (default: false)
- is_active (default: true)
- created_at
- updated_at

[roles]
- id (PK)
- name
- description
- created_at
- updated_at

[user_roles]
- id (PK)
- user_id (FK→users.id, UNIQUE)
- role_id (FK→roles.id)
- created_at
- updated_at

[permissions]
- id (PK)
- name
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

[modules]
- id (PK)
- name
- description
- created_at
- updated_at

[clinics]
- id (PK)
- name
- description
- address
- phone (UNIQUE)
- email (UNIQUE)
- website
- city
- zip_code
- founded_year
- country
- added_by_id (FK→users.id)
- is_deleted (default: false)
- is_active (default: true)
- created_at
- updated_at

[user_clinics]
- id (PK)
- user_id (FK→users.id, UNIQUE)
- clinic_id (FK→clinics.id)
- user_clinical_role
- is_deleted (default: false)
- is_active (default: true)
- added_by_id (FK→users.id)
- created_at
- updated_at

[patients]
- id (PK)
- name
- gender
- date_of_birth
- phone
- email (UNIQUE)
- address
- city
- state
- zip_code
- country
- created_at
- updated_at
- is_deleted (default: false)
- is_active (default: true)

[clinic_patients]
- id (PK)
- clinic_id (FK→clinics.id)
- patient_id (FK→patients.id)
- clinician_id (FK→user_clinics.id)
- added_by_id (FK→user_clinics.id)
- created_at
- updated_at
- is_deleted (default: false)
- is_active (default: true)
- UNIQUE (clinic_id, patient_id)
```

---

### Key Constraints

- `user_roles.user_id` is UNIQUE: Each user can have only one system role.
- `user_clinics.user_id` is UNIQUE: Each user is assigned to one clinic at a time.
- `clinics.email`, `clinics.phone`, and `patients.email` are all UNIQUE.
- `clinic_patients` has a UNIQUE constraint on `(clinic_id, patient_id)`, prohibiting duplicate entries.
- Foreign key references between users, clinics, roles, permissions, and their junction tables enforce referential integrity.

**Soft Delete Columns:**
Most entities have `is_deleted` and `is_active` for soft deletion; data is hidden rather than removed.

**Cascading Deletes:**
- Deleting a user cascades to their `user_roles` and `user_clinics`.
- Deleting a clinic removes all its `user_clinics` and `clinic_patients`.
- Deleting a patient removes their `clinic_patients` mappings.
- Deleting a role deletes associated `role_permissions` and `user_roles`.
- Deleting a permission deletes associated `role_permissions`.

---

## Entity Relationships and Access Control

### Users, Roles, and Permissions

- **Users** → Assigned to **Roles** via `user_roles`.
- **Roles** → Linked to **Permissions** via `role_permissions`.
- **Permissions** → Grouped under **Modules**.

**System Role Flow Example:**
```
users         user_roles       roles          role_permissions       permissions
└── John ───► └── admin ────► └─────────┐  ┌── write:patients ─────►┘
                                        └── read:patients
```
- Each user has one global/system role, with permissions assigned only through that role.
- All roles, permissions, and mappings are defined during DB setup (seeded); no endpoints exist to modify these.

### Users and Clinics

- **Users** → Assigned to one **Clinic** via `user_clinics` (with optional `user_clinical_role` string).
- A user can only be linked to one clinic at a time.

**Clinic Membership Example:**
```
John Doe (user)
└── user_clinics: Clinic A (user_clinical_role: "doctor")
```

### Clinics and Patients

- **Patients** can be connected to multiple **Clinics** (many-to-many via `clinic_patients`).
- Each patient/clinic connection can reference which clinician/user established the link.
- Each clinic-patient association can only exist once per pair.

Example:
```
Jane Smith (patient)
├── Clinic A
└── Clinic B
```

---

## Permission Models and Resolution Flow

### 1. System-Level Permissions

- Assigned to a user’s role globally.
- Evaluated for actions affecting general (non-clinic-scoped) resources.

### 2. Clinic-Level Permissions / Roles

- `user_clinics.user_clinical_role` encodes the user's clinic-specific role (e.g., “nurse”, “doctor”).
- Application logic should map clinical role names to permission sets as seeded in the database (not established via dynamic tables).

### Permission Evaluation

1. **Check system role permissions** (via `user_roles`, `roles`, `role_permissions`, `permissions`).
2. **Check clinic role permissions** according to the user’s `user_clinical_role` in the specific clinic context, mapped to seeded permission sets.

**A user is authorized if any mapped permission for their roles (system or clinic-level) grants the action.**

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
- On each request, permissions are resolved from both the user’s system role and their `user_clinical_role` for the current clinic context.

---

## Summary

- **RBAC** (Role-Based Access Control) is enforced globally via user/role/permission mappings, and within clinics by user-to-clinic associations and clinical roles.
- No API exists to modify roles or permissions; all are static and seeded during migrations.
- Soft deletes are used for most relational entities.
- Users, clinics, roles, permissions, and patients are all connected through strict unique constraints and foreign keys.
- Clinics and patients share a flexible, many-to-many mapping.
- Permissions are organized by modules for easier administration.

If you require the exact attribute list or foreign key constraints, refer to the migration SQL at `@src/db/prisma/migrations/20241017072122_init/migration.sql`.
