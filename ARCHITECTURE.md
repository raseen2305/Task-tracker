# Ethara-Sync — Architecture, Workflow & Feature Overview
### Internal Meeting Document · Ethara AI

---

## What Is Ethara-Sync?

Ethara-Sync is a **Post-LLM Training & RLHF Task Tracker** built for the Multimango platform. It manages the full lifecycle of annotation work — from assigning taskers to projects, tracking their real-time performance, running automated quality checks, and giving management a live view of every layer of the operation.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS (Rose/Dark theme) |
| Backend     | Node.js + Express (ESM)                          |
| Database    | PostgreSQL via Prisma ORM                        |
| Auth        | JWT (role-based, auto-routing on login)          |
| QC Engine   | LanguageTool API (grammar + spelling)            |
| Deployment  | Railway (nixpacks auto-build)                    |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React + Vite)                   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Tasker  │  │   Lead   │  │    QR    │  │    HR/CEO    │   │
│  │  Portal  │  │  Portal  │  │  Portal  │  │    Portal    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └─────────────┴──────────────┴────────────────┘           │
│                          Axios + JWT                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / Vite Proxy
┌──────────────────────────────▼──────────────────────────────────┐
│                    Node.js + Express API                         │
│                                                                 │
│  /api/auth      /api/tasks     /api/projects                    │
│  /api/users     /api/batches   /api/analytics                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware: JWT Auth → RBAC → Rate Limit → Validation   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │  LanguageTool│    │           Prisma ORM                 │   │
│  │  QC Service  │    │                                      │   │
│  └──────────────┘    │  PostgreSQL Database                 │   │
│                      │  ┌──────────┐  ┌──────────────────┐ │   │
│                      │  │  users   │  │    projects      │ │   │
│                      │  │  tasks   │  │  project_members │ │   │
│                      │  │ batches  │  │  batch_members   │ │   │
│                      │  │feedbacks │  │                  │ │   │
│                      │  └──────────┘  └──────────────────┘ │   │
│                      └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Role Hierarchy

```
CEO / HR
  └── Manages accounts, batches, team analytics
        │
        ├── Project Lead
        │     └── Creates projects, writes SOPs, monitors QR performance
        │               │
        │               └── Quality Reviewer (QR)
        │                     └── Reviews & approves/rejects submitted tasks
        │                               │
        │                               └── Tasker (Student)
        │                                     └── Executes annotation tasks
        │
        └── Batches
              └── 1 QR assigned per batch
                    └── Up to 10 Taskers per batch
```

---

## Smart Authentication & Role Routing

When a user logs in, the system:
1. Looks up their email in the database
2. Reads their `role` field
3. Issues a JWT containing `{ id, email, role, name }`
4. Returns a `redirect` path — the frontend navigates automatically

| Role             | Lands on          |
|------------------|-------------------|
| CEO              | `/portal/hr`      |
| HR               | `/portal/hr`      |
| Project Lead     | `/portal/lead`    |
| Quality Reviewer | `/portal/qr`      |
| Tasker           | `/portal/taker`   |

No manual role selection. No shared login page confusion.

---

## Database Schema (Key Models)

```
User
  id, email, name, passwordHash, role, isActive

Project
  id, name, description (SOP), status, expectedAhtSecs
  leadId → User (PROJECT_LEAD)
  qrId   → User (QUALITY_REVIEWER)

ProjectMember
  userId → User (TAKER)
  projectId → Project

Task
  id, projectId, takerId, reviewerId
  status: PENDING | IN_PROGRESS | SUBMITTED | APPROVED | REJECTED | OVERDUE
  prompt, response
  startedAt, submittedAt, ahtSeconds
  qcScore, qcIssues (JSON), isOverdue

Feedback
  taskId, userId (reviewer), comment, errorTags[]

Batch
  id, name, isActive
  qrId → User (QUALITY_REVIEWER)

BatchMember
  userId → User (TAKER)
  batchId → Batch
```

---

## Feature Breakdown by Role

---

### Tasker Portal

**Purpose:** Execute annotation tasks, track personal performance.

| Feature | Description |
|---------|-------------|
| **Onboarding Modal** | First login triggers a modal to pick their Project Lead and QR. The system auto-creates or finds the matching project and adds them as a member. |
| **Punch In / Out** | Session clock starts on punch-in. Tasker cannot start tasks without punching in. Session time is tracked separately from task time. |
| **Live Task Timer** | Stopwatch starts when "Start Task" is clicked. Turns orange if the task exceeds the project's expected AHT × 2 (overdue). |
| **Multimango Prompt** | Tasker pastes the prompt from Multimango into a dedicated field. |
| **Response Field** | Tasker writes or pastes their annotated response. |
| **Grammar Check** | Before submitting, tasker can click "Check Grammar" — calls LanguageTool API, highlights issues inline with suggested replacements. Tasker can accept individual suggestions or "Accept All". |
| **Task Submission** | On submit, AHT is calculated (`submittedAt - startedAt`). QC runs automatically. Task enters the QR's review queue. |
| **Today's Task Log** | Right panel shows all tasks submitted today with status and AHT. |
| **My Projects Grid** | Searchable, selectable grid of all assigned projects. |
| **Feedback Page** | Shows all rejected tasks with reviewer comments, error tags, and QC issue highlights. |

---

### Quality Reviewer (QR) Portal

**Purpose:** Review submitted tasks, monitor assigned taskers.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Shows stat cards (pending review, total tasks, overdue, batch count). Displays assigned batches with nested tasker list and capacity bar. |
| **Review Queue** | FIFO list of all SUBMITTED tasks across assigned projects. Each card shows tasker name, AHT, QC score, and overdue flag. Tasks with QC issues are highlighted in gold. |
| **Expand Task** | Click to expand a task card — shows full submitted response and all QC issues with suggested corrections. |
| **Approve** | One-click approval. Task moves to APPROVED status. |
| **Reject with Feedback** | Opens a modal to write a comment and tag error types (grammar, factual, formatting, etc.). Tasker sees this in their Feedback page. |
| **Analytics** | AHT bar chart per tasker, status pie chart, per-tasker summary table. Aggregate counts only — no individual response content shown. |

---

### Project Lead Portal

**Purpose:** Create and manage projects, write SOPs, monitor QR performance.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Stat cards + QR Progress Overview. Each QR shown as a clickable row with a progress bar, tasker count, and avg AHT. |
| **Click QR → See Taskers** | Expands to show all taskers under that QR as clickable cards. |
| **Click Tasker → Prompt Drawer** | Opens a slide-up drawer showing the tasker's last 5 days of tasks — full prompt and response text (read-only). |
| **Projects Page** | Full project management: create, edit status, set expected AHT, assign QR. |
| **SOP Editor** | Each project has a "SOP" button. Opens a full-screen editor with file upload (.txt/.md) or manual text entry. SOP is saved to the project and shown to taskers. |
| **Analytics** | Same AHT analytics as HR, scoped to the lead's own projects. |

---

### HR / CEO Portal

**Purpose:** Team management, account control, batch organisation, analytics.

| Feature | Description |
|---------|-------------|
| **Dashboard** | AHT leaderboard (top 5 taskers), active projects list, task status breakdown. |
| **Team Page** | Full user list with search and role filter. "Add Member" button opens a modal to create Tasker or QR accounts with auto-generated passwords. |
| **Batches Page** | Create and manage batches. Each batch has 1 QR and up to 10 taskers. Batches display as cards with the QR as the group header and taskers nested underneath with tree connectors. Capacity bar fills green → amber → red. |
| **Accounts Page** | Block or restore any account (except CEO/HR). Confirmation dialog before any action. Active/inactive status shown with live counts. |
| **Analytics Page** | Full AHT report with bar chart, status pie chart, and per-tasker breakdown table. Filterable by 7 / 14 / 30 days. |

---

## The Task Lifecycle

```
Tasker punches in
       │
       ▼
Tasker selects project + enters Task ID
       │
       ▼
Tasker clicks "Start Task"
  → Task created in DB with status: IN_PROGRESS
  → Timer starts
       │
       ▼
Tasker pastes Multimango prompt
Tasker writes response
Tasker optionally runs Grammar Check
  → LanguageTool API called
  → Issues shown inline with replacements
  → Tasker accepts/dismisses suggestions
       │
       ▼
Tasker clicks "Submit Task"
  → AHT calculated (submittedAt - startedAt)
  → Overdue flag set if AHT > expectedAHT × 2
  → QC runs automatically (score 0–100)
  → Task status → SUBMITTED
  → Task enters QR's Review Queue
       │
       ▼
QR reviews task in Review Queue
  → Sees response, QC score, AHT, overdue flag
  → Approves → status: APPROVED
  → Rejects → status: REJECTED + Feedback created
       │
       ▼
If REJECTED:
  → Tasker sees feedback in their Feedback page
  → Error tags + reviewer comment + QC issues shown

If APPROVED:
  → Task counted in AHT analytics
  → Project Lead can see it in QR Monitor
```

---

## AHT (Average Handling Time) Calculation

```
AHT (seconds) = submittedAt − startedAt

Daily AHT    = sum of all task AHTs for the day
Average AHT  = total AHT ÷ number of tasks

Overdue flag = AHT > project.expectedAhtSecs × 2
```

AHT is stored per task and aggregated in the analytics endpoints. The HR and Lead portals show per-tasker AHT breakdowns with min, max, and average.

---

## Automated QC (Grammar Check)

Every submission is automatically checked via **LanguageTool API**:

```
Score = 100 − (issues × deduction_per_issue)
Deduction = 100 ÷ max(wordCount, 10)

Score ≥ 70 → QC Passed (green)
Score < 70 → QC Warning (flagged for QR attention)
```

The QR sees the score and all issues when reviewing. If LanguageTool is unavailable, the task passes with a "QC Skipped" badge.

---

## Batch System

```
HR creates a Batch
  → Assigns 1 Quality Reviewer
  → Adds up to 10 Taskers

Batch card shows:
  ┌─────────────────────────────────────┐
  │  Batch 1 — RLHF Alpha    [Active]   │
  │  ████░░░░░░  2/10 taskers           │
  │                                     │
  │  🛡 Saumya Pandey  Quality Reviewer │
  │  ├── Thoshif Ahmed                  │
  │  └── Student Tasker                 │
  └─────────────────────────────────────┘

QR sees their batch on their dashboard.
HR can block/restore any account.
```

---

## Security

- All passwords hashed with **bcrypt** (12 rounds)
- JWT tokens expire in 7 days
- Every API route is protected by `authenticate` middleware
- Every sensitive route is protected by `authorize(...roles)` middleware
- Rate limiting: 200 requests per 15 minutes per IP
- Input validation on all POST/PATCH endpoints via `express-validator`
- CEO/HR accounts are protected from deactivation

---

## Deployment (Railway)

```
GitHub Push
    │
    ▼
Railway detects nixpacks.toml
    │
    ├── Install: npm ci (backend + frontend)
    ├── Build:   Vite build → backend/public/
    │            Prisma generate
    │
    └── Start:   prisma db push → node src/index.js
                 Backend serves frontend as static files
                 Single service, single port (3001)
```

Environment variables set in Railway dashboard:
- `DATABASE_URL` — auto-provided by Railway PostgreSQL plugin
- `JWT_SECRET` — long random string
- `NODE_ENV=production`
- `FRONTEND_URL` — Railway public domain

---

## Summary

Ethara-Sync replaces manual spreadsheet tracking with a purpose-built portal that:

1. **Automates quality control** — every submission is grammar-checked before a human even looks at it
2. **Tracks AHT in real time** — every second of every task is measured and aggregated
3. **Organises teams into batches** — clear QR → Tasker hierarchy, max 10 per batch
4. **Gives each role exactly what they need** — no shared dashboards, no information overload
5. **Flags problems automatically** — overdue tasks, low QC scores, and rejected work all surface immediately to the right person

---

*Document generated for internal Ethara AI meeting.*
*Stack: Node.js · React · PostgreSQL · Railway*
