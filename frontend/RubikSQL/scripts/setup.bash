#!/bin/bash
# =============================================================================
# RubikSQL GUI - Environment Setup Script
# =============================================================================
# This script sets up a clean conda environment for RubikSQL GUI development.
#
# Usage:
#   bash scripts/setup.bash [--clean]
#
# Options:
#   --clean    Remove existing environment before creating new one
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

# Parse arguments
CLEAN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            head -n 15 "$0" | tail -n 10
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Find conda installation
find_conda() {
    # Check common conda locations
    local conda_paths=(
        "$HOME/miniconda3"
        "$HOME/anaconda3"
        "$HOME/miniforge3"
        "/opt/homebrew/Caskroom/miniforge/base"
        "/opt/anaconda3"
        "/usr/local/anaconda3"
    )
    
    for path in "${conda_paths[@]}"; do
        if [[ -f "$path/etc/profile.d/conda.sh" ]]; then
            echo "$path"
            return 0
        fi
    done
    
    # Fallback: use CONDA_EXE if set
    if [[ -n "$CONDA_EXE" ]]; then
        echo "$(dirname "$(dirname "$CONDA_EXE")")"
        return 0
    fi
    
    return 1
}

# Initialize conda for this shell
init_conda() {
    local conda_base=$(find_conda)
    if [[ -z "$conda_base" ]]; then
        error "Could not find conda installation"
        exit 1
    fi
    
    info "Found conda at: $conda_base"
    
    # Source conda.sh to enable conda commands
    source "$conda_base/etc/profile.d/conda.sh"
}

# Initialize conda
init_conda

# Remove existing environment if --clean
if [[ "$CLEAN" == true ]]; then
    info "Removing existing '$ENV_NAME' environment..."
    # Remove from any location
    conda env remove -n "$ENV_NAME" -y 2>/dev/null || true
    # Also try to remove by path if it exists in multiple locations
    for path in $(conda env list | grep rubiksql | awk '{print $NF}'); do
        conda env remove -p "$path" -y 2>/dev/null || true
    done
fi

# Check if environment exists (by name, not path)
if conda env list | grep -E "^$ENV_NAME\s+" > /dev/null 2>&1; then
    info "Environment '$ENV_NAME' already exists."
    warn "Use --clean to remove and recreate it."
else
    info "Creating conda environment '$ENV_NAME' from environment.yml..."
    cd "$PROJECT_DIR"
    conda env create -f environment.yml -n "$ENV_NAME"
fi

info "Environment setup complete!"
echo ""
echo -e "${BLUE}To activate and install local packages:${NC}"
echo ""
echo "  conda activate $ENV_NAME"
echo "  cd ../AgentHeaven-dev && pip install -e \".[exp]\""
echo "  cd ../RubikSQL-dev && pip install -e ."
echo "  python -m spacy download en_core_web_sm"
echo "  rubiksql setup -r"
echo "  bash start.bash --tauri"
echo ""
