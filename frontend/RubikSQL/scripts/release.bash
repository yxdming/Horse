#!/bin/bash
# =============================================================================
# RubikSQL GUI - Release Build Script
# =============================================================================
# This script creates a complete release build of RubikSQL GUI.
# It sets up a clean environment, installs dependencies, and builds the app.
#
# Usage:
#   bash scripts/release.bash [--skip-env] [--skip-backend]
#
# Options:
#   --skip-env      Skip environment setup (use existing rubiksql env)
#   --skip-backend  Skip backend build (use existing binary)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_NAME="rubiksql"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
section() {
    echo ""
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

# Parse arguments
SKIP_ENV=false
SKIP_BACKEND=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-env)
            SKIP_ENV=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --help)
            head -n 18 "$0" | tail -n 12
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"

# Find and initialize conda
find_conda() {
    local conda_paths=(
        "$HOME/miniconda3"
        "$HOME/anaconda3"
        "$HOME/miniforge3"
        "/opt/homebrew/Caskroom/miniforge/base"
        "/opt/anaconda3"
    )
    for path in "${conda_paths[@]}"; do
        if [[ -f "$path/etc/profile.d/conda.sh" ]]; then
            echo "$path"
            return 0
        fi
    done
    if [[ -n "$CONDA_EXE" ]]; then
        echo "$(dirname "$(dirname "$CONDA_EXE")")"
        return 0
    fi
    return 1
}

init_conda() {
    local conda_base=$(find_conda)
    if [[ -z "$conda_base" ]]; then
        error "Could not find conda installation"
        exit 1
    fi
    source "$conda_base/etc/profile.d/conda.sh"
}

# =============================================================================
# Step 1: Environment Setup
# =============================================================================
section "Step 1: Environment Setup"

init_conda

if [[ "$SKIP_ENV" == false ]]; then
    info "Setting up clean conda environment..."
    bash "$SCRIPT_DIR/setup.bash" --clean
fi

info "Activating conda environment '$ENV_NAME'..."
conda activate "$ENV_NAME"

# Verify we're in the right environment
if [[ "$CONDA_DEFAULT_ENV" != "$ENV_NAME" ]]; then
    error "Failed to activate conda environment '$ENV_NAME'"
    error "Current environment: $CONDA_DEFAULT_ENV"
    exit 1
fi
info "Environment activated: $CONDA_DEFAULT_ENV"

# =============================================================================
# Step 2: Install Local Packages
# =============================================================================
section "Step 2: Install Local Packages"

# Use the conda environment's pip directly
CONDA_PIP="$CONDA_PREFIX/bin/pip"
CONDA_PYTHON="$CONDA_PREFIX/bin/python"

info "Installing AgentHeaven-dev..."
"$CONDA_PIP" install -e "$PROJECT_DIR/../AgentHeaven-dev/" --quiet

info "Installing RubikSQL-dev..."
"$CONDA_PIP" install -e "$PROJECT_DIR/../RubikSQL-dev/" --quiet

# Verify installations
info "Verifying installations..."
"$CONDA_PYTHON" -c "import ahvn; print(f'  AgentHeaven: {ahvn.__version__}')"
"$CONDA_PYTHON" -c "import rubiksql; print(f'  RubikSQL: {rubiksql.__version__}')"

# =============================================================================
# Step 3: Install Frontend Dependencies
# =============================================================================
section "Step 3: Install Frontend Dependencies"

if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
    info "Installing npm dependencies..."
    npm install
else
    info "npm dependencies already installed"
fi

# =============================================================================
# Step 4: Build Application
# =============================================================================
section "Step 4: Build Application"

BUILD_ARGS="--release"
if [[ "$SKIP_BACKEND" == true ]]; then
    BUILD_ARGS="$BUILD_ARGS --skip-backend"
fi

bash "$SCRIPT_DIR/build.bash" $BUILD_ARGS

# =============================================================================
# Complete
# =============================================================================
section "Release Build Complete!"

# Show output location
info "Final release artifacts in: $PROJECT_DIR/dist/"
ls -lh "$PROJECT_DIR/dist/" 2>/dev/null || true

echo ""
info "To test the app, run:"
echo "  open \"$PROJECT_DIR/dist/RubikSQL.app\""