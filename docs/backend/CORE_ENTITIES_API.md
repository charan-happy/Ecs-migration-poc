# Core Entities API - Entity Relationships

## Overview

This document explains how the core entities in the application are connected and related to each other. The system follows a multi-tenant architecture where clinics can have their own roles and permissions.

---

## Entity Relationship Diagram

```
┌─────────┐
│  Users  │
└────┬────┘
     │
     ├─────────────────┐
     │                 │
     ▼                 ▼
┌─────────────┐  ┌──────────────────┐
│ User Roles  │  │    Clinics       │
└──────┬──────┘  └────────┬─────────┘
       │                  │
       │                  │
       ▼                  ▼
┌─────────┐         ┌────────────┐
│  Roles  │         │User Clinics
└────┬────┘         └────┬───────┘
    │                    │
    │                    ├──────────────────┐
    │                    │                  │
    ▼                    ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ Role Permissions │ │ Clinic Roles │ │ Clinic       │
└────────┬─────────┘ └──────┬───────┘ │ Patients     │
         │                  │          └──────┬───────┘
         │                  │                 │
         ▼                  ▼                 │
    ┌──────────┐    ┌──────────────────┐      │
    │Permissions    │
    └──────────┘    │ Permissions      │      │
                    └──────────────────┘      │
                                              │
                                      ┌───────▼──────┐
                                      │   Patients   │
                                      └──────────────┘
```

---

## Core Entity Connections

### 1. Users & Roles (System-Level)

**Connection:** `users` ↔ `user_roles` ↔ `roles`

- **Users** can have **one system role** (via `user_roles` table)
- Each user has a single role assignment (UNIQUE constraint on `user_id`)
- **Roles** define system-wide access levels (e.g., "super_admin", "admin", "clinic_owner")
- **Roles** have multiple **Permissions** (via `role_permissions` table)

**Example Flow:**
```
User (John Doe)
  → Has Role (admin)
    → Role has Permissions (read:patients, write:patients, delete:patients)
```

**API Endpoints:**
- `POST /users/:userId/roles` - Assign role to user
- `GET /users/:userId/roles` - Get user's role and permissions
- `PATCH /users/:userId/roles` - Update user's role

---

### 2. Users & Clinics (Single Clinic Per User)

**Connection:** `users` ↔ `user_clinics` ↔ `clinics`

- Each user belongs to exactly one clinic (foreign key `clinic_id` on the `users` table)
- Each user has a `user_clinical_role` within their clinic (e.g., "doctor", "nurse", "admin")
- Clinics can have multiple users assigned to them

**Example Flow:**
```
User (John Doe)
  → Belongs to Clinic A with clinical role "doctor"
```


**API Endpoints:**
- `POST /users/:userId/clinics` - Associate user with clinic
- `GET /clinics/:clinicId/users` - Get all users for a clinic
- `PATCH /users/:userId/clinics/:clinicId` - Update user's role in clinic
- `DELETE /users/:userId/clinics/:clinicId` - Remove user from clinic

---

### 3. Clinics & Clinic Roles

**Connection:** `clinics` ↔ `clinic_roles` ↔ `clinic_role_permissions` ↔ `permissions`

- Each **Clinic** can assign roles to users **only from a predefined set of clinic roles** that are seeded in the database
- **Clinic Roles** are distinct from system roles and are scoped to a specific clinic, but **cannot be created, edited, or deleted via API**
- Permissions for clinic roles are **predefined** and **cannot be changed via API**; role-permission mappings are set during the initial database seed
- Same permission can be used by both system roles and clinic roles, but clinic role assignments are restricted to seeded permissions only

**Example Flow:**
```
Clinic (City Medical Center)
  → Has Clinic Role (senior_doctor)
    → Clinic Role has predefined Permissions (read:all_patients, write:prescriptions)
```
- Clinic roles are assigned from a fixed, seeded list and cannot be created, updated, or deleted via the API.
- Clinic role permissions are also fixed and cannot be changed via application endpoints; any updates require a database migration or reseed.

**API Endpoints:**
- `POST /clinics` - Create new clinic (admin/super-admin only)
- `GET /clinics` - Get all clinics (admin/super-admin only)
- `GET /clinics/:clinicId` - Get details for a clinic (admin/super-admin only)
- `PATCH /clinics/:clinicId` - Update clinic details (admin/super-admin only)
- `DELETE /clinics/:clinicId` - Delete (soft-delete) a clinic (admin/super-admin only)


### 4. Clinics & Patients

**Connection:** `clinics` ↔ `clinic_patients` ↔ `patients`

- **Patients** can be associated with **multiple clinics** (many-to-many)
- A patient can visit different clinics
- Unique constraint: one patient can only be associated once per clinic
- Patients have their own independent records

**Example Flow:**
```
Patient (Jane Smith)
  → Associated with Clinic A
  → Associated with Clinic B
```

**API Endpoints:**
- `POST /clinics/:clinicId/patients` - Associate patient with clinic
- `GET /clinics/:clinicId/patients` - Get all patients for a clinic
- `GET /patients/:patientId/clinics` - Get all clinics for a patient
- `DELETE /clinics/:clinicId/patients/:patientId` - Remove patient from clinic

---

### 5. Roles & Permissions (System-Level)

**Connection:** `roles` ↔ `role_permissions` ↔ `permissions`

- **Roles** and **Permissions** at the system level are **predefined and seeded by us**
- System roles can have multiple permissions assigned
- Permissions define granular access rights (e.g., "read:patients", "write:appointments")
- The same permission can be assigned to multiple roles, and permissions are shared across system roles
- Creation, editing, or deletion of system roles and permissions is **not available via API**; these are managed through database seeding and migrations only

**Example Flow:**
```
Role (doctor)
  → Has Permission (read:patients)
  → Has Permission (write:patients)
  → Has Permission (read:appointments)
```

> **Note:** All roles, permissions, and their mappings are predetermined and managed by us. No endpoints exist for creating, editing, or deleting the core roles or permissions via the API.

---

### 6. Permissions & Modules

**Connection:** `permissions` ↔ `modules` (conceptual grouping)

- **Modules** organize permissions into logical groups (e.g., "patients", "appointments", "billing")
- **Permissions** can be grouped by module for better organization
- Modules help structure the permission system

**Example:**
```
Module (patients)
  → Contains Permissions (read:patients, write:patients, delete:patients)
```

---

## Permission Hierarchy

The system supports two levels of permissions:

### 1. System-Level Permissions
- Assigned via `user_roles` → `roles` → `role_permissions` → `permissions`
- Applies globally across all clinics
- User has one system role

### 2. Clinic-Level Permissions
- Clinic-level permissions are granted through assigning existing roles (such as "clinician", "clinic_owner", "technician") to users within each clinic.
- There is no separate `clinic_roles` table; instead, the same roles table is used for both system and clinic level, but assignment is scoped per clinic.
- Permissions for each clinic-level role are managed centrally and not assigned by individual clinicians.
- A user can have different roles (and thus different permissions) in different clinics, but the available roles are predefined and shared across all clinics.
- Assigning or editing these roles and their permissions is handled through configuration and not through a separate clinic roles entity.


**Permission Resolution Workflow:**

When determining whether a user is authorized to perform an action, the system evaluates permissions in the following order:

1. **System Role Permissions:**
   Checks permissions granted to the user's system role (applies application-wide, regardless of clinic).

2. **Clinic Role Permissions (Current Clinic Context):**
   Checks permissions associated with the role the user holds within the specified clinic context (the clinic being accessed or operated on).

3. **Clinical Role Permissions:**
   Checks permissions tied to the user's specific clinical role within the clinic (e.g., "doctor", "nurse", etc.).

A permission is granted if any of the above conditions allow the requested action. This layered approach ensures both global and context-specific (clinic-level) access control.

---

## Permission Resolution Examples

To clarify how permissions are evaluated in different contexts, here are sample data flows illustrating user-system and user-clinic relationships.

### Example 1: Accessing Patient Data as a Single-Clinic User

```
User: John Doe
- System Role: doctor
  - Permissions: ["read:patients", "write:patients"]

- Associated Clinic: City Medical Center
  - Clinic Role: senior_doctor
    - Permissions: ["read:all_patients", "write:prescriptions"]

Permission Resolution When Accessing Clinic A's Patients:
1. Check System Role Permissions   → ✅ read:patients
2. Check Clinic Role Permissions   → ✅ read:all_patients
Final Authorization: User can read all patients in Clinic A
```

### Example 2: Accessing Data as a Multi-Clinic User

```
User: Jane Smith
- System Role: nurse
  - Permissions: ["read:patients"]

- Clinic Associations:
  - Clinic A: City Medical Center
    - Clinic Role: nurse
      - Permissions: ["read:patients"]

  - Clinic B: Regional Hospital
    - Clinic Role: head_nurse
      - Permissions: ["read:all_patients", "manage:staff"]

Scenario: Accessing Clinic A
1. System Role      → ✅ read:patients
2. Clinic A Role    → ✅ read:patients
Final Authorization: Can read patients in Clinic A

Scenario: Accessing Clinic B
1. System Role      → ✅ read:patients
2. Clinic B Role    → ✅ read:all_patients, manage:staff
Final Authorization: Can read all patients AND manage staff in Clinic B
```

**Summary:**
The system first checks global (system role) permissions and then applies clinic-specific role permissions based on clinic context. If either grants the required right, access is approved. This ensures both global security and granular, clinic-level control for multi-tenant environments.

---

## Key Constraints

### Unique Constraints
- **User Roles**: One role per user (`user_id` is UNIQUE)
- **User Clinics**: Each user can be associated with only one clinic (`user_id` is UNIQUE)
- **Clinic Patients**: One association per clinic-patient pair (`clinic_id`, `patient_id` UNIQUE)
- **Users**: Email must be unique
- **Clinics**: email, and phone must be unique
- **Patients**: Email must be unique

### Cascading Deletes
- Deleting a **User** → Removes `user_roles` and `user_clinics`
- Deleting a **Role** → Removes `role_permissions` and `user_roles`
- Deleting a **Clinic** → Removes `user_clinics` and `clinic_patients`
- Deleting a **Patient** → Removes `clinic_patients`
- Deleting a **Permission** → Removes `role_permissions`

---

## Soft Delete Pattern

Most entities support soft deletion:
- `is_deleted`: Boolean flag (default: false)
- `is_active`: Boolean flag (default: true)

**Soft Delete Flow:**
1. Set `is_deleted = true` and `is_active = false`
2. Data remains in database but is excluded from normal queries
3. Can be restored by setting `is_deleted = false` and `is_active = true`

**Entities with Soft Delete:**
- Clinics
- User Clinics
- Clinic Roles
- Patients
- Clinic Patients

---

## Summary

The application uses a **multi-tenant, role-based access control (RBAC)** system where:

1. **Users** have one system role with global permissions
2. **Users** can be associated with multiple clinics, each with different clinical roles
3. **Clinics** can define their own custom roles with specific permissions
4. **Patients** can be associated with multiple clinics
5. **Permissions** are reusable across system roles and clinic roles
6. **Modules** organize permissions into logical groups

This architecture allows for flexible access control where users can have different permissions in different clinics while maintaining a global system role.
