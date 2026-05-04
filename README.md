# Ethara-Sync

> High-Performance Post-LLM Training & RLHF Task Tracker 



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


