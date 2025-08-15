# GlobeTalk — Virtual Pen Pals 🌍✉️

**GlobeTalk** is a privacy-first, anonymous pen-pal platform that connects people around the world for friendly, cultural, asynchronous “letter” exchanges. It recreates the charm of postal pen pals using modern web tech: random matchmaking, delayed message delivery, short cultural profiles, and moderation — text-only and anonymous by design.

---

![codecov](https://codecov.io/gh/MakomaneTau/my-app/branch/main/graph/badge.svg)](https://codecov.io/gh/MakomaneTau/GlobeTalk)

![License](https://img.shields.io/badge/license-MIT-blue)

# Table of contents
1. [Quick summary](#quick-summary)  
2. [Features](#features)  
3. [Tech stack (suggested)](#tech-stack-suggested)  
4. [Architecture & data model](#architecture--data-model)  
5. [API endpoints (examples)](#api-endpoints-examples)  
6. [Local setup & development](#local-setup--development)  
7. [Testing & CI](#testing--ci)  
8. [Sprint 1 deliverables (rubric-aligned)](#sprint-1-deliverables-rubric-aligned)  
9. [Privacy, safety & moderation](#privacy-safety--moderation)  
10. [Contributing](#contributing)  
11. [Contact & support](#contact--support)  
12. [License](#license)

# Quick summary
- **Purpose:** Help users make anonymous, cross-cultural connections via delayed text letters.  
- **Key constraints:** Text-only (no file/media), anonymous (no names/emails published), moderation/reporting, OAuth-based sign-in for account protection.  
- **Target users:** Curious learners, language learners, students, and anyone seeking low-pressure cultural exchange.

# Features
- **Random Matchmaking** — pair users globally with optional filters (language, region/time-zone).  
- **Asynchronous Messaging** — write a “letter”, schedule a delivery delay (e.g., 12 hours).  
- **Cultural Profiles** — short, anonymous fields (age range, hobbies, region, languages).  
- **Inbox / Compose** — thread-based UI for reading and writing letters.  
- **Moderation** — reporting, moderation logs, blocking.  
- **Settings & Safety** — block/report, toggle match prefs, delete account.

# Tech stack (suggested)
> Replace components as your team prefers.

**Frontend**
- React (Next.js recommended)  
- Tailwind CSS  
- React Query or Context API

**Backend**
- Node.js + Express (or Next.js API routes)  
- Firebase Authentication (OAuth) or Auth0  
- PostgreSQL (or MongoDB)  
- ORM: Prisma (Postgres) or Mongoose (MongoDB)

**Dev / infra**
- GitHub for version control  
- GitHub Actions for CI  
- Hosting: Vercel/Netlify (frontend), Railway/Render/Heroku (backend)  
- Redis (optional) for job queue / rate limiting

# Architecture & data model

### High-level components
- Frontend (React) — UI, auth redirect, profile flow  
- Backend API — matchmaking, messaging, moderation  
- Database — persistent storage for users, matches, messages, logs  
- Worker / Scheduler — processes delayed deliveries

### Minimal DB schema (relational)
```sql
users (
  id UUID PRIMARY KEY,
  anon_id TEXT UNIQUE,           -- public identifier, not PII
  region TEXT,                   -- approximate (country/region)
  languages TEXT[],              -- preferred languages
  hobbies TEXT[],                -- short tags
  created_at TIMESTAMP
);

matches (
  id UUID PRIMARY KEY,
  user_a UUID REFERENCES users(id),
  user_b UUID REFERENCES users(id),
  matched_at TIMESTAMP,
  long_term BOOLEAN DEFAULT false
);

messages (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  sender_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP,
  delivery_time TIMESTAMP,       -- when message becomes visible to recipient
  delivered BOOLEAN DEFAULT false
);

moderation_logs (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  message_id UUID REFERENCES messages(id),
  reason TEXT,
  status TEXT,                   -- "pending", "reviewed", "actioned"
  created_at TIMESTAMP
);
