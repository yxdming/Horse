#!/bin/bash
# =============================================================================
# RubikSQL GUI Build Script
# =============================================================================
# This script builds the RubikSQL GUI application for distribution.
# It creates a standalone app that includes the Python backend as a sidecar.
#
# Usage:
#   ./scripts/build.bash [--target <target>] [--release]
#
# Options:
#   --target <target>  Build for specific target (macos, windows, linux)
#   --release          Build in release mode (default: debug)
#   --skip-backend     Skip building the Python backend
#   --help             Show this help message
#
# Prerequisites:
#   - Rust and Cargo installed
#   - Node.js and npm installed
#   - Python 3.10+ with PyInstaller installed
#   - RubikSQL and AgentHeaven packages installed
# =============================================================================

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
TARGET=""
RELEASE_MODE=false
SKIP_BACKEND=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET="$2"
            shift 2
            ;;
        --release)
            RELEASE_MODE=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --help)
            head -n 20 "$0" | tail -n 18
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Print section header
section() {
    echo ""
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

# Print info message
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Print warning message
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Print error message
error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect platform
detect_platform() {
    case "$(uname -s)" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Get target triple for sidecar naming
get_target_triple() {
    local platform="$1"
    case "$platform" in
        macos)
            # Detect architecture
            if [[ "$(uname -m)" == "arm64" ]]; then
                echo "aarch64-apple-darwin"
            else
                echo "x86_64-apple-darwin"
            fi
            ;;
        linux)
            echo "x86_64-unknown-linux-gnu"
            ;;
        windows)
            echo "x86_64-pc-windows-msvc"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Get executable extension
get_exe_ext() {
    local platform="$1"
    if [[ "$platform" == "windows" ]]; then
        echo ".exe"
    else
        echo ""
    fi
}

# Build Python backend with PyInstaller
build_backend() {
    section "Building Python Backend"
    
    local platform=$(detect_platform)
    local target_triple=$(get_target_triple "$platform")
    local exe_ext=$(get_exe_ext "$platform")
    
    info "Platform: $platform"
    info "Target triple: $target_triple"
    
    cd "$PROJECT_ROOT/backend"
    
    # Check if PyInstaller is installed
    if ! command -v pyinstaller &> /dev/null; then
        error "PyInstaller is not installed. Please install it with: pip install pyinstaller"
        exit 1
    fi
    
    # Check if spaCy model is installed
    if ! python -c "import en_core_web_sm" 2>/dev/null; then
        info "Installing spaCy en_core_web_sm model..."
        python -m spacy download en_core_web_sm
    fi
    
    # Build with PyInstaller
    info "Running PyInstaller..."
    pyinstaller rubiksql-server.spec --noconfirm
    
    # Create binaries directory for Tauri sidecar
    local binaries_dir="$PROJECT_ROOT/src-tauri/binaries"
    mkdir -p "$binaries_dir"
    
    # Copy the built executable with target triple suffix (Tauri requirement)
    local src_exe="$PROJECT_ROOT/backend/dist/rubiksql-server${exe_ext}"
    local dst_exe="$binaries_dir/rubiksql-server-${target_triple}${exe_ext}"
    
    if [[ -f "$src_exe" ]]; then
        info "Copying backend executable to $dst_exe"
        cp "$src_exe" "$dst_exe"
        chmod +x "$dst_exe"
    else
        error "Backend executable not found at $src_exe"
        exit 1
    fi
    
    info "Backend build complete!"
    cd "$PROJECT_ROOT"
}

# Build frontend
build_frontend() {
    section "Building Frontend"
    
    cd "$PROJECT_ROOT"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        info "Installing npm dependencies..."
        npm install
    fi
    
    # Build frontend
    info "Building frontend with Vite..."
    npm run build
    
    info "Frontend build complete!"
}

# Build Tauri app
build_tauri() {
    section "Building Tauri Application"
    
    cd "$PROJECT_ROOT"
    
    # Check if Tauri CLI is installed
    if ! command -v cargo &> /dev/null; then
        error "Rust/Cargo is not installed. Please install from https://rustup.rs/"
        exit 1
    fi
    
    local build_cmd="npm run tauri build"
    
    if [[ "$RELEASE_MODE" == false ]]; then
        build_cmd="npm run tauri build -- --debug"
    fi
    
    info "Running: $build_cmd"
    # Run tauri build but don't fail on DMG script errors (they're often benign)
    set +e
    eval "$build_cmd"
    local exit_code=$?
    set -e
    
    # Check if the actual artifacts were created despite any errors
    local platform=$(detect_platform)
    local success=false
    
    case "$platform" in
        macos)
            # Check for either .app or .dmg using ls
            if ls "$PROJECT_ROOT/src-tauri/target/release/bundle/macos/"*.app &>/dev/null || \
               ls "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg/"*.dmg &>/dev/null; then
                success=true
            fi
            ;;
        windows)
            if ls "$PROJECT_ROOT/src-tauri/target/release/bundle/msi/"*.msi &>/dev/null; then
                success=true
            fi
            ;;
        linux)
            if ls "$PROJECT_ROOT/src-tauri/target/release/bundle/appimage/"*.AppImage &>/dev/null; then
                success=true
            fi
            ;;
    esac
    
    if [[ "$success" == false ]]; then
        error "Tauri build failed - no artifacts found"
        exit 1
    fi
    
    if [[ "$exit_code" != 0 ]]; then
        warn "Tauri build returned error code $exit_code but artifacts were created"
    fi
    
    info "Tauri build complete!"
}

# Main build process
main() {
    section "RubikSQL GUI Build"
    
    local platform=$(detect_platform)
    info "Detected platform: $platform"
    info "Release mode: $RELEASE_MODE"
    
    # Build backend unless skipped
    if [[ "$SKIP_BACKEND" == false ]]; then
        build_backend
    else
        warn "Skipping backend build"
    fi
    
    # Build frontend
    build_frontend
    
    # Build Tauri app
    build_tauri
    
    section "Build Complete!"
    
    # Create dist directory and copy artifacts
    mkdir -p "$PROJECT_ROOT/dist"
    
    local platform=$(detect_platform)
    local app_path=""
    case "$platform" in
        macos)
            # Copy .app bundle
            for app in "$PROJECT_ROOT/src-tauri/target/release/bundle/macos/"*.app; do
                if [[ -d "$app" ]]; then
                    info "Copying .app bundle to dist/"
                    cp -R "$app" "$PROJECT_ROOT/dist/" 2>/dev/null || true
                fi
            done
            # Copy .dmg (check both dmg and macos directories)
            for dmg in "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg/"*.dmg \
                       "$PROJECT_ROOT/src-tauri/target/release/bundle/macos/"*.dmg; do
                if [[ -f "$dmg" ]]; then
                    local dmg_name=$(basename "$dmg")
                    # Clean up the filename (remove rw. prefix if present)
                    local clean_name="${dmg_name#rw.}"
                    info "Copying DMG to dist/$clean_name"
                    cp "$dmg" "$PROJECT_ROOT/dist/$clean_name"
                fi
            done
            app_path="$PROJECT_ROOT/dist/"
            ;;
        windows)
            for msi in "$PROJECT_ROOT/src-tauri/target/release/bundle/msi/"*.msi; do
                if [[ -f "$msi" ]]; then
                    info "Copying MSI to dist/"
                    cp "$msi" "$PROJECT_ROOT/dist/"
                fi
            done
            app_path="$PROJECT_ROOT/dist/"
            ;;
        linux)
            for appimg in "$PROJECT_ROOT/src-tauri/target/release/bundle/appimage/"*.AppImage; do
                if [[ -f "$appimg" ]]; then
                    info "Copying AppImage to dist/"
                    cp "$appimg" "$PROJECT_ROOT/dist/"
                fi
            done
            app_path="$PROJECT_ROOT/dist/"
            ;;
    esac
    
    if [[ -n "$app_path" ]]; then
        info "Final artifacts:"
        ls -lh "$app_path" 2>/dev/null || true
    fi
}

# Run main
main "$@"
