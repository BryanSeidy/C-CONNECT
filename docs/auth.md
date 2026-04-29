# Auth Module - CEMAC Connect

## Overview
Secure authentication module using Express + TypeScript + Prisma + bcrypt + JWT.

## Endpoints

### POST `/api/auth/register`
Create a user account.

Request:
```json
{
  "email": "test@mail.com",
  "password": "123456",
  "role": "buyer"
}
```

Success response (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "test@mail.com",
    "role": "buyer"
  },
  "message": "User created successfully"
}
```

Possible errors:
- `400` invalid or missing payload
- `409` email already exists

### POST `/api/auth/login`
Authenticate user and return JWT.

Request:
```json
{
  "email": "test@mail.com",
  "password": "123456"
}
```

Success response (200):
```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": 1,
      "email": "test@mail.com",
      "role": "buyer"
    }
  },
  "message": "Login successful"
}
```

Possible errors:
- `400` missing credentials
- `401` invalid credentials

## Error format
```json
{
  "success": false,
  "message": "Error message"
}
```

## Auth middleware
- `verifyToken`: validates `Authorization: Bearer <token>` and injects `req.user`.
- `authorizeRole(role)`: allows only users with required role.

## JWT payload
```json
{
  "userId": 1,
  "role": "buyer"
}
```

## Postman quick tests
1. **Register**: `POST /api/auth/register` with the sample body above.
2. **Login**: `POST /api/auth/login` and copy `data.token`.
3. **Protected route**: send header `Authorization: Bearer <TOKEN>`.
