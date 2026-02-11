# Clinics API
---

## Overview
This API allows authenticated users with **admin** or **super_admin** roles to create new clinics.
Role-based permissions:
- **super_admin**: Can create clinics for any context.
- **admin**: Can create clinics within allowed scope.

All requests require:
- **JWT authentication** (`AuthGuard('jwt')`): User must be authenticated
- **Role Guard**: User must have `admin` or `super_admin` role

---

## Create Clinic

- **Endpoint:** `POST /clinics`
- **Purpose:** Register a clinic and assign clinic admin user.

**Authorization:**
- **Authentication:** Valid JWT Bearer token required
- **Role Guard:** Only `admin` or `super_admin` users allowed

---

**Request Body:** _(all clinic fields required, plus clinic admin info)_
```json
{
  "name": "Acme Health Clinic",
  "description": "Primary care clinic in downtown.",
  "address": "123 Main Street, Springfield",
  "phone": "+1-555-123-4567",
  "email": "info@acmeclinic.com",
  "website": "https://acmeclinic.com",
  "industry": "Healthcare",
  "size": "10-50",
  "founded_year": 2022,
  "country": "USA",
  "clinic_admin_name": "Jane Smith",
  "clinic_admin_email": "jane.smith@acmeclinic.com",
  "clinic_admin_phone": "+1-555-987-6543"
}
```
- All clinic fields (**name, address, contact, etc.**) are **required**.
- `clinic_admin_*` fields give details for the initial admin user.

---

**Flow:**
1. **Guards:**
   - `AuthGuard('jwt')`: Verifies authentication
   - `RolesGuard`: Checks for `admin` or `super_admin`
2. **Controller:**
   - Receives validated request
   - Calls Clinics Service
3. **Service:**
   - Creates clinic in DB
   - Assigns admin with supplied details
   - Handles uniqueness (name/email), validations
4. **Response:**
   - **Success:** Returns clinic details (no sensitive info) and assigned admin
   - **Failure:** Standard HTTP errors for invalid role, duplicate/invalid data

---

**Response Example**
**201 Created**
```json
{
  "id": 42,
  "name": "Acme Health Clinic",
  "email": "info@acmeclinic.com",
  "phone": "+1-555-123-4567",
  "admin": {
    "name": "Jane Smith",
    "email": "jane.smith@acmeclinic.com",
    "phone": "+1-555-987-6543",
    "role": "admin"
  },
  "created_at": "2024-06-17T13:45:19.123Z"
}
```
**Error Responses**
- **401 Unauthorized:** Missing/invalid JWT
- **403 Forbidden:** Not `admin`/`super_admin`
- **400 Bad Request:** Validation failure, duplicate clinic/email, missing data

---

## Update Clinic

- **Endpoint:** `PUT /clinics/:id`
- **Purpose:** Update clinic details (any field) or admin info. Partial DTO allowed. Clinic admins can update their clinic/admin fields.

---

**Access Control:**
- **Guards:**
  - `AuthGuard('jwt')`: Ensures authentication
  - `RolesGuard`:
    - `admin`/`super_admin`: Update any clinic
    - `clinic_admin`: Update own clinic and admin details

---

**Request Body:**
- **DTO:** Same as create, all fields optional (partial update allowed), only one field required
```json
{
  "name": "Acme Health Clinic",
  "description": "A multi-specialty healthcare clinic",
  "address": "123 Main St",
  "phone": "+1-555-123-4567",
  "email": "info@acmeclinic.com",
  "website": "https://acmeclinic.com",
  "industry": "Healthcare",
  "size": "50-100",
  "founded_year": 1999,
  "country": "USA"
}
```
> Provide any subset above; **at least one field required**

---

**Flow:**
1. **Guards:** Checked before controller
   - `clinic_admin`: Only change their own clinic
2. **Controller:**
   - Receives validated (possibly partial) DTO
   - Calls Clinics Service
3. **Service:**
   - Checks clinic exists, permission granted
   - Updates only supplied fields
   - Checks uniqueness for clinic/email/phone
   - Applies business rules
4. **Response:**
   - **Success:** Updated clinic (no sensitive info), latest admin info
   - **Failure:** HTTP errors for unauthorized, invalid, or conflicting data

---

**Response Example**
**200 OK**
```json
{
  "id": 42,
  "name": "Acme Health Clinic",
  "email": "info@acmeclinic.com",
  "phone": "+1-555-123-4567",
  "admin": {
    "name": "Jane Smith",
    "email": "jane.smith@acmeclinic.com",
    "phone": "+1-555-987-6543",
    "role": "admin"
  },
  "updated_at": "2024-06-18T10:54:00.000Z"
}
```
**Error Responses**
- **401 Unauthorized:** Invalid/missing JWT
- **403 Forbidden:** Trying to update unauthorized clinic
- **400 Bad Request:** Uniqueness/validation errors, missing required fields

---

**Security Notes**
- Only authenticated users with allowed roles
- All input robustly validated and sanitized
- Error messages do not reveal internal state (e.g. if email already used)

---
