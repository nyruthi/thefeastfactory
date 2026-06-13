# Local PostgreSQL

Use local PostgreSQL for development.

## Install PostgreSQL

On macOS with Homebrew:

```bash
brew install postgresql@16
brew services start postgresql@16
```

If PostgreSQL is already installed, make sure the server is running.

## Create Database

```bash
createdb aranyam
```

The default local connection string is:

```text
postgresql://postgres:postgres@localhost:5432/aranyam?schema=public
```

If your local PostgreSQL user or password differs, update `DATABASE_URL` in `apps/api/.env`.

## Apply Schema

```bash
npm run db:push
npm run db:triggers
npm run db:seed
```

The trigger step installs database-owned `updated_at` timestamp triggers. The seed creates platform settings, starter admin user, and menu categories.

Starter admin:

```text
Email: admin@aranyam.local
Password: Admin@12345
```
