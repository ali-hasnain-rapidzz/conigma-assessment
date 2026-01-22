# Assumptions

This document captures all assumptions made during the implementation of the Workflow Agent assessment.

---

## Scope Boundaries (Per Assessment Instructions)

| Item | Status | Rationale |
|------|--------|-----------|
| Authentication | Out of scope | Assessment explicitly states auth is out of scope |
| Database | Out of scope | No persistence beyond Temporal's built-in state |
| Real LLM calls | Out of scope | Mocking is acceptable per assessment |
| UI polish | Out of scope | "Systems and architecture exercise, not a UI challenge" |
| Production deployment | Out of scope | Local Docker only |

---

## Technical Decisions

### 1. Monorepo Structure

**Decision**: Use pnpm workspaces in a single repository

**Rationale**:
- Single repo is easier for reviewers to clone, run, and evaluate
- Shared types between frontend and worker without publishing packages
- Faster iteration during assessment timeframe
- Internal structure respects distribution boundaries for future scaling

**Trade-off**: In production, would likely split into:
- `workflow-contracts` → npm package
- `workflow-orchestrator` → separate service
- `worker-search` → separate service
- `worker-llm` → separate service
- `api-gateway` + `web-app` → separate deployables

---

### 2. Mocked Activities

**Decision**: All external API calls are mocked

**Rationale**:
- Per assessment scope: "Mocking is acceptable if reasoning is sound"
- No external API keys or accounts required to run
- Deterministic behavior for demonstration
- Includes simulated latency (500ms-3s) for realism
- Includes random transient failures (~5-10%) to demonstrate retry logic

**What mocks simulate**:
| Activity | Real Implementation Would Call |
|----------|-------------------------------|
| `webSearch` | Tavily API, Google Custom Search |
| `contentExtractor` | Browserless, Puppeteer, fetch |
| `summarizer` | Anthropic Claude, OpenAI GPT-4 |
| `factChecker` | Custom fact-check service, LLM with grounding |

---

### 3. Sequential Activity Execution

**Decision**: Activities execute sequentially, not in parallel

**Rationale**:
- Each activity depends on the output of the previous one:
  - `webSearch` → produces URLs
  - `contentExtractor` → needs URLs from search
  - `summarizer` → needs content from extraction
  - `factChecker` → needs claims from summary
- This is the natural flow for a research agent
- Parallel execution would only make sense for independent operations (e.g., extracting multiple URLs simultaneously)

**Future consideration**: Within `contentExtractor`, could parallelize extraction of multiple URLs using Temporal's `Promise.all()` equivalent.

---

### 4. Single Task Queue

**Decision**: All activities and workflows use one task queue

**Rationale**:
- Simplicity for demonstration
- Reduces cognitive overhead for reviewers
- Sufficient for single-worker setup

**Production would use**:
```
TASK_QUEUE_WORKFLOW = 'workflow-tasks'     → Orchestration only
TASK_QUEUE_SEARCH = 'search-tasks'         → Search & extraction
TASK_QUEUE_LLM = 'llm-tasks'               → LLM-intensive operations
```

This enables:
- Independent scaling per activity type
- Different hardware (GPU for LLM workers)
- Isolated failure domains

---

### 5. Polling for Status Updates

**Decision**: Frontend polls `/api/workflow/[id]` every 2 seconds

**Rationale**:
- Simpler than WebSocket implementation
- Sufficient for demonstration purposes
- No additional infrastructure (WebSocket server)
- Easy to understand and debug

**Trade-off**: Production might use:
- Server-Sent Events (SSE) for real-time updates
- WebSockets for bidirectional communication
- Temporal's native query mechanism exposed via streaming

---

### 6. Docker for Temporal Infrastructure

**Decision**: Use Docker Compose with PostgreSQL backend

**Rationale**:
- More production-representative than SQLite
- Standard local development approach
- Easy to start/stop with single command
- Temporal UI included for debugging

**Assumption**: Reviewer has Docker installed and running.

---

### 7. Idempotent Activity Responses

**Decision**: Activities return deterministic results for the same input

**Assumption**: External content (blogs, articles, web pages) does not change between retries within a single workflow execution.

**Rationale**:
- When Temporal retries a failed activity, the real-world content being fetched/analyzed is unlikely to have changed in the few seconds between attempts
- For a research workflow that takes minutes, the underlying sources remain stable
- This allows activities to be safely retried without producing inconsistent results

**Implementation**:
- `webSearch`: Same query → same mock results
- `contentExtractor`: Same URLs → same extracted content
- `summarizer`: Same content → same summary
- `factChecker`: Same claims → same verification status (confidence may vary slightly)

**Why this matters**:
```
Retry scenario:
  Call 1: factChecker(claims) → verifies → 💥 NETWORK TIMEOUT (result lost)
  Call 2: factChecker(claims) → verifies → ✅ Returns result

If idempotent:    Both calls would return the same verification status
If NOT idempotent: Retry might flip "verified" to "disputed" (confusing!)
```

**Edge case acknowledged**: In a long-running workflow (hours/days), content could change. Production systems might:
- Cache fetched content at the start of the workflow
- Use content hashes to detect changes
- Re-fetch and re-process if significant changes detected

For this assessment's timeframe (minutes), content stability is a safe assumption.

---

## Temporal-Specific Assumptions

### 1. Determinism

**Assumption**: All non-deterministic operations are isolated in activities

**Implementation**:
- No `Math.random()` in workflow code
- No `Date.now()` in workflow code (use `workflow.now()` if needed)
- No external API calls in workflow code
- Random failures for retry demonstration happen in activities only

---

### 2. Retry Policies

**Assumption**: Different activities have different failure characteristics

| Activity | Max Attempts | Initial Interval | Rationale |
|----------|--------------|------------------|-----------|
| `webSearch` | 3 | 1s | External API, typically reliable |
| `contentExtractor` | 3 | 2s | Multiple HTTP requests, may timeout |
| `summarizer` | 5 | 5s | LLM rate limits are common |
| `factChecker` | 3 | 2s | Similar to summarizer |

---

### 3. Timeouts

**Assumption**: Activities have vastly different execution times

| Activity | Start-to-Close Timeout | Rationale |
|----------|------------------------|-----------|
| `webSearch` | 30s | External API call |
| `contentExtractor` | 60s | Multiple page fetches |
| `summarizer` | 120s | LLM calls can be slow |
| `factChecker` | 60s | LLM call, but smaller scope |

---

## Future Considerations (Documented but Not Implemented)

1. **MCP Integration**: Activities could wrap MCP tool calls, enabling dynamic tool discovery
2. **Parallel URL Extraction**: Fan-out pattern for extracting multiple URLs concurrently
3. **Caching**: Results could be cached to avoid redundant LLM calls
4. **Observability**: OpenTelemetry integration for distributed tracing
5. **Multi-tenancy**: Workflow IDs could include tenant context

---

## Running the Assessment

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker Desktop

### Commands
```bash
# Install dependencies
pnpm install

# Start Temporal infrastructure
docker-compose up -d

# Start worker (in terminal 1)
pnpm dev:worker

# Start frontend (in terminal 2)
pnpm dev:web

# Access
# - Frontend: http://localhost:3000
# - Temporal UI: http://localhost:8080
```