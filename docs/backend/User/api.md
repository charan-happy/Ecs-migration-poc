# User Management API

This section describes the API endpoints for managing the authenticated user's profile and security settings. All endpoints require a valid JWT token.

---


## API Endpoints

### 1. Get Current User Profile

**GET** `/users/me`

- **Purpose:** Retrieve the profile information of the currently authenticated user.
- **Response Example:**
  ```json
  {
    "id": 12,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-123-4567",
    "profile_picture_url": "https://myapp.com/uploads/profile/12.jpg",
    "is_2fa_enabled": true,
    "created_at": "2024-06-18T13:17:00.000Z"
  }
  ```

---

### 2. Update Basic Profile Information

**PATCH** `/users/me`

- **Purpose:** Update basic user profile information (e.g., name, phone).
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "phone": "+1-555-123-4567"
  }
  ```
  - Only the fields provided will be updated.
- **Business Logic:**
  - Validates changes and checks for unique constraints (e.g., phone).
  - Input is validated and sanitized.
- **Response Example:**
  ```json
  {
    "id": 12,
    "name": "Jane Doe",
    "phone": "+1-555-123-4567",
    "updated_at": "2024-06-18T14:00:00.000Z"
  }
  ```

---

### 3. Change Profile Picture

**POST** `/users/me/profile-picture`

- **Purpose:** Update user profile picture by uploading a new image.
- **Request:** `multipart/form-data` with a `profile_picture` file.
- **Business Logic:**
  - Handles image upload, validation, and storage.
  - Updates the user’s profile with the new image URL.
  - Optionally deletes the old profile picture.
- **Response Example:**
  ```json
  {
    "id": 12,
    "profile_picture_url": "https://myapp.com/uploads/profile/12_updated.jpg"
  }
  ```
---

### 4. Change Password

**POST** `/users/me/change-password`

- **Purpose:** Change the password of the authenticated user.
- **Request Body:**
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456!"
  }
  ```
  - `current_password` must match existing password.
  - `new_password` must meet validation criteria (length, complexity, etc.).
- **Business Logic:**
  - Validates old password before updating.
  - Hashes the new password.
  - Logs the password change event.
- **Response Example:**
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

---

## High-Level Login Flow with 2FA

### Without 2FA

1. **User submits:** Email + Password
2. **System authenticates:** If valid, issues access token
3. **Access granted**

**Diagram:**
```
Email + Password → [Login] → [Access Token Issued]
```

---

### With 2FA Enabled

1. **User submits:** Email + Password
2. **System checks:** If user has 2FA enabled
3. **System requests:** One-Time Passcode (OTP)
4. **User submits:** OTP sent to email
5. **System verifies OTP:**
    - If valid, issues access token
    - If invalid, returns error
6. **Access granted**

**Diagram:**
```
Email + Password
    → [Login]
        → [If 2FA enabled]
            → [Ask for OTP]
                → [Verify OTP]
                    → [Issue Access Token]
```


### 5. Enable 2FA (Two-Factor Authentication)

**POST** `/users/me/enable-2fa`

- **Purpose:** Initiate enabling two-factor authentication (OTP via email).
- **Business Logic:**
  - Generates and sends a Time-Based One-Time Password (TOTP) secret/OTP to the user’s registered email.
  - Stores a temporary record for verification.
- **Response Example:**
  ```json
  {
    "message": "OTP sent to your registered email"
  }
  ```

---

### 6. Verify Email OTP for 2FA

**POST** `/users/me/verify-otp`

- **Purpose:** Verify the OTP sent to the user's email and enable 2FA upon success.
- **Request Body:**
  ```json
  {
    "otp": "837216"
  }
  ```
- **Business Logic:**
  - Verifies the OTP against the most recent one sent.
  - Upon successful verification, updates the user's `is_2fa_enabled` field to `true` in the database.

- **Response Example:**
  ```json
  {
    "message": "2FA enabled successfully"
  }
  ```

---

## Security and Validation Notes

- All routes require authenticated access (JWT).
- Input is validated using DTOs and `class-validator`.
- Output never includes password or sensitive authentication fields.
- Unique and rate limiting checks are enforced on sensitive flows (e.g., OTP and password change).
- Error responses follow a consistent format and do not leak internal details.
