# Baramiz Backend

Baramiz is an AI-assisted tourism backend for Karakalpakstan. This repository is intentionally a small MVP built for fast frontend integration and later Expo/mobile reuse.

Core stack:

- Node.js + Express
- TypeScript
- Zod validation
- local JSON storage
- deterministic route generation
- optional AI provider for chat and admin translation
- lightweight bearer-token auth for profile-ready flows

The goal is contract clarity and demo stability, not enterprise complexity.

## Day 1 Contract Freeze

These are the backend contracts the current frontend can rely on right now:

- `GET /api/service/sections` for the image-first Service grid
- `GET /api/service/sections/:slug/items` for Service section item lists
- `GET /api/service/sections/:slug/items/:itemSlug` for Service item detail screens
- `GET /api/places` and `GET /api/places/:id` for discovery content
- `POST /api/routes/generate` with `city` and `language`, while `interests` and `duration` stay optional
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` for profile-ready flows

Public discovery does not require login.

## Public vs Auth-Protected Thinking

Public and open now:

- health
- categories
- places
- guides
- services
- events
- service sections and items
- route generation
- chat

Auth exists only for:

- profile-ready flows
- saved items later
- booking-related user data later

Auth does not block discovery, Service browsing, routes, or chat.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

PowerShell:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Local API base:

```text
http://localhost:3000/api
```

Build and start:

```bash
npm.cmd run build
npm start
```

## Environment Variables

Example `.env`:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5176
CORS_ALLOWED_ORIGINS=http://localhost:5176,http://10.95.4.27:5176,http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000
AUTH_TOKEN_TTL_DAYS=30
PROVIDER_API_KEY=
PROVIDER_MODEL=
PROVIDER_BASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

Notes:

- `PUBLIC_BASE_URL` helps turn image paths into client-usable URLs.
- `AUTH_TOKEN_TTL_DAYS` controls bearer session lifetime.
- AI keys stay server-side only.

## Response Shapes

List endpoints:

```json
{
  "items": []
}
```

Single record endpoints:

```json
{
  "item": {}
}
```

Simple success mutations:

```json
{
  "message": "Updated successfully"
}
```

Validation errors:

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

## Folder Structure

```text
C:\Users\HP\Desktop\backend-Baramiz
|- .env.example
|- package.json
|- README.md
|- scripts
|  \- npm-runner.cjs
\- src
   |- app.ts
   |- server.ts
   |- config
   |  \- env.ts
   |- constants
   |  \- tourism.constants.ts
   |- controllers
   |  |- auth.controller.ts
   |  |- categories.controller.ts
   |  |- chat.controller.ts
   |  |- places.controller.ts
   |  |- routes.controller.ts
   |  |- service.controller.ts
   |  \- other active admin/content controllers
   |- data
   |  |- auth-sessions.json
   |  |- auth-users.json
   |  |- places.json
   |  |- service-items.json
   |  \- service-sections.json
   |- routes
   |  |- auth.routes.ts
   |  |- places.routes.ts
   |  |- routes.routes.ts
   |  |- service.routes.ts
   |  \- index.ts
   |- schemas
   |  |- auth.schema.ts
   |  |- places.schema.ts
   |  |- routes.schema.ts
   |  |- service.schema.ts
   |  \- tourism-data.schema.ts
   |- services
   |  |- auth.service.ts
   |  |- chat.service.ts
   |  |- places.service.ts
   |  |- route-generator.service.ts
   |  \- services.service.ts
   |- types
   |  \- tourism.types.ts
   \- utils
      |- app-error.ts
      |- async-handler.ts
      |- json-storage.ts
      |- text-helpers.ts
      \- url-helpers.ts
```

## Language Support

The backend is prepared for 4-language content:

- `uz`
- `ru`
- `en`
- `kaa`

Current localized output support:

- `GET /api/categories?language=...`
- `GET /api/places?language=...`
- `GET /api/places/:id?language=...`
- `GET /api/service/sections?language=...`
- `GET /api/service/sections/:slug?language=...`
- `GET /api/service/sections/:slug/items?language=...`
- `GET /api/service/sections/:slug/items/:itemSlug?language=...`
- `GET /api/services?language=...`
- `POST /api/routes/generate` via request body `language`
- `POST /api/chat` via request body `language`

Active localized endpoints also accept language from headers:

- `X-Language: uz|ru|en|kaa`
- `X-Lang: uz|ru|en|kaa`
- `Accept-Language: uz`, `ru`, `en`, or `kaa`

Resolution order is:

1. explicit `language` query or request body field
2. `X-Language`
3. `X-Lang`
4. `Accept-Language`
5. default `en`

Current model direction:

- places already store multilingual names and descriptions
- service sections store multilingual `title`, `shortDescription`, and `description`
- service items store multilingual `title`, `shortDescription`, and `description`
- route responses localize `title`, `summary`, and stop reasons

Current fallback behavior is intentionally predictable:

- categories resolve `name` using requested language, then `uz`, then `en`
- service section cards always localize `title`
- service section optional text is omitted if that text is not meaningfully localized yet
- service items and places fall back to one consistent content language instead of mixing title in one language and description in another
- for places and service items, the consistent content fallback is:
  - requested language when meaningfully translated
  - otherwise `uz` when meaningfully translated
  - otherwise `en`
- route output uses the requested language for `title`, `summary`, and stop reasons
- service section and category Russian labels are curated for stable localized headers in demo paths

The structure is ready. Some service seed copy still needs real human translation later, but the API now avoids mixed-language payloads more carefully.

## Stable Public Endpoints

These are the active frontend-safe endpoints:

- `GET /api/health`
- `GET /api/categories`
- `GET /api/places`
- `GET /api/places/:id`
- `GET /api/guides`
- `GET /api/services`
- `GET /api/events`
- `GET /api/service/sections`
- `GET /api/service/sections/:slug`
- `GET /api/service/sections/:slug/items`
- `GET /api/service/sections/:slug/items/:itemSlug`
- `POST /api/routes/generate`
- `POST /api/chat`

Practical note:

- `GET /api/places/:id` accepts either the stable place `id` or the place `slug`

## Live Demo Notes

Recommended demo-safe frontend flow:

1. load `GET /api/service/sections`
2. open one section with `GET /api/service/sections/:slug/items`
3. open one place with `GET /api/places/:id`
4. generate a route with `POST /api/routes/generate`
5. use auth only for Profile-ready flows

For the judge demo, the strongest backend-backed paths are:

- Service tab grid via `GET /api/service/sections`
- Service item detail via `GET /api/service/sections/:slug/items/:itemSlug`
- Places list and place detail via `GET /api/places` and `GET /api/places/:id`
- Route generation via `POST /api/routes/generate`

Practical demo advice:

- prefer registering a fresh demo user instead of depending on old seeded auth data
- public discovery, Service browsing, and routes work without login
- if a stored token fails on `/api/auth/me`, clear it locally and continue as guest
- logout is safe as a cleanup call even if the session already expired
- nearby utility demos look strongest on `pharmacies`, `hospitals`, and `atms`

## Service Contract Guarantees

### `GET /api/service/sections`

This is the stable Service tab grid contract.

Guaranteed fields on every item:

- `id`
- `slug`
- `title`
- `image`
- `order`
- `isActive`

Optional enhancement fields:

- `shortDescription`
- `description`
- `icon`
- `type`

If optional descriptive text is not properly localized yet, it may be omitted instead of mixing languages inside one card payload.

Example:

```json
{
  "items": [
    {
      "id": "service-section-hotels",
      "slug": "hotels",
      "title": "Hotels",
      "image": "http://localhost:3000/assets/service/sections/hotels.svg",
      "order": 7,
      "isActive": true,
      "shortDescription": "Places to stay in Nukus and key route towns.",
      "description": "Accommodation options for travelers who need a reliable city base or route stop.",
      "icon": "hotel",
      "type": "discovery"
    }
  ]
}
```

This listing is intentionally image-first and card-friendly. Long descriptions are not required for the main grid.

Localized output notes:

- `title` is always a resolved string
- `shortDescription` and `description` are resolved strings when the selected language has meaningful content
- if optional descriptive text is not localized yet, it may be omitted instead of falling back field-by-field into mixed languages

### `GET /api/service/sections/:slug`

Returns one localized section record for section detail pages.

### `GET /api/service/sections/:slug/items`

Supports:

- `city`
- `featured=true|false`
- `search`
- `lat`
- `lng`
- `radiusKm`
- `language=uz|ru|en|kaa`

Nearby behavior:

- if `lat` and `lng` are provided, items are sorted nearest first
- if `radiusKm` is also provided, only items within that radius are returned
- `distanceKm` is included on each returned item when location is provided
- `distanceText` is included together with `distanceKm`
- in nearby mode, utility-first sections like `pharmacies`, `hospitals`, `atms`, and `taxi` return only items with coordinates
- utility items need valid `coordinates` in the JSON data to participate in nearby search

Example:

```text
GET /api/service/sections/pharmacies/items?lat=42.46&lng=59.61&radiusKm=5&language=en
```

Example response:

```json
{
  "items": [
    {
      "id": "service-item-dori-darmon-nukus-central",
      "sectionSlug": "pharmacies",
      "slug": "dori-darmon-nukus-central",
      "title": "Dori-Darmon Nukus Central",
      "shortDescription": "A central pharmacy option for everyday travel needs.",
      "address": "Central Nukus",
      "city": "Nukus",
      "phoneNumbers": ["+998 61 222 88 44"],
      "workingHours": "08:00-23:00",
      "mapLink": "https://maps.google.com/?q=42.4590,59.6125",
      "telegram": "https://t.me/doridarmon_nukus",
      "website": "https://doridarmon.uz",
      "instagram": "https://instagram.com/doridarmon_nukus",
      "coordinates": {
        "lat": 42.459,
        "lng": 59.6125
      },
      "distanceKm": 0.3,
      "distanceText": "300 m",
      "serviceType": "pharmacy",
      "featured": true,
      "isActive": true,
      "metadata": {
        "openLate": true
      }
    }
  ]
}
```

### `GET /api/service/sections/:slug/items/:itemSlug`

Returns one localized item with enough data for a mobile detail screen.

Localized output notes:

- `title`, `shortDescription`, and `description` are returned as resolved strings
- the backend avoids mixing languages inside one item payload by using one consistent content language per item
- `metadata` stays raw and language-agnostic
- utility item detail may include `phoneNumbers`, `workingHours`, `mapLink`, `coordinates`, `instagram`, `telegram`, and `website`

Current practical use:

- `pharmacies`, `hospitals`, and `atms` are the first utility categories ready for nearby search
- the same query pattern can be reused later for `taxi`, `hotels`, `restaurants`, and similar location-based sections

### `GET /api/services`

This is a flat helper endpoint across active service items. It stays available for convenience and compatibility.

## Route Generator Contract

### `POST /api/routes/generate`

The frontend can send this minimal body:

```json
{
  "city": "Nukus",
  "language": "en"
}
```

`interests` and `duration` are still supported, but both are optional.

`language` can also come from `X-Language`, `X-Lang`, or `Accept-Language` if the frontend prefers a header-driven request flow.

If `duration` is omitted, the backend defaults to:

- `half_day`

If `interests` is omitted or an empty array, the backend derives a sensible city-first route mix instead of failing the request.

Supported durations when explicit control is needed:

- `3_hours`
- `half_day`
- `1_day`

Response shape:

```json
{
  "item": {
    "city": "Nukus",
    "language": "en",
    "duration": "half_day",
    "title": "Nukus half-day itinerary",
    "summary": "3 stops starting at 09:00 and ending around 13:40.",
    "totalDurationMinutes": 280,
    "stops": [
      {
        "id": "savitsky-museum",
        "order": 1,
        "name": "Savitsky Museum",
        "city": "Nukus",
        "category": "museum",
        "description": "Savitsky Museum matches your museum interest and fits naturally inside Nukus.",
        "estimatedDurationMinutes": 120,
        "image": "http://localhost:3000/assets/..."
      }
    ]
  }
}
```

Each stop is intentionally compact and frontend-friendly:

- `id`
- `order`
- `name`
- `city`
- `category`
- `description`
- `estimatedDurationMinutes`
- `image`

Frontend UX note:

- the UI no longer needs to expose duration
- the backend chooses a safe default when duration is hidden
- if the UI later brings duration back, the endpoint already supports it

Day 1 frontend rule:

- send `city` and `language`
- optionally send `interests`
- let the backend default `duration` unless the product explicitly needs a different trip length

If the frontend uses a global language header already, it can omit `language` from the route body and let the backend resolve it from headers.

## Auth Endpoints

Auth is lightweight and optional for the public product flow.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Auth uses:

- bearer token in `Authorization: Bearer <token>`
- local JSON storage for users and sessions
- no cookies
- no impact on public discovery routes
- `AUTH_TOKEN_TTL_DAYS` controls how long a session token stays valid
- `GET /api/auth/me` is the session-restore check for the frontend
- `POST /api/auth/logout` is safe to call during client cleanup, even if the session already expired

Register body:

```json
{
  "name": "Amina",
  "email": "amina@example.com",
  "password": "secret123"
}
```

Login or register response:

```json
{
  "item": {
    "user": {
      "id": "user-id",
      "name": "Amina",
      "email": "amina@example.com",
      "createdAt": "2026-04-03T09:00:00.000Z"
    },
    "token": "opaque-session-token",
    "expiresAt": "2026-05-03T09:00:00.000Z"
  }
}
```

`GET /api/auth/me` response:

```json
{
  "item": {
    "user": {
      "id": "user-id",
      "name": "Amina",
      "email": "amina@example.com",
      "createdAt": "2026-04-03T09:00:00.000Z"
    }
  }
}
```

`POST /api/auth/logout` request:

```http
Authorization: Bearer opaque-session-token
```

`POST /api/auth/logout` response:

```json
{
  "message": "Logged out"
}
```

Validation and auth error examples:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "path": "email",
      "message": "Enter a valid email"
    }
  ]
}
```

```json
{
  "message": "Invalid email or password"
}
```

```json
{
  "message": "Session expired or invalid"
}
```

Frontend auth notes:

- keep the token on the client after register or login
- send `Authorization: Bearer <token>` to `/api/auth/me` and `/api/auth/logout`
- do not require auth for categories, places, service browsing, routes, or chat
- use auth only when the user enters profile, saved, or booking-ready flows
- if the token expires, the frontend can clear local auth state and ask the user to sign in again
- if a token exists on app start, call `/api/auth/me` to restore the signed-in state
- if `/api/auth/me` returns `401`, treat the client as signed out and clear the stored token
- `logout` can be used as a best-effort cleanup call before clearing local auth state

What Profile can realistically show now:

- user `id`
- `name`
- `email`
- `createdAt`

What Saved / Booking can realistically do now:

- show guest messaging when there is no valid session
- show signed-in messaging when `/api/auth/me` succeeds
- prepare UI flows that require login before future saved or booking persistence exists
- not persist favorites or bookings yet on the backend

Current MVP auth limits:

- no OAuth
- no refresh tokens
- no password reset flow
- no role system
- session storage is local JSON, which is fine for demo use but not for production scale

Public discovery stays open even if the user never signs in.

## Public vs Future-Ready

Public and actively usable now:

- categories
- places
- service sections and items
- guides
- services
- events
- route generation
- chat
- auth basics

Future-ready but not fully built yet:

- saved items
- booking data attached to users
- admin UI for multilingual editing
- richer human-curated translations for all service records

## Frontend Integration Notes

- Use `GET /api/service/sections` for the Service hub grid.
- Use `GET /api/service/sections/:slug/items` for section screens.
- Use `GET /api/service/sections/:slug/items/:itemSlug` for detail screens.
- Use `GET /api/places` and `GET /api/places/:id` for discovery content.
- Use `POST /api/routes/generate` with only `city` and `language` if the UI hides duration and interests.
- Prefer one shared frontend locale source. Either:
  - pass `language` in query/body explicitly
  - or send `X-Language` consistently from the client
- Keep all requests JSON-based.
- Do not require auth for discovery, service browsing, routes, or chat.
- Only use auth when the user enters profile or saved/booking-oriented flows.

Useful Day 2 examples:

```text
GET /api/service/sections?language=uz
GET /api/service/sections/hotels/items?language=ru
GET /api/places?city=Nukus&language=en
GET /api/categories with X-Language: kaa
```

Minimal route body:

```json
{
  "city": "Nukus",
  "interests": ["history", "culture"],
  "language": "en"
}
```

Day 3 stability notes:

- service section images are backed by local assets, so the Service grid does not depend on third-party placeholder hosts
- service item placeholder images fall back to stable local section assets
- unstable place card images fall back to stable local section assets
- place and service responses avoid `null` optional fields in public JSON
- active localized endpoints now support both query/body language and header-driven language resolution

## Expo Integration Notes

- Use LAN or production API URLs, not browser-only assumptions.
- `PUBLIC_BASE_URL` should be set so image fields are easy to render on mobile.
- Bearer auth is mobile-friendly because it does not depend on cookies.
- Service and place detail endpoints already return enough data for standalone mobile screens.

## AI Notes

- Provider keys stay on the server only.
- `/api/chat` uses AI when configured.
- If provider config is missing or fails, chat falls back to local tourism logic.
- `/api/admin/translate` stays optional and returns a controlled error when the provider is not configured.

## Current MVP Limits

- local JSON storage is not concurrency-safe for heavy multi-admin usage
- admin endpoints are still open in this demo pass
- multilingual structure is ready, but some non-English service copy still needs real editorial improvement
- auth is intentionally basic and not production-grade
