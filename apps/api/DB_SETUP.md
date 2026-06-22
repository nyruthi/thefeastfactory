Local DB setup steps for @aranyam/api

1) Create a Postgres database and user (PowerShell)

# Run PowerShell as Administrator or a user that can access the postgres service.
# Adjust username/password/dbname as needed.

# Create user
psql -U postgres -c "CREATE USER aranyam WITH PASSWORD 'AranyamPass1';"
# Create database
psql -U postgres -c "CREATE DATABASE aranyam_dev OWNER aranyam;"
# Grant privileges (optional if owner set above)
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE aranyam_dev TO aranyam;"

2) Save connection string
- Example DATABASE_URL (put in `apps/api/.env` or export in PowerShell):
  postgresql://aranyam:AranyamPass1@localhost:5432/aranyam_dev?schema=public

3) Install dependencies (from repo root)
# npm is the workspace package manager in this repo
npm install

4) Generate Prisma client and apply schema
# From repo root, these run the scripts in the @aranyam/api package
npm run prisma:generate
npm run db:migrate
# or if you prefer not to create migrations:
npm run db:push

5) Run SQL triggers (optional but recommended)
npm run db:triggers

6) Seed the DB
npm run db:seed

7) Verify
- Connect with psql: psql "postgresql://aranyam:AranyamPass1@localhost:5432/aranyam_dev"
- Or use a GUI such as pgAdmin or TablePlus to inspect tables.
- Start the API in dev mode: npm run dev -w @aranyam/api
