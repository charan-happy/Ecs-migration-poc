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
│ User Roles  │  │  User Clinics    │
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
- **Roles** define system-wide access levels (e.g., "admin", "doctor", "nurse")
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
- `DELETE /users/:userId/roles` - Remove role from user

---

### 2. Users & Clinics (Multi-Tenant)

**Connection:** `users` ↔ `user_clinics` ↔ `clinics`

- **Users** can be associated with **multiple clinics** (many-to-many)
- Each association has a `user_clinical_role` (e.g., "doctor", "nurse", "admin")
- Unique constraint: one user can only have one association per clinic
- Clinics can have multiple users

**Example Flow:**
```
User (John Doe)
  → Associated with Clinic A (as "doctor")
  → Associated with Clinic B (as "senior_doctor")
```

**API Endpoints:**
- `POST /users/:userId/clinics` - Associate user with clinic
- `GET /users/:userId/clinics` - Get all clinics for a user
- `GET /clinics/:clinicId/users` - Get all users for a clinic
- `PATCH /users/:userId/clinics/:clinicId` - Update user's role in clinic
- `DELETE /users/:userId/clinics/:clinicId` - Remove user from clinic

---

### 3. Clinics & Clinic Roles

**Connection:** `clinics` ↔ `clinic_roles` ↔ `clinic_role_permissions` ↔ `permissions`

- Each **Clinic** can have its own **custom roles** (clinic-specific)
- **Clinic Roles** are different from system roles and are scoped to a specific clinic
- **Clinic Roles** have **Permissions** assigned (via `clinic_role_permissions`)
- Same permission can be used by both system roles and clinic roles

**Example Flow:**
```
Clinic (City Medical Center)
  → Has Clinic Role (senior_doctor)
    → Clinic Role has Permissions (read:all_patients, write:prescriptions)
```

**API Endpoints:**
- `POST /clinics/:clinicId/roles` - Create clinic-specific role
- `GET /clinics/:clinicId/roles` - Get all roles for a clinic
- `POST /clinics/:clinicId/roles/:roleId/permissions` - Assign permission to clinic role
- `GET /clinics/:clinicId/roles/:roleId/permissions` - Get permissions for clinic role

---

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

- **Roles** have multiple **Permissions** assigned
- **Permissions** define granular access rights (e.g., "read:patients", "write:appointments")
- Same permission can be assigned to multiple roles
- Permissions are reusable across system roles

**Example Flow:**
```
Role (doctor)
  → Has Permission (read:patients)
  → Has Permission (write:patients)
  → Has Permission (read:appointments)
```

**API Endpoints:**
- `POST /roles/:roleId/permissions` - Assign permission to role
- `GET /roles/:roleId/permissions` - Get all permissions for a role
- `DELETE /roles/:roleId/permissions/:permissionId` - Remove permission from role

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
- Assigned via `user_clinics` → `clinics` → `clinic_roles` → `clinic_role_permissions` → `permissions`
- Scoped to specific clinics
- User can have different roles/permissions in different clinics

**Permission Resolution:**
When checking permissions, the system checks:
1. User's system role permissions (global)
2. User's clinic-specific role permissions (for the current clinic context)
3. User's clinical role in the clinic (e.g., "doctor", "nurse")

---

## Data Flow Examples

### Example 1: User Accessing Patient Data

```
User (John Doe)
  ├─ System Role: "doctor"
  │   └─ Permissions: ["read:patients", "write:patients"]
  │
  └─ Clinic Association: "City Medical Center"
      └─ Clinical Role: "senior_doctor"
          └─ Clinic Role: "senior_doctor"
              └─ Permissions: ["read:all_patients", "write:prescriptions"]

When accessing Clinic A's patients:
  → Check system permissions: ✅ read:patients
  → Check clinic role permissions: ✅ read:all_patients
  → Result: Can read all patients in Clinic A
```

### Example 2: Multi-Clinic User

```
User (Jane Smith)
  ├─ System Role: "nurse"
  │   └─ Permissions: ["read:patients"]
  │
  ├─ Clinic A: "City Medical Center"
  │   └─ Clinical Role: "nurse"
  │       └─ Permissions: ["read:patients"]
  │
  └─ Clinic B: "Regional Hospital"
      └─ Clinical Role: "head_nurse"
          └─ Clinic Role: "head_nurse"
              └─ Permissions: ["read:all_patients", "manage:staff"]

When accessing Clinic A:
  → System: ✅ read:patients
  → Clinic A: ✅ read:patients
  → Result: Can read patients in Clinic A

When accessing Clinic B:
  → System: ✅ read:patients
  → Clinic B: ✅ read:all_patients, manage:staff
  → Result: Can read all patients AND manage staff in Clinic B
```

---

## Key Constraints

### Unique Constraints
- **User Roles**: One role per user (`user_id` is UNIQUE)
- **User Clinics**: One association per user-clinic pair (`user_id`, `clinic_id` UNIQUE)
- **Clinic Roles**: One role name per clinic (`clinic_id`, `name` UNIQUE)
- **Clinic Patients**: One association per clinic-patient pair (`clinic_id`, `patient_id` UNIQUE)
- **Users**: Email must be unique
- **Clinics**: Name, email, and phone must be unique
- **Patients**: Email must be unique

### Cascading Deletes
- Deleting a **User** → Removes `user_roles` and `user_clinics`
- Deleting a **Role** → Removes `role_permissions` and `user_roles`
- Deleting a **Clinic** → Removes `user_clinics`, `clinic_roles`, and `clinic_patients`
- Deleting a **Patient** → Removes `clinic_patients`
- Deleting a **Permission** → Removes `role_permissions` and `clinic_role_permissions`

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
