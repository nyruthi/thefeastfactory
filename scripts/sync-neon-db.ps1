# sync-neon-db.ps1
# Syncs local aranyam DB → Neon production DB
# Usage: .\scripts\sync-neon-db.ps1 -NeonUrl "postgresql://..."

param(
    [Parameter(Mandatory=$true)]
    [string]$NeonUrl,

    [Parameter(Mandatory=$false)]
    [string]$LocalDb = "aranyam",

    [Parameter(Mandatory=$false)]
    [string]$LocalUser = "postgres",

    [Parameter(Mandatory=$false)]
    [string]$DumpFile = "$env:TEMP\tff_sync_data.sql",

    [Parameter(Mandatory=$false)]
    [switch]$SkipSchema,

    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

$PSQL = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$PGDUMP = 'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe'

function Run-Neon($sql) {
    & $PSQL $NeonUrl -c $sql 2>&1
}

Write-Host "=== TFF Neon DB Sync ===" -ForegroundColor Cyan
Write-Host "Local DB : $LocalDb"
Write-Host "Neon URL : $($NeonUrl.Substring(0, [Math]::Min(50, $NeonUrl.Length)))..."
Write-Host ""

# ── Step 1: Check / migrate schema ──────────────────────────────────────────
if (-not $SkipSchema) {
    Write-Host "[1/4] Checking Neon schema..." -ForegroundColor Yellow
    $cols = Run-Neon "SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name IN ('box_price','base_price');"
    $needsMigration = ($cols -join "") -match "base_price"

    if ($needsMigration) {
        Write-Host "      Schema is OLD (has base_price). Running migration..." -ForegroundColor Yellow
        if (-not $DryRun) {
            Run-Neon @"
ALTER TABLE public.menu_items RENAME COLUMN base_price TO box_price;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS general_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.package_menu_items ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'INCLUDED';
ALTER TABLE public.package_menu_items ADD COLUMN IF NOT EXISTS is_swappable BOOLEAN DEFAULT false;
ALTER TABLE public.package_menu_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'FIXED_PACKAGE';
ALTER TABLE public.packages DROP COLUMN IF EXISTS is_custom;
"@
        }
        Write-Host "      Schema migrated." -ForegroundColor Green
    } else {
        Write-Host "      Schema OK (has box_price)." -ForegroundColor Green
    }
} else {
    Write-Host "[1/4] Schema check skipped." -ForegroundColor Gray
}

# ── Step 2: Clear Neon data ──────────────────────────────────────────────────
Write-Host "[2/4] Clearing Neon menu/package data..." -ForegroundColor Yellow
if (-not $DryRun) {
    Run-Neon "TRUNCATE public.package_menu_items, public.package_versions, public.packages, public.menu_items, public.menu_categories CASCADE;"
}
Write-Host "      Cleared." -ForegroundColor Green

# ── Step 3: Dump local data ──────────────────────────────────────────────────
Write-Host "[3/4] Dumping local data to $DumpFile..." -ForegroundColor Yellow
if (-not $DryRun) {
    & $PGDUMP -U $LocalUser -d $LocalDb `
        --data-only --inserts `
        --table=menu_categories `
        --table=menu_items `
        --table=packages `
        --table=package_versions `
        --table=package_menu_items `
        --no-acl --no-owner `
        -f $DumpFile
    $size = (Get-Item $DumpFile).Length
    Write-Host "      Dumped ($size bytes)." -ForegroundColor Green
} else {
    Write-Host "      [DRY RUN] Would dump to $DumpFile" -ForegroundColor Gray
}

# ── Step 4: Import to Neon ───────────────────────────────────────────────────
Write-Host "[4/4] Importing to Neon..." -ForegroundColor Yellow
if (-not $DryRun) {
    $result = & $PSQL $NeonUrl -f $DumpFile 2>&1
    $errors = $result | Where-Object { $_ -match "ERROR" }
    if ($errors) {
        Write-Host "      Errors during import:" -ForegroundColor Red
        $errors | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
    } else {
        Write-Host "      Import complete." -ForegroundColor Green
    }
} else {
    Write-Host "      [DRY RUN] Would import $DumpFile to Neon" -ForegroundColor Gray
}

# ── Verify ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan
if (-not $DryRun) {
    Run-Neon @"
SELECT p.name AS package, COUNT(pmi.id) AS items
FROM public.packages p
LEFT JOIN public.package_versions pv ON pv.package_id = p.id
LEFT JOIN public.package_menu_items pmi ON pmi.package_version_id = pv.id
GROUP BY p.name ORDER BY p.name;
"@
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
