# GlobeTalk — Virtual Pen Pals 🌍✉️

**GlobeTalk** is a privacy-first, anonymous pen-pal platform that connects people around the world for friendly, cultural, asynchronous “letter” exchanges. It recreates the charm of postal pen pals using modern web tech: random matchmaking, delayed message delivery, short cultural profiles, and moderation — text-only and anonymous by design.

---

[![codecov](https://codecov.io/gh/usmiso/GlobeTalk/graph/badge.svg?token=WICVUUWN1D)](https://codecov.io/gh/usmiso/GlobeTalk)
![License](https://img.shields.io/badge/license-MIT-blue)

# Table of contents
1. [Quick summary](#quick-summary)
2. [Features](#features)  
3. [Tech stack](#tech-stack)  
4. [Architecture & data model](#architecture--data-model)  
5. [API endpoints](#api-endpoints)  
6. [Local setup & development](#local-setup--development)  
7. [Testing & CI](#testing--ci)  
8. [Sprint 1 deliverables](#sprint-1-deliverables-rubric-aligned)  
9. [Sprint 2 deliverables](#sprint-2-deliverables-rubric-aligned)  
10. [Sprint 3 deliverables](#sprint-3-deliverables-rubric-aligned)  
11. [Privacy, safety & moderation](#privacy-safety--moderation)  
12. [Contributing](#contributing)  
13. [Contact & support](#contact--support)  
14. [License](#license)

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
- **Settings & Safety** — block/report, toggle match preferences, delete account.

# Tech stack

**Frontend**
- Next.js - Modern UI Library with hooks and context
- Tailwind CSS  - Utility-first CSS framework
- React Query or Context API

**Backend**
- Next.js API routes  
- Firebase - Backend-as-a-Service Platform
    - **Firebase Auth** - Authentication service
    - **Firestore** - NoSQL document database

**Development Infrastructure**
- GitHub for version control  
- GitHub Actions for CI (test.yml)
    - Jest for unit testing
    - Codecov for Code Coverage
- Hosting: Netlify (One-click deployment)
- Secrets & Environment management: Github Secrets & Netlify Environment Variables
- Docs site: GitHub Pages (MkDocs)

# Architecture & data model

### High-level components
- Frontend (Next) — UI, auth redirect, profile flow  
- Backend API — matchmaking, messaging, moderation  
- Database — persistent storage for users, matches, messages, logs  
- Worker / Scheduler — processes delayed deliveries

### Minimal DB schema (relational)
```NoSQL
users
{
  "uid": "uid_abc123",
  "anonId": "G-42a7",          // public id shown to others
  "createdAt": "<Firestore Timestamp>",
  "lastSeenAt": "<Firestore Timestamp>",
  "authProvider": "google",    // for admin use
  "settings": {
    "receiveEmail": false
  }
}

profiles
{
  "anonId": "G-42a7",
  "ownerUid": "uid_abc123",    // internal link, not public PII
  "region": "South Africa",
  "languages": ["English","Zulu"],
  "hobbies": ["music","soccer"],
  "bio": "22-28 • interested in culture & language exchange",
  "createdAt": "<Firestore Timestamp>"
}

matches
{
  "id": "match_ab12",
  "userA": "uid_abc123",
  "userB": "uid_def456",
  "matchedAt": "<Firestore Timestamp>",
  "longTerm": false,
  "state": "active"   // e.g., active, archived
}

messages
{
  "id": "msg_x001",
  "senderId": "uid_abc123",
  "body": "Hello from South Africa! What are your local holidays like?",
  "createdAt": "<Firestore Timestamp>",
  "deliveryTime": "<Firestore Timestamp>",    // when message should become visible
  "delivered": false,
  "deliveredAt": null,
  "flagged": 0
}

moderation logs
{
  "id": "report_0001",
  "reporterId": "uid_xyz789",
  "messageRef": "/matches/match_ab12/messages/msg_x001",  // path reference
  "reason": "abusive language",
  "status": "pending",
  "createdAt": "<Firestore Timestamp>",
  "handledBy": null,
  "actionTaken": null
}
```
# API Endpoints

> See [docs/api.md](docs/api.md) for full request/response examples.

### Auth
- `GET /auth/oauth/login` — Redirect user to OAuth provider.
- `POST /auth/oauth/callback` — Exchange provider code for app JWT.

### Profiles
- `POST /profiles` — Create or update a profile.
- `GET /profiles/:anonId` — Retrieve a profile by public anon ID.

### Matchmaking
- `POST /match` — Request a new match (with optional filters).
- `GET /matches` — List active matches for the current user.

### Messaging
- `POST /messages` — Write a letter (delayed delivery).  
- `GET /messages/:matchId` — Get delivered messages for a match.

### Moderation
- `POST /moderation/report` — Report a message.  
- `GET /moderation/reports` — Moderator-only list of reports.  
- `POST /admin/moderation/:reportId/action` — Moderator resolves report.  
- `DELETE /users/:uid` — Delete user account (self or admin).

---

# Local Setup & Development

### Prerequisites
- Node.js 18+  
- npm / pnpm / yarn  
- Firebase project (Auth + Firestore enabled)  
- Netlify

### `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
FIREBASE_API_KEY=xxxx
FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
FIREBASE_PROJECT_ID=xxxx
FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=xxxx
FIREBASE_APP_ID=xxxx
```

### Install dependencies
```sh
npm install
```

### Run locally
```sh
npm run dev
```

### Build for production
```sh
npm run build
```

### Run tests
```sh
npm test
```

---

# Testing & CI

- **Jest** for unit and integration tests
- **Testing Library** for React component tests
- **GitHub Actions** for CI/CD
- **Codecov** for code coverage reporting

---

# Security audit (supply chain)

We ship a tiny audit that checks your dependency graph against known-compromised npm releases (from recent Debug/Chalk and Tinycolor campaigns). Reports are written under `security/`.

Run with Node (recommended):

```powershell
# root app
node scripts/security/scan-compromised.js security/compromised.json

# server package
Set-Location 'server'; node ../scripts/security/scan-compromised.js ../security/compromised.json; Set-Location '..'
```

Run with Python (alternative):

```powershell
# root app
python scripts/security/scan_compromised.py --root . --compromised security/compromised.json --out security/compromised-report-python.md

# server package
Set-Location 'server'; python ../scripts/security/scan_compromised.py --root . --compromised ../security/compromised.json --out security/compromised-report-python.md; Set-Location '..'
```

Outputs
- Root (Node): `security/compromised-report.md`
- Server (Node): `server/security/compromised-report.md`
- Root (Python): `security/compromised-report-python.md`
- Server (Python): `server/security/compromised-report-python.md`

To update the list of bad packages/versions, edit `security/compromised.json` and re-run the audit.

---

# Sprint 1 Deliverables (Rubric-aligned)
- [x] User authentication (email, Google OAuth)
- [x] Anonymous profile creation
- [x] Responsive UI (Next.js + Tailwind CSS)
- [x] Netlify deployment

---

# Sprint 2 Deliverables (Rubric-aligned)

Status: planning/implementation. This sprint focuses on matchmaking, richer profiles, edit flows, CI coverage, and a deployable backend on Railway.

- [ ] Matchmaking functionality
  - Acceptance: Users can request a match and optionally filter by language and/or time zone. Visible in UI (Matchmaking page) with loading/error states, and a “proceed to chat” handoff.
  - Backend: HTTP endpoint for match requests (e.g., `GET /api/match?timezone=&language=`) and data fetchers for languages/timezones.
  - Pointers:
    - Frontend components under `src/app/pages/matchmaking/`.
    - Backend service under `server/` (Express/Firebase Admin).

- [ ] Edit profile
  - Acceptance: An “Edit Profile” form that lets a signed-in user update profile fields and persists to backend.
  - Client validation and helpful error messages; success toast; disabled save while submitting.
  - Pointers: `src/app/pages/userprofile/` or `src/app/pages/profile/` and server endpoints under `server/`.

- [ ] More significant profile details
  - Acceptance: Store and render richer fields beyond MVP, e.g., `timezone`, `languages` (codes + names), `favorites`, `funFacts`, `sayings`, `country`, `username`, `avatarUrl`.

- [ ] Testing coverage ≥ 40%
  - Acceptance: `npm run test -- --coverage` shows overall lines coverage ≥ 40% in CI; critical flows (matchmaking and profile edit) have happy-path tests and at least one

- [ ] Functional backend server setup on Railway
  - Acceptance: Server starts on Railway and serves API endpoints (profiles, matchmaking, lookups). Health check route responds 200.
  - Suggested steps (high level):
    1) Create a Railway project and attach this repo’s `server/` folder as a service.
    2) Set environment variables (e.g., Firebase Admin creds, CORS origins) in Railway.
    3) Configure start command (e.g., `node index.js`) and a `PORT` binding.
    4) Verify via Railway deployment logs and `GET /health`.
  - Note: Keep secrets in Railway variables; do not commit them.
---

# Sprint 3 Deliverables (Rubric-aligned)

Focus: end-to-end messaging polish, moderation workflows, safety features, personal stats, and CI hardening.

- [ ] Asynchronous messaging & delivery engine
  - Acceptance: Letters remain locked until their delivery time; users see accurate unlock times even after refresh. Delivered messages are readable and appear in order. Back end either filters by deliveryTime or a lightweight scheduler flips a delivered flag.
  - Pointers:
    - Client: `src/app/pages/inbox/page.js` (deliveryTime, lock/unlock rendering)
    - Server: `server/index.js` (`POST /api/chat/send`, consider a cron/worker or time-based filtering)

- [ ] Inbox export & UX improvements
  - Acceptance: Users can download a single letter and the full chat transcript as PDF. Export includes timestamps and sender labels. Composer enforces max length and shows remaining characters.
  - Pointers: Implement `handleDownloadChatPDF` and validate with Jest by mocking jsPDF.

- [ ] Moderation dashboard & actions (admin)
  - Acceptance: Reports page lists incoming reports, shows severity tags, and allows validate/invalidate actions that persist status via API. Polling or on-demand refresh shows updates.
  - Pointers: UI `src/app/pages/reports/page.js`; API `POST /api/reports/:id/validate|invalidate`, `GET /api/reports`.

- [ ] Blocking & safety controls
  - Acceptance: A user can block another user. Blocked users won’t appear in matchmaking and cannot send new messages. Provide unblock controls.
  - Backend: `POST /api/block` (blockUid), `DELETE /api/block` (unblock), `GET /api/blocked` (list). Client filters matches and hides chats from blocked users.

- [ ] Account management (delete + data export)
  - Acceptance: User can request a data export (JSON download of profile, matches, and messages) and can delete their account. Deletion removes profile and chat references server-side.
  - Backend: `GET /api/export/:uid`, `DELETE /api/users/:uid`.

- [ ] Personal stats dashboard
  - Acceptance: A dashboard visualizes key metrics (total letters, active pen pals, countries connected, average response time, recent activity). Tests verify formatting and empty states.
  - Pointers: API `GET /api/stats`; UI under `src/app/pages/dashboard/`.

- [ ] Explore quiz finalized
  - Acceptance: Country quiz runs end-to-end with scoring and results summary, and the user can retake. Basic unit tests cover scoring logic.
  - Pointers: `src/app/pages/explore/page.js` and `src/app/pages/explore/data.js`.

- [ ] i18n/timezone data availability
  - Acceptance: Available languages/timezones endpoints return non-empty datasets in a fresh DB by seeding from `public/assets/`. UI fallbacks still work if DB is empty.
  - Backend seeding script or on-demand import on first request.

- [ ] CI/CD hardening and quality gates
  - Acceptance: Test coverage ≥ 60% enforced via Jest thresholds and Codecov status check. Supply-chain audit runs in CI using `scripts/security/scan-compromised.js` and fails on findings.
  - Extras: Basic Express rate limiting and CORS origin allow-list on the server.


---

# Privacy, Safety & Moderation

- No personal info shared between users
- All messages are text-only, no media
- Moderation tools for reporting/blocking
- Data stored securely in Firebase
- Users can delete their account at any time

---

# Contributing

1. Fork the repo and clone locally
2. Create a new branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to GitHub and open a Pull Request

See CONTRIBUTING.md for more details.

---

# Contact & Support

- Issues: [GitHub Issues](https://github.com/MakomaneTau/GlobeTalk/issues)
- Email: [pontshotau09@gmail.com](pontshotau097@gmail.com)

---

# License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.
