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

---

## API Endpoints

### 1. Add User to Clinic

**POST** `/clinics/:clinicId/users`

- **Purpose**: Add a new user to a clinic.
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
  - Creates association with the specified clinic and role.

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

**GET** `/clinics/:clinicId/users`

- **Purpose**: List all users for a given clinic.
- **Response Example:**
  ```json
  [
    {
      "id": 101,
      "name": "Alice Doe",
      "email": "alice.doe@example.com",
      "role": "doctor",
      "is_active": true
    },
    {
      "id": 102,
      "name": "Bob Smith",
      "email": "bob.smith@example.com",
      "role": "receptionist",
      "is_active": false
    }
  ]
  ```

---

### 3. Get Single Clinic User

**GET** `/clinics/:clinicId/users/:userId`

- **Purpose**: Retrieve details for a specific user by ID.
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

**PUT** `/clinics/:clinicId/users/:userId`

- **Purpose**: Update user details or change their role.
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

**PATCH** `/clinics/:clinicId/users/:userId/status`

- **Purpose**: Activate or deactivate a clinic user (soft-delete).
- **Request Body:**
  ```json
  {
    "is_active": false
  }
  ```
  - Only `is_active` boolean allowed.
- **Business Logic**:
  - Updates the `is_active` status for the user within the clinic.
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

**DELETE** `/clinics/:clinicId/users/:userId`

- **Purpose**: Remove a user from the clinic (hard delete or soft delete as per business logic).
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
- No sensitive information (e.g. password hashes) is ever returned in responses.
- Error messages never leak whether an email is registered.

---
