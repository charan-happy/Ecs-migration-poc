# Organization Management API

This document describes the API endpoints for managing organizations in the system. All endpoints require JWT authentication and are restricted to superadmin and admin roles only.

---

## API Endpoints

### 1. Create New Organization

**POST** `/organizations`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Create a new organization record in the system.
- **Request Body (JSON, validated by DTO):**
  ```json
  {
    "name": "Acme Healthcare Systems",
    "description": "Leading healthcare provider with multiple clinics across the region"
  }
  ```
  - **All required fields** must be provided as per DTO/validation. Organization name must be unique.
- **Business Logic:**
  - Rejects creation if organization name already exists.
  - Applies input validation and sanitization.
  - Records `added_by_id` from the authenticated super admin user.
- **Response Example:**
  ```json
  {
    "id": 1,
    "name": "Acme Healthcare Systems",
    "description": "Leading healthcare provider with multiple clinics across the region",
    "added_by_id": 1,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 2. List Organizations

**GET** `/organizations`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Retrieve a paginated, searchable list of organizations.
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Number of records per page (default: 20)
  - `search` (string, optional): Search text (matches organization name or description)
- **Business Logic:**
  - Returns paginated results, sorted by name or creation date.
- **Response Example:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Acme Healthcare Systems",
        "description": "Leading healthcare provider with multiple clinics across the region",
        "added_by_id": 1,
        "created_at": "2024-06-18T10:15:00.000Z"
      }
      // ...more organizations
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20
    }
  }
  ```

---

### 3. Get Organization Details

**GET** `/organizations/{organizationId}`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Retrieve details for an individual organization by ID.
- **Route Parameter:** `organizationId` (number)
- **Business Logic:**
  - Returns full organization details.
- **Response Example:**
  ```json
  {
    "id": 1,
    "name": "Acme Healthcare Systems",
    "description": "Leading healthcare provider with multiple clinics across the region",
    "added_by_id": 1,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 4. Update Organization Info

**PUT** `/organizations/{organizationId}`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Update the information for an individual organization.
- **Route Parameter:** `organizationId` (number)
- **Request Body:** Any updatable organization fields; validated with DTO, partial updates allowed.
  ```json
  {
    "name": "Acme Healthcare Systems Inc.",
    "description": "Updated description: Leading healthcare provider with multiple clinics across the region"
  }
  ```
- **Business Logic:**
  - Checks for unique organization name (if updated).
  - Applies field and format validation.
  - Performs update and returns latest organization info.
- **Response Example:**
  ```json
  {
    "id": 1,
    "name": "Acme Healthcare Systems Inc.",
    "description": "Updated description: Leading healthcare provider with multiple clinics across the region",
    "added_by_id": 1,
    "updated_at": "2024-06-18T12:34:00.000Z",
    "created_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 5. Delete Organization

**DELETE** `/organizations/{organizationId}`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Delete an organization from the system.
- **Route Parameter:** `organizationId` (number)
- **Business Logic:**
  - Permanently removes the organization record.
  - Should validate that no clinics are associated with the organization before deletion (or handle cascade deletion appropriately).
- **Response Example:**
  ```json
  {
    "message": "Organization deleted successfully"
  }
  ```

---

### 6. Assign Organization Admin

**POST** `/organizations/{organizationId}/admins`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Assign a user as an organization admin for a specific organization.
- **Route Parameter:** `organizationId` (number)
- **Request Body (JSON, validated by DTO):**
  ```json
  {
    "user_id": 3,
    "is_active": true
  }
  ```
  - `user_id` (required): ID of the user to assign as organization admin
  - `is_active` (optional): Whether the admin is active (default: true)
- **Business Logic:**
  - Creates a `user_organizations` record with `role_id` corresponding to "org_admin".
  - Validates that the user exists and is not already assigned to this organization.
  - Records `added_by_id` from the authenticated super admin user.
- **Response Example:**
  ```json
  {
    "id": 2,
    "user_id": 3,
    "user": {
      "id": 3,
      "name": "John Admin",
      "email": "john.admin@example.com"
    },
    "organization_id": 1,
    "role_id": 2,
    "role_name": "org_admin",
    "is_active": true,
    "created_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 7. List Organization Admins

**GET** `/organizations/{organizationId}/admins`

- **Access Control:** Only accessible by superadmin and admin roles
- **Purpose:** Retrieve a list of organization admins for a specific organization.
- **Route Parameter:** `organizationId` (number)
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Number of records per page (default: 20)
  - `is_active` (boolean, optional): Filter by active status
- **Business Logic:**
  - Returns paginated list of users with org_admin role in the organization.
- **Response Example:**
  ```json
  {
    "data": [
      {
        "id": 2,
        "user_id": 3,
        "user": {
          "id": 3,
          "name": "John Admin",
          "email": "john.admin@example.com"
        },
        "organization_id": 1,
        "role_name": "org_admin",
        "is_active": true,
        "created_at": "2024-06-18T10:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

---

## Related Endpoints

For detailed user management within organizations, see:
- **[Organization User Management API](./user-management.md)** - Complete API for assigning users to organizations with roles

---

## Security and Validation Notes

- All endpoints require valid JWT authentication.
- **Access Control:**
  - Only superadmin and admin roles can access all organization endpoints.
- All DTOs use strong validation (`class-validator`).
- Input is sanitized and output omits sensitive fields.
- Unique constraint on organization name.
- Errors handled by global exception filters; error responses are consistent and never leak internal state.

---
