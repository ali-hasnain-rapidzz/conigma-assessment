# Workflow Agent

A Temporal-backed research agent demonstrating workflow orchestration, distributed systems design, and production-minded engineering.

## Overview

This project implements a research agent that:
1. Takes a user query
2. Searches for relevant sources
3. Extracts content from those sources
4. Summarizes findings
5. Fact-checks claims

Each step is a separate Temporal **activity**, orchestrated by a **workflow** that handles failures, retries, and cancellation automatically.

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                   Temporal Workflow                      │
│                                                          │
│  ┌──────────┐    ┌───────────┐    ┌────────────┐        │
│  │  Search  │───▶│  Extract  │───▶│ Summarize  │        │
│  └──────────┘    └───────────┘    └────────────┘        │
│        │                                │                │
│        │              ┌─────────────────┘                │
│        │              ▼                                  │
│        │        ┌────────────┐                          │
│        └───────▶│ Fact Check │                          │
│                 └────────────┘                          │
│                        │                                 │
│                        ▼                                 │
│                 Research Result                          │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Prerequisites: Node.js 18+, pnpm 8+, Docker

# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm -F @workflow-agent/shared build

# 3. Start Temporal (Docker)
docker-compose up -d

# 4. Start worker (terminal 1)
pnpm -F @workflow-agent/temporal-worker dev

# 5. Start web app (terminal 2)
pnpm -F @workflow-agent/web dev

# Open http://localhost:3000
```

See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed setup instructions.

---

## Architecture

### Package Structure

```
packages/
├── shared/           # Contract layer: types, constants, shared utilities
│   └── src/
│       ├── types/    # TypeScript interfaces for all components
│       └── constants.ts  # Task queues, timeouts, retry policies
│
├── temporal-worker/  # Temporal worker: workflows + activities
│   └── src/
│       ├── activities/   # 4 activities: search, extract, summarize, fact-check
│       └── workflows/    # Research agent workflow
│
└── web/              # Next.js frontend
    └── src/
        ├── app/          # Pages and API routes
        ├── components/   # UI components
        └── hooks/        # React hooks (polling)
```

### Why a Monorepo?

For this assessment, a monorepo provides:
- **Simplicity**: Single `pnpm install` sets up everything
- **Type sharing**: `@workflow-agent/shared` is imported directly by both packages
- **Easy review**: All code in one place

In production, this would likely split into:
- Shared types published as an npm package
- Worker deployed independently (scalable)
- Web app in its own repository with CI/CD

---

## Design Decisions

### 1. Temporal for Orchestration

**Why Temporal instead of simple queues (SQS/Redis)?**

Temporal provides:
- **Durable execution**: Workflows survive process crashes and restarts
- **Automatic retries**: Failed activities retry with configurable backoff
- **Visibility**: Full history of every workflow execution
- **Signals and queries**: Real-time communication with running workflows
- **Cancellation**: Clean handling of user-initiated or timeout cancellations

For a research agent with potentially slow external calls, these guarantees are essential.

### 2. Activities vs Workflow Code

| Aspect | Workflow Code | Activities |
|--------|--------------|------------|
| Determinism | Required (no I/O, no randomness) | Not required |
| Side effects | Prohibited | Allowed |
| Retries | Automatic replay | Explicit retry policy |
| Context | Isolated V8 | Full Node.js |

**Our split:**
- Workflow: Orchestration logic, state management, progress tracking
- Activities: HTTP calls, LLM calls, any external interaction

### 3. Progress Tracking via Queries

```typescript
// Workflow exposes progress via query
const progressQuery = defineQuery<WorkflowProgress>('getProgress');

// Client queries without affecting workflow
const progress = await handle.query(progressQuery);
```

**Why queries over signals?**
- Queries are read-only and don't mutate workflow state
- Temporal optimizes queries to not replay entire history
- Queries can be called frequently without cost

### 4. Retry Policies per Activity

```typescript
// Each activity has tailored retry settings
const ACTIVITY_RETRY_POLICIES = {
  webSearch: { maximumAttempts: 3, backoffCoefficient: 2 },
  contentExtractor: { maximumAttempts: 2 },
  summarizer: { maximumAttempts: 2 },
  factChecker: { maximumAttempts: 1 }, // Idempotent check
};
```

**Rationale:**
- Search may have transient failures (rate limits, network) - retry more
- Summarizer (LLM) is expensive - fewer retries
- Fact checker produces deterministic results - single attempt sufficient

### 5. Polling vs WebSockets for Status Updates

We chose **polling** (2-second interval) over WebSockets:

| Polling | WebSockets |
|---------|------------|
| Simpler infrastructure | Requires persistent connection |
| Works behind any proxy | May have firewall issues |
| Stateless server | Stateful server |
| Slightly delayed updates | Real-time updates |

For a research workflow taking 10-30 seconds, 2-second polling provides adequate UX without WebSocket complexity.

### 6. Mock Activities

Activities return simulated data with:
- **Realistic latency**: 500ms - 5s delays
- **Transient failures**: 5-10% random failure rate
- **Deterministic content**: Same input produces same output (idempotency)

This allows testing retry logic and workflow behavior without external dependencies.

---

## Key Files

### Workflow Definition
`packages/temporal-worker/src/workflows/research-agent.workflow.ts`

The core orchestration logic. Note:
- Activities called with `proxyActivities` for retry configuration
- Progress tracked via query handler
- Cancellation handled gracefully

### Activity Implementations
`packages/temporal-worker/src/activities/`

Each activity:
- Has a single responsibility
- Includes simulated latency
- May fail transiently (tests retry logic)
- Returns typed output

### Type Contracts
`packages/shared/src/types/`

Three type files:
- `workflow.types.ts`: Workflow input/output, progress state
- `activities.types.ts`: Each activity's input/output
- `api.types.ts`: HTTP API request/response schemas

### API Routes
`packages/web/src/app/api/workflow/`

Two endpoints:
- `POST /api/workflow`: Start a new research workflow
- `GET /api/workflow/[id]`: Get status, progress, and results

---

## Extending the System

### Adding a New Activity

1. Define types in `shared/src/types/activities.types.ts`:
```typescript
export interface MyActivityInput { /* ... */ }
export interface MyActivityOutput { /* ... */ }
```

2. Implement in `temporal-worker/src/activities/`:
```typescript
export async function myActivity(input: MyActivityInput): Promise<MyActivityOutput> {
  // Implementation
}
```

3. Register in workflow and call via `proxyActivities`

### Versioning Workflows

For backward-compatible changes, use Temporal's versioning:

```typescript
import { patched } from '@temporalio/workflow';

if (patched('my-change-v2')) {
  // New behavior
} else {
  // Old behavior for existing workflows
}
```

### Scaling Workers

```bash
# Run multiple worker instances
pnpm -F @workflow-agent/temporal-worker dev &
pnpm -F @workflow-agent/temporal-worker dev &
pnpm -F @workflow-agent/temporal-worker dev &
```

Temporal automatically distributes tasks across workers.

---

## Testing

### Manual Testing

1. Start all services (see Quick Start)
2. Open http://localhost:3000
3. Enter a research query
4. Watch progress in UI and Temporal UI (http://localhost:8081)

### Type Checking

```bash
pnpm typecheck  # All packages
```

---

## Production Considerations

This is an assessment project. Production deployments would need:

### Infrastructure
- [ ] Temporal Cloud or self-hosted cluster (not single Docker container)
- [ ] PostgreSQL with replication
- [ ] Multiple worker instances behind load balancer
- [ ] Metrics and alerting (Datadog, Prometheus)

### Security
- [ ] Authentication on web app
- [ ] TLS for Temporal connections
- [ ] Input validation and sanitization
- [ ] Rate limiting on API endpoints

### Reliability
- [ ] Workflow replay tests
- [ ] Activity unit tests with mocked dependencies
- [ ] Integration tests against Temporal test server
- [ ] Graceful worker shutdown handling

### Features
- [ ] Real search API integration (Brave, Bing)
- [ ] Real LLM integration (Claude, GPT-4)
- [ ] Persistent storage for results
- [ ] User accounts and history

---

## Assumptions

See [docs/ASSUMPTIONS.md](./docs/ASSUMPTIONS.md) for documented assumptions made during development.

---

## References

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://typescript.temporal.io/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## License

This project was created as a take-home assessment. All rights reserved.