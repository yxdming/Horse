# RubikSQL GUI - Quick Start Card

## 🎯 TL;DR - I Just Want to Run It

```bash
# One command to start everything:
bash /path/to/RubikSQL-gui/start.bash --tauri
```

Or add to your `~/.zshrc`:
```bash
alias rubik='bash /path/to/RubikSQL-gui/start.bash --tauri'
```

Then just: `rubik`

---

## 🛠️ First Time Setup

### 1. Prerequisites Check
```bash
# Check Node.js (need v18+)
node --version

# Check Python (need 3.10+)
python --version

# Check Rust (need 1.60+, for desktop app only)
rustc --version

# Check conda environment
conda env list | grep ahvn
```

### 2. Install Missing Dependencies

**Node.js:**
```bash
brew install node  # macOS
# or download from https://nodejs.org
```

**Rust (for desktop app):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
```

**ahvn conda environment:**
```bash
# Should already exist if you have AgentHeaven-dev
conda activate ahvn
```

### 3. Install Project Dependencies
```bash
cd /path/to/RubikSQL-gui
npm install
```

---

## 🚀 Launch Modes

### Mode 1: Native Desktop App (Recommended)
```bash
bash start.bash --tauri
```
- Opens a native window (no browser tabs)
- Native file dialogs
- Better UX
- **First compile takes 3-5 min** (subsequent launches are fast)

### Mode 2: Browser Mode (Fallback)
```bash
bash start.bash
```
- Opens in your default browser
- Good for quick testing
- No Rust compilation needed

### Mode 3: Manual (For Debugging)
```bash
# Terminal 1 - Backend
conda activate ahvn
PYTHONPATH=. uvicorn backend.main:app --reload --port 43252

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Tauri (optional)
npm run tauri -- dev
```

---

## 📍 Important Locations

| What | Where |
|------|-------|
| Startup script | `/path/to/RubikSQL-gui/start.bash` |
| Config file | `~/.rubiksql/config.yaml` |
| Database registry | `~/.rubiksql/app/databases.json` |
| Logs | `/tmp/rubiksql/*.log` |
| Frontend URL | http://localhost:32744 |
| Backend API | http://localhost:43252 |
| API docs | http://localhost:43252/docs |

---

## 🐛 Troubleshooting

### "node: command not found"
```bash
# Add to your PATH
export PATH="/opt/homebrew/bin:$PATH"  # macOS Homebrew
```

### "ahvn environment not found"
```bash
# Check available environments
conda env list

# Create if needed (from AgentHeaven-dev)
cd /path/to/AgentHeaven-dev
conda env create -f environment.yml
```

### "Tauri compile error"
```bash
# Update Rust
rustup update

# Clear cargo cache
cd src-tauri
cargo clean
```

### "Frontend not loading"
```bash
# Check logs
tail -f /tmp/rubiksql/frontend.log
tail -f /tmp/rubiksql/backend.log

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 Next Steps

1. **Import a database:** Drag-drop a `.sqlite` file or click "Import Database"
2. **Browse schema:** Click a database to view its tables and columns
3. **Try NL2SQL:** (Coming soon) Type a natural language query
4. **Check docs:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture details

---

## 🔗 Key Documentation

- [README.md](README.md) - Project overview and features
- [docs/README.md](docs/README.md) - Complete documentation index
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture and design
- [docs/API.md](docs/API.md) - API specification
- [docs/DEV_LOG.md](docs/DEV_LOG.md) - Development changelog

---

## 🆘 Getting Help

1. Check logs: `tail -f /tmp/rubiksql/*.log`
2. Check [docs/DEV_LOG.md](docs/DEV_LOG.md) for recent changes
3. Check [docs/README.md](docs/README.md) for complete documentation
4. Run with `--verbose`: `bash start.bash --tauri --verbose`
