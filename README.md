# 🎬 Core Media Backend

A **production-grade, enterprise-ready** NestJS backend architecture built with industry-standard security, observability, and scalability patterns.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Feature Details & Examples](#-feature-details--examples)
  - [Configuration & Validation](#1--configuration--validation)
  - [Security Layer](#2--security-layer)
  - [Authentication & RBAC](#3--authentication--rbac)
  - [API Versioning](#4--api-versioning)
  - [Logging & Observability](#5--logging--observability)
  - [Request Context / Correlation ID](#6--request-context--correlation-id)
  - [Error Handling](#7--error-handling)
  - [Caching](#8--caching)
  - [Rate Limiting](#9--rate-limiting)
  - [Health Checks](#10--health-checks)
  - [Queue System (Background Jobs)](#11--queue-system-background-jobs)
  - [Pagination, Filtering & Sorting](#12--pagination-filtering--sorting)
  - [Event-Driven Architecture](#13--event-driven-architecture)
  - [Feature Flags](#14--feature-flags)
  - [Custom Decorators](#15--custom-decorators)
  - [Swagger API Documentation](#16--swagger-api-documentation)
- [Testing](#-testing)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Scripts](#-scripts)

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| Config Validation (Joi) | ✅ | Prevent runtime crashes from missing env vars |
| Helmet & CORS | ✅ | XSS prevention and cross-origin management |
| JWT Authentication | ✅ | Stateless token-based auth with Passport |
| Role-Based Access Control | ✅ | `@Roles()` decorator with `RolesGuard` |
| API Versioning (URI) | ✅ | Future-proof `/api/v1/...` routing |
| Winston Logging | ✅ | Daily rotating file logs + console output |
| Morgan HTTP Logging | ✅ | Request-level HTTP access logs |
| Correlation IDs | ✅ | Track requests across logs with `reqId` |
| Global Exception Filter | ✅ | Standardized error responses |
| Response Interceptor | ✅ | Consistent `{ success, data, message }` envelope |
| Redis / In-Memory Caching | ✅ | Environment-aware cache layer |
| Rate Limiting (Throttler) | ✅ | Prevent brute-force attacks |
| Health Checks (Terminus) | ✅ | `/health` endpoint for Docker/K8s |
| Background Jobs (Bull) | ✅ | Non-blocking email/notification processing |
| Pagination & Filtering | ✅ | Standardized query params for all list endpoints |
| Event-Driven Architecture | ✅ | Decoupled domain events with `@OnEvent()` |
| Feature Flags | ✅ | Dynamic enable/disable features at runtime |
| Custom Decorators | ✅ | `@Public()`, `@Roles()`, `@CurrentUser()`, `@FeatureGate()` |
| Swagger API Docs | ✅ | Interactive documentation at `/api/docs` |
| Unit & E2E Testing | ✅ | Jest test suites with full pipeline coverage |
| CI/CD (GitHub Actions) | ✅ | Automated lint → test → build → deploy |

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Auth | Passport + JWT |
| Validation | class-validator + class-transformer + Joi |
| Logging | Winston + winston-daily-rotate-file + Morgan |
| Caching | cache-manager + cache-manager-redis-yet |
| Queue | Bull (BullMQ) + Redis |
| Health | @nestjs/terminus |
| Rate Limiting | @nestjs/throttler |
| Events | @nestjs/event-emitter |
| Context | nestjs-cls (AsyncLocalStorage) |
| Docs | @nestjs/swagger |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
src/
├── auth/                          # Authentication module
│   ├── auth.module.ts             # JWT + Passport wiring
│   └── strategies/
│       └── jwt.strategy.ts        # JWT extraction & validation
├── common/                        # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   ├── public.decorator.ts         # @Public() bypass auth
│   │   └── roles.decorator.ts          # @Roles() RBAC decorator
│   ├── dto/
│   │   ├── pagination-query.dto.ts     # Standard pagination query params
│   │   └── paginated-response.dto.ts   # Paginated response wrapper
│   ├── enums/
│   │   └── role.enum.ts                # User role definitions
│   ├── filters/
│   │   └── global-exception.filter.ts  # Global error handler
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # JWT guard (with @Public() support)
│   │   └── roles.guard.ts             # RBAC guard
│   ├── interceptors/
│   │   └── response.interceptor.ts     # Consistent response envelope
│   └── utils/
│       └── pagination.util.ts          # createPaginatedResponse() helper
├── events/                        # Event-Driven Architecture
│   ├── event-definitions.ts       # Typed event classes + constants
│   ├── event-listeners.ts         # @OnEvent() handlers
│   ├── events.module.ts           # EventEmitter registration
│   └── index.ts                   # Barrel exports
├── feature-flags/                 # Feature Flag System
│   ├── feature-flag.controller.ts # Admin API for flag management
│   ├── feature-flag.guard.ts      # Global @FeatureGate() guard
│   ├── feature-flag.module.ts     # Global module registration
│   ├── feature-flag.service.ts    # Flag checking + runtime overrides
│   └── feature-gate.decorator.ts  # @FeatureGate() decorator
├── health/                        # Health Monitoring
│   ├── health.controller.ts       # GET /health endpoint
│   ├── health.module.ts           # Terminus integration
│   └── redis.health.ts            # Custom Redis health indicator
├── jobs/                          # Background Job System
│   ├── jobs.controller.ts         # Queue dispatch endpoints
│   ├── jobs.module.ts             # Bull queue registration
│   ├── jobs.service.ts            # Queue interaction service
│   ├── jobs.service.spec.ts       # Unit tests
│   └── processors/
│       └── email.processor.ts     # Email queue worker
├── app.module.ts                  # Root module (all wiring)
├── app.controller.ts              # Root controller
├── app.service.ts                 # Root service
└── main.ts                        # Bootstrap + global middleware
test/
├── app.e2e-spec.ts                # End-to-end integration tests
└── jest-e2e.json                  # E2E Jest configuration
.github/
└── workflows/
    └── ci.yml                     # GitHub Actions CI/CD pipeline
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20
- **Yarn** >= 1.22
- **Redis** (optional for dev, required for production)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd core-media_backend

# Install dependencies
yarn install

# Create your local environment file
cp .env.example .env.local
```

### Running the App

```bash
# Development (with hot reload)
yarn start:dev

# Debug mode
yarn start:debug

# Production
yarn build
yarn start:prod
```

The server starts at `http://localhost:8080` (configurable via `PORT`).

---

## 🔐 Environment Variables

Create `.env.local` for development and `.env.production` for production.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | No | `development` | `development` \| `production` \| `test` |
| `PORT` | number | No | `3000` | Server port |
| `JWT_SECRET` | string | **Yes** | — | Secret key for JWT signing |
| `USE_REDIS` | boolean | No | `false` | Force-enable Redis in dev mode |
| `REDIS_HOST` | string | No | `localhost` | Redis server hostname |
| `REDIS_PORT` | number | No | `6379` | Redis server port |
| `FEATURE_*` | boolean | No | `false` | Feature flags (see Feature Flags section) |

### Example `.env.local`

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=super_secret_dev_key_123
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
FEATURE_BETA_API=true
FEATURE_DARK_MODE=false
```

---

## 📖 Feature Details & Examples

### 1. ⚙️ Configuration & Validation

**Joi** validates all environment variables at startup. If a required variable is missing, the app **refuses to boot** with a clear error message.

```typescript
// src/app.module.ts
ConfigModule.forRoot({
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    JWT_SECRET: Joi.string().required(),  // App won't start without this!
    USE_REDIS: Joi.boolean().default(false),
  }),
});
```

**What happens if JWT_SECRET is missing:**
```
Config validation error: "JWT_SECRET" is required
```

---

### 2. 🛡️ Security Layer

#### Helmet (XSS Protection)
```typescript
// src/main.ts
app.use(helmet());
```
Automatically sets secure HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.).

#### CORS
```typescript
app.enableCors({
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

#### Input Validation
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Throw error on unknown properties
  transform: true,           // Auto-transform payloads to DTO types
}));
```

---

### 3. 🔑 Authentication & RBAC

#### JWT Authentication

```typescript
// Protect a route with JWT
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: any) {
  return user;
}
```

#### Role-Based Access Control

```typescript
// Only admins can access this route
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete('users/:id')
deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

#### Public Routes (Skip Auth)

```typescript
// This route is accessible without a token
@Public()
@Get('status')
getStatus() {
  return { status: 'ok' };
}
```

---

### 4. 📡 API Versioning

All routes are prefixed with `/api/v1/`. The versioning type is **URI-based**.

```typescript
// src/main.ts
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

**Result:**
| Route | URL |
|-------|-----|
| Root | `GET /api/v1` |
| Health | `GET /api/v1/health` |
| Feature Flags | `GET /api/v1/feature-flags` |

#### Creating a V2 Endpoint

```typescript
@Controller('users')
export class UsersController {
  @Version('1')
  @Get()
  findAllV1() { return 'V1 users list'; }

  @Version('2')
  @Get()
  findAllV2() { return 'V2 users list with extra fields'; }
}
```

---

### 5. 📝 Logging & Observability

#### Winston Logger

- **Console**: Colorized, pretty-printed logs during development
- **File Rotation**: Daily rotating log files with auto-compression
  - `logs/error-YYYY-MM-DD.log` — Error-level only
  - `logs/combined-YYYY-MM-DD.log` — All levels
  - Auto-cleanup after 14 days, max 20MB per file

#### Morgan HTTP Logging

```
# Development (dev format)
GET /api/v1/health 200 14.234 ms - 231

# Production (combined format → piped to Winston files)
::1 - - [23/Apr/2026:06:15:00 +0000] "GET /api/v1/health HTTP/1.1" 200 231
```

---

### 6. 🔗 Request Context / Correlation ID

Every request is automatically assigned a unique `reqId` (UUID). If the client sends an `x-correlation-id` header, that value is used instead.

```typescript
// The ID is available in every log entry:
{
  "level": "info",
  "message": "GET /api/v1/health 200",
  "reqId": "c4b9d7e3-1a2b-4c5d-9e8f-0a1b2c3d4e5f",
  "timestamp": "2026-04-23T06:15:00.000Z"
}
```

**Usage in services:**
```typescript
import { ClsService } from 'nestjs-cls';

@Injectable()
export class MyService {
  constructor(private readonly cls: ClsService) {}

  doSomething() {
    const requestId = this.cls.getId();
    this.logger.log(`Processing request ${requestId}`);
  }
}
```

---

### 7. 🚨 Error Handling

#### Global Exception Filter

All errors are caught and returned in a standardized format:

```json
// 400 Bad Request
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email", "name should not be empty"],
  "timestamp": "2026-04-23T06:15:00.000Z",
  "path": "/api/v1/users"
}

// 500 Internal Server Error (production — no stack traces leaked)
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-04-23T06:15:00.000Z",
  "path": "/api/v1/users"
}
```

#### Response Interceptor

All successful responses are wrapped in a consistent envelope:

```json
{
  "success": true,
  "data": { "id": "123", "name": "John" },
  "message": "Success"
}
```

---

### 8. 💾 Caching

#### Environment-Aware Caching

| Environment | Cache Store | Requires Redis |
|-------------|-------------|----------------|
| Development | In-memory | ❌ |
| Development + `USE_REDIS=true` | Redis | ✅ |
| Production | Redis | ✅ |

```typescript
// Using the CacheInterceptor (auto-caches GET responses)
@UseInterceptors(CacheInterceptor)
@Get('products')
findAll() {
  return this.productsService.findAll();
}

// Manual cache control
@Inject(CACHE_MANAGER) private cacheManager: Cache;

async getExpensiveData() {
  const cached = await this.cacheManager.get('expensive-key');
  if (cached) return cached;

  const data = await this.computeExpensiveData();
  await this.cacheManager.set('expensive-key', data, 60000); // 60s TTL
  return data;
}
```

---

### 9. 🚦 Rate Limiting

Globally configured via `@nestjs/throttler`:

```typescript
// Default: 100 requests per 60 seconds per IP
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
```

**Custom limits per route:**
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
login() { /* Max 5 login attempts per minute */ }
```

**Response when throttled:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

### 10. 📊 Health Checks

**Endpoint:** `GET /api/v1/health`

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "info": {
      "memory_heap": { "status": "up" },
      "redis": { "status": "up" }
    },
    "details": {
      "memory_heap": { "status": "up" },
      "redis": { "status": "up" }
    }
  }
}
```

✔ Ready for Docker `HEALTHCHECK` and Kubernetes liveness/readiness probes.

---

### 11. 📬 Queue System (Background Jobs)

#### Conditional Loading

- **Development**: Bull queues are **not loaded** (no Redis required)
- **Development + `USE_REDIS=true`**: Bull queues are loaded
- **Production**: Bull queues are always loaded

#### Dispatching Jobs

```typescript
// POST /api/v1/jobs/email
// Body: { "email": "user@example.com", "name": "John" }

// In your service:
await this.emailsQueue.add('send-welcome', {
  email: 'user@example.com',
  name: 'John',
}, {
  attempts: 3,      // Retry 3 times on failure
  backoff: 5000,    // Wait 5s between retries
});
```

#### Processing Jobs

```typescript
// src/jobs/processors/email.processor.ts
@Processor('emails')
export class EmailProcessor {
  @Process('send-welcome')
  async handleWelcomeEmail(job: Job) {
    const { email, name } = job.data;
    // Send email logic here
  }
}
```

---

### 12. 🔍 Pagination, Filtering & Sorting

#### Using PaginationQueryDto

```typescript
@Get()
findAll(@Query() query: PaginationQueryDto) {
  // query.page    → number (default: 1)
  // query.limit   → number (default: 10)
  // query.sort    → string (e.g., "createdAt:desc")
  // query.filters → object (e.g., { status: "active" })
}
```

#### Example Request

```
GET /api/v1/users?page=2&limit=20&sort=createdAt:desc&filters={"status":"active"}
```

#### Standardized Response

```typescript
import { createPaginatedResponse } from './common/utils/pagination.util';

const result = createPaginatedResponse(users, totalCount, page, limit);
```

```json
{
  "data": [{ "id": "1", "name": "John" }, ...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

---

### 13. 📡 Event-Driven Architecture

#### Defining Events

```typescript
// src/events/event-definitions.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
  ) {}
}

export const AppEvents = {
  USER_CREATED: 'user.created',
  ORDER_PLACED: 'order.placed',
  PAYMENT_COMPLETED: 'payment.completed',
} as const;
```

#### Emitting Events

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents, UserCreatedEvent } from '../events';

@Injectable()
export class UsersService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.userRepo.save(dto);

    // Fire and forget — listeners handle side effects
    this.eventEmitter.emit(
      AppEvents.USER_CREATED,
      new UserCreatedEvent(user.id, user.email, user.name),
    );

    return user;
  }
}
```

#### Listening to Events

```typescript
// src/events/event-listeners.ts
@OnEvent(AppEvents.USER_CREATED)
handleUserCreated(event: UserCreatedEvent) {
  this.logger.log(`New user created: ${event.email}`);
  // Send welcome email, notify analytics, etc.
}
```

---

### 14. 🏁 Feature Flags

#### Configuring Flags via `.env`

```env
FEATURE_BETA_API=true
FEATURE_DARK_MODE=false
FEATURE_SOCIAL_LOGIN=true
```

#### Gating a Route

```typescript
import { FeatureGate } from '../feature-flags/feature-gate.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.service';

@FeatureGate(FeatureFlag.BETA_API)
@Get('beta-search')
betaSearch() {
  return { results: [] };
}
// Returns 404 if FEATURE_BETA_API is disabled
```

#### Checking in Service Logic

```typescript
@Injectable()
export class NotificationService {
  constructor(private flags: FeatureFlagService) {}

  async notify(userId: string) {
    if (this.flags.isEnabled(FeatureFlag.EMAIL_NOTIFICATIONS)) {
      await this.sendEmail(userId);
    }
  }
}
```

#### Runtime Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/feature-flags` | List all flags and their status |
| `GET` | `/api/v1/feature-flags/:flag` | Check a specific flag |
| `POST` | `/api/v1/feature-flags/:flag/enable` | Enable at runtime |
| `POST` | `/api/v1/feature-flags/:flag/disable` | Disable at runtime |
| `DELETE` | `/api/v1/feature-flags/:flag/override` | Reset to env default |

---

### 15. 🎯 Custom Decorators

| Decorator | Location | Purpose |
|-----------|----------|---------|
| `@Public()` | `common/decorators/public.decorator.ts` | Skip JWT authentication |
| `@Roles(Role.ADMIN)` | `common/decorators/roles.decorator.ts` | Require specific roles |
| `@CurrentUser()` | `common/decorators/current-user.decorator.ts` | Extract user from JWT payload |
| `@FeatureGate(flag)` | `feature-flags/feature-gate.decorator.ts` | Gate routes behind feature flags |

#### DI for Custom Validators

Custom `class-validator` decorators can inject NestJS services (e.g., for database uniqueness checks):

```typescript
// This is enabled by useContainer() in main.ts
@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(email: string) {
    const user = await this.usersService.findByEmail(email);
    return !user;
  }
}
```

---

### 16. 📚 Swagger API Documentation

Interactive API docs are available at **`/api/docs`** when the server is running.

- Auto-generated from decorators and DTOs
- Supports `Try it out` for live testing
- Bearer token authentication built-in
- Swagger spec is auto-exported to `docs/swagger-spec.json`

---

## 🧪 Testing

### Unit Tests

```bash
yarn test           # Run all unit tests
yarn test:watch     # Watch mode
yarn test:cov       # With coverage report
```

**Example: JobsService unit test** (`src/jobs/jobs.service.spec.ts`)
```typescript
it('should push a send-welcome job to the emails queue', async () => {
  await service.sendWelcomeEmail('user@example.com', 'John');
  expect(mockQueue.add).toHaveBeenCalledWith(
    'send-welcome',
    { email: 'user@example.com', name: 'John' },
    { attempts: 3, backoff: 5000 },
  );
});
```

### E2E Tests

```bash
yarn test:e2e       # Run integration tests
```

**Example: Health check E2E test** (`test/app.e2e-spec.ts`)
```typescript
it('GET /api/v1/health - System health check', () => {
  return request(app.getHttpServer())
    .get('/api/v1/health')
    .expect(200)
    .expect((res) => {
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
});
```

---

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

```
┌─────────────┐    ┌──────────┐    ┌───────────┐    ┌─────────┐    ┌──────────┐
│  Checkout   │ →  │  Install │ →  │   Lint    │ →  │  Test   │ →  │  Build   │
│  Repository │    │   Deps   │    │   Code    │    │ Unit+E2E│    │   App    │
└─────────────┘    └──────────┘    └───────────┘    └─────────┘    └──────────┘
                                                                        │
                                                                        ▼
                                                                 ┌──────────┐
                                                                 │  Deploy  │
                                                                 │  (main)  │
                                                                 └──────────┘
```

- **Redis service container** is automatically spun up for E2E tests
- Deploy job only runs on `main` branch after all tests pass

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `yarn start:dev` | Start in watch mode (development) |
| `yarn start:debug` | Start with debugger attached |
| `yarn start:prod` | Start production build |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn lint` | Lint and auto-fix code |
| `yarn test` | Run unit tests |
| `yarn test:watch` | Run unit tests in watch mode |
| `yarn test:cov` | Run tests with coverage |
| `yarn test:e2e` | Run end-to-end tests |
| `yarn format` | Format code with Prettier |

---

## 📄 License

This project is [UNLICENSED](LICENSE).

---

<p align="center">
  Built with ❤️ using <a href="https://nestjs.com/" target="_blank">NestJS</a>
</p>
