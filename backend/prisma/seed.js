import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // CEO
  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@ethara.ai' },
    update: {},
    create: {
      email: 'ceo@ethara.ai',
      name: 'Ethara CEO',
      passwordHash: hash('password123'),
      role: 'CEO',
    },
  });

  // HR
  const hr = await prisma.user.upsert({
    where: { email: 'hr@ethara.ai' },
    update: {},
    create: {
      email: 'hr@ethara.ai',
      name: 'HR Manager',
      passwordHash: hash('password123'),
      role: 'HR',
    },
  });

  // Project Lead
  const pl = await prisma.user.upsert({
    where: { email: 'lead@ethara.ai' },
    update: {},
    create: {
      email: 'lead@ethara.ai',
      name: 'Project Lead',
      passwordHash: hash('password123'),
      role: 'PROJECT_LEAD',
    },
  });

  // 5 Project Leads
  const plDefs = [
    { email: 'vanshika@ethara.ai',  name: 'Vanshika Juneja' },
    { email: 'arjun@ethara.ai',     name: 'Arjun Mehta'     },
    { email: 'priya@ethara.ai',     name: 'Priya Sharma'    },
    { email: 'rahul@ethara.ai',     name: 'Rahul Verma'     },
    { email: 'neha@ethara.ai',      name: 'Neha Kapoor'     },
  ];
  const leads = [pl];
  for (const def of plDefs) {
    const u = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: { email: def.email, name: def.name, passwordHash: hash('password123'), role: 'PROJECT_LEAD' },
    });
    leads.push(u);
  }

  // Quality Reviewer
  const qr = await prisma.user.upsert({
    where: { email: 'qr@ethara.ai' },
    update: {},
    create: {
      email: 'qr@ethara.ai',
      name: 'Quality Reviewer',
      passwordHash: hash('password123'),
      role: 'QUALITY_REVIEWER',
    },
  });

  // 5 Quality Reviewers
  const qrDefs = [
    { email: 'saumya@ethara.ai',   name: 'Saumya Pandey'  },
    { email: 'kiran@ethara.ai',    name: 'Kiran Reddy'    },
    { email: 'amit@ethara.ai',     name: 'Amit Joshi'     },
    { email: 'divya@ethara.ai',    name: 'Divya Nair'     },
    { email: 'rohan@ethara.ai',    name: 'Rohan Gupta'    },
  ];
  const qrUsers = [qr];
  for (const def of qrDefs) {
    const u = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: { email: def.email, name: def.name, passwordHash: hash('password123'), role: 'QUALITY_REVIEWER' },
    });
    qrUsers.push(u);
  }

  // Tasker
  const tasker = await prisma.user.upsert({
    where: { email: 'taker@multimango.com' },
    update: {},
    create: {
      email: 'taker@multimango.com',
      name: 'Student Tasker',
      passwordHash: hash('password123'),
      role: 'TAKER',
    },
  });

  // 5 Demo Projects
  const projectDefs = [
    {
      id: 'seed-project-1',
      name: 'RLHF Batch Alpha',
      description: 'First batch of RLHF annotation tasks for LLM fine-tuning.',
      status: 'ACTIVE',
      expectedAhtSecs: 300,
    },
    {
      id: 'seed-project-2',
      name: 'Omni-ELO Evaluation',
      description: 'Side-by-side model response ranking for omni-modal outputs.',
      status: 'ACTIVE',
      expectedAhtSecs: 240,
    },
    {
      id: 'seed-project-3',
      name: 'Text-to-Image H2H',
      description: 'Human-to-human preference labelling for text-to-image generation tasks.',
      status: 'ACTIVE',
      expectedAhtSecs: 360,
    },
    {
      id: 'seed-project-4',
      name: 'Conversations Response QA',
      description: 'Quality assurance on multi-turn conversational model responses.',
      status: 'ACTIVE',
      expectedAhtSecs: 420,
    },
    {
      id: 'seed-project-5',
      name: 'Code Review Annotation',
      description: 'Annotating LLM-generated code snippets for correctness and style.',
      status: 'PAUSED',
      expectedAhtSecs: 480,
    },
  ];

  const projects = [];
  for (const def of projectDefs) {
    const p = await prisma.project.upsert({
      where: { id: def.id },
      update: {
        name: def.name,
        description: def.description,
        status: def.status,
        expectedAhtSecs: def.expectedAhtSecs,
      },
      create: {
        ...def,
        leadId: pl.id,
        qrId: qr.id,
      },
    });
    projects.push(p);
  }

  // NOTE: Taskers are NOT pre-assigned to projects.
  // They self-onboard via the dashboard modal on first login,
  // choosing their own Project Lead and Quality Reviewer.

  console.log('✅ Seed complete.');
  console.log('');
  console.log('Demo accounts (password: password123):');
  console.log('  CEO:              ceo@ethara.ai');
  console.log('  HR:               hr@ethara.ai');
  console.log('');
  console.log('  Project Leads:');
  console.log('    lead@ethara.ai       — Project Lead (generic)');
  console.log('    vanshika@ethara.ai   — Vanshika Juneja');
  console.log('    arjun@ethara.ai      — Arjun Mehta');
  console.log('    priya@ethara.ai      — Priya Sharma');
  console.log('    rahul@ethara.ai      — Rahul Verma');
  console.log('    neha@ethara.ai       — Neha Kapoor');
  console.log('');
  console.log('  Quality Reviewers:');
  console.log('    qr@ethara.ai         — Quality Reviewer (generic)');
  console.log('    saumya@ethara.ai     — Saumya Pandey');
  console.log('    kiran@ethara.ai      — Kiran Reddy');
  console.log('    amit@ethara.ai       — Amit Joshi');
  console.log('    divya@ethara.ai      — Divya Nair');
  console.log('    rohan@ethara.ai      — Rohan Gupta');
  console.log('');
  console.log('  Tasker:           taker@multimango.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
