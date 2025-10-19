# GlobeTalk Backend (Express + Firebase Admin)

This service powers the API for GlobeTalk. It uses Firebase Admin for auth and Firestore access.

## Run locally

1. Install deps

```powershell
npm install
```

2. Provide credentials via ONE of the following:
- Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON string of a service account
- Or set split env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  - If using Windows/CI, ensure the private key has escaped newlines (\n). The server converts `\n` to real newlines at runtime.
- Or place a file `server/serviceAccountKey.json` for local development only

You can copy `.env.example` to `.env` and fill the values:

```powershell
Copy-Item .env.example .env
```

3. Start the server

```powershell
# default port 5000; set PORT to override
$env:PORT = 8080; npm start
```

## Environment variables

- PORT: HTTP port (default 5000)
- FIREBASE_SERVICE_ACCOUNT_JSON: Full JSON string for service account
- FIREBASE_PROJECT_ID: Firebase project id
- FIREBASE_CLIENT_EMAIL: Service account client email
- FIREBASE_PRIVATE_KEY: Private key (with \n escapes)
- ENABLE_CRON_IN_TESTS=1: Opt‑in to run cron during tests

## Container/Production notes

- Ensure one of the Firebase credential methods above is provided. If none is provided, the server will still boot but Firestore endpoints will return 500 with `Firestore not initialized`.
- `dotenv` is included and loaded when available. In containers where `.env` isn’t used, it is safe to omit.
- Expose the desired port with `PORT`. Platforms like Render/Heroku often inject it automatically.

## API docs

If `openapi.json` is present, Swagger UI will be available at `/api-docs`.

## Health checks

- `/api/health` (router)
- `/api/health/firebase` returns `{ adminInitialized, firestoreInitialized }`