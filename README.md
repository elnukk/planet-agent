# Planet Agent — Project Centinela

A platform that helps conservation organizations turn Planet Labs satellite data into runnable Jupyter notebooks. Users describe their analysis goal through a guided intake flow; an AI agent searches a curated notebook corpus and assembles a complete, parameterized notebook ready to run in Google Colab.

Built at Stanford CS52 in collaboration with the Project Centinela team at Planet Labs.

## Architecture

- **Frontend** — Next.js (hosted on Vercel)
- **Database** — Convex (real-time, hosted)
- **AI pipeline** — FastAPI server running the planner → coder agent (hosted on Railway)
- **Notebook execution** — E2B sandboxed Python environments

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.10+
- API keys for:
  - [Anthropic](https://console.anthropic.com) — powers the planner, coder, and chat assistant
  - [E2B](https://e2b.dev) — sandboxed notebook cell execution
  - [Google AI](https://aistudio.google.com) — used by the CLI intake bot
  - [SerpAPI](https://serpapi.com) — live Planet docs search
  - [Convex](https://dashboard.convex.dev) — real-time database
  - [GitHub](https://github.com/settings/tokens) — personal access token for Gist export

## Local Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/elnukk/planet-agent.git
cd planet-agent
npm install
pip install -r requirements.txt
```

### 2. Set environment variables

Create a `.env` file in the project root:

```
# AI
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
SERPAPI_KEY=your_serpapi_key

# Infrastructure
E2B_API_KEY=your_e2b_api_key
GITHUB_TOKEN=your_github_personal_access_token

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Encryption (32-byte hex key for Planet API key storage)
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_64_char_hex_string
```

### 3. Run locally (3 terminals)

**Convex (database)**
```bash
npx convex dev
```

**Next.js frontend**
```bash
npm run dev
```

**FastAPI server**
```bash
cd knowledge-base
uvicorn api_server:app --reload --port 8001
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (frontend + Next.js API routes)

Add all environment variables from `.env` to your Vercel project, plus:

```
PYTHON_API_URL=https://your-railway-service.up.railway.app
```

### Railway (FastAPI server)

| Setting | Value |
|---|---|
| Build command | `pip install -r requirements.txt` |
| Start command | `cd knowledge-base && uvicorn api_server:app --host 0.0.0.0 --port $PORT` |

Add environment variables: `ANTHROPIC_API_KEY`, `SERPAPI_KEY`, and `FRONTEND_URL` (your Vercel URL, for CORS).

## Project Structure

```
├── src/                        # Next.js frontend
│   ├── app/
│   │   ├── api/                # API routes (chat, assemble, run-cell, etc.)
│   │   ├── dashboard/          # Workflow dashboard
│   │   ├── intake/             # Intake flow
│   │   └── workflow/[id]/      # Notebook viewer + chat
│   ├── components/
│   │   ├── intake/             # Intake form and region picker
│   │   └── workflow/           # Notebook viewer, cell blocks, chat sidebar
│   └── lib/                    # Auth, encryption, shared types
├── knowledge-base/             # Python AI pipeline
│   ├── api_server.py           # FastAPI server
│   ├── agentic_search.py       # Iterative notebook retrieval
│   ├── build_metadata.py       # One-time script: builds notebooks_metadata.json
│   ├── dspy_agent.py           # CLI tool for querying the knowledge base
│   ├── agent/
│   │   ├── planner.py          # Workflow planner (step generation + retrieval)
│   │   └── coder.py            # Notebook assembler (code generation)
│   ├── search/
│   │   ├── metadata_ranker.py  # Notebook-level ranking
│   │   ├── notebook_search.py  # Cell-level search and scoring
│   │   └── web_search.py       # Live Planet docs search via SerpAPI
│   ├── intake/
│   │   └── intake_bot.py       # CLI intake flow (dev/testing)
│   ├── notebooks/              # Planet Labs notebook corpus
│   └── data/
│       └── notebooks_metadata.json  # Pre-built notebook index
└── convex/                     # Convex schema and mutations
```

## Contributors

- Elanu Karakus (TA)
- David Tomz
- Brandyn Lu
- Anya Pinto
- Jolie Teo
- Vanesska Hall

## Acknowledgements

Thanks to Amy Rosenthal and Seamus Lombardo at Planet Labs, and to the conservation organizations that participated in our needfinding interviews.

## License

[MIT](https://choosealicense.com/licenses/mit/)
