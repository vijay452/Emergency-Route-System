# 🚑 Emergency Route Optimization System

<div align="center">

**An intelligent system to find the fastest routes for emergency vehicles using Google Maps-style interface and optimized pathfinding algorithms**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](.)

</div>

---

## ✨ Features

- **🗺️ Google Maps Style Interface**: Modern, responsive web UI similar to Google Maps
- **🎯 Dijkstra's Algorithm**: Industry-standard shortest path calculation
- **🚨 Real-time Traffic Integration**: Dynamic route adjustment based on traffic conditions
- **🌐 Responsive Web Design**: Works seamlessly on desktop, tablet, and mobile
- **⚙️ RESTful API**: Complete backend API for route calculations
- **📊 Performance Metrics**: Real-time distance and time estimation
- **🔄 Multi-Service Support**: Optimized routing for ambulances, fire departments, and police
- **💾 Interactive Map**: Zoom, pan, and explore the city network
- **📈 Route History**: Track and analyze historical routes
- **⚡ Fast Calculations**: Sub-100ms route computation times

---

## 📁 Project Structure

```
Emergency-Route-System/
├── frontend/              # 🌐 Web Interface (Google Maps-style)
├── backend/               # ⚙️ Node.js/Express Server
├── core/                  # 🧠 C++ Engine (Dijkstra with using namespace std)
├── data/                  # 📊 Graph & Traffic Data
├── config/                # ⚙️ Configuration
├── Makefile               # Build automation
└── README.md              # Documentation
```

---

## 🔧 Prerequisites & Installation

### Quick Start
```bash
# Clone repository
git clone https://github.com/vijay452/Emergency-Route-System.git
cd Emergency-Route-System

# Install all dependencies
make setup
```

### Requirements
- **Node.js**: v14+
- **npm**: v6+
- **C++ Compiler**: GCC 7+ (C++17)
- **Make**: GNU Make
- **Python**: v3.6+ (optional, for frontend server)

---

## 🚀 Running the Application

### Start All Services (3 Terminals)

**Terminal 1 - Backend Server:**
```bash
make backend
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend Server:**
```bash
make frontend
# Frontend runs on http://localhost:8000
```

**Browser:**
```
Open: http://localhost:8000
```

### Alternative: Individual Components

```bash
# Backend only
cd backend && npm install && npm start

# Frontend only
cd frontend && python -m http.server 8000

# C++ Interactive Engine
make run
```

---

## ☁️ Deploy On Render

This repo includes a Render blueprint file at [render.yaml](render.yaml).

### Option A: Blueprint (Recommended)
1. Push this repository to GitHub.
2. In Render, choose New + > Blueprint.
3. Select this repo.
4. Render will create:
  - `emergency-route-backend` (Node Web Service)
  - `emergency-route-frontend` (Static Site)
5. Set required secrets in Render:
  - `JWT_SECRET` (backend)
  - `ERS_API_BASE` (frontend) = your backend URL, for example `https://emergency-route-backend.onrender.com`
  - Optional: `TOMTOM_API_KEY`, `OPENWEATHER_API_KEY`

### Option B: Manual Service Setup
1. Create a Web Service from `backend/`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Health Check Path: `/health`
2. Create a Static Site from `frontend/`
  - Build Command: `sh -c "echo \"window.ERS_API_BASE='${ERS_API_BASE:-}'\" > runtime-config.js"`
  - Publish Directory: `.`
  - Add Rewrite: `/*` -> `/index.html`
  - Set `ERS_API_BASE` to the backend URL.

### Post-Deploy Verification
1. Open frontend URL and ensure map loads.
2. Test backend health: `https://<backend-url>/health`
3. Test API route endpoint from UI (Find Route).
4. Confirm traffic/realtime panels load without localhost errors.

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/route` | Find optimal route |
| POST | `/route/optimize` | Multi-stop route optimization |
| GET | `/routes` | List all locations |
| GET | `/traffic` | Get traffic alerts |
| POST | `/traffic/alert` | Add traffic alert (auth required) |
| GET | `/statistics` | Get statistics |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Current user profile |
| GET | `/ops/analytics` | Fleet and route analytics (auth required) |
| GET | `/ops/live-traffic` | Real-time traffic incidents |
| GET | `/ops/weather?lat=..&lng=..` | Weather impact at location |

### Default Login Accounts (Dev)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | `admin` |
| `operator` | `operator123` | `operator` |
| `viewer` | `viewer123` | `viewer` |

You can override secrets and API keys using `backend/.env.example`.

### Example: Find Route
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "start": "Hospital A",
    "end": "Fire Station",
    "emergency_type": "ambulance"
  }'
```

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JS, Leaflet.js
- **Backend**: Node.js, Express.js
- **Core**: C++ (C++17), STL, Dijkstra Algorithm with `using namespace std;`
- **Maps**: OpenStreetMap (Free Alternative to Google Maps)
- **Build**: GNU Make, npm

---

## 🏗️ Architecture

```
Browser (Google Maps UI)
        ↓ HTTP REST
   Express.js (Port 3000)
        ↓ IPC
   C++ Engine (Dijkstra)
```

---

## 📊 Features

### Frontend
✅ Google Maps-style interface  
✅ Real-time route calculation  
✅ Traffic alerts display  
✅ Interactive map controls  
✅ Route distance & time estimation  
✅ Responsive design  

### Backend
✅ RESTful API  
✅ Route optimization  
✅ Traffic management  
✅ CORS enabled  
✅ Performance optimized  

### Core Engine
✅ C++ implementation  
✅ Using `namespace std;`  
✅ Dijkstra's algorithm  
✅ Graph-based routing  
✅ Sub-100ms computation  

---

## 📈 Performance

- Route Calculation: < 100ms
- Server Response: < 500ms
- Frontend Load: < 2s
- Graph Nodes: 5 locations
- Graph Edges: 7 connections

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Server auto-retries on 3001-3010; frontend auto-discovers API port |
| npm not found | Install Node.js from nodejs.org |
| Compilation error | Update g++: `g++ --version` should be 7+ |
| CORS errors | Ensure backend is running and configured |
| Map not showing | Check internet connection for tile server |

---

## ✅ Testing

```bash
cd backend
npm test
```

Includes API tests for health, auth, route calculation, and protected analytics endpoints.

---

## 📄 Makefile Commands

```bash
make help          # Show all commands
make setup         # Install & build everything
make install       # Install npm dependencies
make build         # Compile C++ engine
make run           # Run C++ interactive mode
make backend       # Start Express server
make frontend      # Start web server
make clean         # Remove build artifacts
```

---

## 🚀 Quick Test

```bash
# 1. Build C++ engine
make build

# 2. Run interactive mode
make run
# Enter: "Hospital A" "Fire Station"
# Should output route distance and time

# 3. Start backend (new terminal)
make backend

# 4. Start frontend (new terminal)
make frontend

# 5. Open browser to http://localhost:8000
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `core/main.cpp` | C++ engine entry point |
| `core/dijkstra.cpp` | Dijkstra algorithm (used namespace std) |
| `backend/server.js` | Express server |
| `backend/controllers/routeController.js` | Route logic |
| `frontend/index.html` | Main UI |
| `frontend/map.js` | Map initialization |
| `frontend/app.js` | Application logic |
| `frontend/style.css` | Styling (Google Maps style) |
| `config/config.json` | Application settings |

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- Dijkstra algorithm by Edsger W. Dijkstra
- Leaflet.js mapping library
- OpenStreetMap tile server
- Express.js framework
- C++ Standard Library

---

## 📞 Support

- Issues: https://github.com/vijay452/Emergency-Route-System/issues
- Discussions: https://github.com/vijay452/Emergency-Route-System/discussions

---

<div align="center">

**Made with ❤️ for Emergency Services**

Status: ✅ **Fully Functional & Ready to Use**

Last Updated: March 2024

</div>
