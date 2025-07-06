# Authentication and Role-Based Access Control (RBAC) Documentation

## Overview

This document provides a comprehensive guide to the authentication and role-based access control (RBAC) system implemented in the HR Portal backend. The system ensures secure login, token management, user registration, role assignment, and permission-based access control.

## Authentication Features

- **JWT Token-based Authentication**: Using access tokens and refresh tokens
- **Password Hashing**: Secure password storage using bcrypt
- **Rate Limiting**: Protection against brute force attacks
- **Password Reset**: Email-based password reset functionality
- **Role-Based Access Control**: Different access levels based on user roles
- **Permission-Based Access Control**: Fine-grained access control based on specific permissions

## Core Components

### 1. Models

Located in `src/models/auth.py`:

- **User**: Stores user credentials and links to roles
- **Role**: Defines roles like admin, hr, manager, employee
- **Permission**: Defines specific permissions associated with roles

### 2. Authentication Utilities

Located in `src/auth/utils.py`:

- Password hashing and verification
- JWT token creation and verification
- Access and refresh token generation
- Rate limiting utilities

### 3. Authentication Dependencies

Located in `src/auth/deps.py`:

- `get_current_user`: Extracts and validates user from token
- `get_current_active_user`: Ensures user is active
- `has_role`: Checks if user has specific role
- `is_superuser`: Ensures user has admin role
- `RoleChecker`: Class for role-based access control on routes

### 4. Authentication Middleware

Located in `src/auth/middleware.py`:

- `PermissionChecker`: Middleware for permission-based access control
- `ResourceOwnershipChecker`: Middleware for checking resource ownership

### 5. Authentication API Routes

Located in `src/api/auth.py`:

- Login endpoint with rate limiting
- Token refresh endpoint
- Password reset functionality
- User registration and management
- Role and permission management

## Usage Examples

### Basic Authentication Flow

1. **Login**: User provides credentials and receives access and refresh tokens
   ```
   POST /auth/login
   ```

2. **Access Protected Resources**: Use access token in Authorization header
   ```
   GET /protected-endpoint
   Authorization: Bearer <access_token>
   ```

3. **Refresh Token**: When access token expires, use refresh token to get a new one
   ```
   POST /auth/refresh
   {
     "refresh_token": "<refresh_token>"
   }
   ```

### Role-Based Access Control

Protect endpoints based on user roles:

```python
@router.get("/admin-only")
def admin_only_endpoint(
    current_user: User = Depends(RoleChecker(["admin"]))
):
    # Only accessible to users with admin role
    return {"message": "Admin access granted"}
```

### Permission-Based Access Control

Protect endpoints based on specific permissions:

```python
@router.get("/create-employee", dependencies=[Depends(PermissionChecker(["employee:create"]))])
def create_employee_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    # Only accessible to users with employee:create permission
    return {"message": "Permission granted"}
```

### Resource Ownership Checking

Ensure users can only access their own resources:

```python
@router.get("/employee/{employee_id}")
def get_employee_endpoint(
    employee_id: int,
    _: None = Depends(ResourceOwnershipChecker(Employee, user_field="id")),
    current_user: User = Depends(get_current_active_user)
):
    # Only accessible to the resource owner or users with bypass roles
    return {"message": "Access granted"}
```

## Password Reset Flow

1. User requests password reset by providing email
   ```
   POST /auth/forgot-password
   {
     "email": "user@example.com"
   }
   ```

2. System sends email with reset token

3. User submits token and new password
   ```
   POST /auth/reset-password
   {
     "token": "<reset_token>",
     "new_password": "new_secure_password"
   }
   ```

## Environment Variables

The authentication system uses the following environment variables:

- `SECRET_KEY`: For JWT token signing
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Default is 30 minutes
- `REFRESH_TOKEN_EXPIRE_DAYS`: Default is 7 days
- `MAX_LOGIN_ATTEMPTS`: For rate limiting
- `LOCKOUT_TIME_MINUTES`: Duration of lockout after failed attempts
- `SMTP_*` variables: For email sending in password reset

## Security Considerations

- In-memory storage for rate limiting and password reset tokens is used for simplicity. In production, use Redis or similar persistent storage.
- Ensure HTTPS is enforced in production.
- Regularly rotate JWT signing keys.
- Implement token revocation for enhanced security.
- Consider adding two-factor authentication for sensitive operations.

## Example Endpoints

See `src/api/examples.py` for comprehensive examples of how to use the authentication and RBAC system in API endpoints.

## Default Roles and Permissions

The system initializes with the following default roles:

- **admin**: Full system access
- **hr**: HR-related operations
- **manager**: Department management
- **employee**: Basic employee access

Each role has associated permissions that determine what actions users with that role can perform.
