# StadiaNav One-Click Deployment Script
# Usage: ./deploy_all.ps1 -DatabaseUrl "your-neon-url"

param (
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl,
    
    [string]$ProjectID = "gen-lang-client-0551150140",
    [string]$Region = "us-central1"
)

Write-Host "🚀 Starting Deployment for StadiaNav..." -ForegroundColor Cyan

# 1. Deploy Sync Engine (Socket Server)
Write-Host "📦 Building and Deploying Sync Engine..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.sync.yaml `
    --substitutions "_DATABASE_URL=$DatabaseUrl" `
    --quiet
gcloud run deploy stadianav-sync `
    --image "gcr.io/$ProjectID/stadianav-sync" `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars "DATABASE_URL=$DatabaseUrl" `
    --port 3002 `
    --quiet

# Get the URL of the Sync Engine
$SyncUrl = gcloud run services describe stadianav-sync --platform managed --region $Region --format 'value(status.url)'
Write-Host "✅ Sync Engine deployed at: $SyncUrl" -ForegroundColor Green

# 2. Deploy Web App (Next.js)
Write-Host "📦 Building and Deploying Web App..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.yaml `
    --substitutions "_DATABASE_URL=$DatabaseUrl,_SOCKET_URL=$SyncUrl" `
    --quiet

gcloud run deploy stadianav-web `
    --image "gcr.io/$ProjectID/stadianav-web" `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars "DATABASE_URL=$DatabaseUrl,NEXT_PUBLIC_SOCKET_URL=$SyncUrl" `
    --quiet

$WebUrl = gcloud run services describe stadianav-web --platform managed --region $Region --format 'value(status.url)'
Write-Host "🏁 StadiaNav is LIVE!" -ForegroundColor Cyan
Write-Host "Web URL: $WebUrl" -ForegroundColor Green
Write-Host "Sync Engine: $SyncUrl" -ForegroundColor Green
