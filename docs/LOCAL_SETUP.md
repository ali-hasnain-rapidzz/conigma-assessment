# Local Development Setup

This guide walks you through setting up the Workflow Agent project for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.x | Runtime |
| pnpm | >= 8.x | Package manager |
| Docker | >= 20.x | Temporal infrastructure |
| Docker Compose | >= 2.x | Container orchestration |

### Verifying Prerequisites

```bash
# Check Node.js version
node --version  # Should be >= 18.x

# Check pnpm version
pnpm --version  # Should be >= 8.x

# Check Docker
docker --version
docker-compose --version
```

### Installing Prerequisites

**Node.js**: Download from [nodejs.org](https://nodejs.org/) or use nvm:
```bash
nvm install 18
nvm use 18
```

**pnpm**: Install globally:
```bash
npm install -g pnpm
```

**Docker**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)

---

## Quick Start

```bash
# 1. Clone and navigate to project
cd conigma-assessment

# 2. Install dependencies
pnpm install

# 3. Build the shared package
pnpm -F @workflow-agent/shared build

# 4. Start Temporal infrastructure
docker-compose up -d

# 5. Wait for Temporal to be healthy (check in another terminal)
docker ps  # All containers should show "healthy"

# 6. Start the worker (in a new terminal)
pnpm -F @workflow-agent/temporal-worker dev

# 7. Start the web app (in another terminal)
pnpm -F @workflow-agent/web dev
```

You should now have:
- **Web App**: http://localhost:3000
- **Temporal UI**: http://localhost:8081
- **Temporal Server**: localhost:7233 (gRPC)

---

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
pnpm install
```

This installs all dependencies across all packages in the monorepo.

### Step 2: Build Shared Package

The shared package contains TypeScript types and constants used by both the worker and web app.

```bash
pnpm -F @workflow-agent/shared build
```

**Expected output:**
```
> @workflow-agent/shared@1.0.0 build
> tsc
```

### Step 3: Start Temporal Infrastructure

Temporal requires three services:
- **PostgreSQL**: Database for workflow persistence
- **Temporal Server**: The workflow orchestration engine
- **Temporal UI**: Web interface for monitoring workflows

```bash
docker-compose up -d
```

**First run**: Docker will pull the required images (~500MB total). This takes a few minutes.

**Verify containers are healthy:**
```bash
docker ps
```

Expected output:
```
NAMES               STATUS                   PORTS
temporal-ui         Up X seconds             0.0.0.0:8081->8080/tcp
temporal-server     Up X minutes (healthy)   0.0.0.0:7233->7233/tcp
temporal-postgres   Up X minutes (healthy)   0.0.0.0:5432->5432/tcp
```

**Troubleshooting:**
- If `temporal-server` shows `Exited`, check logs: `docker-compose logs temporal`
- Port conflicts: Another service may be using ports 5432, 7233, or 8081

### Step 4: Start the Worker

The worker registers workflows and activities with Temporal and polls for tasks.

```bash
pnpm -F @workflow-agent/temporal-worker dev
```

**Expected output:**
```
==================================================
Temporal Worker Started
==================================================
Task Queue: research-agent-queue
Namespace: default
Address: localhost:7233
==================================================
```

**Note**: The first startup takes longer (~10-15s) as it compiles the workflow bundle.

### Step 5: Start the Web App

```bash
pnpm -F @workflow-agent/web dev
```

**Expected output:**
```
▲ Next.js 14.x
- Local:        http://localhost:3000

✓ Starting...
✓ Ready in Xs
```

---

## Running Tests

### Type Checking

```bash
# Check all packages
pnpm typecheck

# Check specific package
pnpm -F @workflow-agent/web typecheck
```

### Linting

```bash
pnpm -F @workflow-agent/web lint
```

---

## Development Workflow

### Terminal Layout (Recommended)

For development, keep three terminals open:

```
+------------------+------------------+
|   Temporal       |   Worker         |
|   Logs           |   Logs           |
|                  |                  |
| docker-compose   | pnpm -F worker   |
| logs -f temporal | dev              |
+------------------+------------------+
|              Web App                |
|                                     |
|         pnpm -F web dev             |
+-------------------------------------+
```

### Rebuilding After Changes

**Shared package changes:**
```bash
pnpm -F @workflow-agent/shared build
# Then restart worker and web app
```

**Worker changes:**
Worker uses `ts-node` in dev mode, so changes are reflected on restart. For workflow changes, you must restart the worker.

**Web app changes:**
Next.js hot-reloads automatically in dev mode.

---

## Stopping Services

### Stop all services:
```bash
# Stop and remove containers
docker-compose down

# Stop containers but keep data
docker-compose stop
```

### Stop worker/web:
Press `Ctrl+C` in the respective terminals.

---

## Resetting State

### Clear Temporal data (fresh start):
```bash
docker-compose down -v  # -v removes volumes
docker-compose up -d
```

### Clear node_modules:
```bash
rm -rf node_modules packages/*/node_modules
pnpm install
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Web App | 3000 | http://localhost:3000 |
| Temporal UI | 8081 | http://localhost:8081 |
| Temporal Server | 7233 | localhost:7233 (gRPC) |
| PostgreSQL | 5432 | localhost:5432 |

---

## Troubleshooting

### "Cannot connect to Temporal server"

1. Ensure Temporal is running: `docker ps | grep temporal`
2. Check Temporal logs: `docker-compose logs temporal`
3. Verify the server is healthy: wait for health check to pass

### "Port already in use"

Find and kill the process using the port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

Or change the port:
- Web app: Set `PORT` environment variable
- Temporal UI: Edit `docker-compose.yml` ports section

### Worker fails to start

1. Ensure shared package is built: `pnpm -F @workflow-agent/shared build`
2. Check Temporal server is healthy: `docker ps`
3. Review error message in worker terminal

### TypeScript errors

```bash
# Rebuild shared types
pnpm -F @workflow-agent/shared build

# Clear TypeScript cache and rebuild
rm -rf packages/*/dist packages/*/.tsbuildinfo
pnpm -F @workflow-agent/shared build
```

---

## Environment Variables

All environment variables are optional. Defaults work for local development.

| Variable | Default | Description |
|----------|---------|-------------|
| `TEMPORAL_ADDRESS` | `localhost:7233` | Temporal server address |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `PORT` | `3000` | Web app port |

To override, create a `.env.local` file in the package directory or set in terminal:
```bash
TEMPORAL_ADDRESS=custom:7233 pnpm -F @workflow-agent/temporal-worker dev
```

---

## Next Steps

Once everything is running:
1. Open http://localhost:3000 in your browser
2. Enter a research topic (e.g., "TypeScript 5.0 features")
3. Watch the workflow execute in the Temporal UI at http://localhost:8081
4. See the research results display on the page