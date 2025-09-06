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
  subgraph FE ["Frontend - Vue 3 / MathJax"]
    UI["Chat UI"]
  end

  subgraph BE ["Backend - NestJS"]
    AUTH["Auth (JWT)"]
    MSG["Messages & Conversations"]
    ADMIN["Admin role (view users)"]
  end

  subgraph DB ["PostgreSQL"]
    U[users]
    C[conversations]
    M[messages]
  end

  subgraph AI ["AI Service - FastAPI"]
    RETRIEVE["Retriever (ChromaDB)"]
    LLM["Ollama / Prompting"]
  end

  VDB["ChromaDB"]

  UI -->|"HTTPS JSON"| BE
  BE <--> DB
  BE -->|/ask| AI
  AI <--> VDB
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

This project is designed to run with **Docker Desktop**. Below is a complete, step‑by‑step startup guide.

### 5.1 Prerequisites

- **Docker** & **Docker Compose v2** (Docker Desktop on macOS/Windows, Docker Engine + Compose plugin on Linux)
- **Ports free on host**: 8081, 8082, 5000, 5432, 8000, **11434** (for Ollama)
- **Git** (to clone repo)

> You do **not** need Node/Python locally unless you want to run parts outside Docker.

### 5.2 Clone & inspect

```bash
git clone <your-fork-or-repo-url> llm-bot
cd llm-bot
```

### 5.3 Configure the Ollama connection (**important**)

The AI service talks to an **external Ollama server** (embedding + chat models). You have three options:

#### Option A — Ollama on your **host** machine (recommended for local dev)

1. Install Ollama on your OS (macOS/Windows installer, or Linux package). Start it so it serves on **`http://localhost:11434`**.
2. Pull required models **on the host**:

   ```bash
   ollama pull nomic-embed-text
   ollama pull llama3.1:8b
   ollama list
   ```

3. Set the AI container env `OLLAMA_BASE_URL` so containers can reach your host:

   - **macOS/Windows:** use `http://host.docker.internal:11434`
   - **Linux:** either use your host LAN IP, e.g. `http://192.168.1.50:11434`, **or** add this to the `ai` service in `docker-compose.yml` so `host.docker.internal` works:

     ```yaml
     services:
       ai:
         extra_hosts:
           - "host.docker.internal:host-gateway"
     ```

   Then set `OLLAMA_BASE_URL: http://host.docker.internal:11434`.

#### Option B — Ollama in **its own Docker container** (separate from compose)

You don’t have to add it to `docker-compose.yml`. Run it once, independently:

```bash
docker run -d --name ollama \
  --restart unless-stopped \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama:latest

# Pull models into that container
docker exec -it ollama ollama pull nomic-embed-text
docker exec -it ollama ollama pull llama3.1:8b
```

Then set `OLLAMA_BASE_URL` in your compose to **`http://host.docker.internal:11434`** (macOS/Windows) or **`http://<YOUR-HOST-IP>:11434`** (Linux).

#### Option C — Remote Ollama server (GPU box / other machine)

Run Ollama on a remote machine and expose port **11434**:

```bash
# On the remote machine
ollama serve &
ollama pull nomic-embed-text
ollama pull llama3.1:8b
```

Ensure the firewall allows inbound **11434**. In `docker-compose.yml` on your dev machine, set:

```
OLLAMA_BASE_URL: http://<REMOTE-IP>:11434
```

> **Tip:** Verify connectivity before continuing: `curl http://<...>:11434/api/tags` should return a JSON list of installed models.

### 5.4 Set `OLLAMA_BASE_URL` in Compose

In your current `docker-compose.yml`, `OLLAMA_BASE_URL` is empty. You can:

- **Simplest**: hardcode it under the `ai` service, e.g.

  ```yaml
  environment:
    PORT: 5000
    CHROMA_HOST: chroma
    CHROMA_PORT: 8000
    OLLAMA_BASE_URL: http://host.docker.internal:11434
    OLLAMA_EMBED_MODEL: nomic-embed-text
    # Optional, defaults to llama3.1:8b if coded that way
    # OLLAMA_LLM_MODEL: llama3.1:8b
  ```

- **Recommended**: parameterize it and use a `.env` file:

  ```yaml
  environment:
    PORT: 5000
    CHROMA_HOST: chroma
    CHROMA_PORT: 8000
    OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}
    OLLAMA_EMBED_MODEL: ${OLLAMA_EMBED_MODEL:-nomic-embed-text}
    OLLAMA_LLM_MODEL: ${OLLAMA_LLM_MODEL:-llama3.1:8b}
  ```

  Then create a local `.env`:

  ```dotenv
  OLLAMA_BASE_URL=http://host.docker.internal:11434
  OLLAMA_EMBED_MODEL=nomic-embed-text
  OLLAMA_LLM_MODEL=llama3.1:8b
  ```

### 5.5 Start the stack

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

The frontend does **not** use environment variables. The API base URL is defined in `frontend/src/services/http.js` as `const API_URL = "http://localhost:8081"`.

> For deployments, either update this constant, put a reverse proxy in front (so the frontend and backend share an origin), or refactor later to read from a runtime config file.

### AI Service (`backend/ai`)

In Docker, compose provides:

- `PORT=5000`
- `CHROMA_HOST=chroma`
- `CHROMA_PORT=8000`
- `OLLAMA_EMBED_MODEL=nomic-embed-text`
- `OLLAMA_LLM_MODEL=llama3.1:8b`
- **`OLLAMA_BASE_URL`** — **must** point to a reachable Ollama server (see §5.3)

#### Model prerequisites (Ollama)

On the machine that runs Ollama (host/remote/container):

```bash
ollama pull nomic-embed-text
ollama pull llama3.1:8b    # or another chat model you prefer
ollama list
```

If you change models, set the compose env (or AI `.env` when running locally):

```env
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3.1:8b
```

---

## 8. Database (Docker-only)

- **PostgreSQL** runs in Docker with a named volume `postgres_data`. Your app data survives restarts. To reset, run `docker compose down -v`.
  **Docker `postgres` service** defined in `docker-compose.yml`:

- User: `user`
- Password: `password`
- Database: `postgres`
- Port: `5432` (mapped to host)

No manual local setup or migration commands are required for the default Docker workflow.

---

## 9. Vectors (Persistence)

- **ChromaDB** persists under `./data/chroma` (bind mount). Deleting that folder resets your vector store.
- You can host **multiple collections**; they persist across restarts when created via the AI service / your ingestion scripts.

---

## 10. Optional Local Dev (Frontend/Backend only)

> Full system (AI/Chroma/Postgres) runs via Docker.
> You can run **only** frontend and backend locally for UI work, while leaving AI/Chroma/Postgres in Docker.

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

**AI service** (if you prefer local instead of Docker):

```bash
cd backend/ai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 5000
```

---

## 11. API Summary (high level)

- **Authentication** — register/login issue JWTs; protected routes require a valid token.
- **Users (admin only)** — endpoint to list all users.
- **Account settings** — endpoints for the current user to fetch and update profile fields (name, surname, email, password).
- **Conversations & messages** — endpoints that persist chat messages and conversation metadata.
- **AI service** — external microservice called by the backend to answer questions via RAG.

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

---

## 12. Data Model

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

## 13. RAG Pipeline

- **Collections:** multiple Chroma collections. The user **selects a collection** in the UI; that collection name is sent with each `/ask` request and used for retrieval.
- **Embeddings:** `nomic-embed-text` (Ollama)
- **Vector DB:** Chroma at `http://localhost:8000`
- **LLM provider:** Ollama at **`OLLAMA_BASE_URL`** (set per machine; see §5.3).
- **Flow:** retrieve top‑k chunks **from the selected collection** → generate LaTeX answer → return with citations
- **Default (fallback) collection:** the AI container can be configured with `CHROMA_COLLECTION` (compose sets `my_collection`). This acts as a default only if a request does not specify `collection`. The frontend **always** sends a `collection`, so the default is rarely used.

---

## 14. Math Rendering (LaTeX)

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

## 15. Troubleshooting & FAQ

**Q: AI says it cannot reach Ollama (connection refused / timeout).**
A: Check that `OLLAMA_BASE_URL` is correct and reachable **from inside containers**. On Linux, add `extra_hosts: ["host.docker.internal:host-gateway"]` or use your host IP. Verify: `curl $OLLAMA_BASE_URL/api/tags`.

**Q: Model not found (`nomic-embed-text` or chat model).**
A: Pull the models on the machine that runs Ollama (`ollama pull <name>`). For Dockerized Ollama, exec into the container and pull.

**Q: Frontend can’t call backend (CORS or 404).**
A: Use the provided compose (frontend and backend run on 8082/8081). If you proxy or deploy differently, adjust `frontend/src/services/http.js`.

**Q: Reset DB or vectors?**
A: Postgres → `docker compose down -v` (removes `postgres_data`). Chroma → delete `./data/chroma`.

**Q: Can I include Ollama in the same compose?**
A: Yes (optional). Add a service like:

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: ollama
  ports: ["11434:11434"]
  volumes: ["ollama:/root/.ollama"]
  restart: unless-stopped
```

Then set `OLLAMA_BASE_URL: http://ollama:11434` and add `depends_on: [ollama]`.

---

## 16. Grader Steps (Repro Guide)

1. Install Docker. Ensure port **11434** is free.
2. Pick **one** Ollama option from §5.3 and ensure models are pulled.
3. Set `OLLAMA_BASE_URL` in compose (§5.4). On Linux, consider `extra_hosts`.
4. Run `docker compose up --build`.
5. Open **[http://localhost:8082](http://localhost:8082)**, register/login.
6. **Chat → New conversation** → select a collection → ask a question that exists in that collection.
7. Confirm the LaTeX rendering and citations. If admin, check **Users**; update profile in **Settings**.

---

## 17. Project Metadata & License

- **Project Title:** Mathematics ChatBot
- **Repository:** `llm-bot`
- **Author:** Ines Strapač
- **Supervisor:** Tomislav Prusina
- **University:** Fakultet primijenjene matematike i informatike
- **Academic Year:** 3
