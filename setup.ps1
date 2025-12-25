# OneCeylon Setup Script for Windows
# This script helps you set up the development environment

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  OneCeylon - Setup Wizard" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✓ PostgreSQL is installed: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "! PostgreSQL not found locally. You can use a cloud database instead." -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
Write-Host ""
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file already exists" -ForegroundColor Green
} else {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    
    # Generate a random secret
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    $envContent = @"
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/oneceylon

# NextAuth
NEXTAUTH_SECRET=$secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ .env.local file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Please update DATABASE_URL in .env.local with your database credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up your PostgreSQL database" -ForegroundColor White
Write-Host "   - Create database: createdb oneceylon" -ForegroundColor Gray
Write-Host "   - Run schema: psql -d oneceylon -f database/schema.sql" -ForegroundColor Gray
Write-Host "   - Or use cloud: Supabase, Neon, Railway" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update .env.local with your database URL" -ForegroundColor White
Write-Host ""
Write-Host "3. Start development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see README.md" -ForegroundColor Cyan
Write-Host ""
