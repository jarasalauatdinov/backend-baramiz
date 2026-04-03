# Baramiz Backend

Baramiz is an AI-assisted tourism platform focused on Karakalpakstan. This backend is a demo-ready MVP built for fast frontend integration, predictable JSON APIs, and easy future reuse in an Expo mobile app.

The backend intentionally stays simple:

- Node.js + Express
- TypeScript
- Zod validation
- local JSON files for storage
- 4-language content model direction (`uz`, `ru`, `en`, `kaa`)
- deterministic route generation
- optional AI provider for chat and admin translation

Public discovery, service browsing, routes, and chat work without login. Basic auth endpoints are available for profile-ready features such as saved items and future booking flows.

## Why This MVP Is Intentionally Simple

This project is designed for competition speed and clarity, not enterprise scale. It avoids databases, auth complexity, background jobs, and heavy abstractions so the team can iterate quickly and keep the code beginner-readable.

## Main Product Areas

- Home support data
- Service tab content
- Routes / itineraries
- Saved and booking readiness
- Profile readiness

The new Service tab is backend-driven through sections and items. That makes it easy to grow later with more local utility content and tourism content without hardcoding the frontend.

## Folder Structure

```text
C:\Users\HP\Desktop\backend-Baramiz
?? .env.example
?? package.json
?? README.md
?? scripts
?  ?? npm-runner.cjs
?? src
   ?? app.ts
   ?? server.ts
   ?? config
   ?  ?? env.ts
   ?? constants
   ?  ?? tourism.constants.ts
   ?? controllers
   ?  ?? admin-places.controller.ts
   ?  ?? admin-translate.controller.ts
   ?  ?? auth.controller.ts
   ?  ?? categories.controller.ts
   ?  ?? chat.controller.ts
   ?  ?? events.controller.ts
   ?  ?? guides.controller.ts
   ?  ?? health.controller.ts
   ?  ?? places.controller.ts
   ?  ?? routes.controller.ts
   ?  ?? service.controller.ts
   ?  ?? services.controller.ts
   ?? data
   ?  ?? auth-sessions.json
   ?  ?? auth-users.json
   ?  ?? categories.json
   ?  ?? events.json
   ?  ?? guides.json
   ?  ?? places.json
   ?  ?? service-items.json
   ?  ?? service-sections.json
   ?? middleware
   ?  ?? error-handler.middleware.ts
   ?  ?? not-found.middleware.ts
   ?? routes
   ?  ?? admin-places.routes.ts
   ?  ?? admin-service.routes.ts
   ?  ?? admin-translate.routes.ts
   ?  ?? auth.routes.ts
   ?  ?? categories.routes.ts
   ?  ?? chat.routes.ts
   ?  ?? events.routes.ts
   ?  ?? guides.routes.ts
   ?  ?? health.routes.ts
   ?  ?? index.ts
   ?  ?? places.routes.ts
   ?  ?? routes.routes.ts
   ?  ?? service.routes.ts
   ?  ?? services.routes.ts
   ?? schemas
   ?  ?? admin-places.schema.ts
   ?  ?? admin-translate.schema.ts
   ?  ?? auth.schema.ts
   ?  ?? categories.schema.ts
   ?  ?? chat.schema.ts
   ?  ?? common.schema.ts
   ?  ?? places.schema.ts
   ?  ?? routes.schema.ts
   ?  ?? service.schema.ts
   ?  ?? tourism-data.schema.ts
   ?? services
   ?  ?? ai-provider.service.ts
   ?  ?? auth.service.ts
   ?  ?? categories.service.ts
   ?  ?? chat.service.ts
   ?  ?? events.service.ts
   ?  ?? guides.service.ts
   ?  ?? places.service.ts
   ?  ?? route-generator.service.ts
   ?  ?? services.service.ts
   ?  ?? translation.service.ts
   ?? types
   ?  ?? tourism.types.ts
   ?? utils
      ?? app-error.ts
      ?? async-handler.ts
      ?? json-storage.ts
      ?? route-helpers.ts
      ?? text-helpers.ts
      ?? url-helpers.ts
```
## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start the backend:

```bash
npm run dev
```

Default API base:

```text
http://localhost:3000/api
```

## Build And Start

```bash
npm run build
npm start
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5176
CORS_ALLOWED_ORIGINS=http://localhost:5176,http://10.95.4.27:5176,http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000
PROVIDER_API_KEY=
PROVIDER_MODEL=
PROVIDER_BASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

### Env Notes

- `PORT`: server port
- `FRONTEND_URL`: simple local frontend fallback origin
- `CORS_ALLOWED_ORIGINS`: comma-separated browser allowlist for Vite and LAN testing
- `PUBLIC_BASE_URL`: backend base URL used to resolve image URLs
- `AUTH_TOKEN_TTL_DAYS`: how long bearer sessions stay valid
- `PROVIDER_API_KEY`: preferred server-side AI provider key
- `PROVIDER_MODEL`: preferred server-side AI model
- `PROVIDER_BASE_URL`: optional OpenAI-compatible provider base URL
- `OPENAI_API_KEY`: fallback direct OpenAI key
- `OPENAI_MODEL`: fallback OpenAI model
- `OPENAI_BASE_URL`: optional OpenAI-compatible fallback base URL

## Response Shapes

Lists:

```json
{
  "items": []
}
```

## Multilingual Direction

The backend is now prepared around four language codes:

- `uz`
- `ru`
- `en`
- `kaa`

Where it is practical today, content models store text in this shape:

```json
{
  "uz": "...",
  "ru": "...",
  "en": "...",
  "kaa": "..."
}
```

Current state:

- `places` already return localized names and descriptions with `?language=...`
- `service sections` now store multilingual `title`, `shortDescription`, and `description`
- `service items` now store multilingual `title`, `shortDescription`, and `description`
- `routes` return localized `title`, `summary`, and localized stop reasons
- `categories` already support localized `name`

Future-ready but still needing content curation:

- many Service item descriptions currently reuse the same seed copy across languages
- admin CRUD already accepts multilingual payloads, but the admin UI still needs full translation editing workflows later

Single records:

```json
{
  "item": {}
}
```

Simple mutations:

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

## Service Tab Content Model

The Service tab is driven by two JSON stores:

- `src/data/service-sections.json`
- `src/data/service-items.json`

### Service Section Model

- `id`
- `slug`
- `title` as multilingual text
- `image`
- `order`
- `isActive`
- `shortDescription` as multilingual text
- `description` as multilingual text
- `icon`
- `type` (`discovery` or `utility`)

For the main Service hub, the frontend should treat `title` and `image` as the primary fields. Long descriptions are available for detail/admin flows, but the listing endpoint stays card-friendly.

### Service Item Model

- `id`
- `sectionSlug`
- `slug`
- `title` as multilingual text
- `shortDescription` as multilingual text
- `description` as multilingual text
- `image`
- `gallery`
- `address`
- `city`
- `phoneNumbers`
- `workingHours`
- `district`
- `mapLink`
- `emergencyNote`
- `serviceType`
- `coordinates`
- `tags`
- `featured`
- `isActive`
- `metadata`

This lets one simple system power:

- tourism discovery content
- hotels
- restaurants
- sightseeing
- local help
- taxi
- hospitals
- pharmacies
- ATMs

## Seeded Service Sections

The backend is seeded with these sections:

- `services`
- `history-and-culture`
- `nature`
- `museums-and-exhibitions`
- `restaurants`
- `sightseeing`
- `hotels`
- `taxi`
- `hospitals`
- `pharmacies`
- `atms`

## Seeded Example Service Items

Example seeded items include:

- `smart-route-concierge`
- `regional-transfer-desk`
- `mizdakhan-memorial-complex`
- `chilpik-dakhma`
- `ustyurt-plateau-viewpoint`
- `lower-amu-darya-outlook`
- `savitsky-museum`
- `state-museum-of-karakalpakstan`
- `nukus-market-lunch`
- `moynaq-fish-kitchen`
- `ayaz-kala`
- `topraq-kala`
- `jipek-joli-city-stay`
- `moynaq-route-guest-house`
- `nukus-city-taxi-1050`
- `regional-taxi-dispatch`
- `nukus-emergency-hospital`
- `dori-darmon-nukus-central`
- `ipoteka-bank-nukus-center`

## Public Endpoints

Core public endpoints:

- `GET /api/health`
- `GET /api/categories`
- `GET /api/places`
- `GET /api/places/:id`
- `GET /api/guides`
- `GET /api/services`
- `GET /api/events`
- `POST /api/routes/generate`
- `POST /api/chat`

### New Service Tab Endpoints

- `GET /api/service/sections`
- `GET /api/service/sections/:slug`
- `GET /api/service/sections/:slug/items`
- `GET /api/service/sections/:slug/items/:itemSlug`

Language-aware queries:

- `GET /api/categories?language=ru`
- `GET /api/places?language=kaa`
- `GET /api/service/sections?language=uz`
- `GET /api/service/sections/:slug?language=ru`
- `GET /api/service/sections/:slug/items?language=en`

### `GET /api/service/sections`

Optional query:

- `type=discovery|utility`
- `language=uz|ru|en|kaa`

Response:

```json
{
  "items": [
    {
      "id": "service-section-hotels",
      "slug": "hotels",
      "title": "Hotels",
      "image": "http://localhost:3000/assets/service/sections/hotels.svg",
      "order": 7,
      "isActive": true
    }
  ]
}
```

Optional fields such as `shortDescription`, `icon`, and `type` may also be present, but the mobile category grid should not depend on long descriptions.

### `GET /api/service/sections/:slug`

Response:

```json
{
  "item": {
    "id": "service-section-taxi",
    "slug": "taxi",
    "title": "Taxi",
    "shortDescription": "Local taxi and dispatch contacts for fast, practical movement.",
    "type": "utility",
    "isActive": true
  }
}
```

### `GET /api/service/sections/:slug/items`

Optional query:

- `city`
- `featured=true|false`
- `search`
- `language=uz|ru|en|kaa`

Response:

```json
{
  "items": [
    {
      "id": "service-item-nukus-city-taxi-1050",
      "sectionSlug": "taxi",
      "slug": "nukus-city-taxi-1050",
      "title": "Nukus city taxi 1050",
      "shortDescription": "A simple city taxi contact for local rides in Nukus.",
      "address": "Nukus city dispatch",
      "city": "Nukus",
      "phoneNumbers": ["1050", "+998 61 225 10 50"],
      "workingHours": "24/7",
      "serviceType": "taxi-dispatch",
      "featured": true,
      "isActive": true
    }
  ]
}
```

### `GET /api/service/sections/:slug/items/:itemSlug`

Response:

```json
{
  "item": {
    "id": "service-item-savitsky-museum",
    "sectionSlug": "museums-and-exhibitions",
    "slug": "savitsky-museum",
    "title": "Savitsky Museum",
    "shortDescription": "The best-known museum stop in Nukus.",
    "description": "A flagship museum in Nukus with one of the region's most memorable collections.",
    "image": "https://placehold.co/1200x800?text=Savitsky+Museum",
    "gallery": [],
    "address": "Nukus city center",
    "city": "Nukus",
    "phoneNumbers": ["+998 61 222 74 54"],
    "workingHours": "10:00-18:00",
    "district": "Nukus center",
    "mapLink": "https://maps.google.com/?q=42.4601,59.6168",
    "serviceType": "museum",
    "coordinates": {
      "lat": 42.4601,
      "lng": 59.6168
    },
    "tags": ["museum", "art", "culture"],
    "featured": true,
    "isActive": true,
    "metadata": {
      "recommendedVisitMinutes": 120
    }
  }
}
```

### `GET /api/services`

This is kept as a flatter compatibility endpoint. It returns all active Service items across active sections and supports:

- `city`
- `featured=true|false`
- `search`
- `language=uz|ru|en|kaa`

## Auth Endpoints

Auth is lightweight and bearer-token based. It is intended for profile and future saved/booking features, not for blocking the public tourism flow.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Auth Notes

- public discovery endpoints remain open without login
- auth uses `Authorization: Bearer <token>`
- no cookies are required, which keeps web and Expo/mobile integration simpler
- sessions are stored in local JSON files for MVP honesty

### Register Body

```json
{
  "name": "Amina",
  "email": "amina@example.com",
  "password": "secret123"
}
```

### Login Response

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

## Admin Endpoints

Existing admin endpoints:

- `GET /api/admin/places`
- `GET /api/admin/places/:id`
- `POST /api/admin/places`
- `PUT /api/admin/places/:id`
- `PATCH /api/admin/places/:id`
- `DELETE /api/admin/places/:id`
- `POST /api/admin/translate`

The public endpoints above remain open and do not require auth.

### New Admin Service Endpoints

- `GET /api/admin/service/sections`
- `POST /api/admin/service/sections`
- `PUT /api/admin/service/sections/:id`
- `DELETE /api/admin/service/sections/:id`
- `GET /api/admin/service/sections/:slug/items`
- `POST /api/admin/service/sections/:slug/items`
- `GET /api/admin/service/items/:id`
- `PUT /api/admin/service/items/:id`
- `DELETE /api/admin/service/items/:id`

### Admin Section Create / Update Body

```json
{
  "slug": "hospitals",
  "title": {
    "uz": "Shifoxonalar",
    "ru": "Больницы",
    "en": "Hospitals",
    "kaa": "Aurıwxanalar"
  },
  "image": "/assets/service/sections/hospitals.svg",
  "order": 9,
  "isActive": true,
  "shortDescription": {
    "uz": "Muhim tibbiy kontaktlar.",
    "ru": "Важные медицинские контакты.",
    "en": "Important medical contacts.",
    "kaa": "Mańızlı medicina baylanısları."
  },
  "description": {
    "uz": "Sayohatchilar uchun amaliy tibbiy yo'nalishlar.",
    "ru": "Практичные медицинские ориентиры для путешественников.",
    "en": "Practical medical guidance for travelers.",
    "kaa": "Sayaxatshılar ushın ámeliy medicina baǵdarları."
  },
  "icon": "hospital",
  "type": "utility"
}
```

### Admin Item Create / Update Body

```json
{
  "title": {
    "uz": "Nukus shahar taksi 1050",
    "ru": "Такси Нукус 1050",
    "en": "Nukus city taxi 1050",
    "kaa": "Nókis qala taksi 1050"
  },
  "shortDescription": {
    "uz": "Nukus ichidagi qatnovlar uchun oddiy taksi kontakti.",
    "ru": "Простой контакт такси для поездок по Нукусу.",
    "en": "A simple city taxi contact for local rides in Nukus.",
    "kaa": "Nókis ishindegi qatnawlar ushın ápiwayı taksi baylanısı."
  },
  "description": {
    "uz": "Tez shahar qatnovlari uchun amaliy taksi dispatch varianti.",
    "ru": "Практичный вариант диспетчерской службы для быстрых поездок по городу.",
    "en": "A practical taxi dispatch option for quick city rides.",
    "kaa": "Tez qala qatnawları ushın ámeliy taksi dispatch variantı."
  },
  "image": "https://placehold.co/1200x800?text=Nukus+Taxi",
  "gallery": [],
  "address": "Nukus city dispatch",
  "city": "Nukus",
  "phoneNumbers": ["1050", "+998 61 225 10 50"],
  "workingHours": "24/7",
  "district": "Nukus city",
  "mapLink": "https://maps.google.com/?q=42.4600,59.6150",
  "serviceType": "taxi-dispatch",
  "coordinates": {
    "lat": 42.46,
    "lng": 59.615
  },
  "tags": ["taxi", "city rides", "airport transfer"],
  "featured": true,
  "isActive": true,
  "metadata": {
    "paymentOptions": ["cash"],
    "serviceArea": "Nukus"
  }
}
```

## Frontend Integration Notes

- Use `GET /api/service/sections` to build the Service tab entry screen.
- Each service section card already includes the key mobile UI fields: `id`, `slug`, `title`, `image`, `order`, and `isActive`.
- Pass `language` in query strings when the client switches locale.
- Use `GET /api/service/sections/:slug/items` to load each section page.
- Use `GET /api/service/sections/:slug/items/:itemSlug` for detail screens.
- Use `GET /api/services` only as a helper or compatibility endpoint when a flat list is easier.
- All endpoints return JSON only.
- List responses use `{ "items": [...] }`.
- Detail responses use `{ "item": {...} }`.
- Mutation responses use `{ "message": "..." }` where appropriate.
- The Service content model is designed to grow over time with more sections and more items.
- Public endpoints do not require login.
- Only profile-oriented features should use `/api/auth/*`.

## Expo Integration Notes

- The API is framework-agnostic and works for Vite web and future Expo mobile.
- Use absolute backend API URLs in production and LAN URLs for local phone demos.
- `PUBLIC_BASE_URL` should be set so image URLs stay easy to render on mobile.
- Store the bearer token from `/api/auth/login` or `/api/auth/register` on the client only when the user signs in.
- Service item detail endpoints return enough data for mobile detail screens without requiring extra stitching.
- The utility sections like `taxi`, `hospitals`, `pharmacies`, and `atms` are shaped to work well in mobile cards and quick-action lists.

## Notes On AI

- Provider keys stay server-side only.
- `/api/chat` uses the provider when configured.
- If provider config is missing or the request fails, chat falls back to local tourism logic.
- `/api/admin/translate` is optional and returns a clean controlled error when provider config is missing.

## Sample cURL Commands

```bash
curl "http://localhost:3000/api/service/sections"
curl "http://localhost:3000/api/service/sections/taxi"
curl "http://localhost:3000/api/service/sections/taxi/items"
curl "http://localhost:3000/api/service/sections/museums-and-exhibitions/items/savitsky-museum"
curl "http://localhost:3000/api/services?city=Nukus"
curl "http://localhost:3000/api/admin/service/sections"
curl "http://localhost:3000/api/admin/service/sections/taxi/items"
```

## Current MVP Limits

- Storage is local JSON, so this is not concurrency-safe for heavy multi-user admin usage.
- Admin CRUD has no auth gate in this demo pass.
- Content is curated sample data for frontend development and jury demos.
- The Service model is deliberately simple and flexible rather than a full CMS.
- Booking and profile flows are not implemented yet, but the backend shape is ready to support them later.
