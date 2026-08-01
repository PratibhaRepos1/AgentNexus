# CLAUDE.md

Guidance for Claude (and any AI coding assistant) working in this repository.

## Project

**AgentNexus** — a multi-tenant AI chatbot platform for small businesses (retail, service providers, restaurants, clinics, real estate, local shops). Each business gets a branded, embeddable chat widget backed by RAG over their own FAQs/documents, plus an admin dashboard for managing content and leads.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast dev server, free, huge ecosystem |
| UI | Tailwind CSS + shadcn/ui | Free, no license cost, easy theming per tenant |
| State/data | TanStack Query + Zustand | Lightweight, free |
| Backend | Python 3.12 + FastAPI | Async, typed, free, great for AI/RAG workloads |
| ORM | SQLAlchemy 2.0 + Alembic | Free, mature migrations |
| Database | PostgreSQL | Free, self-hostable |
| Vector store | pgvector extension | Free — avoids paid Pinecone; lives in the same Postgres instance |
| RAG orchestration | LangChain (Python) | Free, open-source |
| Embeddings | `sentence-transformers` (local, free) — fallback to a free-tier hosted embedding API | No per-call cost for MVP |
| LLM | Provider-agnostic layer — Groq (generous free tier, fast), Google Gemini free tier, or local Ollama (Llama 3 / Mistral) — OpenAI/Claude as paid upgrade option | Keeps MVP cost near $0 |
| Auth | JWT via `python-jose` + `passlib` (self-rolled) or Supabase Auth free tier | No license cost |
| File storage | Local disk (MVP) → Supabase Storage free tier or Cloudflare R2 free tier | Free at low volume |
| Background jobs | FastAPI `BackgroundTasks` (MVP) → Celery + Redis (free, self-hosted) later | Keep MVP simple |
| Containerization | Docker + Docker Compose | Free |
| Hosting | Render.com free web service tier, Railway free trial, or Fly.io free allowance | $0 to start |
| CI/CD | GitHub Actions (free for public/small private repos) | Free |
| Monitoring/errors | Sentry free tier | Free |

No paid SaaS is required to build and demo the MVP.

## Repository Structure

```
agentnexus/
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── widget/             # Embeddable chat widget (built separately, exposed as <script>)
│   │   ├── dashboard/          # Admin dashboard app
│   │   ├── shared/             # Shared components, hooks, api client
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── api/                # Routers: chat, leads, auth, admin, documents
│   │   ├── core/                # Config, security, dependencies
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic (RAG, intent detection, lead capture)
│   │   ├── rag/                  # LangChain pipeline, embeddings, retrievers
│   │   └── main.py
│   ├── alembic/                 # DB migrations
│   ├── tests/
│   └── requirements.txt
├── docker-compose.yml
├── docs/                       # This doc set
└── .env.example
```

## Commands

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Full stack (local)
docker compose up --build

# Tests
cd backend && pytest
cd frontend && npm test
```

## Coding Conventions

- **Multi-tenancy**: every table with business data carries `business_id`; every query MUST filter by the authenticated tenant. Never trust a `business_id` passed from the client without cross-checking the auth token.
- **Backend**: FastAPI routers stay thin; business logic lives in `services/`. Pydantic schemas separate request/response shapes from SQLAlchemy models.
- **Frontend**: the chat widget (`frontend/src/widget`) must build to a single small bundle with no external runtime dependency on the dashboard — it's embedded via `<script>` on third-party sites.
- **Secrets**: never commit `.env`. All provider keys (LLM, storage) are read from environment variables via `app/core/config.py`.
- **RAG**: document ingestion → chunk → embed → store in `document_chunks` (pgvector). Retrieval always scoped by `business_id`.
- **LLM provider abstraction**: all LLM/embedding calls go through `app/rag/providers/`, so swapping Groq/Gemini/Ollama/OpenAI/Claude is a config change, not a code change.

## What Claude Should Do

- Prefer the free/open-source option already in the stack table unless the user asks for a paid upgrade.
- When adding a new table, update `docs/DATABASE_SCHEMA.md` in the same change.
- When adding a new API route, keep `docs/ARCHITECTURE.md`'s endpoint list in sync.
- Ask before introducing a new paid dependency or service.

## What Claude Should Avoid

- Don't hardcode API keys or write them to files.
- Don't bypass tenant scoping "for convenience" — treat cross-tenant data leaks as a critical bug.
- Don't add Pinecone, paid vector DBs, or paid-only LLM providers as the default path — keep them optional/pluggable.
