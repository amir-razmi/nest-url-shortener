# URL Shortener

A production‑ready URL shortening backend built with **NestJS**, **Prisma**, **MongoDB**, **Redis**, and **JWT**.  
Features secure user authentication, email verification, short URL creation/deletion, and visit analytics.  
This project is part of my portfolio as a **Node.js Backend Developer**, showcasing API security, database integration, caching, and Docker deployment skills.


## 🚀 Features

- **User Authentication & Email Verification**
  - Register with email and password.
  - Receive an email link for verification before you can create URLs.
  - Secure login with JWT authentication.

- **URL Management**
  - Authenticated users can create and delete their short URLs.

- **URL Redirection & Analytics**
  - Redirects visitors to the original URL.
  - Logs analytics data into MongoDB:
    - IP address
    - Browser name
    - Operating system
    - Referrer
    - User agent
    - Device type
    - Visit timestamp

- **Role-Based Access Control**
  - **User Role** – Create and delete own short URLs.
  - **Admin Role** – All user abilities plus access to:
    - Get all users (`GET /admin/users`)
    - Get all short URLs (`GET /admin/urls`)
    - Get overall statistics (`GET /admin/stats`)

- **API Documentation**
  - Swagger UI available at [`/api-doc`](http://localhost:5000/api-doc)

- **Dockerized Deployment**
  - Multi‑service `docker-compose` setup:
    - NestJS application
    - 3‑node MongoDB replica set
    - Redis service

## 🛠 Technologies Used

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [GitHub Actions (CI/CD)](https://docs.github.com/en/actions)


## 📦 Prerequisites

- Node.js v16 or higher  
- npm, yarn, or pnpm  
- Docker & Docker Compose (for containerized setup)  
- MongoDB & Redis (if running locally without Docker)  
- Email service provider credentials (SMTP) for verification emails

## ⚙️ Installation and Setup

### 💻 Local Development

1. Clone the repository:
  ```bash 
git clone https://github.com/amir-razmi/nest-url-shortener.git
cd nest-url-shortener
  ```


2. Install dependencies:
  ```bash
pnpm i
  ```


3. Copy the example environment file and configure it:
```bash
cp .example-dev.env .env
```
   Edit `.env` with your settings (e.g., MongoDB URI, Redis config, JWT secret, email service details).

4. Start local services (MongoDB and Redis) if not using Docker. Ensure they are running.

5. Run database migrations (if applicable) or seed data using Prisma:

```bash
npx prisma generate
npx prisma db push
```

6. Start the application:
```bash
pnpm start:dev
```

   The server will run on `http://localhost:5000` (or your configured port).

### 🐳  Docker Setup

1. Copy the example Docker environment file:
```bash
cp .example-docker.env .env
```
   Edit `.env` with necessary configurations.

3. Build and start the containers:
```bash
  docker-compose up -d --build
```
   This sets up:
   - The NestJS server service.
   - A 3-node MongoDB replica set for high availability.
   - A Redis service for caching.

   The application will be accessible at `http://localhost:5000` (or configured port).


## 🧪 Integration Testing
This project includes full integration tests that run against real MongoDB and Redis services using the dedicated `docker-compose.test.yaml` file.

Tests interact with the actual NestJS application instance, database, and cache layer — providing production‑like correctness.

### 📁 Test Environment
Integration tests run using a lightweight environment:

  - MongoDB (container)
  - Redis (container)
  - Prisma (connected to the test Mongo instance)
  - Jest (with experimental VM modules for ES modules support)

These services are isolated from your development and production environment.

### ▶️ Running Integration Tests
1. Start/Reset the Test Databases
Before running tests, you must ensure the test database stack is running and Prisma schema is applied:
```bash
pnpm db:restart
```

This script performs:

- Shut down any previous test containers
- Start docker-compose.test.yaml in detached mode
- Wait a few seconds for MongoDB/Redis to become ready
- Run prisma db push to sync the schema

2. Run the Integration Test Suite
Use:
```bash
pnpm test:int
```

This command:

- Runs Jest using the jest-int.config.json config
- ses --experimental-vm-modules for ES module compatibility
- Runs tests serially (-i) to avoid DB race conditions
- Disables Jest’s cache to ensure fresh results

### 🔍 Notes
Integration tests are located in: `/test/integration`

- Each test uses the real NestJS application and real database connections.
- Make sure the test containers are fully up before running test:int (the db:restart script handles this for you).
- The test environment is completely isolated, so running tests will not modify development or production databases.

## 🤖 GitHub Actions CI/CD
Automated CI/CD pipeline with full integration testing and production deployment.

### 🔍 CI Pipeline (runs on every push/PR)
Triggers: push to main/dev, pull_request to main/develop, manual workflow_dispatch

- Test Job:
- Sets up Node.js v20 and pnpm
  - Prepares test environment variables
  - Starts test MongoDB/Redis via docker-compose.test.yaml
  - Runs prisma generate and prisma db push
  - Executes full integration tests (pnpm test:int:ci)
  - Cleans up test containers

### 🚀 CD Pipeline (production deployment)

- Triggers: Manual workflow_dispatch OR push to main
- Deployment Job (runs after successful tests):
  - Creates production .env from GitHub Secrets/Variables
  - Stops existing Docker containers
  - Builds and starts full stack (docker compose up -d --build)
  - Waits for services to be healthy
  - Runs health check against /api-doc
  - Shows logs on failure and cleans up

### 🔧 Configuration
- **Repository Secrets**: `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `JWT_SECRET`, `REDIS_PASSWORD`, `DATABASE_URL`, `MONGODB_PASSWORD`, `MONGODB_ROOT_PASSWORD`, `MONGODB_REPLICA_SET_KEY`
- **Repository Variables**: `NODE_ENV`, `PORT`, `CORS`, `REDIS_HOST`, `REDIS_PORT`, `MONGODB_DATABASE`, `MONGODB_USERNAME`, `MONGODB_REPLICA_SET_NAME`, `MONGODB_INITIAL_PRIMARY_ROOT_USER`
- **Workflow file**: `.github/workflows/ci-cd.yml`

## 📌 Usage

1. **Register a User**: POST to `/auth/register` with email and password. Verify via the sent email.
2. **Login**: POST to `/auth/login` to get a JWT token.
3. **Create Short URL**: Authenticated POST to `/urls` with the original URL.
4. **Delete Short URL**: Authenticated DELETE to `/urls/:shortCode`.
5. **Redirect**: GET to `/:shortCode` to redirect and log visit stats.
6. **Admin Routes** (requires Admin role):
   - GET `/admin/users` - Get all users.
   - GET `/admin/urls` - Get all short URLs.
   - GET `/admin/stats` - Get overall statistics.
7. **API Docs**: Visit `/api-doc` for Swagger interface to explore all endpoints.

## 🔑 Environment Variables

- Use `.example-dev.env` as a template for local development.
- Use `.example-docker.env` as a template for Dockerized environments.
- Key variables include: DATABASE_URL, REDIS_URL, JWT_SECRET, EMAIL_SERVICE_CONFIG, etc.


---

Built by **Amirmohammad Razmi** as a showcase of Node.js backend expertise. For questions, reach out via <a href="https://linkedin.com/in/amir-mohammad-razmi-b85602217" target="_blank">LinkedIn</a>.
