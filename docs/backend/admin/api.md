# Admin Module APIs

This module provides **super admin-only** API endpoints for managing platform-level accounts.

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
