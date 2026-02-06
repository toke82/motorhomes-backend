# Motorhomes Project

Motorhomes backend system built with Node.js, TypeScript and PostgreSQL.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   API Gateway (Port 3000)               │
│  - Central router, proxy, JWT authentication            │
└─────────────────────────────────────────────────────────┘
                          ↓
    ┌─────────────────────┬─────────────────────┐
    │                     │                     │
┌───────────────┐  ┌────────────────┐  ┌──────────────┐
│ Auth Service  │  │ Notification   │  │ Payment      │
│  (Port 3001)  │  │ Service        │  │ Service      │
└───────────────┘  └────────────────┘  └──────────────┘
    │                     │                     │
    └─────────────────────┬─────────────────────┘
                          ↓
            ┌──────────────────────────┐
            │  PostgreSQL + Redis      │
            │  - Persistent data       │
            │  - Cache and sessions    │
            └──────────────────────────┘
```

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis
- **Testing**: Jest
- **Validation**: express-validator
- **Security**: JWT, bcryptjs, helmet
- **Logging**: Winston

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- npm o yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd motorhomes-backend
```

2. Install dependencies
```bash
npm install
```

3. Build shared packages
```bash
# Build config package
cd shared/config && npm run build

# Build types package
cd ../types && npm run build

# Return to root
cd ../../
```

4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your specific configurations
```

5. Database setup
```bash
# Run Prisma migrations
npx prisma migrate dev
```

6. Start the services

```bash
# API Gateway
npm run dev:gateway

# Auth Service
npm run dev:auth

# Notification Service
npm run dev:notification

# Payment Service
npm run dev:payment
```

## Project Structure

```
motorhomes-project/
├── api-gateway/                  # API Gateway (Port 3000) - Entry point
├── services/
│   ├── auth-service/         # Authentication Service (Port 3001)
│   ├── notification-service/ # Notification Service (Port 3002)
│   └── payment-service/      # Payment Service (Port 3003)
├── shared/
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Shared utilities
│   └── config/              # Shared configurations
├── .env.example             # Example environment variables
├── docker-compose.yml       # PostgreSQL + Redis setup
├── package.json             # Main dependencies
└── tsconfig.json            # TypeScript configuration
```

## Monorepo Structure

This project uses **npm workspaces** with compiled shared packages. Key points:

- **Shared packages** (`shared/config`, `shared/types`) are built to `dist/` and referenced via TypeScript path aliases
- Each microservice has its own `tsconfig.json` mapping `@microservices/*` paths to the compiled `dist` folders
- Install dependencies from the **root** directory only
- Always build shared packages before services that depend on them

## Available Scripts

- `npm run dev:gateway` - Starts API Gateway in development mode
- `npm run dev:auth` - Starts Auth Service in development mode
- `npm run dev:notification` - Starts Notification Service in development mode
- `npm run dev:payment` - Starts Payment Service in development mode
- `npm run build` - Compiles all services
- `npm run test` - Runs tests across all services
- `npm run lint` - Runs linter
- `npm run format` - Formats code using Prettier

## Testing

```bash
# Run all tests
npm run test

# Run tests for a specific service
cd services/auth-service && npm test
```

## Troubleshooting

### Import resolution issues with @microservices/*

If you see errors like "Cannot find module '@microservices/config'":

1. Ensure shared packages are built:
```bash
cd shared/config && npm run build
cd ../types && npm run build
cd ../../
```

2. Verify TypeScript paths in the service's `tsconfig.json` point to `dist`:
```json
"paths": {
  "@microservices/config": ["../../shared/config/dist"],
  "@microservices/types": ["../../shared/types/dist"]
}
```

3. Restart the TypeScript server in VS Code (Ctrl+Shift+P → "TypeScript: Restart TS Server")


## License

ISC