# Auth API Documentation

---

## Login API

- **Endpoint:** `POST /auth/login`
- **Purpose:**
  Authenticates users using email and password. This entry-point is **unprotected**—all users (logged in or not) can access this route.

- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "your-password"
  }
  ```
  *Both fields are required. `email` must be a valid email address (validated by DTO), and `password` must be at least 8 characters, meeting regex requirements.*

- **Business Logic Flow:**
  1. **Controller:**
     - Accepts and validates login data (DTO/pipe).
     - Invokes Auth Service for authentication.
  2. **Service:**
     - Finds user in the database by email.
     - Verifies the password using secure hash comparison (`bcrypt` or similar).
     - **If the user has 2FA enabled:**
       - Generate a One-Time Password (OTP) for the user.
       - Send the OTP to the user’s registered email address.
       - Generate a temporary token (tempToken) that links to this pending authentication attempt and send it in a secure HTTP-only cookie or as part of the response (based on design).
       - Return **NO access or refresh token yet**—the client will need to call a dedicated endpoint to finish login via 2FA OTP.
       - **Response Example (if 2FA enabled):**
         ```json
         {
           "requires_2fa": true,
           "message": "OTP sent to your registered email",
           "temp_token": "TEMP_TOKEN_HASH"
         }
         ```
     - **If the user does NOT have 2FA enabled:**
       - Generate both an **access token** and a **refresh token**.
       - Set access token as an HTTP-only cookie.
       - Return both tokens and minimal user payload.
       - **Response Example (if 2FA not enabled):**
         ```json
         {
           "access_token": "JWT_TOKEN_HERE",
           "refresh_token": "REFRESH_TOKEN_HERE",
           "user": {
             "id": 123,
             "email": "user@example.com",
             "phone": "+1-555-555-5555",
             "role_id": 2,
             "clinic_id": 3 // present only if not admin/super_admin
           }
         }
         ```
  3. **Database Layer:**
     - Handles user lookups and temp token/OTP storage if 2FA is initiated.

- **Tokens:**
  - **Access Token:** Set as HTTP-only cookie for authorizing further requests. Payload includes: `user_id`, `email`, `phone`, `role_id`, and for non-admin users also `clinic_id`.
  - **Refresh Token:** Used to renew session as per implementation.

- **Security Notes:**
  - This is a **public** route—**no guards or authentication middleware** are applied.
  - Always use rate limiting and logging to prevent brute-force attacks.
  - Never reveal whether email exists or not in the response.

> This login API supports step-up authentication. If 2FA is enabled, it enforces OTP verification before issuing access and refresh tokens.

---

## Verify 2FA OTP API

- **Endpoint:** `POST /auth/verify-2fa-otp`
- **Purpose:**
  Finalizes login for users with 2FA enabled by verifying the OTP and issuing tokens.

- **Request Body:**
  ```json
  {
    "otp": "123456"
  }
  ```
  - The OTP must be exactly 6 digits.
  - The **temp_token** (issued by the login endpoint) must be provided as an HTTP-only cookie or in a custom header (according to your implementation).

- **Business Logic Flow:**
  1. **Controller:**
     - Receives OTP and temp token.
     - Validates input.
     - Invokes Auth Service.
  2. **Service:**
     - Validates temp token and retrieves pending user session.
     - Verifies that OTP matches the most recently generated value for the user.
     - If valid, generates and returns **access token** and **refresh token** just like the normal login response.
     - Deletes or expires the temp token and OTP.
     - If invalid, returns an error.
  3. **Response Example (on success):**
     ```json
     {
       "access_token": "JWT_TOKEN_HERE",
       "refresh_token": "REFRESH_TOKEN_HERE",
       "user": {
         "id": 123,
         "email": "user@example.com",
         "phone": "+1-555-555-5555",
         "role_id": 2,
         "clinic_id": 3
       }
     }
     ```
  4. **Security:**
     - Applies rate limiting and logs attempts.
     - OTP attempts should expire and rate-limited to prevent brute-force.

> Clients should use the `/auth/login` endpoint first. If 2FA is required, client must call `/auth/verify-2fa-otp` with the OTP and temp token to complete login and receive access/refresh tokens.


## Forgot Password API

- **Endpoint:** `POST /auth/forgot-password`
- **Purpose:**
  Initiates password reset by sending an OTP to the user's email address.

- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

- **How it works:**
  - **No authentication or guards** are present on this route.
  - Expects a valid email in the body.
  - Service logic:
    - If the email does *not* exist, a `NotFoundException` is triggered, but *no information* about account presence is leaked in responses.
    - If the email exists, generates an OTP for password reset.
    - Sends OTP to the email via AWS SQS (OTP is **never** revealed in API response).
  - **Response Example** (`200 OK`):
    ```json
    {
      "message": "OTP sent successfully"
    }
    ```
  - **Security:**
    Use rate limiting and logging. Do not leak whether the email is registered in responses.

---

## Verify OTP API

- **Endpoint:** `POST /auth/verify-otp`
- **Purpose:**
  Confirms the OTP for password reset.

- **Request Body:**
  ```json
  {
    "otp": "123456"
  }
  ```
  - **Validation:**
    - OTP must be **exactly 6 digits**, `0-9` only.
    - Any different value triggers a `BadRequestException`.

- **How it works:**
  - Client must send the **temporary token** (acquired after OTP request) in a cookie.
    - This links the OTP validation to the specific user and reset flow.
  - **TempTokenGuard** checks temp token validity and reset status **before** the controller:
    - If invalid or expired: access denied.
    - If valid: guard extracts `user_id` for downstream use.
  - Service checks that the OTP matches, is valid for the user and the "forgot password" operation:
    - If not, a `BadRequestException` is thrown.
    - If valid, generates a new temp token for the *next* ("reset password") phase and sets it as a response cookie.
  - **Response Example** (`200 OK`):
    ```json
    {
      "message": "OTP verified. Proceed to reset password."
    }
    ```

---

## Reset Password API

- **Endpoint:** `POST /auth/reset-password`
- **Purpose:**
  Sets a new password using a verified temp token (from successful OTP verification).

- **Request Body:**
  ```json
  {
    "password": "YourNewP@ssw0rd",
    "confirmPassword": "YourNewP@ssw0rd"
  }
  ```

- **How it works:**
  - Requires a **valid temp token** in the cookie (from previous step).
  - **Validation:**
    - DTO validation (before controller) enforces:
      - Minimum 8 characters
      - At least one uppercase, one lowercase, one number, and one special character
    - `password` and `confirmPassword` must match; if not, throws `BadRequestException`.
  - **TempTokenGuard** ensures temp token is for the reset password phase and not expired.
  - **Service logic:**
    - Confirms password fields match.
    - Password is hashed with bcrypt.
    - Updates user's password in the database.
    - **No access or refresh token** is issued in this flow. User must log in separately after reset.
  - **Response Example** (`200 OK`):
    ```json
    {
      "message": "Password reset successful. Please login with your new password."
    }
    ```
