# Ethara-Sync

A task tracking portal built for Ethara AI's annotation teams working on the Multimango platform. It handles the full workflow of RLHF (Reinforcement Learning from Human Feedback) annotation — from assigning taskers to projects, tracking how long each task takes, running automated grammar checks on submissions, and giving managers a live view of team performance.

The idea was simple: replace manual spreadsheet tracking with something purpose-built that actually fits how the team works.

**Live demo:** [task-tracker-production-4716.up.railway.app](https://task-tracker-production-4716.up.railway.app)

---

## What it does

There are four types of users, each with their own portal:

**Taskers (students)** log in, punch in for their shift, pick a project, and start working. They paste the prompt from Multimango, write their response, run a grammar check that highlights issues inline, fix them, and submit. The system automatically calculates how long the task took (AHT) and flags it if it took too long.

**Quality Reviewers** see a queue of submitted tasks. They can expand each one to read the response and any grammar issues the system flagged, then approve or reject it. If they reject, they leave a comment and tag the type of error so the tasker knows what to fix.

**Project Leads** create projects, write SOPs for each one, and monitor how their QRs are performing. They can click into any QR to see their taskers, and click into any tasker to read their submitted prompts and responses from the last 5 days.

**HR / CEO** manages the team — adding new accounts, organising taskers into batches (each batch has one QR and up to 10 taskers), blocking or restoring accounts, and viewing analytics across the whole team.

---

## Tech stack

| Layer | What's used |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT with role-based routing |
| Grammar check | LanguageTool API |
| Deployment | Railway |

---

## How login works

When someone logs in, the backend checks their role and returns a redirect path. The frontend navigates them straight to their portal — no manual role selection needed.

| Role | Goes to |
|---|---|
| CEO / HR | `/portal/hr` |
| Project Lead | `/portal/lead` |
| Quality Reviewer | `/portal/qr` |
| Tasker | `/portal/taker` |

---


```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/ethara_sync"
JWT_SECRET="any-long-random-string"
JWT_EXPIRES_IN="7d"
LANGUAGETOOL_URL="https://api.languagetool.org/v2/check"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

Then create the database tables and seed demo accounts:

```bash
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

**3. Set up the frontend** (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with any of the demo accounts below.

---

## Demo accounts

All accounts use the password `password123`.

| Role | Email |
|---|---|
| CEO | ceo@ethara.ai |
| HR | hr@ethara.ai |
| Project Lead | vanshika@ethara.ai |
| Quality Reviewer | saumya@ethara.ai |
| Tasker | taker@multimango.com |

There are 6 project leads and 6 quality reviewers seeded in total, so you can test the onboarding flow where a tasker picks their own PL and QR.

---

## Project structure

```
ethara-sync/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   └── seed.js             # Demo data
│   └── src/
│       ├── controllers/        # Business logic
│       ├── middleware/         # Auth, error handling
│       ├── routes/             # API endpoints
│       ├── services/           # LanguageTool QC
│       └── index.js            # Express app entry
├── frontend/
│   └── src/
│       ├── components/         # Shared UI components
│       ├── pages/
│       │   ├── taker/          # Tasker portal
│       │   ├── lead/           # Project Lead portal
│       │   ├── qr/             # Quality Reviewer portal
│       │   └── hr/             # HR / CEO portal
│       ├── store/              # Zustand auth state
│       └── lib/                # API client, utilities
├── Dockerfile
├── nixpacks.toml               # Railway build config
└── README.md
```

---

## API overview

All endpoints are under `/api` and require a `Bearer` token except `/api/auth/login`.

| Method | Endpoint | Who can use it |
|---|---|---|
| POST | `/api/auth/login` | Everyone |
| POST | `/api/auth/register` | HR, CEO |
| GET | `/api/tasks/history/5-days` | Tasker, Project Lead |
| POST | `/api/tasks/start` | Tasker |
| POST | `/api/tasks/submit` | Tasker |
| POST | `/api/tasks/check-grammar` | Tasker |
| GET | `/api/tasks/submitted` | QR, PL, HR, CEO |
| PATCH | `/api/tasks/:id/approve` | QR |
| PATCH | `/api/tasks/:id/reject` | QR |
| GET | `/api/projects` | All (scoped by role) |
| POST | `/api/projects` | Project Lead, HR, CEO |
| POST | `/api/projects/join` | Tasker (onboarding) |
| GET | `/api/batches` | HR, CEO |
| POST | `/api/batches` | HR, CEO |
| GET | `/api/batches/mine` | QR |
| GET | `/api/analytics/aht-report` | HR, CEO, PL, QR |
| GET | `/api/users` | HR, CEO, PL, Tasker (read-only) |

---

## Deploying to Railway

The app is configured to deploy as a single service — the backend builds the frontend and serves it as static files.

**1. Push to GitHub**

**2. Create a new Railway project** → Deploy from GitHub repo

**3. Add a PostgreSQL database** → Railway → New → Database → PostgreSQL

**4. Set environment variables** in your service's Variables tab:

```
DATABASE_URL        = ${{Postgres.DATABASE_URL}}
JWT_SECRET          = your-secret-here
JWT_EXPIRES_IN      = 7d
LANGUAGETOOL_URL    = https://api.languagetool.org/v2/check
NODE_ENV            = production
FRONTEND_URL        = https://your-app.up.railway.app
PORT                = 3001
```

**5. Generate a domain** → Settings → Networking → Generate Domain

Railway picks up `nixpacks.toml` automatically. The build installs both frontend and backend, builds the Vite app, copies it into `backend/public`, generates the Prisma client, and starts the server.

**6. Seed the database** — after first deploy, run from your local machine with the Railway `DATABASE_URL`:

```bash
DATABASE_URL="your-railway-db-url" node backend/prisma/seed.js
```

---

## How AHT is calculated

AHT (Average Handling Time) is the time between when a tasker clicks "Start Task" and when they submit it.

```
AHT = submittedAt − startedAt  (in seconds)
```

A task is flagged as overdue if its AHT exceeds twice the project's expected AHT. The analytics pages aggregate this per tasker, showing average, minimum, and maximum AHT over a selected time window.

---

## Grammar check

Every submission is automatically checked via the LanguageTool API before it reaches the QR's queue. The score is calculated as:

```
score = 100 − (number of issues × deduction per issue)
deduction = 100 ÷ max(word count, 10)
```

Scores below 70 are flagged. The QR sees the score and all issues when reviewing. Taskers can also run the check themselves before submitting and fix issues inline — each suggestion shows the original text crossed out and replacement options as clickable chips.

If LanguageTool is unavailable, the task passes with a "QC Skipped" badge so work isn't blocked.

---

## Notes for reviewers

- The `kwift.CHROME.js` errors you might see in the browser console are from the Dashlane password manager extension — not the app.
- The onboarding modal only appears on a tasker's first login (when they have no project memberships). After picking a PL and QR, it won't show again.
- Batch capacity is capped at 10 taskers per batch by design.
- The SOP field on projects is a free-text editor — it accepts plain text or markdown.
