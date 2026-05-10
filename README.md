# Installation Programme — V1

Crane & lifting equipment installation programme dashboard.
Built with React + Vite. Ready to deploy on Vercel.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Vercel (2 minutes)

1. Push this folder to a GitHub repo
2. Go to vercel.com → New project → Import that repo
3. Vercel auto-detects Vite — hit Deploy
4. Done. You get a live URL.

---

## What's in V1

### Programme calendar
- 3-week rolling calendar view (Mon–Sun)
- Navigate forward/back by week, snap to today
- Each project shows as a card on its active days
- Cards display: project number, project name, phase label, equipment chips, prep dots (●●●●●)
- Equipment chips update per day (SL, HB, EW, FK, TT, PG)

### Add / edit project
- Project number (5-digit), name, client, address, region, crane type, scope
- Contacts: role, name, phone, email (add as many as needed)
- Mobilisations: each mob has start/end dates, phase label, task selection, equipment per day
- Tasks: library of standard tasks + custom task input
- Prep status: 5-stage toggle (Scheduled → Stakeholders notified → Plant confirmed → Equipment ready → H&S complete)
- Notes: site access, H&S requirements, general

### Project detail view
- Click any calendar card to open the full project record
- Edit or delete from detail view
- Tap prep stages to mark complete/incomplete
- Contact phone/email links

### Weekly prep report
- Summary of all active mobs this week
- Flags anything below 5/5 prep with missing stages listed
- Green/red split for at-a-glance status

---

## File structure

```
src/
  App.jsx                    # Root — tab routing, project state
  index.css                  # All styles
  main.jsx                   # React entry point
  lib/
    constants.js             # Equipment, tasks, colours, date utils
  components/
    ProgrammeCalendar.jsx    # 3-week calendar
    ProjectForm.jsx          # Add/edit form
    ProjectDetail.jsx        # Project detail view
    PrepSummary.jsx          # Weekly prep report
```

---

## V2 — what to build next

### Must-have for team use
- [ ] **Supabase database** — projects persist between sessions and across users
- [ ] **Auth** — login so the team can all use it (Supabase Auth, Google sign-in)
- [ ] **Real-time sync** — changes one person makes appear for everyone

### High value features
- [ ] **Stakeholder comms generator** — Claude API generates pre-mob emails per audience (PM, workers, sponsor, site manager) from the project record
- [ ] **Delivery tracking** — link a shipment to a mob, track ETA and status
- [ ] **Document storage** — attach the booking confirmation / completion sign-off to each mob
- [ ] **Mobile view** — responsive layout for on-site use
- [ ] **Notifications** — alert when a mob is 7 days out and prep < 4/5

### Nice to have
- [ ] **Project colour picker** — choose your own colour per project
- [ ] **Export to PDF** — weekly report as a PDF to send to stakeholders
- [ ] **Mob history** — completed mobs archived, visible in project timeline

---

## Supabase schema (ready for V2)

```sql
-- Projects table
create table projects (
  id           uuid primary key default gen_random_uuid(),
  proj_num     text not null unique,
  proj_name    text not null,
  client       text,
  address      text,
  region       text,
  crane_type   text,
  scope        text,
  contacts     jsonb default '[]',
  mobs         jsonb default '{}',
  prep         integer default 0,
  access_notes text,
  hs_notes     text,
  gen_notes    text,
  colour       jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Enable Row Level Security
alter table projects enable row level security;

-- Allow all reads/writes for now (tighten with auth in V2)
create policy "allow all" on projects for all using (true);
```

To connect: install `@supabase/supabase-js`, create a `src/lib/supabase.js` client,
then replace the `useState([])` in `App.jsx` with Supabase queries.

---

## Notes for Claude Code

When opening this project in Claude Code, say:
> "Deploy this React app to Vercel and connect a Supabase database so project data persists."

Claude Code will handle npm install, env vars, and deployment automatically.
