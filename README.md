# Ethara-Sync

> High-Performance Post-LLM Training & RLHF Task Tracker for the Multimango platform.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS      |
| Backend    | Node.js + Express                   |
| Database   | PostgreSQL (via Prisma ORM)         |
| Auth       | JWT + Role-based routing            |
| QC Service | LanguageTool API (self-hosted/cloud)|
| Deploy     | Railway                             |

---

## Role Hierarchy

| Role            | Access                                                        |
|-----------------|---------------------------------------------------------------|
| CEO / HR        | High-level analytics, AHT monitoring, student onboarding     |
| Project Lead    | Project creation, assign QR & Taskers                        |
| Quality Reviewer| QC log review, final approval                                 |
| Tasker (Student)| Task execution, timer, feedback review                        |

---

## Project Structure

```
ethara-sync/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── Dockerfile
├── nixpacks.toml
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm or npm

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/ethara-sync.git
cd ethara-sync

# 2. Backend setup
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, LANGUAGETOOL_URL
npm install
npx prisma migrate dev --name init
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables (backend/.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ethara_sync"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
LANGUAGETOOL_URL="https://api.languagetool.org/v2/check"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

---

## Deployment on Railway

1. Push to GitHub
2. Create a new Railway project → "Deploy from GitHub repo"
3. Add a PostgreSQL plugin
4. Set environment variables in Railway dashboard
5. Railway auto-detects `nixpacks.toml` — no extra config needed

---

## API Reference

| Method | Endpoint                    | Role         | Description                        |
|--------|-----------------------------|--------------|------------------------------------|
| POST   | /api/auth/login             | All          | Login + role-based redirect token  |
| POST   | /api/auth/register          | HR/CEO       | Onboard new tasker                 |
| GET    | /api/tasks/history/5-days   | Tasker       | Last 5 days task history           |
| POST   | /api/tasks/submit           | Tasker       | Submit task (triggers QC)          |
| GET    | /api/tasks/:id              | QR, PL       | Single task detail                 |
| PATCH  | /api/tasks/:id/approve      | QR           | Approve task                       |
| PATCH  | /api/tasks/:id/reject       | QR           | Reject with feedback               |
| GET    | /api/analytics/aht-report   | CEO/HR, PL   | AHT analytics report               |
| GET    | /api/projects               | All          | List projects                      |
| POST   | /api/projects               | PL           | Create project                     |
| PATCH  | /api/projects/:id/assign    | PL           | Assign QR/Taskers to project       |
| GET    | /api/users                  | HR/CEO       | List all users                     |

---

## License

MIT © Ethara AI
