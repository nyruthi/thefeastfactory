<#
PowerShell script to set up local Postgres DB for the aranyam project.

What it does:
- Ensures you're in the repo root
- Optionally installs npm dependencies (run as repo root)
- Runs Prisma generate, migrate (or db:push), executes triggers SQL, and seeds the DB
- Optionally starts the API in dev mode

Usage: Open PowerShell in repo root and run:
  .\scripts\setup-db.ps1

You may run with -SkipInstall, -UseDbPush, or -StartApi switches.
#>

param(
    [switch]$SkipInstall,
    [switch]$UseDbPush,
    [switch]$StartApi
)

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

# 1) Check for repository root files
if (-not (Test-Path "package.json")) {
    Write-Err "package.json not found. Run the script from the repository root."
    exit 1
}

# 2) Confirm .env exists in apps/api
$envPath = "apps/api/.env"
if (-not (Test-Path $envPath)) {
    Write-Warn "$envPath not found. There's an example at apps/api/.env.example. Create apps/api/.env with DATABASE_URL before proceeding or press Enter to continue and you will be prompted later."
    Read-Host "Press Enter to continue or Ctrl+C to abort"
}

# 3) Optionally install dependencies
if (-not $SkipInstall) {
    Write-Info "Running npm install (this may take a while)..."
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed."; exit $LASTEXITCODE }
}
else { Write-Info "Skipping npm install" }

# 4) Prisma generate
Write-Info "Generating Prisma client for @aranyam/api"
npm run prisma:generate
if ($LASTEXITCODE -ne 0) { Write-Err "prisma generate failed."; exit $LASTEXITCODE }

# 5) Apply schema: migrate (default) or db:push if requested
if ($UseDbPush) {
    Write-Info "Applying schema with db:push (non-migratory)"
    npm run db:push
    if ($LASTEXITCODE -ne 0) { Write-Err "db:push failed."; exit $LASTEXITCODE }
} else {
    Write-Info "Applying schema with db:migrate (creates migrations locally)"
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) { Write-Err "db:migrate failed."; exit $LASTEXITCODE }
}

# 6) Run triggers SQL
Write-Info "Applying DB triggers (updated_at triggers)"
npm run db:triggers
if ($LASTEXITCODE -ne 0) { Write-Err "db:triggers failed."; exit $LASTEXITCODE }

# 7) Seed the DB
Write-Info "Seeding database"
npm run db:seed
if ($LASTEXITCODE -ne 0) { Write-Err "db:seed failed."; exit $LASTEXITCODE }

# 8) Optionally start API
if ($StartApi) {
    Write-Info "Starting API in dev mode (workspace)"
    npm run dev -w @aranyam/api
}

Write-Info "DB setup finished. Verify by connecting with psql or a GUI."
exit 0
