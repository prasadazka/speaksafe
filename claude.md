# SpeakSafe — Enterprise Whistleblowing Platform

## Project Overview
Secure, anonymous whistleblowing and compliance reporting platform. Enterprise-grade, scalable, and aligned with global governance standards (EU Whistleblower Directive, KSA regulations, SOC 2, GDPR).

---

## Tech Stack (Locked Decisions)

### Frontend
- **Framework:** Next.js 14+ (App Router, SSR/SSG for performance)
- **Language:** TypeScript (strict mode, no `any`)
- **UI Library:** shadcn/ui + Radix UI primitives
- **Styling:** Tailwind CSS (utility-first, design tokens)
- **State Management:** Zustand (lightweight) or React Context for simple state
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query) for caching & sync
- **Charts/Dashboards:** Recharts or Tremor for admin analytics
- **Animations:** Framer Motion (subtle, professional transitions)
- **Accessibility:** WCAG 2.1 AA compliance mandatory

### Backend
- **Framework:** FastAPI (async, high-performance, auto OpenAPI docs)
- **Language:** Python 3.12+ (strict typing with Pydantic v2)
- **API Style:** REST (auto-generated Swagger/ReDoc) + WebSocket for real-time notifications
- **Validation:** Pydantic v2 models (strict, coerce=False)
- **ORM:** SQLAlchemy 2.0 (async) + Alembic migrations
- **Auth:** python-jose (JWT) + passlib[argon2] for password hashing
- **File Handling:** python-multipart + streaming to encrypted storage via boto3
- **Rate Limiting:** slowapi (built on limits library)
- **Logging:** structlog (structured JSON logs)
- **Task Queue:** Celery + Redis (async email notifications, AI processing)
- **ASGI Server:** Uvicorn + Gunicorn (production)

### Database & Storage
- **Primary DB:** PostgreSQL 16+ (encrypted at rest via pgcrypto / TDE)
- **Cache:** Redis 7+ (sessions, rate limiting, pub/sub for notifications)
- **File Storage:** S3-compatible (MinIO for self-hosted / AWS S3) — all files AES-256 encrypted before upload
- **Search (optional):** Elasticsearch for complaint text search at scale

### Security & Encryption
- **Data at Rest:** AES-256-GCM encryption for all sensitive fields (complaint text, evidence metadata)
- **Data in Transit:** TLS 1.3 mandatory, HSTS headers
- **Zero-Knowledge Design:** No PII stored for anonymous reporters. Tracking ID is the only link.
- **IP Masking:** Proxy-aware, X-Forwarded-For stripped at ingress. No IP logging for anonymous submissions.
- **Password Hashing:** Argon2id (admin accounts)
- **Key Management:** Environment-isolated encryption keys, rotate quarterly. Use KMS in production (AWS KMS / HashiCorp Vault).
- **CSRF Protection:** Double-submit cookie pattern
- **CSP Headers:** Strict Content-Security-Policy, X-Frame-Options, X-Content-Type-Options
- **CORS:** Whitelist-only origins
- **SQL Injection:** SQLAlchemy parameterized queries (never raw SQL unless audited)
- **XSS:** React auto-escaping + DOMPurify for any user-rendered HTML
- **Audit Logs:** Immutable append-only table. Records: who, what, when, IP (admin only), action type.

### DevOps & Infrastructure
- **Cloud:** Google Cloud Platform (GCP)
- **Compute:** Cloud Run (frontend + backend as separate services)
- **Container Registry:** Artifact Registry (GCP)
- **Containerization:** Docker + Docker Compose (dev)
- **CI/CD:** GitHub Actions → build Docker images → deploy to Cloud Run
- **Environments:** dev / staging / production (strict env separation)
- **Database Hosting:** Cloud SQL (PostgreSQL) or Supabase
- **Cache Hosting:** Memorystore (Redis) on GCP
- **File Storage:** Google Cloud Storage (GCS) with CMEK encryption
- **Secrets:** Google Secret Manager (never env vars for secrets in prod)
- **Monitoring:** Cloud Monitoring + Cloud Logging + Sentry (error tracking)
- **Uptime:** Health check endpoints, graceful shutdown handling
- **GCP Project:** `wbtool-494011`
- **Service Account:** `wbtool@wbtool-494011.iam.gserviceaccount.com`

### Testing
- **Unit Tests (Frontend):** Vitest — minimum 80% coverage
- **Unit Tests (Backend):** pytest + pytest-asyncio — minimum 80% coverage
- **Integration Tests:** httpx.AsyncClient (FastAPI TestClient)
- **E2E Tests:** Playwright (critical user flows)
- **Security Tests:** OWASP ZAP scans in CI pipeline
- **Load Tests:** Locust (Python-native) or k6

---

## Architecture Principles

### Scalability
- Stateless backend (horizontal scaling behind load balancer)
- Database connection pooling (PgBouncer)
- Redis for session/cache (no in-memory state)
- File uploads streamed directly to object storage (no server memory bloat)
- Pagination + cursor-based queries for all list endpoints
- CDN for static assets (Next.js automatic)

### Code Quality Standards
- **No `any` type** — ever. Use `unknown` + type guards if needed.
- **Strict ESLint + Prettier** — enforced in CI, pre-commit hooks (Husky + lint-staged)
- **Conventional Commits** — `feat:`, `fix:`, `chore:`, `security:`
- **Error Handling:** Global exception handlers (FastAPI), error boundaries (React). Never expose stack traces to client.
- **API Responses:** Consistent envelope: `{ success, data, error, meta }`.
- **Naming:** PascalCase components, camelCase functions/variables, SCREAMING_SNAKE for env vars, kebab-case files.
- **No magic strings** — use enums/constants.
- **DRY but not premature** — duplicate is fine if abstraction isn't clear yet.

### Module Structure
```
speaksafe/
├── frontend/                    # Next.js frontend
│   ├── app/                     # App Router pages
│   │   ├── (public)/            # Anonymous reporter routes
│   │   │   ├── report/          # Submit complaint
│   │   │   └── track/           # Check status via tracking ID
│   │   ├── (admin)/             # Authenticated admin routes
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   ├── audit-log/
│   │   │   └── settings/
│   │   └── layout.tsx
│   ├── components/              # Shared UI components
│   ├── lib/                     # Utilities, API client, helpers
│   ├── Dockerfile
│   └── package.json
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── reports.py   # Anonymous complaint submission
│   │   │   │   ├── cases.py     # Case management (admin)
│   │   │   │   ├── auth.py      # Admin authentication (JWT)
│   │   │   │   ├── users.py     # Admin user management
│   │   │   │   ├── evidence.py  # File upload & encrypted storage
│   │   │   │   └── audit.py     # Audit log endpoints
│   │   │   └── deps.py          # Shared dependencies (DB session, auth)
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic layer
│   │   ├── core/
│   │   │   ├── config.py        # Settings (pydantic-settings)
│   │   │   ├── security.py      # JWT, encryption, hashing
│   │   │   └── exceptions.py    # Custom exception handlers
│   │   └── db/
│   │       ├── session.py       # Async SQLAlchemy session
│   │       └── base.py          # Base model
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest tests
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── .env.example
└── .github/
    └── workflows/
        └── deploy.yml           # CI/CD → Cloud Run
```

---

## UI/UX Requirements

### Reporter (Public) Interface
- Minimal, clean, trustworthy — no flashy animations, no unnecessary fields
- Mobile-first responsive — many reporters will use personal phones
- Dark/Light mode — auto-detect system preference
- Multi-language — i18n ready (English, Arabic minimum for KSA)
- Accessibility: Screen reader compatible, keyboard navigable, high contrast
- Progress indicator on multi-step form
- Instant feedback — tracking ID shown immediately after submission with copy button
- Zero JavaScript required for core flow — progressive enhancement (SSR form submission fallback)

### Admin Dashboard
- Professional, data-dense — inspired by Linear/Notion admin panels
- Real-time updates — WebSocket for new case alerts, status changes
- Filterable/Sortable case list — by status, category, severity, date
- Quick actions — change status, assign, add note without page reload
- Audit trail visible per case — timeline view of all actions
- Analytics widgets — cases by category, resolution time, trend charts
- Export — CSV/PDF for compliance reports
- Keyboard shortcuts for power users

---

## Data Models (Core)

### Report
- `id` (UUID), `trackingId` (public-facing, e.g. SS-2026-XXXX)
- `category` (enum: FRAUD, HARASSMENT, DATA_MISUSE, POLICY_VIOLATION, OTHER)
- `severity` (enum: LOW, MEDIUM, HIGH, CRITICAL) — auto-assigned by AI or manual
- `description` (encrypted text)
- `status` (enum: OPEN, UNDER_REVIEW, INVESTIGATING, CLOSED)
- `resolution` (encrypted text, nullable)
- `createdAt`, `updatedAt`

### Evidence
- `id`, `reportId` (FK), `fileName` (encrypted), `fileKey` (S3 key)
- `mimeType`, `sizeBytes`, `encryptionIV`
- `uploadedAt`

### AdminUser
- `id`, `email`, `passwordHash` (Argon2id), `role` (enum: COMPLIANCE_OFFICER, ADMIN, VIEWER)
- `mfaEnabled`, `mfaSecret`
- `lastLoginAt`, `createdAt`

### AuditLog (append-only)
- `id`, `actorId` (FK AdminUser), `action` (enum), `resourceType`, `resourceId`
- `metadata` (JSONB — before/after snapshots)
- `ipAddress`, `userAgent`, `timestamp`

### CaseNote
- `id`, `reportId` (FK), `authorId` (FK AdminUser)
- `content` (encrypted), `createdAt`

---

## Compliance Checklist
- [ ] EU Whistleblower Protection Directive (2019/1937) alignment
- [ ] Anonymous submission without mandatory identification
- [ ] 7-day acknowledgment rule (notification to reporter)
- [ ] 3-month feedback deadline
- [ ] Data retention policy (auto-purge after configurable period)
- [ ] Right to erasure support (GDPR Article 17)
- [ ] Encrypted backups with tested restore procedures
- [ ] Penetration test before production launch
- [ ] Role separation: no single admin can view + delete + export

---

## Development Workflow
1. Feature branches from `develop` — PR required, minimum 1 review
2. All PRs must pass: lint, type-check, unit tests, build
3. Squash merge to `develop`, conventional commit message
4. Release branches `release/x.y.z` from `develop` to `main`
5. Hotfixes branch from `main`, cherry-pick back to `develop`

---

## Performance Targets
- **Reporter form load:** < 1.5s (LCP)
- **Admin dashboard load:** < 2s (LCP)
- **API response (p95):** < 200ms
- **File upload (100MB):** < 30s on standard connection
- **Concurrent users:** Support 1000+ simultaneous without degradation
- **Database queries:** No N+1. All list queries paginated. Indexes on all filter/sort columns.

---

## AI Features (Optional Module)
- **Auto-categorization:** Classify incoming reports by category using NLP
- **Severity scoring:** Estimate urgency based on keywords and patterns
- **Duplicate detection:** Flag similar reports to prevent redundancy
- **Sentiment analysis:** Gauge urgency from reporter's language
- Use Claude API (Haiku for speed) for all AI features — see `claude-developer-platform` skill

---

## Commands

### Frontend (Next.js)
- `cd frontend && pnpm dev` — Start Next.js dev server
- `cd frontend && pnpm build` — Production build
- `cd frontend && pnpm test` — Run Vitest
- `cd frontend && pnpm lint` — ESLint + Prettier

### Backend (FastAPI)
- `cd backend && uvicorn app.main:app --reload` — Start FastAPI dev server
- `cd backend && pytest` — Run all tests
- `cd backend && alembic upgrade head` — Run migrations
- `cd backend && alembic revision --autogenerate -m "msg"` — Create migration
- `cd backend && ruff check .` — Lint Python code
- `cd backend && mypy .` — Type checking

### Infrastructure
- `docker compose up` — Start PostgreSQL + Redis + MinIO locally
- `docker compose up --build` — Rebuild and start all services

### Deployment
- Push to `main` → GitHub Actions auto-deploys to Cloud Run (production)
- Push to `develop` → GitHub Actions auto-deploys to Cloud Run (staging)
