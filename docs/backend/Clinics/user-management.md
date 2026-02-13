# Clinic User Management API

This document describes the API endpoints for managing users within clinics. These endpoints handle the assignment of clinicians and clinic admins to specific clinics within an organization. The `user_clinics` table is used to store these assignments, and roles are differentiated based on `role_id` which references the `roles` table. Note that one user can be assigned to multiple clinics with different roles.

---

## API Endpoints

### 1. Assign Clinic Admin

**POST** `/clinics/{clinicId}/admins`

- **Purpose:** Assign a user as a clinic admin to a clinic within an organization.
- **Access Control:** Only accessible by superadmin, admin, or org_admin roles
- **Route Parameter:** `clinicId` (number)
- **Request Body (JSON, validated by DTO):**
  ```json
  {
    "user_id": 5,
    "is_active": true
  }
  ```
  - `user_id` (required): ID of the user to assign as clinic admin
  - `is_active` (optional): Whether the user is active in this clinic (default: true)
- **Business Logic:**
  - Validates that the user exists and is assigned to the clinic's organization.
  - Validates that the user is not already assigned to this clinic.
  - Automatically sets `role_id` to the clinic_admin role from the roles table.
  - Automatically sets `organization_id` from the clinic's organization.
  - Records `added_by_id` from the authenticated user.
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "clinic_id": 10,
    "organization_id": 1,
    "role_id": 4,
    "role_name": "clinic_admin",
    "is_active": true,
    "is_deleted": false,
    "added_by_id": 2,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 2. Assign Clinician

**POST** `/clinics/{clinicId}/clinicians`

- **Purpose:** Assign a clinician to a clinic within an organization.
- **Access Control:** Only accessible by superadmin, admin, org_admin, or clinic_admin roles
- **Route Parameter:** `clinicId` (number)
- **Request Body (JSON, validated by DTO):**
  ```json
  {
    "user_id": 5,
    "is_active": true
  }
  ```
  - `user_id` (required): ID of the user to assign as clinician
  - `is_active` (optional): Whether the user is active in this clinic (default: true)
- **Business Logic:**
  - Validates that the user exists and is assigned to the clinic's organization.
  - Validates that the user is not already assigned to this clinic.
  - Validates that the user has the clinician role in the organization.
  - Automatically sets `role_id` to the clinician role from the roles table.
  - Note: A user can be assigned as a clinician to multiple clinics.
  - Automatically sets `organization_id` from the clinic's organization.
  - Records `added_by_id` from the authenticated user.
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "clinic_id": 10,
    "organization_id": 1,
    "role_id": 3,
    "role_name": "clinician",
    "is_active": true,
    "is_deleted": false,
    "added_by_id": 2,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 3. List Users in Clinic

**GET** `/clinics/{clinicId}/users`

- **Purpose:** Retrieve a paginated list of users assigned to a clinic.
- **Access Control:** Super admin, organization admin (for clinics in their organization), clinic admin, or clinicians in the clinic
- **Route Parameter:** `clinicId` (number)
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Number of records per page (default: 20)
  - `role_id` (number, optional): Filter by role ID
  - `is_active` (boolean, optional): Filter by active status
  - `search` (string, optional): Search by user name or email
- **Business Logic:**
  - Returns paginated results with user details and their role (based on role_id).
  - Only shows active, non-deleted assignments by default.
- **Response Example:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "user_id": 5,
        "user": {
          "id": 5,
          "name": "Dr. Jane Smith",
          "email": "jane.smith@example.com"
        },
        "clinic_id": 10,
        "clinic": {
          "id": 10,
          "clinic_name": "Downtown Clinic"
        },
        "organization_id": 1,
        "role_id": 3,
        "role_name": "clinician",
        "is_active": true,
        "created_at": "2024-06-18T10:15:00.000Z"
      }
      // ...more users
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20
    }
  }
  ```

---

### 4. Get User-Clinic Assignment Details

**GET** `/clinics/{clinicId}/users/{userId}`

- **Purpose:** Retrieve details of a specific user's assignment to a clinic.
- **Access Control:** Super admin, organization admin (for clinics in their organization), clinic admin, or the user themselves
- **Route Parameters:**
  - `clinicId` (number)
  - `userId` (number)
- **Business Logic:**
  - Returns the user-clinic relationship details including role (based on role_id).
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "user": {
      "id": 5,
      "name": "Dr. Jane Smith",
      "email": "jane.smith@example.com"
    },
    "clinic_id": 10,
    "clinic": {
      "id": 10,
      "clinic_name": "Downtown Clinic",
      "address": "123 Main St"
    },
    "organization_id": 1,
    "role_id": 3,
    "role_name": "clinician",
    "is_active": true,
    "is_deleted": false,
    "added_by_id": 2,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 5. Update User Assignment in Clinic

**PUT** `/clinics/{clinicId}/users/{userId}`

- **Purpose:** Update a user's role or status within a clinic.
- **Access Control:** Super admin, organization admin (for clinics in their organization), or clinic admin
- **Route Parameters:**
  - `clinicId` (number)
  - `userId` (number)
- **Request Body:** Partial update allowed
  ```json
  {
    "role_id": 4,
    "is_active": true
  }
  ```
- **Business Logic:**
  - Updates the role (role_id) or active status.
  - Returns the updated record.
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "clinic_id": 10,
    "organization_id": 1,
    "role_id": 4,
    "role_name": "clinic_admin",
    "is_active": true,
    "updated_at": "2024-06-18T12:34:00.000Z"
  }
  ```

---

### 6. Remove User from Clinic

**DELETE** `/clinics/{clinicId}/users/{userId}`

- **Purpose:** Remove a user from a clinic (soft delete).
- **Access Control:** Super admin, organization admin (for clinics in their organization), or clinic admin
- **Route Parameters:**
  - `clinicId` (number)
  - `userId` (number)
- **Business Logic:**
  - Performs soft delete by setting `is_deleted = true`.
  - Does not remove the user from the organization, only from this specific clinic.
- **Response Example:**
  ```json
  {
    "message": "User removed from clinic successfully"
  }
  ```

---

### 7. List User's Clinics

**GET** `/users/{userId}/clinics`

- **Purpose:** Retrieve all clinics a user is assigned to.
- **Access Control:** Super admin, organization admin (for users in their organization), or the user themselves
- **Route Parameter:** `userId` (number)
- **Query Parameters:**
  - `organization_id` (number, optional): Filter by organization
  - `is_active` (boolean, optional): Filter by active status
- **Business Logic:**
  - Returns all clinics the user is assigned to, optionally filtered by organization.
- **Response Example:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "user_id": 5,
        "clinic_id": 10,
        "clinic": {
          "id": 10,
          "clinic_name": "Downtown Clinic",
          "organization_id": 1
        },
        "organization_id": 1,
        "role_id": 3,
        "role_name": "clinician",
        "is_active": true
      },
      {
        "id": 2,
        "user_id": 5,
        "clinic_id": 11,
        "clinic": {
          "id": 11,
          "clinic_name": "Uptown Clinic",
          "organization_id": 1
        },
        "organization_id": 1,
        "role_id": 4,
        "role_name": "clinic_admin",
        "is_active": true
      }
    ]
  }
  ```

---

## Security and Validation Notes

- All endpoints require valid JWT authentication.
- **Access Control:**
  - Super admin can manage users in any clinic.
  - Organization admin can manage users in clinics within their organization.
  - Clinic admin can manage users in their clinic.
  - Users can view their own clinic assignments.
- All DTOs use strong validation (`class-validator`).
- Input is sanitized and output omits sensitive fields.
- Unique constraint on `(user_id, clinic_id)` prevents duplicate assignments.
- Users must be assigned to the clinic's organization before being assigned to the clinic.
- Only users with appropriate roles (clinician or clinic_admin) can be assigned to clinics.
- A user can be assigned to multiple clinics with different roles (role_id) within the same or different organizations.
- Roles are differentiated based on `role_id` which references the `roles` table.
- The `user_clinics` table stores the relationship between users and clinics with their respective roles.
- Soft delete is used - records are marked as deleted rather than removed.
- Errors handled by global exception filters; error responses are consistent and never leak internal state.

---
