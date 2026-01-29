# Database Setup

## PostgreSQL and Redis configuration with Prisma ORM

### 1. Build database services

From the root of the project:

```bash
docker-compose up -d
```

This will lift:
- **PostgreSQL 15** en puerto 5432
- **Redis 7** en puerto 6379

### 2. Verify that services are running

```bash
docker ps
```

You should see the containers `microservices_postgres` y `microservices_redis` running.

### 3. Install Auth Service dependencies

```bash
cd services/auth-service
npm install
```

### 4. Generate Prism client

```bash
npm run prisma:generate
```

### 5. Execute migrations

```bash
npm run prisma:migrate
```

This will create the tables in the database according to the schema defined in `prisma/schema.prisma`.

### 6. (Optional) Populate the database with test data

```bash
npx ts-node src/scripts/seed.ts
```

This will create:
- User admin: `admin@example.com` / `admin123`
- User test: `test@example.com` / `test123`

### 7. (Optional) Open Prisma Studio

To view and edit database data visually:

```bash
npm run prisma:studio
```

Se abrirá en `http://localhost:5555`

## Database Structure

### Table: users
- `id` (UUID) - Primary key
- `email` (String) - Unique
- `password` (String) - Hasheada con bcrypt
- `firstName` (String) - Opcional
- `lastName` (String) - Opcional
- `role` (Enum) - USER | ADMIN | MODERATOR
- `isActive` (Boolean) - Default: true
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Table: refresh_tokens
- `id` (UUID) - Primary key
- `token` (String) - Unique
- `userId` (String) - Foreign key a users
- `expiresAt` (DateTime)
- `createdAt` (DateTime)

## Redis

Redis is used to:
- Session cache
- Invalidated refresh tokens (blacklist)
- Limiting rates
- Frequent data cache

### Connection  to Redis

The Redis client is automatically configured using the environment variables inn `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Helper functions available

```typescript
import { cache } from './db/redis';

// Get value
const value = await cache.get('key');

// Save value (with optional expiration in seconds)
await cache.set('key', 'value', 3600);

// Delete value
await cache.del('key');

// Check if it exists
const exists = await cache.exists('key');
```

## Useful commands

```bash
# See PostgreSQL logs
docker logs microservices_postgres

# See Redis logs
docker logs microservices_redis

# Connect to PostgreSQL
docker exec -it microservices_postgres psql -U user -d microservices_db

# Connect to Redis CLI
docker exec -it microservices_redis redis-cli

# Stop services
docker-compose down

# Stop services and delete volumes (⚠️ DELETE ALL DATA)
docker-compose down -v
```

## Troubleshooting

### Error: "Can't reach database server"

Verify that PostgreSQL is running:
```bash
docker ps | grep postgres
```

If he is not running, pick it up:
```bash
docker-compose up -d postgres
```

### Error: "Redis connection refused"

Check that Redis is running:
docker ps | grep redis
```

If he is not running, pick it up:
```bash
docker-compose up -d redis
```

### Reset the database

```bash
# Delete and recreate the database
npm run prisma:migrate reset

# This will execute:
# 1. Drop of all tables
#2. Execution of migrations
#3. Execution of the seed (if any)
```