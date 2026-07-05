# Brolier 360 System Architecture

## Architectural Changes Log
*Note: Each time the architecture changes, append the change in this section with a timestamp. NEVER overwrite the historical architecture.*

### [2026-06-22 10:00:00] Decoupled Python FastAPI & Vite React Architecture

### [2026-07-04 21:52:48] Frontend Code Splitting & Alembic Migrations
- **Frontend**: Implemented route-based code splitting using `React.lazy()` and `Suspense` in `App.tsx` for optimal load performance. Added route pre-fetching (`onMouseEnter`) in `Layout.tsx` and explicit skeleton loaders to prevent layout shifts.
- **Backend**: Integrated **Alembic** (`backend/alembic/`) for version-controlled database migrations to safely track schema changes and optimizations over time.

## Code Files & Folders Structure

```text
Brolier 360 (Root)
├── backend/                  # Python FastAPI Backend
│   ├── app/                  # Application Code
│   │   ├── api/              # REST API Route Handlers (Campaigns, Members, Templates)
│   │   ├── core/             # Configuration and Security
│   │   ├── models/           # SQLAlchemy Data Models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic & integrations (Meta API)
│   │   └── main.py           # FastAPI Application Entrypoint
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment Variables
├── frontend/                 # Vite React Frontend
│   ├── src/                  # Application source code
│   │   ├── components/       # Reusable components & Shadcn UI
│   │   ├── pages/            # Admin Panel Views (Dashboard, Campaigns, Members, etc.)
│   │   ├── App.tsx           # React Router setup
│   │   └── index.css         # Tailwind directives
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── tsconfig.json         # TypeScript configuration
└── .core/                    # Project Documentation & Rules
```

## Application Type
Decoupled Architecture. The Backend is a pure API server (FastAPI) serving REST endpoints and background tasks for bulk messaging. The Frontend (Vite React + TypeScript) is a Single Page Application (SPA) that handles the administrative dashboard for managing campaigns and members.

## Stack Overview
- **Backend Runtime:** Python 3.10+, FastAPI
- **Database:** PostgreSQL (via `psycopg2` or `asyncpg`), managed by SQLAlchemy and Pydantic.
- **Frontend Runtime:** Node.js, Vite, React 19
- **Styling:** Tailwind CSS v3, Shadcn UI
- **Integrations:** Meta WhatsApp Cloud API (Graph API)
- **Concurrency:** FastAPI BackgroundTasks / AsyncIO for non-blocking bulk message broadcasting.

### [2026-07-05 09:08:30] Pivot to wacrm (Next.js + Supabase)
**Major Shift:** The custom Vite + FastAPI architecture was completely deprecated and removed. 
The codebase is now based on the open-source wacrm repository.
- **Frontend/Backend:** Next.js 16 Monorepo (App Router, Server Actions, React 19).
- **Database/Auth:** Supabase (PostgreSQL, Supabase Auth, Storage).
- **Styling:** Tailwind CSS v4.
- **Deployment Strategy:** Vercel / Hostinger (Zero-config Node.js deployment).
