# Quick Start Commands

## 🚀 Easy Way - Start Everything at Once
```bash
./start_all.sh
```
This starts both backend and frontend together. Press Ctrl+C to stop both.

---

## 🔧 Manual Way - Start Separately

### Start Backend Only
```bash
cd backend
./start_backend.sh
```
Backend runs on: http://localhost:5000

### Start Frontend Only (in another terminal)
```bash
./start_frontend.sh
```
Frontend runs on: http://localhost:3001

---

## 🛑 Stopping Servers

**If using start_all.sh:**
- Press `Ctrl+C` once to stop both servers

**If started separately:**
- Press `Ctrl+C` in each terminal

**Kill stuck processes:**
```bash
# Kill backend
pkill -f api_server.py

# Kill frontend
pkill -f "next dev"
```

---

## 🐛 Memory Issues (WSL Crashes)

Your WSL instance is crashing due to **low memory**. Here's the fix:

### 1. Create `.wslconfig` file on Windows
Location: `C:\Users\<YourUsername>\.wslconfig`

Content:
```
[wsl2]
memory=4GB
processors=2
swap=2GB
```

### 2. Restart WSL
In PowerShell (Windows):
```powershell
wsl --shutdown
```

### 3. Reduce VSCode Extensions
Your VSCode extension host is using **970MB RAM**. Disable unused extensions:
- Open VSCode Extensions (Ctrl+Shift+X)
- Disable extensions you don't need
- Keep only: Python, Pylance, ESLint, Prettier

### 4. Close Unused VSCode Windows
Each VSCode window consumes memory. Close any you're not using.

---

## 📊 Check Memory Usage
```bash
# Check memory
free -h

# Check top processes
ps aux --sort=-%mem | head -10

# Monitor live
htop  # (install: sudo apt install htop)
```

---

## 🔍 Check if Servers are Running
```bash
# Check backend (should show Flask process)
ps aux | grep api_server

# Check frontend (should show node/next process)
ps aux | grep "next dev"

# Check ports
netstat -tulpn | grep -E ':(5000|3001)'
```

---

## 💡 Tips

1. **Use `start_all.sh`** - Easiest way to start everything
2. **Monitor logs** - Check `backend/backend.log` and `frontend.log`
3. **WSL memory** - Configure `.wslconfig` to prevent crashes
4. **Close unused apps** - Free up RAM before starting servers
5. **Restart WSL** - If it crashes, run `wsl --shutdown` in PowerShell

---

## ⚡ Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `./start_all.sh` | Start both servers |
| `./start_frontend.sh` | Start frontend only |
| `./backend/start_backend.sh` | Start backend only |
| `pkill -f api_server.py` | Kill backend |
| `pkill -f "next dev"` | Kill frontend |
| `free -h` | Check memory |
| `ps aux \| grep python` | Find Python processes |
| `tail -f backend/backend.log` | Watch backend logs |
| `tail -f frontend.log` | Watch frontend logs |
