# Getting Started with Emergency Route System

## 🚀 Quick Start (5 minutes)

### Prerequisites Check
```bash
# Node.js (v14+)
node --version

# npm (v6+)
npm --version

# C++ Compiler (7+)
g++ --version

# Make
make --version
```

If any are missing, install them first!

---

## 📥 Installation

### Option 1: Automated Setup (Recommended)
```bash
cd Emergency-Route-System
make setup
```

### Option 2: Manual Setup
```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Build C++ engine
cd core
g++ -std=c++17 -o route_engine main.cpp dijkstra.cpp
cd ..
```

---

## ▶️ Running the Application

### Method 1: Using Make Commands (Easiest)

**Open 3 terminals:**

```bash
# Terminal 1 - Backend API Server
make backend

# Terminal 2 - Frontend Web Server  
make frontend

# Terminal 3 (Optional) - C++ Interactive Engine
make run
```

Then open browser to: **http://localhost:8000**

---

### Method 2: Manual Commands

**Terminal 1:**
```bash
cd backend
npm install
npm start
```

**Terminal 2:**
```bash
cd frontend
python -m http.server 8000
```

**Browser:**
```
http://localhost:8000
```

---

## 🌐 Using the Web Interface

### Step-by-Step Guide

1. **Open Application**
   - Go to http://localhost:8000 in your browser
   - You'll see the Google Maps-style interface

2. **Select Starting Location**
   - Click the "From:" dropdown
   - Choose a starting location (e.g., Hospital A)
   - Or click a marker on the map

3. **Select Destination**
   - Click the "To:" dropdown
   - Choose a destination (e.g., Fire Station)

4. **Select Emergency Type**
   - Choose from: Ambulance, Fire Department, or Police
   - This affects routing priorities

5. **Find Route**
   - Click "Find Route" button
   - Wait for calculation (usually < 1 second)
   - See results appear:
     - Distance (in km)
     - Estimated time (in minutes)
     - Route status (Optimal/Moderate/Congested)
     - Traffic alerts along route
     - Visual route on map

6. **Interact with Map**
   - **Zoom In**: + button (top-right)
   - **Zoom Out**: - button (top-right)
   - **Center Map**: Crosshair (top-right)
   - **Click & Drag**: Pan the map
   - **Click Marker**: View location details

---

## 🔧 Testing the API

### Using cURL

```bash
# Health Check
curl http://localhost:3000/health

# Get All Locations
curl http://localhost:3000/api/routes

# Find a Route
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "start": "Hospital A",
    "end": "Fire Station",
    "emergency_type": "ambulance"
  }'

# Get Traffic Alerts
curl http://localhost:3000/api/traffic

# Get Statistics
curl http://localhost:3000/api/statistics
```

### Using Postman

1. Import endpoints from `/api` routes
2. Test each endpoint
3. View responses in JSON

---

## 📊 Viewing Data

### Available Locations (Nodes)
- Hospital A (Central)
- Hospital B (Northern)
- Fire Station (Downtown)
- Police HQ (Headquarters)
- Clinic (East)

### Available Routes (Edges)
- Hospital A ↔ Hospital B
- Hospital A ↔ Fire Station
- Hospital A ↔ Police HQ
- Hospital B ↔ Police HQ
- Hospital B ↔ Clinic
- Fire Station ↔ Police HQ
- Police HQ ↔ Clinic

---

## 🎯 Features to Explore

### Interactive Frontend
- [ ] Find routes between any two locations
- [ ] View real-time traffic alerts
- [ ] Change emergency vehicle type
- [ ] See estimated time and distance
- [ ] View route visualization on map

### Backend API
- [ ] Query route endpoints
- [ ] Add traffic alerts
- [ ] Get statistics
- [ ] Health monitoring

### C++ Engine
- [ ] Interactive route finding
- [ ] Direct Dijkstra algorithm testing
- [ ] Performance monitoring

---

## 🐛 Common Issues & Solutions

### "Port 3000 Already in Use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# macOS/Linux
lsof -i :3000
kill -9 <process_id>
```

### "npm install Failed"
```bash
# Clear cache and try again
npm cache clean --force
cd backend
npm install
```

### "C++ Compilation Error"
```bash
# Check compiler version
g++ --version

# Should be 7.0+. If not, update:
# Windows: Download from mingw-w64.org
# macOS: xcode-select --install
# Linux: sudo apt-get install g++
```

### "Cannot Connect to Backend"
```bash
# Check if backend is running
curl http://localhost:3000/health

# Should return: {"status":"OK","message":"..."}
```

### "Map Not Loading"
- Check internet connection (uses OpenStreetMap tiles)
- Clear browser cache
- Check browser console for errors (F12)
- Restart frontend server

---

## 📈 Performance Tips

### For Better Performance

1. **Use Chrome/Brave Browser** - Fastest performance
2. **Close Unused Tabs** - Reduces memory usage
3. **Update Browser** - Latest optimizations
4. **Restart Services** - After heavy usage

### Monitoring Performance

```bash
# Check server response time
curl -w "Response time: %{time_total}s\n" http://localhost:3000/health

# Monitor C++ engine
time make run
```

---

## 🔐 Security Notes

⚠️ **Development Mode Only**
- No authentication implemented
- CORS is fully open
- Use only on local network
- Not for production

For production:
- Implement authentication
- Use HTTPS
- Restrict CORS
- Add rate limiting
- Use environment variables

---

## 📚 Next Steps

### Learning Resources

1. **Dijkstra's Algorithm**
   - Read `/core/dijkstra.cpp` for implementation
   - Study graph theory concepts
   - Understand priority queues (STL)

2. **Web Development**
   - Learn Leaflet.js for mapping
   - Study Express.js for backend
   - Practice CSS for styling

3. **System Architecture**
   - Review `/backend/controllers/routeController.js`
   - Understand IPC between Node and C++
   - Explore data structure design

### Extending the System

1. **Add More Locations**
   - Edit `data/city_graph.txt`
   - Update `/core/main.cpp` adjacency list
   - Modify `locations` object in `/frontend/app.js`

2. **Implement New Algorithms**
   - Create `/core/astar.cpp` for A* algorithm
   - Add `/core/bellmanford.cpp` for Bellman-Ford
   - Extend route selection logic

3. **Enhance UI**
   - Add more map layers
   - Implement markers clustering
   - Add mobile responsiveness

4. **Database Integration**
   - Replace JSON with PostgreSQL
   - Implement persistent storage
   - Track route history

---

## 💡 Pro Tips

### Backend Development
```bash
# Use nodemon for auto-reload
npm install -g nodemon
cd backend
nodemon server.js
```

### Frontend Development
```bash
# Python HTTP server auto-updates
cd frontend
python -m http.server 8000
# Edit .js/.css files and refresh browser
```

### C++ Development
```bash
# Rebuild on file change
make clean && make build
```

---

## 📞 Getting Help

### Documentation
- See main [README.md](README.md)
- Check [API Documentation](README.md#-api-documentation)
- Review code comments

### Debugging
- Browser DevTools (F12)
- Node.js console output
- C++ cout/cerr statements
- Network tab for API calls

### Resources
- Dijkstra Algorithm: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
- Leaflet.js: https://leafletjs.com/
- Express.js: https://expressjs.com/
- OpenStreetMap: https://www.openstreetmap.org/

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend starts without errors
- [ ] Frontend loads in browser
- [ ] Map displays with markers
- [ ] Can select locations
- [ ] Routes calculate successfully
- [ ] Results display on map
- [ ] Traffic alerts show
- [ ] API endpoints respond
- [ ] No console errors
- [ ] C++ engine compiles

---

## 🎉 You're Ready!

If you've completed all steps, you now have a fully functional Emergency Route System running locally!

```bash
# One final check
make show-config
```

Happy routing! 🚑🗺️
