# Patient Management API

This document describes the API endpoints for managing patients in the system. All endpoints require JWT authentication and are subject to role-based access control (e.g., only staff/clinics may register or modify patient records).

---

## API Endpoints

### 1. Register New Patient

**POST** `/patients`

- **Purpose:** Register and create a new patient record in the system.
- **Request Body (JSON, validated by DTO):**
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-04-01",
    "gender": "male",
    "phone": "+1-555-555-5555",
    "email": "john.doe@example.com",
    "address": "123 Main St, Springfield",
    "notes": "Diabetic, allergic to penicillin"
  }
  ```
  - **All required fields** must be provided as per DTO/validation. Email and phone should be unique.
- **Business Logic:**
  - Rejects registration if email or phone already exists for another patient.
  - Applies input validation and sanitization.
  - Records additional metadata if needed (created_by, clinic, etc.).
- **Response Example:**
  ```json
  {
    "id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-04-01",
    "gender": "male",
    "phone": "+1-555-555-5555",
    "email": "john.doe@example.com",
    "address": "123 Main St, Springfield",
    "is_active": true,
    "created_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 2. List Patients

**GET** `/patients`

- **Purpose:** Retrieve a paginated, searchable list of patients.
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Number of records per page (default: 20)
  - `search` (string, optional): Search text (matches name, phone, or email)
  - Additional filter params may be supported (status, gender, etc.)
- **Business Logic:**
  - Returns paginated results, sorted by name or creation date.
  - May restrict visibility based on user role/clinic association.
- **Response Example:**
  ```json
  {
    "data": [
      {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1-555-555-5555",
        "email": "john.doe@example.com",
        "is_active": true
      }
      // ...more patients
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  }
  ```

---

### 3. Get Patient Details

**GET** `/patients/{patientId}`

- **Purpose:** Retrieve details for an individual patient by ID.
- **Route Parameter:** `patientId` (number)
- **Business Logic:**
  - Only accessible to authorized users/clinics.
  - Returns full patient details, omitting sensitive information.
- **Response Example:**
  ```json
  {
    "id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-04-01",
    "gender": "male",
    "phone": "+1-555-555-5555",
    "email": "john.doe@example.com",
    "address": "123 Main St, Springfield",
    "notes": "Diabetic, allergic to penicillin",
    "is_active": true,
    "created_at": "2024-06-18T10:15:00.000Z"
  }
  ```

---

### 4. Update Patient Info

**PUT** `/patients/{patientId}`

- **Purpose:** Update the information for an individual patient.
- **Route Parameter:** `patientId` (number)
- **Request Body:** Any updatable patient fields; validated with DTO, partial updates allowed.
  ```json
  {
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+1-555-111-2222"
  }
  ```
- **Business Logic:**
  - Checks for unique email and phone (if updated).
  - Applies field and format validation.
  - Performs update and returns latest patient info.
- **Response Example:**
  ```json
  {
    "id": 123,
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+1-555-111-2222",
    "updated_at": "2024-06-18T12:34:00.000Z"
  }
  ```

---

### 5. Activate / Deactivate Patient

**PATCH** `/patients/{patientId}/status`

- **Purpose:** Soft-enable or disable a patient record (deactivate).
- **Route Parameter:** `patientId` (number)
- **Request Body:**
  ```json
  {
    "is_active": false
  }
  ```
- **Business Logic:**
  - Sets the `is_active` field for the patient.
  - Soft-deactivation means data is retained but patient is unavailable for most actions.
- **Response Example:**
  ```json
  {
    "id": 123,
    "is_active": false,
    "updated_at": "2024-06-18T13:00:00.000Z"
  }
  ```

---

### 6. Soft Delete Patient

**DELETE** `/patients/{patientId}`

- **Purpose:** Soft-delete a patient (marks record as deleted but keeps it for audit/history).
- **Route Parameter:** `patientId` (number)
- **Business Logic:**
  - Sets a deleted flag or equivalent; data is not permanently removed.
  - Only authorized roles (e.g., clinic admin) can perform delete.
- **Response Example:**
  ```json
  {
    "message": "Patient deleted successfully"
  }
  ```

---

## Security and Validation Notes

- All endpoints require valid JWT authentication.
- Role-based access enforced (e.g., only staff/clinics can create or modify).
- All DTOs use strong validation (`class-validator`).
- Input is sanitized and output omits sensitive fields.
- Unique constraints on email and phone.
- Errors handled by global exception filters; error responses are consistent and never leak internal state.

---
