# Clinic User Management API

This module provides API endpoints for managing users associated with clinics.

---

## Core Features

- **Add a user to a clinic**
- **Remove (delete) a user from a clinic**
- **Get a specific user**
- **List all users in a clinic**
- **Update user details**
- **Assign or update user roles**
- **Activate/deactivate user accounts**

All endpoints are protected by JWT authentication and role-based access control. Only users with proper clinic admin or super admin privileges may manage clinic users.

> **Note:**
> The backend will extract the `clinicId` from the authenticated user's JWT token.
> *Do not pass `clinicId` in any path or request body parameters.*

---

## API Endpoints

### 1. Add User to Clinic

**POST** `/clinic-users`

- **Purpose**: Add a new user to the clinic associated with the authenticated user (clinicId taken from the JWT token).
- **Request Body (DTO validation applies):**
  ```json
  {
    "name": "Alice Doe",
    "email": "alice.doe@example.com",
    "phone": "+1-555-888-9999",
    "role": "doctor"
  }
  ```
  - All fields required.
  - Email and phone must be unique **across all clinics** (a user can only exist in one clinic).
  - Validation enforces proper formats.

- **Business Logic**:
  - Rejects if email/phone already exists in users table (even for another clinic).
  - Hashes password if default credentials are set.
  - Creates association with the `clinicId` from the authenticated token and assigns the supplied role.

- **Response Example**:
  ```json
  {
    "id": 101,
    "name": "Alice Doe",
    "email": "alice.doe@example.com",
    "phone": "+1-555-888-9999",
    "role": "doctor",
    "clinicId": 24,
    "is_active": true,
    "created_at": "2024-06-18T12:34:56.000Z"
  }
  ```

---

### 2. Get Clinic Users

**GET** `/clinic-users`

- **Purpose:** Retrieve a paginated and filterable list of users for the clinic associated with the JWT token.

#### Query Parameters

| Name      | Type     | Description                                                | Example                |
|-----------|----------|------------------------------------------------------------|------------------------|
| `role`    | string   | Filter users by role (e.g. `doctor`, `nurse`, `admin`...) | `role=doctor`          |
| `is_active` | boolean | Filter by active status                                   | `is_active=true`       |
| `search`  | string   | Full/partial name or email search (case-insensitive)       | `search=ali`           |
| `page`    | integer  | Page number (starts at 1)                                  | `page=2`               |
| `limit`   | integer  | Results per page                                           | `limit=20`             |

<sup>All parameters are optional. Defaults: `page=1`, `limit=20`. Multiple filters can be combined.</sup>

> **Example Request:**
> `GET /clinic-users?role=doctor&is_active=true&search=ali&page=1&limit=10`

#### **Business Logic**
- Filters and pagination are applied to the users in the authenticated user's clinic only.
- Results filtered by supplied parameters; combined if multiple filters present.
- Supports simple partial-match search across name and email.
- Paginates results (sorted by name ascending).
- Returns total result count.

#### **Response Example**
```json
{
  "data": [
    {
      "id": 101,
      "name": "Alice Doe",
      "email": "alice.doe@example.com",
      "role": "doctor",
      "is_active": true
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```
---

### 3. Get Single Clinic User

**GET** `/clinic-users/:userId`

- **Purpose**: Retrieve details for a specific user by their user ID, limited to users within the authenticated user's clinic.
- **Response Example:**
  ```json
  {
    "id": 101,
    "name": "Alice Doe",
    "email": "alice.doe@example.com",
    "phone": "+1-555-888-9999",
    "role": "doctor",
    "is_active": true,
    "created_at": "2024-06-18T12:34:56.000Z"
  }
  ```

---

### 4. Update Clinic User

**PUT** `/clinic-users/:userId`

- **Purpose**: Update user details or change their role for a user in the authenticated user's clinic.
- **Request Body (Partial DTO allowed; all fields optional, at least one required):**
  ```json
  {
    "name": "Alicia Doe",
    "email": "alicia.doe@example.com",
    "phone": "+1-555-998-8888",
    "role": "nurse"
  }
  ```
  - **Business Logic**:
    - If updating `email` or `phone`, must pass uniqueness check across all users (no duplicate email/phone in any clinic).
    - Only allowed fields are updated.
    - Enforces DTO validation.

- **Response Example**:
  ```json
  {
    "id": 101,
    "name": "Alicia Doe",
    "email": "alicia.doe@example.com",
    "phone": "+1-555-998-8888",
    "role": "nurse",
    "is_active": true,
    "updated_at": "2024-06-18T15:12:34.000Z"
  }
  ```

---

### 5. Activate/Deactivate User

**PATCH** `/clinic-users/:userId/status`

- **Purpose**: Activate or deactivate a clinic user (soft-delete) in the authenticated user's clinic.
- **Request Body:**
  ```json
  {
    "is_active": false
  }
  ```
  - Only `is_active` boolean allowed.
- **Business Logic**:
  - Updates the `is_active` status for the user within the authenticated user's clinic.
- **Response Example**:
  ```json
  {
    "id": 101,
    "is_active": false,
    "updated_at": "2024-06-18T16:00:00.000Z"
  }
  ```

---

### 6. Delete Clinic User

**DELETE** `/clinic-users/:userId`

- **Purpose**: Remove a user from the clinic (hard delete or soft delete as per business logic), only affecting users in the authenticated user's clinic.
- **Business Logic**:
  - Ensures the requestor has permissions.
  - Removes user association from clinic.
- **Response Example:**
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

---

## DTO Validation & Security

- All DTOs use class-validator for strong input validation.
- All user-creation and update flows require that email and phone are globally unique.
- Authentication and role guards protect all endpoints.
- The clinic ID is always taken from the JWT token; do not accept it from the request path or body.
- No sensitive information (e.g. password hashes) is ever returned in responses.
- Error messages never leak whether an email is registered.

---
