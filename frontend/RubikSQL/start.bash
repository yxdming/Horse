#!/bin/bash
# =============================================================================
# RubikSQL GUI Universal Startup Script
# =============================================================================
# This script starts the RubikSQL GUI application for development.
# Works from anywhere - just provide the path or add an alias.
#
# Usage:
#   bash /path/to/RubikSQL-gui/start.bash [options]
#
# Options:
#   --tauri      Start in Tauri native window mode (default: browser mode)
#   --no-open    Don't auto-open browser (browser mode only)
#   --help       Show this help message
#
# Examples:
#   bash start.bash              # Browser mode, auto-opens http://localhost:32744
#   bash start.bash --tauri      # Native Tauri desktop window
#   bash start.bash --no-open    # Browser mode, no auto-open
#
# Add to ~/.zshrc for convenience:
#   alias rubik='bash /path/to/RubikSQL-gui/start.bash --tauri'
# =============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export LOG_LEVEL="DEBUG"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="/tmp/rubiksql"
mkdir -p "$LOG_DIR"

# Default options
TAURI_MODE=false
AUTO_OPEN=true
BACKEND_PORT=43252
FRONTEND_PORT=32744

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tauri)
            TAURI_MODE=true
            shift
            ;;
        --no-open)
            AUTO_OPEN=false
            shift
            ;;
        --help|-h)
            head -24 "$0" | tail -21
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ==============================================================================
# Helper Functions
# ==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    log_info "Shutting down..."
    
    # Kill background processes
    if [[ -n "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [[ -n "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [[ -n "$TAURI_PID" ]]; then
        kill $TAURI_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on our ports
    lsof -ti:$BACKEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:$FRONTEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    
    log_success "Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ==============================================================================
# Environment Setup
# ==============================================================================

log_info "Setting up environment..."

# Find and activate conda
setup_conda() {
    # Try common conda locations
    local conda_paths=(
        "$HOME/anaconda3"
        "$HOME/miniconda3"
        "$HOME/miniforge3"
        "$HOME/mambaforge"
        "/opt/anaconda3"
        "/opt/miniconda3"
        "/usr/local/anaconda3"
        "/usr/local/miniconda3"
    )
    
    for conda_path in "${conda_paths[@]}"; do
        if [[ -f "$conda_path/etc/profile.d/conda.sh" ]]; then
            source "$conda_path/etc/profile.d/conda.sh"
            return 0
        fi
    done
    
    # Try CONDA_EXE if available
    if [[ -n "$CONDA_EXE" ]]; then
        local conda_base="$(dirname "$(dirname "$CONDA_EXE")")"
        if [[ -f "$conda_base/etc/profile.d/conda.sh" ]]; then
            source "$conda_base/etc/profile.d/conda.sh"
            return 0
        fi
    fi
    
    return 1
}

# Setup conda and activate ahvn environment
if ! setup_conda; then
    log_error "Could not find conda installation"
    exit 1
fi

# Activate rubiksql environment
if ! conda activate rubiksql 2>/dev/null; then
    log_error "Could not activate 'rubiksql' conda environment"
    log_info "Please create it with: conda env create -f environment.yml"
    exit 1
fi
log_success "Activated conda environment: rubiksql"
log_info "Python: $(which python) ($(python --version 2>&1))"

# Find Node.js (handle non-interactive shell)
setup_node() {
    # Already in PATH?
    if command -v node &>/dev/null; then
        return 0
    fi
    
    # Try common Node.js locations
    local node_paths=(
        "$HOME/.nvm/versions/node"
        "/usr/local/bin"
        "/opt/homebrew/bin"
        "$HOME/.volta/bin"
        "$HOME/.fnm/aliases/default/bin"
    )
    
    # NVM
    if [[ -d "$HOME/.nvm/versions/node" ]]; then
        local latest_node=$(ls -v "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)
        if [[ -n "$latest_node" ]]; then
            export PATH="$HOME/.nvm/versions/node/$latest_node/bin:$PATH"
            return 0
        fi
    fi
    
    # FNM
    if [[ -d "$HOME/.fnm" ]]; then
        export PATH="$HOME/.fnm/aliases/default/bin:$PATH"
        if command -v node &>/dev/null; then
            return 0
        fi
    fi
    
    # Homebrew
    if [[ -f "/opt/homebrew/bin/node" ]]; then
        export PATH="/opt/homebrew/bin:$PATH"
        return 0
    fi
    
    return 1
}

if ! setup_node; then
    log_error "Could not find Node.js"
    log_info "Please install Node.js: https://nodejs.org/"
    exit 1
fi
log_success "Found Node.js: $(node --version)"

# ==============================================================================
# Kill Existing Processes
# ==============================================================================

log_info "Checking for conflicting processes..."

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [[ -n "$pids" ]]; then
        log_warn "Killing existing processes on port $port"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# ==============================================================================
# Install Dependencies
# ==============================================================================

# Check/install npm dependencies
if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
    log_info "Installing npm dependencies..."
    npm install
    log_success "npm dependencies installed"
else
    log_success "npm dependencies up to date"
fi

# ==============================================================================
# Start Backend
# ==============================================================================

log_info "Starting FastAPI backend on port $BACKEND_PORT..."

# Use python -m uvicorn to ensure we use the correct Python environment
PYTHONPATH="$SCRIPT_DIR" python -m uvicorn backend.main:app \
    --host 127.0.0.1 \
    --port $BACKEND_PORT \
    --reload \
    > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
log_info "Waiting for backend to be ready..."
READY=false
for i in {1..30}; do
    if curl -s "http://127.0.0.1:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        log_success "Backend is ready!"
        READY=true
        break
    fi
    # Check if there are errors in the log
    if grep -q "Error\|Exception\|ModuleNotFoundError\|ImportError" "$LOG_DIR/backend.log" 2>/dev/null; then
        log_error "Backend failed to start. Errors found in log:"
        cat "$LOG_DIR/backend.log"
        exit 1
    fi
    sleep 1
done

if [[ "$READY" != "true" ]]; then
    log_error "Backend failed to start within 30 seconds. Check $LOG_DIR/backend.log"
    cat "$LOG_DIR/backend.log"
    exit 1
fi

# ==============================================================================
# Start Frontend / Tauri
# ==============================================================================

if [[ "$TAURI_MODE" == "true" ]]; then
    # Tauri mode - native desktop window
    log_info "Starting Tauri development mode..."
    
    # Check if Rust/Cargo is available
    if ! command -v cargo &>/dev/null; then
        log_error "Rust/Cargo not found. Please install: https://rustup.rs/"
        exit 1
    fi
    
    # First start Vite frontend (Tauri needs it running)
    log_info "Starting Vite frontend on port $FRONTEND_PORT..."
    ./node_modules/.bin/vite --host 127.0.0.1 --port $FRONTEND_PORT \
        > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s "http://127.0.0.1:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend is ready!"
            break
        fi
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "Frontend failed to start. Check $LOG_DIR/frontend.log"
            cat "$LOG_DIR/frontend.log"
            exit 1
        fi
        sleep 1
    done
    
    # Now start Tauri (it will connect to the running Vite server)
    log_info "Starting Tauri native window..."
    npm run tauri dev > "$LOG_DIR/tauri.log" 2>&1 &
    TAURI_PID=$!
    
    log_success "Tauri development server starting..."
    log_info "First compile may take 3-5 minutes. Subsequent runs are fast."
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}RubikSQL GUI (Tauri Mode)${NC}                                ${CYAN}║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  Frontend:     http://127.0.0.1:$FRONTEND_PORT                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Backend API:  http://127.0.0.1:$BACKEND_PORT                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  API Docs:     http://127.0.0.1:$BACKEND_PORT/docs                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Logs:                                                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    tail -f $LOG_DIR/backend.log                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    tail -f $LOG_DIR/frontend.log                 ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    tail -f $LOG_DIR/tauri.log                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Press ${YELLOW}Ctrl+C${NC} to stop all services                       ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Show Tauri logs
    tail -f "$LOG_DIR/tauri.log" &
    TAIL_PID=$!
    
    # Wait for Tauri to exit
    wait $TAURI_PID
    kill $TAIL_PID 2>/dev/null || true
    
else
    # Browser mode - Vite dev server
    log_info "Starting Vite frontend on port $FRONTEND_PORT..."
    
    ./node_modules/.bin/vite --host 127.0.0.1 --port $FRONTEND_PORT \
        > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s "http://127.0.0.1:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend is ready!"
            break
        fi
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "Frontend failed to start. Check $LOG_DIR/frontend.log"
            cat "$LOG_DIR/frontend.log"
            exit 1
        fi
        sleep 1
    done
    
    # Auto-open browser
    if [[ "$AUTO_OPEN" == "true" ]]; then
        log_info "Opening browser..."
        if [[ "$(uname)" == "Darwin" ]]; then
            open "http://127.0.0.1:$FRONTEND_PORT"
        elif [[ "$(uname)" == "Linux" ]]; then
            xdg-open "http://127.0.0.1:$FRONTEND_PORT" 2>/dev/null || true
        elif [[ "$(uname)" =~ MINGW|CYGWIN|MSYS ]]; then
            start "http://127.0.0.1:$FRONTEND_PORT"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}RubikSQL GUI (Browser Mode)${NC}                              ${CYAN}║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  Frontend:     http://127.0.0.1:$FRONTEND_PORT                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Backend API:  http://127.0.0.1:$BACKEND_PORT                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  API Docs:     http://127.0.0.1:$BACKEND_PORT/docs                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Logs:                                                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    tail -f $LOG_DIR/backend.log                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    tail -f $LOG_DIR/frontend.log                 ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Press ${YELLOW}Ctrl+C${NC} to stop all services                       ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Wait for either process to exit
    wait $FRONTEND_PID $BACKEND_PID
fi

cleanup
