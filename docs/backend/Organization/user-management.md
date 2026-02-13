# Organization User Management API

This document describes the API endpoints for managing users within organizations. These endpoints handle the assignment of users to organizations with specific roles (org_admin, researcher).

---

## API Endpoints

### 1. Assign User to Organization

**POST** `/organizations/{organizationId}/users`

- **Purpose:** Assign a user to an organization with a specific role.
- **Access Control:** Only accessible by superadmin, admin, or organization admin (for their own organization only)
- **Route Parameter:** `organizationId` (number)
- **Request Body (JSON, validated by DTO):**
  ```json
  {
    "user_id": 5,
    "role_id": 3,
    "is_active": true
  }
  ```
  - `user_id` (required): ID of the user to assign
  - `role_id` (required): Role ID (must be one of: org_admin, researcher)
  - `is_active` (optional): Whether the user is active in this organization (default: true)
- **Business Logic:**
  - Validates that the user exists and is not already assigned to this organization.
  - Validates that the role_id is valid for organization-level assignment.
  - Organization admins can only assign users to their own organization.
  - Records `added_by_id` from the authenticated user.
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "organization_id": 1,
    "role_id": 2,
    "role_name": "researcher",
    "is_active": true,
    "is_deleted": false,
    "added_by_id": 1,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 2. List Users in Organization

**GET** `/organizations/{organizationId}/users`

- **Purpose:** Retrieve a paginated list of users assigned to an organization.
- **Access Control:** Only accessible by superadmin, admin, or organization admin (for their own organization only)
- **Route Parameter:** `organizationId` (number)
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Number of records per page (default: 20)
  - `role_id` (number, optional): Filter by role ID
  - `is_active` (boolean, optional): Filter by active status
  - `search` (string, optional): Search by user name or email
- **Business Logic:**
  - Returns paginated results with user details and their role in the organization.
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
          "name": "John Researcher",
          "email": "john.researcher@example.com"
        },
        "organization_id": 1,
        "role_id": 2,
        "role_name": "researcher",
        "is_active": true,
        "created_at": "2024-06-18T10:15:00.000Z"
      }
      // ...more users
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20
    }
  }
  ```

---

### 3. Get User-Organization Assignment Details

**GET** `/organizations/{organizationId}/users/{userId}`

- **Purpose:** Retrieve details of a specific user's assignment to an organization.
- **Access Control:** Only accessible by superadmin, admin, or organization admin (for their own organization only)
- **Route Parameters:**
  - `organizationId` (number)
  - `userId` (number)
- **Business Logic:**
  - Returns the user-organization relationship details including role.
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "user": {
      "id": 5,
      "name": "John Researcher",
      "email": "john.researcher@example.com",
      "phone": "+1-555-0100"
    },
    "organization_id": 1,
    "organization": {
      "id": 1,
      "name": "Acme Healthcare Systems"
    },
    "role_id": 2,
    "role_name": "researcher",
    "is_active": true,
    "is_deleted": false,
    "added_by_id": 1,
    "created_at": "2024-06-18T10:15:00.000Z",
    "updated_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 4. Update User Role in Organization

**PUT** `/organizations/{organizationId}/users/{userId}`

- **Purpose:** Update a user's role or status within an organization.
- **Access Control:** Only accessible by superadmin, admin, or organization admin (for their own organization only)
- **Route Parameters:**
  - `organizationId` (number)
  - `userId` (number)
- **Request Body:** Partial update allowed
  ```json
  {
    "role_id": 2,
    "is_active": false
  }
  ```
- **Business Logic:**
  - Validates that the role_id is valid for organization-level assignment.
  - Organization admins cannot change roles to/from super_admin or org_admin.
  - Updates the assignment and returns the updated record.
- **Response Example:**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "organization_id": 1,
    "role_id": 2,
    "role_name": "researcher",
    "is_active": false,
    "updated_at": "2024-06-18T12:34:00.000Z"
  }
  ```

---

### 5. Remove User from Organization

**DELETE** `/organizations/{organizationId}/users/{userId}`

- **Purpose:** Remove a user from an organization (soft delete).
- **Access Control:** Only accessible by superadmin, admin, or organization admin (for their own organization only)
- **Route Parameters:**
  - `organizationId` (number)
  - `userId` (number)
- **Business Logic:**
  - Performs soft delete by setting `is_deleted = true`.
  - Organization admins cannot remove other organization admins or super admins.
  - Also removes user from all clinics within the organization (cascade).
- **Response Example:**
  ```json
  {
    "message": "User removed from organization successfully"
  }
  ```

---

## Security and Validation Notes

- All endpoints require valid JWT authentication.
- **Access Control:**
  - Superadmin and admin can manage users in any organization.
  - Organization admin can only manage users in their own organization.
  - Organization admins cannot assign/remove other organization admins or super admins.
- All DTOs use strong validation (`class-validator`).
- Input is sanitized and output omits sensitive fields.
- Unique constraint on `(user_id, organization_id)` prevents duplicate assignments.
- Soft delete is used - records are marked as deleted rather than removed.
- Errors handled by global exception filters; error responses are consistent and never leak internal state.

---

## Role Hierarchy

1. **super_admin**: Can manage all organizations and users
2. **admin**: Can manage organizations and users (platform-level admin)
3. **org_admin**: Can manage users and clinics within their organization
4. **researcher**: Can access research data within assigned organizations

---
