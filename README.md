# 木霊 Kodama

**Kodama** (木霊, *"echo"*) is a spaced-repetition app for learning English and Japanese — built as a solo full-stack project, backend to frontend, from scratch.

🇷🇺 [Читать на русском](README.ru.md)

---

## What it does

- Create decks of words/phrases in English or Japanese, study them with an **SM-2 spaced-repetition algorithm** (the same family of algorithm behind Anki).
- Generate new decks automatically with an **LLM** (topic + level in, ready-made cards out), processed asynchronously so the request never blocks.
- Practice **pronunciation**: record yourself, get scored against the target word using speech models — Whisper for Japanese, wav2vec2 for English.
- Track progress per language (each language keeps its own review schedule), see stats and a 14-day review-load forecast.
- Real-time UI updates via WebSocket when a background job (generation, pronunciation scoring) finishes.
- Sign in with email/password or Google OAuth; light/dark theme.

## Why it's built this way

This isn't a CRUD-only toy app — a few pieces exist specifically because "just call an API" wasn't good enough:

- **AI generation and pronunciation scoring both run through RabbitMQ queues in separate worker processes**, not inline in the request handler — an LLM call or a Whisper transcription can take seconds, and neither should block the API event loop. The client gets notified over WebSocket when the job finishes.
- **The pronunciation checker never loads its ML models inside the API process** — model loading is deferred behind a factory with lazy imports, so only the dedicated worker pays that cost.
- **Answer grading is a layered pipeline**, not a single `==` check: normalize (NFKC + case + punctuation) → exact match → fuzzy match (tuned against real false positives, e.g. `rain`/`train`) → an LLM tier for genuinely ambiguous cases, with verdicts cached in Redis.
- **Language is a first-class dimension, not a UI filter** — decks, review queues, and stats are all scoped by language at the database/service layer, not filtered client-side, because two languages need fully independent progress.

## Tech stack

**Backend** — Python 3.12, FastAPI, PostgreSQL + SQLAlchemy 2.0 (typed `Mapped[...]`), Alembic migrations, Redis (caching), RabbitMQ (async job queues via `aio-pika`/`pika`), JWT auth in httpOnly cookies + Google OAuth, Whisper + wav2vec2 for pronunciation scoring, Docker.

**Frontend** — React 19, TypeScript (strict), TanStack Query, React Router, Tailwind CSS v4, Motion — hand-built UI components (no component library), inline SVG data visualization, light/dark theming with WCAG-checked contrast.

## Architecture

```
┌─────────────┐        REST + WS         ┌──────────────┐
│  React SPA  │ ───────────────────────► │   FastAPI    │
└─────────────┘ ◄─────────────────────── │   (api)      │
                                          └──────┬───────┘
                                                  │ enqueue
                                   ┌──────────────┼──────────────┐
                                   ▼                              ▼
                          ┌─────────────────┐          ┌───────────────────────┐
                          │  worker          │          │  pronunciation-worker │
                          │  (LLM generation)│          │  (Whisper / wav2vec2) │
                          └─────────────────┘          └───────────────────────┘
                                   │                              │
                                   └──────────► RabbitMQ ◄────────┘
                                                   │
                          PostgreSQL  ◄────────────┼────────────►  Redis
```

Backend modules follow a thin `router → service → schema → model` layering (no repository layer — it hasn't earned its place yet). Frontend mirrors that with `features/<feature>/{api, hooks, ui}`.

## Running it locally

Requires Docker and Docker Compose.

```bash
cp .env.example .env
# fill in .env — at minimum a JWT secret and an OpenRouter API key
# (generate a JWT secret with: python -c "import secrets; print(secrets.token_urlsafe(32))")

docker compose up --build
```

This starts PostgreSQL, Redis, RabbitMQ, the API (runs migrations automatically), and both workers. The API is then available at `http://localhost:8001`.

For the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Status

Actively developed. Core loop (auth, decks, SM-2 study cycle, AI generation, pronunciation scoring, stats) is complete and used daily by the author; deployment to a public instance is planned next.

---

*Built solo by [Nikita](https://github.com/NaMiK0) as a hands-on project to go deep on backend architecture (async processing, caching, ML integration) and frontend craft (accessible, responsive, hand-designed UI) — not a tutorial clone.*
