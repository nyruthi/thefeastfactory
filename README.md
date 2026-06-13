# Aranyam Catering Platform

Phase 1 base project for the catering and event ordering platform.

## Apps

- `apps/api`: NestJS API with Prisma and PostgreSQL
- `apps/customer-web`: Next.js customer web app
- `apps/admin-web`: Next.js admin web app

## Packages

- `packages/shared-types`: shared TypeScript types
- `packages/validation`: shared Zod schemas
- `packages/api-client`: typed fetch client helpers
- `packages/design-tokens`: shared design tokens

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env files:

```bash
cp .env.example apps/api/.env
cp .env.example apps/customer-web/.env.local
cp .env.example apps/admin-web/.env.local
```

3. Create local PostgreSQL database:

```bash
createdb aranyam
```

4. Push the Prisma schema and seed starter data:

```bash
npm run db:push
npm run db:triggers
npm run db:seed
```

5. Run the apps:

```bash
npm run dev:api
npm run dev:customer
npm run dev:admin
```

Default local URLs:

- API: `http://localhost:4000`
- API docs: `http://localhost:4000/docs`
- Customer web: `http://localhost:3000`
- Admin web: `http://localhost:3001`

## External Integration Setup

See [docs/integrations.md](docs/integrations.md) for the keys and dashboard steps needed for MSG91, Razorpay, Resend, Google Cloud Storage, and Sentry.

## Postman

Import [docs/postman/aranyam-api.postman_collection.json](docs/postman/aranyam-api.postman_collection.json) to test the currently implemented health, auth, profile, and address APIs.
