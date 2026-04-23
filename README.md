# Core Media Backend

A production-ready NestJS backend API for the Core Media platform.

## Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (TypeScript)
- **Package Manager:** Yarn
- **Logger:** Winston + Morgan
- **API Docs:** Swagger (OpenAPI 3.0)
- **Code Quality:** ESLint + Prettier

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn >= 1.22

### Installation

```bash
yarn install
```

### Environment Setup

The project uses environment-specific `.env` files managed by `@nestjs/config`:

| File              | Purpose                        | Loaded When              |
| ----------------- | ------------------------------ | ------------------------ |
| `.env.local`      | Local development environment  | `NODE_ENV` is unset or `development` |
| `.env.production` | Production environment         | `NODE_ENV=production`    |

Create your local environment file:

```bash
cp .env.local.example .env.local
```

**Available environment variables:**

| Variable   | Description          | Default (Local) | Default (Production) |
| ---------- | -------------------- | ---------------- | -------------------- |
| `PORT`     | Server listen port   | `3000`           | `8080`               |
| `NODE_ENV` | Runtime environment  | `development`    | `production`         |

---

## Running the Application

```bash
# Development (with hot-reload & dev logger)
yarn start:dev

# Production build
yarn build

# Production start
NODE_ENV=production yarn start:prod
```

---

## Project Structure

The project follows a **module-wise (feature-based) architecture**:

```
core-media_backend/
├── docs/                          # Auto-generated Swagger JSON (gitignored)
│   └── swagger-spec.json
├── logs/                          # Auto-generated log files (gitignored)
│   ├── error-YYYY-MM-DD.log
│   └── combined-YYYY-MM-DD.log
├── public/                        # Static assets
│   └── favicon.ico
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── app.service.ts             # Root service
│   └── <feature>/                 # Feature modules (e.g., users, auth)
│       ├── controller/
│       ├── service/
│       ├── dto/
│       ├── entities/
│       ├── repository/
│       ├── enums/
│       ├── interfaces/
│       └── <feature>.module.ts
├── test/                          # E2E tests
├── .env.local                     # Local env variables
├── .env.production                # Production env variables
├── .prettierrc                    # Prettier config
├── eslint.config.mjs              # ESLint config
├── nest-cli.json                  # NestJS CLI config
├── tsconfig.json                  # TypeScript config
└── package.json
```

### Adding a New Feature Module

```bash
# Generate module + controller + service in one command
nest g resource <feature-name>

# Or individually
nest g module <feature-name>
nest g controller <feature-name>
nest g service <feature-name>
```

---

## Features

### 1. Environment Configuration (`@nestjs/config`)

- Loads environment-specific `.env` files based on `NODE_ENV`.
- Globally available via `ConfigService` — inject it anywhere with DI.
- Defaults to `.env.local` when `NODE_ENV` is not set.

**Usage in any service:**

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SomeService {
  constructor(private readonly configService: ConfigService) {}

  getPort(): number {
    return this.configService.get<number>('PORT');
  }
}
```

---

### 2. Logging (Winston + Morgan)

#### Development Mode (`yarn start:dev`)

- **Morgan** logs HTTP requests to the terminal in colorized `dev` format.
- **Winston** provides pretty-printed, color-coded application logs in the console.

#### Production Mode (`NODE_ENV=production`)

- **Morgan** switches to `combined` format and pipes HTTP logs into Winston file transport (no terminal output).
- **Winston** writes logs to rotating files inside the `logs/` directory:

| File                       | Content                    | Retention |
| -------------------------- | -------------------------- | --------- |
| `logs/error-YYYY-MM-DD.log`    | Errors & exceptions only   | 14 days   |
| `logs/combined-YYYY-MM-DD.log` | All logs (info + warnings + errors) | 14 days   |

- Log files are auto-rotated daily, capped at 20MB per file, and compressed (gzip).

**Usage in any service:**

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class SomeService {
  private readonly logger = new Logger(SomeService.name);

  doSomething(): void {
    this.logger.log('This goes to console + combined log file');
    this.logger.error('This goes to console + error log file + combined log file');
  }
}
```

---

### 3. API Documentation (Swagger)

- Interactive Swagger UI is available at: **`http://localhost:<PORT>/docs`**
- Bearer Auth (JWT) is pre-configured — click "Authorize" in the UI to test protected routes.
- `persistAuthorization` is enabled so your token survives page refreshes.

#### Postman Export

On every server start, a **Postman-compatible OpenAPI spec** is auto-generated at:

```
docs/swagger-spec.json
```

**To import into Postman:**

1. Open Postman.
2. Click **Import**.
3. Select `docs/swagger-spec.json` from the project root.
4. A full API collection will be created with all routes, parameters, and schemas.

#### Decorating Controllers

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
```

---

### 4. Static Assets

Static files are served from the `public/` directory at the project root. The `favicon.ico` is pre-configured.

To add more static assets, place them in `public/` and they will be accessible at the root URL path (e.g., `public/logo.png` → `http://localhost:3000/logo.png`).

---

### 5. Code Quality (ESLint + Prettier)

#### Prettier Rules (`.prettierrc`)

| Rule             | Value     |
| ---------------- | --------- |
| Single Quotes    | `true`    |
| Trailing Commas  | `all`     |
| Print Width      | `80`      |
| Tab Width        | `2`       |
| Use Tabs         | `false`   |
| Semicolons       | `true`    |

#### ESLint Rules (`eslint.config.mjs`)

| Rule                     | Enforcement |
| ------------------------ | ----------- |
| Functions & Methods      | Must be `camelCase` |
| Classes                  | Must be `PascalCase` |
| `any` type               | Allowed (off) |
| Floating promises         | Warning     |
| Unsafe arguments          | Warning     |

#### Commands

```bash
# Format all source files
yarn format

# Lint and auto-fix
yarn lint
```

---

## Available Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `yarn start`       | Start the application                            |
| `yarn start:dev`   | Start with hot-reload (development)              |
| `yarn start:debug` | Start with debug mode + hot-reload               |
| `yarn start:prod`  | Start the compiled production build              |
| `yarn build`       | Compile TypeScript to JavaScript                 |
| `yarn format`      | Format code with Prettier                        |
| `yarn lint`        | Lint code with ESLint (auto-fix)                 |
| `yarn test`        | Run unit tests                                   |
| `yarn test:watch`  | Run unit tests in watch mode                     |
| `yarn test:cov`    | Run unit tests with coverage report              |
| `yarn test:e2e`    | Run end-to-end tests                             |

---

## License

Private — All rights reserved.
