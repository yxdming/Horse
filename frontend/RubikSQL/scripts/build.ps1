# =============================================================================
# RubikSQL GUI Build Script for Windows
# =============================================================================
# This script builds the RubikSQL GUI application for Windows distribution.
# It creates a standalone exe that includes the Python backend as a sidecar.
#
# Usage:
#   .\scripts\build.ps1 [-SkipBackend] [-SkipEnv]
#
# Prerequisites:
#   - Rust and Cargo installed
#   - Node.js and npm installed
#   - Python 3.10+ with conda/pip
#   - RubikSQL and AgentHeaven packages installed
# =============================================================================

param(
    [switch]$SkipBackend,
    [switch]$SkipEnv,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Section { 
    param($Message) 
    Write-Host ""
    Write-Host ("=" * 78) -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host ("=" * 78) -ForegroundColor Blue
}

if ($Help) {
    Get-Content $MyInvocation.MyCommand.Path | Select-Object -First 15
    exit 0
}

# =============================================================================
# Step 1: Environment Setup
# =============================================================================
Write-Section "Step 1: Environment Setup"

if (-not $SkipEnv) {
    Write-Info "Setting up Python environment..."
    
    # Check if conda is available
    $condaPath = Get-Command conda -ErrorAction SilentlyContinue
    if ($condaPath) {
        Write-Info "Using conda environment..."
        conda activate rubiksql 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Creating conda environment..."
            conda env create -f "$ProjectRoot\environment.yml"
            conda activate rubiksql
        }
    } else {
        Write-Info "Conda not found, using pip..."
        pip install -r "$ProjectRoot\requirements.txt"
    }
}

# Install local packages
Write-Info "Installing AgentHeaven-dev..."
pip install -e "$ProjectRoot\..\AgentHeaven-dev\" --quiet

Write-Info "Installing RubikSQL-dev..."
pip install -e "$ProjectRoot\..\RubikSQL-dev\" --quiet

# Verify installations
Write-Info "Verifying installations..."
python -c "import ahvn; print(f'  AgentHeaven: {ahvn.__version__}')"
python -c "import rubiksql; print(f'  RubikSQL: {rubiksql.__version__}')"

# =============================================================================
# Step 2: Build Backend
# =============================================================================
if (-not $SkipBackend) {
    Write-Section "Step 2: Build Python Backend"
    
    Set-Location "$ProjectRoot\backend"
    
    # Check PyInstaller
    $pyinstaller = Get-Command pyinstaller -ErrorAction SilentlyContinue
    if (-not $pyinstaller) {
        Write-Err "PyInstaller is not installed. Installing..."
        pip install pyinstaller
    }
    
    Write-Info "Running PyInstaller..."
    pyinstaller rubiksql-server.spec --noconfirm
    
    # Copy to Tauri binaries
    $binariesDir = "$ProjectRoot\src-tauri\binaries"
    if (-not (Test-Path $binariesDir)) {
        New-Item -ItemType Directory -Path $binariesDir | Out-Null
    }
    
    $srcExe = "$ProjectRoot\backend\dist\rubiksql-server.exe"
    $dstExe = "$binariesDir\rubiksql-server-x86_64-pc-windows-msvc.exe"
    
    if (Test-Path $srcExe) {
        Write-Info "Copying backend executable to $dstExe"
        Copy-Item $srcExe $dstExe -Force
    } else {
        Write-Err "Backend executable not found at $srcExe"
        exit 1
    }
    
    Set-Location $ProjectRoot
    Write-Info "Backend build complete!"
} else {
    Write-Warn "Skipping backend build"
}

# =============================================================================
# Step 3: Build Frontend
# =============================================================================
Write-Section "Step 3: Build Frontend"

Set-Location $ProjectRoot

# Check npm
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Err "npm is not installed. Please install Node.js."
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Info "Installing npm dependencies..."
    npm install
}

Write-Info "Building frontend with Vite..."
npm run build

Write-Info "Frontend build complete!"

# =============================================================================
# Step 4: Build Tauri App
# =============================================================================
Write-Section "Step 4: Build Tauri Application"

Write-Info "Running Tauri build..."
npm run tauri build

Write-Info "Tauri build complete!"

# =============================================================================
# Step 5: Copy Artifacts
# =============================================================================
Write-Section "Step 5: Copy Artifacts"

$distDir = "$ProjectRoot\dist"
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

# Copy MSI installer
$msiDir = "$ProjectRoot\src-tauri\target\release\bundle\msi"
if (Test-Path $msiDir) {
    Get-ChildItem "$msiDir\*.msi" | ForEach-Object {
        Write-Info "Copying MSI: $($_.Name)"
        Copy-Item $_.FullName $distDir -Force
    }
}

# Copy NSIS installer if available
$nsisDir = "$ProjectRoot\src-tauri\target\release\bundle\nsis"
if (Test-Path $nsisDir) {
    Get-ChildItem "$nsisDir\*.exe" | ForEach-Object {
        Write-Info "Copying NSIS: $($_.Name)"
        Copy-Item $_.FullName $distDir -Force
    }
}

Write-Section "Build Complete!"
Write-Info "Artifacts in: $distDir"
Get-ChildItem $distDir | Format-Table Name, Length -AutoSize
