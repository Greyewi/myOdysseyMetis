### MyOdyssey Backend Service

A Node.js (Express) API with PostgreSQL and Prisma. Packaged as a Docker service with a companion Postgres container.

### Architecture
- **Entrypoint**: `src/main.ts`
  - Sets up CORS, JSON parsing, serves static `uploads/`, mounts routes, and attaches the error handler
  - Initializes the job queue (`src/services/queue.service.ts`) and background jobs (`src/jobs/index.ts`)
  - Creates HTTP server and initializes Socket.IO (`src/services/socket.service.ts`)
  - Starts blockchain indexer (`src/services/contract.ts`) which reads LazChain ABI from `artifacts/contracts/LazChain.sol/LazChain.json`
- **Routes** (mounted in `src/main.ts`)
  - `/users` → `src/routes/user.ts` (nonce, signature verification, JWT issuance)
  - `/goals` → `src/routes/goals.ts` (CRUD, wallets, uploads, refunds, blockchain interactions)
  - `/public-goals` → `src/routes/publicGoals.ts` (public browsing)
  - `/tasks` → `src/routes/tasks.ts` (AI task generation and progress)
  - `/api` → `src/routes/priceCache.ts` (token price cache)
- **Middlewares**
  - Auth: `src/middlewares/auth.ts` validates `Authorization: Bearer <jwt>` using `JWT_SECRET` and loads the user via Prisma
  - Errors: `src/middlewares/error.ts` (Joi- and Prisma-aware responses)
- **Data layer**
  - Prisma client: `src/prisma.ts`; schema: `prisma/schema.prisma`
  - Uploads stored under `services/backend/uploads` and served at `/uploads`
- **Queue and jobs**
  - Queue service: `src/services/queue.service.ts` wraps `pg-boss` (create/process/send/schedule jobs)
  - Jobs: `src/jobs/balance-checker.job.ts` (wallet balance monitor with Socket.IO notifications), `src/jobs/price-checker.job.ts` (periodic token price upsert)
  - `src/jobs/index.ts` wires and starts all jobs on boot
- **Realtime**
  - Socket.IO: `src/services/socket.service.ts` emits `balance-change` and `refund-completed`
- **Blockchain indexer**
  - `src/services/contract.ts` (`MetisBlockIndexerService`) listens to LazChain events (`GoalCommitted`, `GoalCompleted`, `GoalClaimed`) and updates goal status in DB (helpers in `src/services/blockchain.ts`)
  - Persists last parsed block in `SyncState` for resumable polling
- **AI integration (optional)**
  - Providers configured in `src/agents/baseAgent.ts` via `AI_PROVIDER` and keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`)
  - Services in `src/agents/*` and `src/services/ai.service.ts` for goal evaluation, task generation, progress analysis, and completion validation
- **CORS**
  - Allowed origins: `http://localhost:4200`, `http://localhost:3000`, `https://myodyssey.me`, `https://app.myodyssey.me` with credentials

### Prerequisites
- Docker (Desktop) and Docker Compose
- Ports free: 3333 (backend), 5432 (Postgres)

### Quick start
1) Create environment file
```bash
cd services/backend
cp .env.example .env
# Edit .env and set at least JWT_SECRET and SESSION_SECRET
```

2) Start services (Postgres + Backend)
```bash
# From services/backend
docker compose up --build -d
```
This will:
- Build the backend image
- Start Postgres
- Run `prisma generate` and `prisma migrate deploy`
- Start the API server on port 3333

3) Verify
```bash
curl http://localhost:3333/
# => {"message":"Welcome to backend!"}
```

### Environment variables
Edit `services/backend/.env` (see `.env.example`):
- PORT: default 3333
- DATABASE_URL: preconfigured for the compose Postgres service
- SESSION_SECRET: set to a strong random value
- JWT_SECRET: set to a strong random value
- AI_PROVIDER: optional (openai|anthropic|deepseek)
- OPENAI_API_KEY / ANTHROPIC_API_KEY / DEEPSEEK_API_KEY: optional; set if you want AI features enabled
- SHOWCASE_URL: optional, used for share links
- CONTRACT_OWNER_PRIVATE_KEY / CONTRACT_OWNER_SEED_PHRASE: optional; only if needed for blockchain actions

Secrets are loaded from `.env` and `.env` is gitignored.

### Useful commands
- View logs:
```bash
docker compose logs -f backend
```
- Stop services:
```bash
docker compose down
```
- Stop and remove DB volume (fresh DB next start):
```bash
docker compose down -v
```

### Notes
- Uploads are stored/mounted at `services/backend/uploads`.
- Prisma schema is in `services/backend/prisma/schema.prisma`.
- On startup, the compose command runs: `prisma generate` → `prisma migrate deploy` → `node dist/main.js`.
- Blockchain contract ABI is read from `services/backend/artifacts/contracts/LazChain.sol/LazChain.json`.

### Troubleshooting
- Port already in use: change `PORT` in `.env` or stop the conflicting process.
- Database connection issues: ensure `cryptogoals_db` is healthy (`docker ps`), and `DATABASE_URL` points to `db:5432`.
- Prisma client not generated: restart compose (it runs `prisma generate` on boot) or run:
```bash
docker compose exec backend npx prisma generate
```
- Missing AI keys error: set `OPENAI_API_KEY` (or other provider keys) in `.env`, or set `AI_PROVIDER` accordingly. Leave them empty to effectively disable AI actions. 