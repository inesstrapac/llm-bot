# Mathematics ChatBot — Final Project

Repository: `llm-bot`

> **Stack:** Frontend (Vue 3 + Vue CLI) · Backend (NestJS + PostgreSQL) · AI Service (Python, FastAPI) · Auth (JWT) · Vector DB (ChromaDB) · ORM (TypeORM) · Package managers (npm + pip)

---

## 1. Overview

**Mathematics ChatBot** is a full-stack web application that answers math questions using **retrieval-augmented generation (RAG)** over course materials. Users must choose a **collection** first (a set of PDFs/notes indexed in a vector database). The bot answers **only** if the answer exists in the chosen collection and returns **LaTeX** that renders correctly in the UI.

### Key capabilities

- Conversational math help with LaTeX rendering (inline and block)
- RAG over a **selected collection** (strictly answers from that collection)
- Citations (inline tags like `[S1]`, `[S2]`)
- Auth (JWT-based login/registration); protected routes
- **Admin role:** can view all users (no admin panel UI)
- Message history persisted in PostgreSQL
- Account Settings (user can update name, surname, email, password)

---

## 2. System Architecture

```mermaid
flowchart LR
  subgraph FE[Frontend (Vue 3 + MathJax)]
    UI[Chat UI]
  end

  subgraph BE[Backend (NestJS)]
    Auth[Auth (JWT)]
    Msg[Messages & Conversations]
    Admin[Admin role (view users)]
  end

  subgraph DB[(PostgreSQL)]
    U[(users)]
    C[(conversations)]
    M[(messages)]
  end

  subgraph AI[AI Service (FastAPI)]
    RAG[Retriever (ChromaDB)]
    LLM[Ollama / Prompting]
  end

  subgraph VDB[(ChromaDB)]
  end

  UI -->|HTTPS JSON| BE
  BE <--> DB
  BE -->|/ask (collection, question)| AI
  AI <--> VDB
  UI -.->|LaTeX via MathJax| UI
```

**High-level flow**

1. User authenticates with NestJS (JWT).
2. Frontend sends chat messages to the backend; backend persists to PostgreSQL.
3. Backend calls AI Service **`/ask`** with `question` + collection + retrieval params.
4. AI retrieves from ChromaDB, generates a **LaTeX** answer with citations, returns it.
5. Backend saves the assistant message and returns it to the UI; UI renders the LaTeX.

---

## 3. Features

### 3.1 Chat

- LaTeX rendering (inline `\( ... \)`, block `$$ ... $$`).
- **New conversation rule:** the first message creates a conversation; the **conversation name = first message**.
- **One-message-at-a-time:** you cannot send a new message until the bot replies.
- **Collection gating:** you **must** choose a collection first; answers only if the content exists in that collection.

### 3.2 Admin role

- Admin accounts can **view all users** (protected route).
- There is **no** admin panel UI (list only).

### 3.3 Account Settings

- Users can view/update **name**, **surname**, **email**, **password**.
- Email change should require password confirmation; password change requires current password & strength checks.
- Frontend and backend input validation (DTOs with `class-validator`).

### 3.4 Security

- Passwords are stored as **bcrypt hashes** with **12 rounds** (example implementation in backend).
- JWT (Bearer) for protected routes.
- CORS should be restricted in production.
- Secrets via Docker/`.env` (never commit real secrets).

---

## 4. Technology Choices

- **Vue 3 + Vue CLI** for a stable dev server and Composition API.
- **NestJS** for opinionated, testable server architecture (TypeScript).
- **PostgreSQL + TypeORM** for relational data and entities.
- **FastAPI (Python)** to isolate AI/RAG concerns in a microservice.
- **ChromaDB** for vector storage (fast local development).

---

## 5. Quickstart (Docker Compose)

This project is designed to run with **Docker Desktop**.

```bash
docker compose up --build
```

When containers are healthy, open:

- Frontend (Vue CLI): **[http://localhost:8082](http://localhost:8082)**
- Backend (NestJS): **[http://localhost:8081](http://localhost:8081)**
- AI service (FastAPI): **[http://localhost:5000/healthz](http://localhost:5000/healthz)**
- ChromaDB: **[http://localhost:8000](http://localhost:8000)**
- PostgreSQL: **localhost:5432** (`user` / `password`, DB `postgres`)

**App navigation**

- Go to **[http://localhost:8082](http://localhost:8082)** and register/log in.
  (For local dev you may use an admin account such as `admin` / `admin` if configured.)
- Pages: **Chat**, **Users** (admin-only), **Settings** (profile).
- **Chat → New conversation:** select a **collection**, then type your question and submit.
  The first message creates the conversation; you cannot send a new message until the bot responds.

**Ports & URLs**

| Service  | URL                                            | Notes                          |
| -------- | ---------------------------------------------- | ------------------------------ |
| Frontend | [http://localhost:8082](http://localhost:8082) | Vue CLI dev server (container) |
| Backend  | [http://localhost:8081](http://localhost:8081) | NestJS API                     |
| AI       | [http://localhost:5000](http://localhost:5000) | FastAPI `/ask`, `/healthz`     |
| ChromaDB | [http://localhost:8000](http://localhost:8000) | Vector DB (HTTP API)           |
| Postgres | localhost:5432                                 | `user/password`, DB `postgres` |

---

## 6. Repository Structure

```
llm-bot/
├─ backend/
│  ├─ server/                 # NestJS API
│  │  ├─ src/                 # authorization, controller, entities, module, repository, seeding, service
│  │  ├─ app.module.ts
│  │  ├─ main.ts
│  │  ├─ package.json
│  │  └─ package-lock.json
│  └─ ai/                     # FastAPI (Docker build context)
│     ├─ src/                 # __init__.py, main.py, service.py
│     ├─ requirements.txt
│     ├─ Dockerfile.ai-service
│     └─ …
├─ frontend/                  # Vue 3 (Vue CLI)
│  ├─ public/
│  ├─ src/                    # app, assets, components, features, layouts, services, stores, types, views
│  ├─ package.json
│  └─ package-lock.json
├─ data/
│  └─ chroma/                 # Chroma persistence (bind mount)
├─ docker-compose.yml
└─ README.md
```

**Dockerfiles**

- `frontend/Dockerfile.client`
- `backend/server/Dockerfile.server`
- `backend/ai/Dockerfile.ai-service`

---

## 7. Configuration

### Backend (`backend/server/.env` — local dev example)

```
# DATABASE
DATABASE_URL=postgres://user:password@localhost:5432/postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=postgres

# AI-SERVICE
AI_SERVICE_URL=http://localhost:5000
```

In Docker, the backend receives from compose:

- `AI_SERVICE_URL=http://ai:5000`
- `DATABASE_URL=postgres://user:password@postgres:5432/postgres`

### Frontend — no `.env`

The frontend does **not** use environment variables. The API base URL is defined in `frontend/src/services/http.js` as `const API_URL = "http://localhost:8081";`.

> For deployments, either update this constant, put a reverse proxy in front (so the frontend and backend share an origin), or refactor later to read from a runtime config file.

### AI Service (`backend/ai`)

In Docker, compose provides:

- `PORT=5000`
- `CHROMA_HOST=chroma`
- `CHROMA_PORT=8000`
- `OLLAMA_EMBED_MODEL=nomic-embed-text`
- `OLLAMA_LLM_MODEL=llama3.1:8b` (default; change to any Ollama chat model you have pulled)
- **`OLLAMA_BASE_URL`** — set per machine to your own Ollama server, for example:

  - `http://host.docker.internal:11434` if Ollama runs on your host (macOS/Windows).
  - `http://<your-LAN-IP>:11434` if Ollama runs on another machine (GPU box) in your network.
  - Linux note: you may need to add `extra_hosts: ["host.docker.internal:host-gateway"]` under the `ai` service in `docker-compose.yml` to use the first option.

#### Model prerequisites (Ollama)

The AI service talks to an external Ollama server. On the machine running Ollama:

```bash
# Install and start Ollama (see https://ollama.com)
# Then pull the required models:
ollama pull nomic-embed-text
ollama pull llama3.1:8b    # or another chat model you prefer

# Verify models are available
ollama list
```

If you change models, update the compose env (or AI `.env` when running locally):

```env
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3.1:8b
```

---

## 8. Database (Docker-only)

This project uses the **Docker `postgres` service** defined in `docker-compose.yml`:

- User: `user`
- Password: `password`
- Database: `postgres`
- Port: `5432` (mapped to host)

No manual local setup or migration commands are required for the default Docker workflow.

---

## 9. Optional Local Dev (Frontend/Backend only)

> Full system (AI/Chroma/Postgres) runs via Docker.
> You can run **only** frontend and backend locally for UI work:

**Backend (NestJS)**

```bash
cd backend/server
npm install
npm run start:dev
```

**Frontend (Vue CLI)**

```bash
cd frontend
npm install
npm run dev
```

AI/Chroma/Postgres stay in Docker. If you do run the AI service locally instead of Docker, install its dependencies and start it manually:

```bash
cd backend/ai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 5000
```

---

## 10. API Summary (high level)

The backend exposes a small set of HTTP endpoints; here’s what matters for running and grading the app:

- **Authentication** — register and login endpoints issue JWTs; protected routes require a valid token.
- **Users (admin only)** — an endpoint to list all users.
- **Account settings** — endpoints for the current user to fetch and update profile fields (name, surname, email, password).
- **Conversations & messages** — endpoints that persist chat messages and conversation metadata.
- **AI service** — an external microservice called by the backend to answer questions via RAG. See the contract below.

### AI Service — `/ask` (contract)

**POST** `/ask`

```json
{
  "question": "What is the geometric meaning of d_infty?",
  "k": 4,
  "collection": "<collection_name>",
  "filter": null,
  "by_vector": false
}
```

**Response**

```json
{
  "answer": "LaTeX-formatted answer with [S1] citations",
  "sources": [{ "id": "...", "title": "...", "page": 12 }]
}
```

**Health**: `GET /healthz` → 200 OK when healthy.

## 11. Data Model

This section shows how data is stored and related in PostgreSQL, so graders and future maintainers understand where conversations, messages, and users live and how they connect.

```mermaid
erDiagram
  USER ||--o{ CONVERSATION : has
  CONVERSATION ||--o{ MESSAGE : contains
```

Message entity:

```ts
@Entity()
export class Message {
  @PrimaryGeneratedColumn() id: number;
  @Column() content: string;
  @Column() collectionName: string;
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "conversationId" })
  conversation: Conversation;
  @Column() isPrompt: boolean;
  @Column() dateCreated: Date;
}
```

---

## 12. RAG Pipeline

- **Collections:** multiple Chroma collections. The user **selects a collection** in the UI; that collection name is sent with each `/ask` request and used for retrieval.
- **Embeddings:** `nomic-embed-text` (Ollama)
- **Vector DB:** Chroma at `http://localhost:8000`
- **LLM provider:** Ollama at **`OLLAMA_BASE_URL`** (set per machine; see Configuration → AI Service).
- **Flow:** retrieve top‑k chunks **from the selected collection** → generate LaTeX answer → return with citations
- **Default (fallback) collection:** the AI container can be configured with `CHROMA_COLLECTION` (compose sets `my_collection`). This acts as a default only if a request does not specify `collection`. The frontend **always** sends a `collection`, so the default is rarely used.

---

## 13. Math Rendering (LaTeX)

Answers are LaTeX-only (no Unicode math symbols). After messages render, the UI re-typesets:

```ts
import { nextTick, onMounted, watch } from "vue";

function typeset() {
  // @ts-ignore
  window.MathJax?.typesetPromise?.();
}

onMounted(async () => {
  await nextTick();
  typeset();
});

watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    typeset();
  }
);
```

---

## 14. Troubleshooting

- **AI not ready:** check `http://localhost:5000/healthz`.
- **Postgres CLI missing:** run inside container:
  `docker exec -it postgres psql -U user -d postgres -c "SELECT version();"`
- **CORS:** restrict in production to your frontend origin.
- **Chroma data:** persisted in `./data/chroma`.

---

## 15. Grader Steps (Repro Guide)

1. `docker compose up --build` and wait for containers.
2. Open **[http://localhost:8082](http://localhost:8082)** and register/log in
   (local dev admin like `admin` / `admin` if configured).
3. Go to **Chat → New conversation**.
4. **Select a collection**, then ask a question whose answer exists in that collection.
5. Observe LaTeX rendering and citations.
6. If logged in as admin, open **Users** to see all users.
7. Open **Settings** to update profile fields and test validation.

---

## 16. Project Metadata & License

- **Project Title:** Mathematics ChatBot
- **Repository:** `llm-bot`
- **Author:** Ines Strapač
- **Supervisor:** Tomislav Prusina
- **University:** Fakultet primijenjene matematike i informatike
- **Academic Year:** 3
