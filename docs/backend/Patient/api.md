# Patient Management API

This document describes the API endpoints for managing patients in the system. All endpoints require JWT authentication and are subject to role-based access control. Patients can be created by clinicians for clinics within their organization only. All patient-related APIs are accessible by clinicians, clinic admins, and org admins.

---

## API Endpoints

### 1. Register New Patient

**POST** `/patients`

- **Access Control:** Only accessible by clinicians, clinic admins, or org admins
- **Purpose:** Register and create a new patient record in the system. Patients can only be created by clinicians for clinics within their organization.
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
    "notes": "Diabetic, allergic to penicillin",
    "clinic_id": 10
  }
  ```
  - **All required fields** must be provided as per DTO/validation. Email is required but not unique. Phone is optional and not unique.
  - `clinic_id` (required): ID of the clinic where the patient is being registered (must be within the clinician's organization)
- **Business Logic:**
  - Validates that the authenticated user is a clinician assigned to the specified clinic.
  - Validates that the clinic belongs to the clinician's organization.
  - Applies input validation and sanitization (email format, phone format, etc.).
  - Records `created_by` from the authenticated clinician and associates patient with the clinic.
  - Creates a `clinic_patients` record linking the patient to the clinic.
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

- **Access Control:** Only accessible by clinicians, clinic admins, or org admins
- **Purpose:** Retrieve a paginated, searchable list of patients.
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Number of records per page (default: 20)
  - `search` (string, optional): Search text (matches name, phone, or email)
  - `clinic_id` (number, optional): Filter by clinic ID
  - `organization_id` (number, optional): Filter by organization ID
  - Additional filter params may be supported (status, gender, etc.)
- **Business Logic:**
  - Returns paginated results, sorted by name or creation date.
  - Clinicians can only view patients from clinics they are assigned to within their organization.
  - Clinic admins can view patients from their clinic.
  - Org admins can view patients from all clinics within their organization.
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

- **Access Control:** Only accessible by clinicians, clinic admins, or org admins
- **Purpose:** Retrieve details for an individual patient by ID.
- **Route Parameter:** `patientId` (number)
- **Business Logic:**
  - Validates that the patient exists and is associated with a clinic.
  - Clinicians can only access patients from clinics they are assigned to within their organization.
  - Clinic admins can access patients from their clinic.
  - Org admins can access patients from all clinics within their organization.
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

- **Access Control:** Only accessible by clinicians, clinic admins, or org admins
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
  - Validates that the patient exists and is associated with a clinic.
  - Clinicians can only update patients from clinics they are assigned to within their organization.
  - Clinic admins can update patients from their clinic.
  - Org admins can update patients from all clinics within their organization.
  - Applies field and format validation (email format, phone format, etc.).
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

- **Access Control:** Only accessible by clinicians, clinic admins, or org admins
- **Purpose:** Soft-enable or disable a patient record (deactivate).
- **Route Parameter:** `patientId` (number)
- **Request Body:**
  ```json
  {
    "is_active": false
  }
  ```
- **Business Logic:**
  - Validates that the patient exists and is associated with a clinic.
  - Clinicians can only activate/deactivate patients from clinics they are assigned to within their organization.
  - Clinic admins can activate/deactivate patients from their clinic.
  - Org admins can activate/deactivate patients from all clinics within their organization.
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

- **Access Control:** Only accessible by clinicians, clinic admins, or org admins
- **Purpose:** Soft-delete a patient (marks record as deleted but keeps it for audit/history).
- **Route Parameter:** `patientId` (number)
- **Business Logic:**
  - Validates that the patient exists and is associated with a clinic.
  - Clinicians can only delete patients from clinics they are assigned to within their organization.
  - Clinic admins can delete patients from their clinic.
  - Org admins can delete patients from all clinics within their organization.
  - Sets a deleted flag or equivalent; data is not permanently removed.
- **Response Example:**
  ```json
  {
    "message": "Patient deleted successfully"
  }
  ```

---

## Security and Validation Notes

- All endpoints require valid JWT authentication.
- **Access Control:**
  - All patient-related APIs are accessible by clinicians, clinic admins, and org admins.
  - Patients can only be created by clinicians for clinics within their organization.
  - Clinicians can only access patients from clinics they are assigned to within their organization.
  - Clinic admins can access patients from their clinic.
  - Org admins can access patients from all clinics within their organization.
- All DTOs use strong validation (`class-validator`).
- Input is sanitized and output omits sensitive fields.
- Email is required but not unique (as per database schema).
- Phone is optional and not unique (as per database schema).
- Patients are associated with clinics through the `clinic_patients` table.
- Errors handled by global exception filters; error responses are consistent and never leak internal state.

---
