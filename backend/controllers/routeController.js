const { v4: uuidv4 } = require('uuid');
const { routeCache, routeCacheKey } = require('../services/cacheService');
const { getDb, persist } = require('../services/dataStore');
const { getWeather } = require('../services/weatherService');
const cppService = require('../services/cppService');

const locations = {
    'Graphic Era University': { lat: 30.2835, lng: 78.0139, name: 'Graphic Era University, Clement Town' },
    'ISBT Dehradun': { lat: 30.2886, lng: 77.9984, name: 'ISBT Dehradun' },
    'Clock Tower Dehradun': { lat: 30.3256, lng: 78.0419, name: 'Clock Tower, Dehradun' },
    'Forest Research Institute': { lat: 30.3380, lng: 77.9994, name: 'Forest Research Institute' },
    'Clement Town Market': { lat: 30.2709, lng: 78.0181, name: 'Clement Town Market' }
};

const graph = {
    'Graphic Era University': ['ISBT Dehradun', 'Clement Town Market'],
    'ISBT Dehradun': ['Graphic Era University', 'Forest Research Institute', 'Clock Tower Dehradun'],
    'Clock Tower Dehradun': ['ISBT Dehradun', 'Forest Research Institute', 'Clement Town Market'],
    'Forest Research Institute': ['ISBT Dehradun', 'Clock Tower Dehradun'],
    'Clement Town Market': ['Graphic Era University', 'Clock Tower Dehradun']
};

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function buildWeightedGraph(adjacencyMap) {
    const weighted = {};
    const nodes = Object.keys(adjacencyMap);

    nodes.forEach((node) => {
        weighted[node] = [];
        const neighbors = adjacencyMap[node] || [];

        neighbors.forEach((neighbor) => {
            const from = locations[node];
            const to = locations[neighbor];
            if (!from || !to) return;

            weighted[node].push({
                node: neighbor,
                weight: calculateDistance(from.lat, from.lng, to.lat, to.lng)
            });
        });
    });

    return weighted;
}

function reconstructPath(start, end, previous) {
    if (start === end) return [start];
    if (!previous[end]) return [];

    const path = [end];
    let current = end;

    while (current !== start) {
        current = previous[current];
        if (!current) return [];
        path.unshift(current);
    }

    return path;
}

function dijkstra(start, end, weightedGraph) {
    const nodes = Object.keys(weightedGraph);
    const dist = {};
    const prev = {};
    const visited = new Set();

    nodes.forEach((node) => {
        dist[node] = Number.POSITIVE_INFINITY;
    });
    dist[start] = 0;

    while (visited.size < nodes.length) {
        let current = null;
        let minDist = Number.POSITIVE_INFINITY;

        nodes.forEach((node) => {
            if (!visited.has(node) && dist[node] < minDist) {
                minDist = dist[node];
                current = node;
            }
        });

        if (current === null || minDist === Number.POSITIVE_INFINITY) break;
        if (current === end) break;

        visited.add(current);

        (weightedGraph[current] || []).forEach(({ node: neighbor, weight }) => {
            const candidate = dist[current] + weight;
            if (candidate < dist[neighbor]) {
                dist[neighbor] = candidate;
                prev[neighbor] = current;
            }
        });
    }

    return reconstructPath(start, end, prev);
}

function astar(start, end, weightedGraph) {
    const nodes = Object.keys(weightedGraph);
    const open = new Set([start]);
    const prev = {};
    const gScore = {};
    const fScore = {};

    nodes.forEach((node) => {
        gScore[node] = Number.POSITIVE_INFINITY;
        fScore[node] = Number.POSITIVE_INFINITY;
    });

    gScore[start] = 0;
    fScore[start] = calculateDistance(
        locations[start].lat,
        locations[start].lng,
        locations[end].lat,
        locations[end].lng
    );

    while (open.size > 0) {
        let current = null;
        let best = Number.POSITIVE_INFINITY;

        open.forEach((node) => {
            if (fScore[node] < best) {
                best = fScore[node];
                current = node;
            }
        });

        if (current === end) {
            return reconstructPath(start, end, prev);
        }

        open.delete(current);

        (weightedGraph[current] || []).forEach(({ node: neighbor, weight }) => {
            const tentativeG = gScore[current] + weight;
            if (tentativeG < gScore[neighbor]) {
                prev[neighbor] = current;
                gScore[neighbor] = tentativeG;
                fScore[neighbor] = tentativeG + calculateDistance(
                    locations[neighbor].lat,
                    locations[neighbor].lng,
                    locations[end].lat,
                    locations[end].lng
                );
                open.add(neighbor);
            }
        });
    }

    return [];
}

function bellmanFord(start, end, weightedGraph) {
    const nodes = Object.keys(weightedGraph);
    const dist = {};
    const prev = {};
    const edges = [];

    nodes.forEach((node) => {
        dist[node] = Number.POSITIVE_INFINITY;
        (weightedGraph[node] || []).forEach(({ node: neighbor, weight }) => {
            edges.push({ from: node, to: neighbor, weight });
        });
    });

    dist[start] = 0;

    for (let i = 0; i < nodes.length - 1; i += 1) {
        let updated = false;

        edges.forEach(({ from, to, weight }) => {
            if (dist[from] !== Number.POSITIVE_INFINITY && dist[from] + weight < dist[to]) {
                dist[to] = dist[from] + weight;
                prev[to] = from;
                updated = true;
            }
        });

        if (!updated) break;
    }

    return reconstructPath(start, end, prev);
}

function resolveAlgorithm(rawAlgorithm) {
    const normalized = String(rawAlgorithm || 'dijkstra').toLowerCase();

    if (normalized === 'a*' || normalized === 'astar' || normalized === 'a-star') {
        return 'astar';
    }

    if (normalized === 'bellman-ford' || normalized === 'bellmanford') {
        return 'bellman-ford';
    }

    return 'dijkstra';
}

function findRouteByAlgorithm(start, end, adjacencyMap, rawAlgorithm) {
    const algorithm = resolveAlgorithm(rawAlgorithm);
    const weightedGraph = buildWeightedGraph(adjacencyMap);

    if (algorithm === 'astar') {
        return { algorithm, path: astar(start, end, weightedGraph) };
    }

    if (algorithm === 'bellman-ford') {
        return { algorithm, path: bellmanFord(start, end, weightedGraph) };
    }

    return { algorithm, path: dijkstra(start, end, weightedGraph) };
}

function normalizeCppRoutePayload(rawOutput) {
    if (!rawOutput) return null;

    try {
        const parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
        if (!parsed || parsed.success !== true || !Array.isArray(parsed.path)) {
            return null;
        }

        return {
            algorithm: resolveAlgorithm(parsed.algorithmUsed),
            path: parsed.path,
            distance: Number(parsed.distance || 0),
            time: Number(parsed.time || 0)
        };
    } catch (_error) {
        return null;
    }
}

async function computeRoute(start, end, emergencyType, requestedAlgorithm) {
    try {
        if (!cppService.initialized) {
            await cppService.initialize();
        }

        const cppResultRaw = await cppService.findRoute(start, end, {
            emergencyType,
            algorithm: requestedAlgorithm
        });

        const cppResult = normalizeCppRoutePayload(cppResultRaw);
        if (cppResult) {
            return {
                ...cppResult,
                source: 'cpp'
            };
        }
    } catch (_error) {
        // Use JavaScript implementation if C++ engine is not available.
    }

    const jsResult = findRouteByAlgorithm(start, end, graph, requestedAlgorithm);
    return {
        algorithm: jsResult.algorithm,
        path: jsResult.path,
        source: 'javascript'
    };
}

function calculateTime(distance, emergencyType = 'ambulance') {
    const speedMap = {
        ambulance: 40,
        fire: 35,
        police: 50
    };

    const speed = speedMap[emergencyType] || 40;
    return (distance / speed) * 60;
}

function getRouteStatus() {
    const congestion = Math.random();

    if (congestion > 0.7) return 'Congested';
    if (congestion > 0.4) return 'Moderate';
    return 'Optimal';
}

function nearestNeighborOrder(start, stops) {
    const unvisited = [...stops];
    const order = [];
    let current = start;

    while (unvisited.length > 0) {
        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;

        for (let i = 0; i < unvisited.length; i += 1) {
            const candidate = unvisited[i];
            const d = calculateDistance(
                locations[current].lat,
                locations[current].lng,
                locations[candidate].lat,
                locations[candidate].lng
            );

            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }

        const [nextStop] = unvisited.splice(bestIdx, 1);
        order.push(nextStop);
        current = nextStop;
    }

    return order;
}

function buildRouteRecord({ start, end, emergencyType, routePath, trafficAlerts }) {
    let totalDistance = 0;

    for (let i = 0; i < routePath.length - 1; i += 1) {
        const from = locations[routePath[i]];
        const to = locations[routePath[i + 1]];
        if (from && to) {
            totalDistance += calculateDistance(from.lat, from.lng, to.lat, to.lng);
        }
    }

    const totalTime = calculateTime(totalDistance, emergencyType);
    const status = getRouteStatus();

    const relevantAlerts = trafficAlerts.filter((alert) =>
        routePath.some((node) => alert.location.includes(node.split(' ')[0]))
    );

    return {
        id: uuidv4(),
        start,
        end,
        emergencyType,
        distance: Number(totalDistance.toFixed(2)),
        time: Number(totalTime.toFixed(2)),
        status,
        path: routePath.slice(1, -1),
        fullPath: routePath,
        traffic: relevantAlerts,
        timestamp: new Date().toISOString()
    };
}

async function appendRouteHistory(record, actor) {
    const db = getDb();
    db.data.routeHistory.push(record);
    db.data.auditLogs.push({
        id: uuidv4(),
        eventType: 'route_calculated',
        actor: actor || 'anonymous',
        payload: {
            routeId: record.id,
            start: record.start,
            end: record.end,
            emergencyType: record.emergencyType
        },
        timestamp: new Date().toISOString()
    });

    await persist();
}

exports.findRoute = async (req, res) => {
    try {
        const { start, end, emergency_type, algorithm } = req.body || {};
        const requestedAlgorithm = algorithm || req.query.algorithm;
        const effectiveEmergencyType = emergency_type || 'ambulance';

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end locations required' });
        }

        if (!locations[start] || !locations[end]) {
            return res.status(400).json({ error: 'Invalid location' });
        }

        const db = getDb();

        const cacheKey = routeCacheKey({
            start,
            end,
            emergencyType: effectiveEmergencyType,
            algorithm: resolveAlgorithm(requestedAlgorithm),
            alertsCount: db.data.trafficAlerts.length
        });

        const cached = routeCache.get(cacheKey);
        if (cached) {
            return res.json({
                ...cached,
                cacheHit: true
            });
        }

        const result = await computeRoute(start, end, effectiveEmergencyType, requestedAlgorithm);
        const routePath = result.path;

        if (!routePath || routePath.length === 0) {
            return res.status(404).json({ error: 'No route found between selected locations' });
        }

        const record = buildRouteRecord({
            start,
            end,
            emergencyType: effectiveEmergencyType,
            routePath,
            trafficAlerts: db.data.trafficAlerts
        });

        const endLocation = locations[end];
        const weather = await getWeather(endLocation.lat, endLocation.lng);

        const response = {
            ...record,
            algorithmUsed: result.algorithm,
            algorithmOptions: ['dijkstra', 'astar', 'bellman-ford'],
            engineSource: result.source,
            weather,
            cacheHit: false
        };

        routeCache.set(cacheKey, response);
        await appendRouteHistory(record, req.user?.username);

        return res.json(response);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to calculate route', details: error.message });
    }
};

exports.optimizeRoute = (req, res) => {
    try {
        const { start, end, waypoints, emergency_type, time_windows } = req.body || {};

        if (!start || !end) {
            return res.status(400).json({ error: 'start and end are required' });
        }

        if (!locations[start] || !locations[end]) {
            return res.status(400).json({ error: 'Invalid location in start or end' });
        }

        const normalizedStops = Array.isArray(waypoints)
            ? waypoints.filter((wp) => locations[wp] && wp !== start && wp !== end)
            : [];

        const orderedStops = nearestNeighborOrder(start, normalizedStops);
        const fullStops = [start, ...orderedStops, end];

        let totalDistance = 0;
        for (let i = 0; i < fullStops.length - 1; i += 1) {
            const a = locations[fullStops[i]];
            const b = locations[fullStops[i + 1]];
            totalDistance += calculateDistance(a.lat, a.lng, b.lat, b.lng);
        }

        const totalTime = calculateTime(totalDistance, emergency_type || 'ambulance');

        const timeWindowWarnings = [];
        if (Array.isArray(time_windows)) {
            time_windows.forEach((window, index) => {
                if (!window || typeof window !== 'object') {
                    return;
                }

                if (!window.start || !window.end) {
                    timeWindowWarnings.push(`Waypoint index ${index} has invalid time window.`);
                }
            });
        }

        return res.json({
            start,
            end,
            orderedStops,
            fullStops,
            estimatedDistanceKm: Number(totalDistance.toFixed(2)),
            estimatedTimeMinutes: Number(totalTime.toFixed(2)),
            emergencyType: emergency_type || 'ambulance',
            timeWindowWarnings
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to optimize route', details: error.message });
    }
};

exports.getAllRoutes = (_req, res) => {
    try {
        return res.json({
            routes: Object.keys(locations),
            total: Object.keys(locations).length
        });
    } catch (_error) {
        return res.status(500).json({ error: 'Failed to retrieve routes' });
    }
};

exports.getTrafficData = (_req, res) => {
    try {
        const db = getDb();
        return res.json({
            alerts: db.data.trafficAlerts,
            timestamp: new Date().toISOString()
        });
    } catch (_error) {
        return res.status(500).json({ error: 'Failed to retrieve traffic data' });
    }
};

exports.addTrafficAlert = async (req, res) => {
    try {
        const { type, message, location, severity } = req.body || {};

        if (!type || !message || !location) {
            return res.status(400).json({ error: 'Type, message, and location required' });
        }

        const db = getDb();
        const alert = {
            id: uuidv4(),
            type,
            message,
            location,
            severity: severity || 'moderate',
            timestamp: new Date().toISOString()
        };

        db.data.trafficAlerts.push(alert);
        db.data.auditLogs.push({
            id: uuidv4(),
            eventType: 'traffic_alert_added',
            actor: req.user?.username || 'anonymous',
            payload: alert,
            timestamp: alert.timestamp
        });

        await persist();

        return res.status(201).json({
            message: 'Traffic alert added',
            alert
        });
    } catch (_error) {
        return res.status(500).json({ error: 'Failed to add traffic alert' });
    }
};

exports.getStatistics = (_req, res) => {
    try {
        const db = getDb();
        const history = db.data.routeHistory;

        const stats = {
            totalRoutes: history.length,
            averageDistance: history.length > 0
                ? Number((history.reduce((sum, r) => sum + Number(r.distance || 0), 0) / history.length).toFixed(2))
                : 0,
            averageTime: history.length > 0
                ? Number((history.reduce((sum, r) => sum + Number(r.time || 0), 0) / history.length).toFixed(2))
                : 0,
            totalAlerts: db.data.trafficAlerts.length,
            locations: Object.keys(locations).length,
            timestamp: new Date().toISOString()
        };

        return res.json(stats);
    } catch (_error) {
        return res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
};

module.exports = exports;
