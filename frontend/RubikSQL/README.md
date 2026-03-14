# RubikSQL GUI

A minimalist, cross-platform desktop client for RubikSQL - Natural Language to SQL powered by AgentHeaven.

**Tech Stack:** Tauri (Rust) + React + TypeScript + FastAPI (Python) + AgentHeaven

## ✨ Current Features

| Feature | Status | Description |
|---------|--------|-------------|
| 🗄️ Database Import | ✅ Complete | Drag-drop or native file dialog (Tauri) to import SQLite |
| 📊 Schema Viewer | 🚧 UI exists | Browse tables, columns, types in tree view |
| 💬 NL2SQL Chat | 🚧 Mock only | Natural language queries → SQL (needs backend integration) |
| 📝 Session History | ⏸️ Backend ready | Save/restore chat conversations |
| ⚙️ Config Manager | ✅ Complete | RUBIK_CM integration for app settings |
| 🖥️ Desktop App | ✅ Dev mode | Tauri native window with file dialogs |
| 🌐 Browser Mode | ✅ Complete | Runs in browser (localhost:32744) |
| 📦 Production Build | ⏳ TODO | DMG/EXE/DEB distributables |

**Legend:** ✅ Complete | 🚧 In Progress | ⏸️ Paused | ⏳ Planned

## 📚 Documentation

**Core Documentation:**
*   [**Documentation Index**](docs/README.md): Complete overview of available documentation.
*   [**Architecture Overview**](docs/ARCHITECTURE.md): Understanding the Sidecar pattern (Tauri + Python).
*   [**API Specification**](docs/API.md): The contract between the UI and the Python backend.
*   [**Session Format**](docs/SESSION_FORMAT.md): Session storage format specification.
*   [**UI Style Guide**](docs/UI_STYLE_GUIDE.md): Design guidelines and styling conventions.

**Development:**
*   [**Development Log**](docs/DEV_LOG.md): Active development changelog and recent changes.
*   [**Requirements**](REQUIREMENT.md): Original UI/UX design specification.
*   [**Quick Start**](QUICKSTART.md): Fast-track setup and launch guide.

## 🚀 Quick Start (Development)

### Prerequisites
*   **Node.js** (v18 or newer) - [Download](https://nodejs.org)
*   **Python** (v3.10 or newer) with `rubiksql` conda environment
*   **Rust** (v1.60+) - [Install via rustup](https://rustup.rs) - **Required for native desktop app**

### Universal Startup Script

**Recommended:** Use the universal startup script that works from anywhere:

```bash
# Browser mode (default)
bash /path/to/RubikSQL-gui/start.bash

# Native desktop app mode (Tauri)
bash /path/to/RubikSQL-gui/start.bash --tauri

# Don't auto-open browser
bash /path/to/RubikSQL-gui/start.bash --no-open
```

**Add to your shell for convenience:**
```bash
# Add to ~/.zshrc or ~/.bashrc
alias rubik='bash /path/to/RubikSQL-gui/start.bash --tauri'

# Then just run:
rubik
```

### What the Script Does
1. ✅ Auto-detects and activates `rubiksql` conda environment
2. ✅ Finds Node.js even in non-interactive shells
3. ✅ Installs missing npm dependencies
4. ✅ Kills conflicting processes on ports 43252/32744
5. ✅ Starts FastAPI backend (port 43252)
6. ✅ Starts Vite frontend (port 32744)
7. ✅ Optionally starts Tauri native window
8. ✅ Monitors processes and shows logs

### First Time Setup

**Install Rust (for Tauri desktop app):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
```

**First Tauri compile takes 3-5 minutes** (subsequent runs are fast)

### Manual Start (For Debugging)

**Terminal 1 - Backend:**
```bash
conda activate rubiksql
cd RubikSQL-gui
PYTHONPATH=. uvicorn backend.main:app --reload --port 43252
```

**Terminal 2 - Frontend:**
```bash
cd RubikSQL-gui
npm install  # First time only
./node_modules/.bin/vite
```

Then open: http://localhost:32744

### Useful URLs & Logs
| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:32744 | Main application |
| Backend | http://localhost:43252 | API server |
| API Docs | http://localhost:43252/docs | Swagger UI |
| Logs | `/tmp/rubiksql/*.log` | Backend, frontend, tauri logs |

**View logs in real-time:**
```bash
tail -f /tmp/rubiksql/backend.log
tail -f /tmp/rubiksql/frontend.log
tail -f /tmp/rubiksql/tauri.log     # When using --tauri mode
```

## 🏗️ Project Structure

```
RubikSQL-gui/
├── start.bash            # 🌟 Universal startup script (USE THIS!)
├── backend/              # Python FastAPI backend
│   ├── main.py           # App entry point, CORS setup
│   ├── routers/          # API endpoints (databases, sessions, config)
│   │   ├── databases.py  # Import/list databases, get schema, table data
│   │   ├── sessions.py   # Chat session management
│   │   └── config.py     # Config API (uses RUBIK_CM)
│   └── services/         # Business logic
│       ├── database_service.py  # SQLite operations via ahvn.Database
│       └── session_service.py   # Session persistence
├── src/                  # React frontend
│   ├── components/       # Shared UI components
│   │   ├── modals/       # ImportDatabaseModal (Tauri native dialog)
│   │   └── ...
│   ├── lib/              # Utilities
│   │   └── api.ts        # Backend API client
│   ├── stores/           # Zustand state management
│   │   └── useAppStore.ts
│   └── types/            # TypeScript definitions
├── src-tauri/            # Tauri desktop app configuration
│   ├── tauri.conf.json   # Window size, permissions (dialog, fs, path)
│   ├── Cargo.toml        # Rust dependencies
│   └── src/main.rs       # Rust entry point
├── scripts/              # Legacy scripts (deprecated, use start.bash)
├── __tasks__/            # 📋 Project management
│   ├── activities.md     # Development log (what's been done)
│   ├── roadmap.md        # Feature priorities and status
│   └── futures.md        # Long-term ideas
└── docs/                 # 📚 Technical documentation
    ├── DEVELOPER_MANUAL.md   # Start here for architecture
    ├── ARCHITECTURE.md       # Sidecar pattern explanation
    ├── API.md                # Backend API reference
    ├── FRONTEND_GUIDE.md     # React components guide
    └── IMPLEMENTATION_ROADMAP.md  # Detailed implementation plan with progress tracking
```

## 🔄 Development Workflow

### Continuous Integration Process

To maintain a clean and traceable development history, follow this workflow for every small, self-contained change:

1. **Update Progress**: After completing any task from the roadmap:
   - Update the checkbox in `docs/IMPLEMENTATION_ROADMAP.md` (☐ → ☑)
   - Add notes in the **Notes** section about what was done, any challenges, or observations

2. **Update Development Log**: Record your work in the appropriate location:
   - For major features: Update `__tasks__/activities.md` with a summary of changes
   - For small fixes: Add a brief note to the roadmap's **Notes** section

3. **Commit to GitHub**: Submit changes to the `refactor` branch:
   ```bash
   git add .
   git commit -m "feat: complete task X.Y - brief description

   - Updated roadmap progress
   - Added implementation notes
   - Fixes/changes made"
   git push origin refactor
   ```

4. **Branch Strategy**:
   - **refactor** branch: All ongoing development work
   - **main** branch: Stable releases only
   - Create feature branches only for large, multi-day features

### Progress Tracking Guidelines

- **Checkboxes**: Use ☐ for not started, ☑ for completed, ⏳ for in-progress
- **Notes Section**: Always document:
  - What was actually implemented vs planned
  - Any deviations from the original plan
  - Time taken vs estimated
  - Blocking issues or dependencies
  - Lessons learned for future tasks

- **Activity Log**: Update `__tasks__/activities.md` weekly with:
  - Completed tasks summary
  - Current focus areas
  - Blockers and resolutions
  - Next week's priorities

This workflow ensures:
✅ Transparent progress tracking
✅ Historical context for decisions
✅ Easy identification of blockers
✅ Clear attribution of work
✅ Minimal merge conflicts

## 🔧 Tauri Build (Desktop App)

To build the distributable application (DMG, EXE, DEB):

```bash
npm run tauri build
```

## 📝 Notes

- The backend uses the `rubiksql` conda environment
- Data is persisted to `~/.rubiksql/app/`
- Frontend hot-reloads on save; backend auto-reloads with `--reload`
