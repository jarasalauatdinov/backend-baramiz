# Baramiz AI Backend

Lightweight MVP backend for a tourism platform focused on Karakalpakstan. The project stays simple on purpose: Node.js, Express, TypeScript, Zod, local JSON files, deterministic route generation, and optional server-side AI support for chat and translation.

## Features

- `GET /api/health`
- `GET /api/categories`
- `GET /api/places`
- `GET /api/places/:id`
- `POST /api/routes/generate`
- `POST /api/chat`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/places`
- `POST /api/admin/places`
- `PUT /api/admin/places/:id`
- `DELETE /api/admin/places/:id`
- `POST /api/admin/translate`

## Tech Stack

- Node.js
- Express
- TypeScript
- Zod
- dotenv
- local JSON files
- optional OpenAI or OpenAI-compatible provider integration

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

Default URL: `http://localhost:3000`

## Build And Run

```bash
npm run build
npm start
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5176
CORS_ALLOWED_ORIGINS=http://localhost:5176,http://localhost:5173,https://your-site.netlify.app
PUBLIC_BASE_URL=http://localhost:3000
PROVIDER_API_KEY=
PROVIDER_MODEL=
PROVIDER_BASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
AUTH_TOKEN_TTL_DAYS=30
```

- `PORT`: server port
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend allowlist
- `PUBLIC_BASE_URL`: backend public URL used for relative asset paths
- `PROVIDER_API_KEY`: optional preferred server-side API key for an OpenAI-compatible provider
- `PROVIDER_MODEL`: optional preferred model name for that provider
- `PROVIDER_BASE_URL`: optional base URL for OpenAI-compatible APIs
- `OPENAI_API_KEY`: fallback server-side API key for direct OpenAI usage
- `OPENAI_MODEL`: fallback model override when `PROVIDER_MODEL` is not set
- `OPENAI_BASE_URL`: optional fallback base URL for OpenAI-compatible OpenAI SDK usage
- `AUTH_TOKEN_TTL_DAYS`: session token TTL in days (default 30)

Provider precedence:

1. `PROVIDER_API_KEY`
2. `OPENAI_API_KEY`

The backend never exposes these values to the frontend. Chat and translation are always called server-side.

## API Notes

- Success responses stay plain JSON.
- Validation and controlled errors return:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "path": "fieldName",
      "message": "Problem description"
    }
  ]
}
```

- `GET /api/places` supports:
  - `city`
  - `category`
  - `featured`
  - `language` (`uz`, `en`, `ru`) as an optional output-language switch for `name` and `description`

- `GET /api/places/:id` also supports optional `language`

- `POST /api/routes/generate` stays deterministic:
  - city-first ranking
  - practical stop selection
  - distance-aware fallback only when it still makes sense for the trip length

- `POST /api/chat`:
  - uses the configured AI provider only when server-side env vars are present
  - supports direct OpenAI or an OpenAI-compatible base URL
  - falls back to local tourism logic if provider config is missing or provider requests fail
  - stays short and scoped to Karakalpakstan tourism

- `POST /api/admin/translate`:
  - uses the same optional server-side provider configuration
  - returns a clean error if translation is not configured or provider requests fail

- `POST /api/auth/register`:
  - body: `{ "name": string, "email": string, "password": string }`
  - response: `{ "user": { id, name, email, createdAt }, "token": string, "expiresAt": string }`

- `POST /api/auth/login`:
  - body: `{ "email": string, "password": string }`
  - response: `{ "user": { id, name, email, createdAt }, "token": string, "expiresAt": string }`

- `GET /api/auth/me`:
  - requires `Authorization: Bearer <token>`
  - response: `{ "user": { id, name, email, createdAt } }`

- `POST /api/auth/logout`:
  - requires `Authorization: Bearer <token>`
  - response: `{ "message": "Logged out" }`

## Static Assets

- `GET /assets/*` maps to `public/assets/*`

If a place uses a relative image path such as `/assets/places/example.jpg`, the backend can expose it as an absolute URL through `PUBLIC_BASE_URL`.

## Quick Checks

```bash
curl "http://localhost:3000/api/health"
curl "http://localhost:3000/api/places?city=Nukus&language=en"
curl -X POST "http://localhost:3000/api/routes/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Nukus",
    "duration": "1_day",
    "interests": ["history", "culture"],
    "language": "en"
  }'
```

## MVP Scope

- No database
- Token-based traveler authentication for protected actions and profile access
- No payments
- No Docker requirement
- No enterprise-style abstractions

The goal is a clean, demo-practical backend that is easy to understand and easy to extend later.

## Safe Local Development

- Put provider keys only in `.env`, never in frontend code.
- If no provider key is configured, `/api/chat` still works through local fallback responses.
- If provider chat requests fail at runtime, `/api/chat` degrades to fallback instead of crashing the API.
- If translation is not configured, admin users can still save manual `ru` and `en` content.

## Auth Notes

- Auth is optional at app startup. Only protected actions should require it.
- Tokens are stored in `src/data/sessions.json` for the MVP.
- Use the `Authorization: Bearer <token>` header from the frontend for protected calls.
- This is file-based and not intended for production scale.
