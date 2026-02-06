# API Gateway

Single entry point for all microservices in the system.

## Features

- ✅ Reverse proxy to all microservices
- ✅ Centralized JWT authentication
- ✅ Rate limiting per endpoint
- ✅ Centralized request logging
- ✅ CORS handling
- ✅ Security with Helmet
- ✅ Role-based access control
- ✅ Health checks

## Architecture

```
Client
   ↓
API Gateway (Port 3000)
   ├─→ /api/auth/*          → Auth Service (3001)
   ├─→ /api/notifications/* → Notification Service (3002)
   └─→ /api/payments/*      → Payment Service (3003)
```

## Installation

```bash
# From project root
npm install

# Or from api-gateway
cd api-gateway
npm install
```

## Configuration

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your settings
```

## Usage

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2024-01-27T10:00:00.000Z",
  "uptime": 12345
}
```

### Gateway Information

```http
GET /
```

### Authentication Routes

**Public:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

**Protected (require JWT):**
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

**Admin (require ADMIN role):**
- `GET /api/auth/users` - List users
- `GET /api/auth/users/:id` - Get user
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user

### Notification Routes

All require authentication.

- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications/:id` - Get notification
- `PUT /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification

### Payment Routes

All require authentication.

- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment

**Admin (require ADMIN or MODERATOR role):**
- `GET /api/payments/admin/all` - List all payments
- `PUT /api/payments/admin/:id` - Update payment

## Authentication

The Gateway expects a JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

The token must contain:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER" | "ADMIN" | "MODERATOR"
}
```

## Rate Limiting

### General
- 100 requests per 15 minutes per IP

### Authentication
- 5 login attempts per 15 minutes per IP
- Successful requests don't count

### Resource Creation
- 10 creations per hour per IP

## Middleware

### Authentication
- `authenticateToken` - Requires valid JWT
- `optionalAuth` - Optional JWT (adds user if present)
- `requireRole(...roles)` - Requires specific roles

### Rate Limiting
- `generalLimiter` - General rate limit
- `authLimiter` - Authentication rate limit
- `createLimiter` - Creation rate limit

### Logging
- `requestLogger` - Logs all requests
- `errorLogger` - Logs errors

## Proxy

The Gateway uses `http-proxy-middleware` to forward requests to services.

**Headers automatically added:**
- `X-User-Id` - Authenticated user ID
- `X-User-Email` - User email
- `X-User-Role` - User role
- `X-Forwarded-By` - Always "api-gateway"

## Logs

Logs are saved in:
- `logs/gateway-combined.log` - All logs
- `logs/gateway-error.log` - Errors only

Format:
```
2024-01-27 10:00:00 [API-Gateway] [info]: GET /api/auth/me 200 45ms - user-123
```

## Testing

```bash
npm test
```

## Structure

```
api-gateway/
├── src/
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   └── requestLogger.ts     # Request logging
│   ├── proxy/
│   │   └── serviceProxy.ts      # Proxy configuration
│   ├── routes/
│   │   └── index.ts             # Route definitions
│   ├── utils/
│   │   └── logger.ts            # Winston logger
│   └── index.ts                 # Main entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Security

- ✅ Helmet for security headers
- ✅ CORS configured
- ✅ Rate limiting
- ✅ JWT for authentication
- ✅ Role-based access control
- ✅ All requests logged
- ✅ Token validation

## Troubleshooting

### Error: "Service temporarily unavailable"

Check that microservices are running:
```bash
# Auth Service
curl http://localhost:3001/health

# Notification Service
curl http://localhost:3002/health

# Payment Service
curl http://localhost:3003/health
```

### Error: "Invalid or expired token"

The JWT token is invalid or expired. Generate a new one:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Error: "Too many requests"

You've exceeded the rate limit. Wait a few minutes and try again.

## Usage Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Get Profile (with token)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

### List Users (requires ADMIN)
```bash
curl http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer <admin-token>"
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Auth Service
AUTH_SERVICE_URL=http://localhost:3001

# Notification Service
NOTIFICATION_SERVICE_URL=http://localhost:3002

# Payment Service
PAYMENT_SERVICE_URL=http://localhost:3003

# JWT (must match auth-service)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
```

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Production Considerations

### CORS Configuration
Update the CORS configuration in production:

```typescript
app.use(
  cors({
    origin: ['https://yourdomain.com'],
    credentials: true,
  })
);
```

### Environment Variables
- Use strong, unique JWT secrets
- Configure proper service URLs
- Set `NODE_ENV=production`
- Adjust rate limits as needed

### Monitoring
- Monitor logs in `logs/` directory
- Set up log aggregation (e.g., ELK stack)
- Monitor service health endpoints
- Track rate limit hits

### Performance
- Consider Redis for rate limiting in production
- Use cluster mode for multiple cores
- Implement caching where appropriate
- Monitor proxy performance

## API Gateway Flow

```
1. Client Request
   ↓
2. General Rate Limiter (100 req/15min)
   ↓
3. Request Logger (log incoming request)
   ↓
4. Route Matching (/api/auth, /api/notifications, /api/payments)
   ↓
5. Specific Rate Limiter (if applicable)
   ↓
6. Authentication Middleware (if required)
   ↓
7. Role Check (if required)
   ↓
8. Proxy to Microservice
   ↓
9. Add Custom Headers (X-User-*, X-Forwarded-By)
   ↓
10. Microservice Processing
   ↓
11. Response Logging
   ↓
12. Client Response
```

## Security Best Practices

1. **Always validate JWT tokens** before proxying to services
2. **Use HTTPS in production** - Never send tokens over HTTP
3. **Rotate JWT secrets regularly** - Update in all services
4. **Monitor rate limit hits** - Detect potential attacks
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Sanitize logs** - Don't log sensitive data (passwords, full tokens)
7. **Implement request timeouts** - Prevent hanging connections
8. **Use environment variables** - Never hardcode secrets

## Contributing

When adding new routes:

1. Define the route in `src/routes/index.ts`
2. Apply appropriate middleware (auth, rate limiting)
3. Configure proxy in `src/proxy/serviceProxy.ts`
4. Update this README with the new endpoint
5. Add tests

## License

ISC

## Support

For issues and questions:
- Check logs in `logs/` directory
- Verify microservices are running
- Check environment variables
- Review rate limit settings
- Consult troubleshooting section above