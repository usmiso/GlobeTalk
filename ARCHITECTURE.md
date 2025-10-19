# GlobeTalk – Project Layout

This is a quick map to help you find your way around. It’s intentionally short.

- server/
  - index.js – Express entrypoint. Wires up routers and (optionally) serves Swagger at /api-docs.
  - endpoints/ – Route handlers split by area: health, profile, matchmaking, chat, users, reports, stats.
  - openapi.json – Source for the Swagger UI, if present.

- src/app/
  - layout.js, page.js – Next.js App Router shell and landing page.
  - components/ – UI bits (nav, loading), auth helpers (AuthContext, ProtectedRoute/Layout, useAuthRedirect).
  - firebase/ – Client-side Firebase setup (config.js) and auth flows (auth.js).
  - pages/ – Feature pages (dashboard, inbox, explore, matchmaking, profile, etc.).

How things talk to each other:
- The frontend signs users in with Firebase Auth (client SDK) and renders pages.
- The backend uses Firebase Admin to store profiles, chats, matches, reports, and derived lists (languages/timezones).
- Frontend calls the backend under /api for profile edits, matchmaking, chat, moderation, and stats.

Notes:
- Most endpoints accept and return JSON; errors use { error: string }.
- For a large dataset, consider replacing in-memory scans (e.g., matchmaking) with Firestore queries on indexed fields.
- Swagger is optional; if the dependency is missing, the API still runs.