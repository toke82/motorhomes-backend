# Auth Service

Authentication and user management microservice.

## Features

- ✅ User registration with email validation
- ✅ Login with JWT tokens (access + refresh)
- ✅ Token refresh mechanism
- ✅ Password change
- ✅ User management (admin only)
- ✅ Role-based access control (USER, ADMIN, MODERATOR)
- ✅ Password hashing with bcrypt
- ✅ Refresh token rotation
- ✅ Token blacklisting with Redis
- ✅ Input validation
- ✅ Soft delete for users

## Endpoints

### Public Endpoints

#### POST /register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "User registered successfully"
}
```

#### POST /login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "Login successful"
}
```

#### POST /refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  },
  "message": "Token refreshed successfully"
}
```

### Protected Endpoints (require JWT)

#### POST /logout
Logout and invalidate refresh token.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /me
Get current user information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-27T10:00:00.000Z",
    "updatedAt": "2024-01-27T10:00:00.000Z"
  }
}
```

#### PUT /change-password
Change user password.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Admin Endpoints (require ADMIN role)

#### GET /users
List all users with pagination.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-27T10:00:00.000Z",
      "updatedAt": "2024-01-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### GET /users/:id
Get user by ID.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    ...
  }
}
```

#### PUT /users/:id
Update user information.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "MODERATOR",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "MODERATOR",
    "isActive": true
  },
  "message": "User updated successfully"
}
```

#### DELETE /users/:id
Deactivate user (soft delete).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Roles

- **USER**: Default role, basic access
- **MODERATOR**: Elevated privileges
- **ADMIN**: Full access to user management

## Token System

### Access Token
- **Expiration**: 24 hours (configurable)
- **Used for**: API authentication
- **Storage**: Client-side (memory/localStorage)

### Refresh Token
- **Expiration**: 7 days (configurable)
- **Used for**: Obtaining new access tokens
- **Storage**: Database + Client-side (httpOnly cookie recommended)
- **Rotation**: New refresh token issued on each refresh

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **Token Blacklisting**: Redis-based token revocation
3. **Input Validation**: express-validator
4. **Refresh Token Rotation**: Prevents token reuse
5. **Soft Delete**: Users are deactivated, not deleted
6. **Role-Based Access Control**: Middleware for authorization

## Database Schema

### users
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  firstName     String?
  lastName      String?
  role          Role     @default(USER)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  refreshTokens RefreshToken[]
}
```

### refresh_tokens
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Role Enum
```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}
```

## Installation

```bash
# Install dependencies
cd services/auth-service
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

## Development

```bash
# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/microservices_db

# Server
PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=debug
```

## Project Structure

```
auth-service/
├── src/
│   ├── controllers/
│   │   ├── authController.ts       # Auth endpoints
│   │   └── userController.ts       # User management endpoints
│   ├── services/
│   │   ├── authService.ts          # Auth business logic
│   │   └── userService.ts          # User business logic
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication
│   │   └── validateRequest.ts      # Validation errors handler
│   ├── validators/
│   │   └── authValidators.ts       # Input validation rules
│   ├── routes/
│   │   ├── authRoutes.ts          # Auth routes
│   │   ├── userRoutes.ts          # User routes
│   │   └── index.ts               # Routes aggregator
│   ├── db/
│   │   ├── prisma.ts              # Prisma client
│   │   └── redis.ts               # Redis client
│   ├── utils/
│   │   └── logger.ts              # Winston logger
│   ├── scripts/
│   │   └── seed.ts                # Database seeder
│   └── index.ts                   # App entry point
├── prisma/
│   └── schema.prisma              # Database schema
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email"
    }
  ]
}
```

## HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created (registration)
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Server error

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- authService.test.ts
```

## Logs

Logs are saved in:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

## Troubleshooting

### "Email already registered"
The email is already in use. Try logging in or use a different email.

### "Invalid credentials"
Email or password is incorrect.

### "Account is deactivated"
The user account has been deactivated by an admin. Contact support.

### "Invalid or expired token"
The JWT token is invalid or has expired. Login again or refresh the token.

### "Insufficient permissions"
Your role doesn't have access to this endpoint.

## License

ISC