# 🏗️ Architecture & Development Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                           │
│           (Frontend: HTML, CSS, JavaScript)             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON
┌────────────────────▼────────────────────────────────────┐
│           BACKEND SERVER (Node.js/Express)              │
│  - Route API endpoints                                  │
│  - Traffic data management                              │
│  - Request validation & error handling                  │
└────────────────────┬────────────────────────────────────┘
                     │ IPC/Subprocess
┌────────────────────▼────────────────────────────────────┐
│              CORE ENGINE (C++)                          │
│  - Dijkstra's algorithm                                │
│  - Graph data structure                                 │
│  - Path calculation                                     │
└──────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend (`frontend/`)

**Files:**
- `index.html` - UI structure
- `style.css` - Responsive styling
- `app.js` - Client logic & API calls

**Key Functions:**
```javascript
findRoute()              // Search for route
displayRoute(data)       // Show results
fetchTrafficData()       // Update traffic alerts
```

**Technologies:**
- HTML5 semantic markup
- CSS Grid & Flexbox
- Fetch API for HTTP requests

### 2. Backend (`backend/`)

**Files:**
- `server.js` - Express server
- `package.json` - Dependencies

**Key Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | Health check |
| GET | /api/routes | Available locations |
| POST | /api/route | Find route |
| GET | /api/traffic | Traffic alerts |
| POST | /api/traffic/alert | Add alert |
| GET | /api/statistics | System stats |

**Technologies:**
- Express.js web framework
- CORS for cross-origin requests
- Body-parser for JSON

### 3. Core Engine (`core/`)

**Files:**
- `main.cpp` - Entry point
- `dijkstra.h/cpp` - Algorithm implementation
- `graph.h/cpp` - Graph structure

**Key Classes:**
```cpp
class Graph {
    - loadFromFile()
    - addNode()
    - addEdge()
    - getNeighbors()
}

class Dijkstra {
    - findShortestPath()
    - getDistance()
    - getAllDistances()
}
```

**Data Structures:**
```cpp
struct Node {
    id, name, latitude, longitude, type
}

struct TrafficInfo {
    congestionLevel, speedMultiplier, status
}
```

### 4. Data Files (`data/`)

**city_graph.txt:**
```
NODE id name lat lon type
EDGE from to distance
```

**traffic_data.txt:**
```
from to congestion_level speed_multiplier status
```

## Development Workflow

### Adding a New Route/Location

1. **Edit `data/city_graph.txt`:**
   ```
   NODE 10 NewHospital 40.7500 -73.9900 hospital
   EDGE 9 10 2.5  # Connect to existing node
   ```

2. **Add to traffic data `data/traffic_data.txt`:**
   ```
   9 10 0.2 1.1 normal
   ```

3. **Restart services:**
   ```bash
   make clean-all
   make setup
   make run-backend
   ```

### Modifying Dijkstra Algorithm

**File:** `core/dijkstra.cpp`

```cpp
// Add traffic awareness
double weight = baseWeight * trafficMultiplier;

// Or implement A* heuristic
double heuristic = distanceToGoal;
```

### Adding API Endpoint

**File:** `backend/server.js`

```javascript
app.post('/api/new-endpoint', (req, res) => {
    const { param1, param2 } = req.body;
    
    try {
        // Your logic here
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### Enhancing Frontend

**File:** `frontend/app.js`

```javascript
// Add new API call
async function newFunction() {
    const response = await fetch(`${API_BASE_URL}/new-endpoint`);
    const data = await response.json();
    // Process and display
}
```

## Building & Compilation

### C++ Compilation Process

```bash
# Manual compilation
g++ -std=c++17 -o route_engine main.cpp dijkstra.cpp graph.cpp

# With Makefile
make build

# Compiler flags explained:
# -std=c++17      → Use C++17 standard
# -Wall -Wextra   → Show all warnings
# -O2             → Optimization level 2
# -o file.exe     → Output executable
```

### Debugging C++

```bash
# Compile with debug symbols
g++ -g -std=c++17 -o route_engine main.cpp dijkstra.cpp graph.cpp

# Run with debugger (if available)
gdb ./route_engine
```

## Performance Optimization

### Algorithm Optimization
- Use priority queue for O((V + E) log V) Dijkstra
- Cache previously calculated paths
- Implement bidirectional search

### Code Optimization
```cpp
// Use const references to avoid copying
const Node& getNode(int id) const;

// Reserve vector capacity
vector<int> path;
path.reserve(nodeCount);

// Use static for constants
static const double MAX_DISTANCE = 1000.0;
```

### Backend Optimization
```javascript
// Enable response caching
app.get('/api/routes', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
});

// Use async/await
async function findRoute(start, end) {
    const result = await calculatePath(start, end);
    return result;
}
```

## Testing

### Frontend Testing
```bash
# Manual testing through browser
# Expected: Form inputs work, route displays, traffic updates
```

### Backend Testing
```bash
# Test endpoints
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"start":"Hospital","end":"Station"}'
```

### C++ Testing
```bash
# Run interactive mode
make run

# Input: 0 5
# Expected: Route found with distance
```

## Extension Ideas

1. **Multiple Algorithms**
   - Implement A* algorithm
   - Add Bellman-Ford for negative weights

2. **Real-time Updates**
   - WebSocket for live traffic
   - Streaming route updates

3. **Advanced Features**
   - Multi-stop routing
   - Historical traffic patterns
   - Machine learning for prediction

4. **Scalability**
   - Database integration (PostgreSQL)
   - Caching layer (Redis)
   - Microservices architecture

## Troubleshooting Development

| Issue | Solution |
|-------|----------|
| Changes not reflected | Run `make clean-all && make setup` |
| Port in use | Kill process or change port in .env |
| Compilation fails | Check C++ version, install MinGW |
| API not responding | Check backend terminal for errors |
| Frontend stuck | Clear browser cache, restart frontend |

## Code Style

### C++
```cpp
// Use camelCase for variables
int nodeCount = graph.getNodeCount();

// Use PascalCase for classes
class Dijkstra { };

// Use UPPER_CASE for constants
const double MAX_WEIGHT = 1000.0;
```

### JavaScript
```javascript
// Use camelCase for functions
async function findRoute() { }

// Use const/let, avoid var
const API_BASE_URL = 'http://localhost:3000/api';

// Use arrow functions
array.map(item => item * 2);
```

## Resources

- [Dijkstra's Algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm)
- [Express.js Docs](https://expressjs.com/)
- [C++ Reference](https://en.cppreference.com/)
- [Graph Theory](https://www.khanacademy.org/computing/computer-science/algorithms/graph-representation/a/describing-graphs)

---

**Last Updated:** March 2026  
**Maintainer:** Development Team
