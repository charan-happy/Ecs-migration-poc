# Admin Module APIs

This module provides **super admin-only** API endpoints for managing platform-level accounts and patient records.

---

## 1. Create Admin User (Platform Admin)

- **Endpoint:** `POST /admin/users`
- **Purpose:** **Super admin** can create a new user with the `admin` role (not tied to any clinic).
- **Authorization:** Only `super_admin` (via JWT + role guard)
- **Request Body:**
  ```json
  {
    "name": "John Admin",
    "email": "admin@example.com",
    "phone": "+1-123-111-2222",
    "password": "P@ssw0rd!"
  }
  ```
  - All fields required.
  - `email` and `phone` must be unique across all users.
- **Response Example:**
  ```json
  {
    "id": 10,
    "name": "John Admin",
    "email": "admin@example.com",
    "phone": "+1-123-111-2222",
    "role": "admin",
    "created_at": "2024-06-18T16:00:00.000Z"
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation/uniqueness errors
  - `403 Forbidden`: Not a super admin

---

## 2. List All Patients

- **Endpoint:** `GET /admin/patients`
- **Purpose:** **Super admin** can view the entire patient list across the application, including patients not linked to clinics.
- **Authorization:** `super_admin` and `admin`
- **Query Parameters:**
  Supports pagination & search
  | Name        | Type    | Description                                 |
  |-------------|---------|---------------------------------------------|
  | `search`    | string  | Name/email/phone partial match (optional)   |
  | `page`      | integer | Page number (default 1)                     |
  | `limit`     | integer | Results per page (default 20, max 100)      |

- **Response Example**:
  ```json
  {
    "data": [
      {
        "id": 501,
        "name": "Alice Patient",
        "email": "alice.pat@example.com",
        "phone": "+1-999-333-4444",
        "clinicId": null
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1
  }
  ```

## 3. Get Patient by ID

- **Endpoint:** `GET /admin/patients/:patientId`
- **Purpose:** **Super admin** can get any patient record by `id` (including those with no clinic assignment).
- **Authorization:** `super_admin` and `admin`
- **Response Example:**
  ```json
  {
    "id": 777,
    "name": "James Stone",
    "email": "james.stone@example.com",
    "phone": "+1-555-111-2222",
    "dob": "1990-04-15",
    "clinicId": null,
    "created_at": "2024-06-18T16:30:00.000Z"
  }
  ```
- **Errors:**
  - `404 Not Found`: Patient does not exist

---
