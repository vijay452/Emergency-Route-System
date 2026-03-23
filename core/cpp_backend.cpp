#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "Ws2_32.lib")
#define CLOSESOCKET closesocket
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#define SOCKET int
#define INVALID_SOCKET -1
#define SOCKET_ERROR -1
#define CLOSESOCKET close
#endif

using namespace std;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

struct HttpRequest {
    string method;
    string rawPath;
    string path;
    map<string, string> query;
    map<string, string> headers;
    string body;
};

struct HttpResponse {
    int status = 200;
    string contentType = "application/json";
    string body = "{}";
    map<string, string> headers;
};

struct Location {
    string name;
    double lat;
    double lng;
};

struct WeightedEdge {
    string to;
    double weight;
};

struct RouteResult {
    bool success;
    string error;
    string algorithmUsed;
    vector<string> path;
    double distance;
    double time;
};

struct User {
    string id;
    string username;
    string password;
    string role;
};

struct TrafficAlert {
    string id;
    string type;
    string message;
    string location;
    string severity;
    string timestamp;
};

struct RouteHistoryItem {
    string id;
    string start;
    string end;
    string emergencyType;
    double distance;
    double time;
    string timestamp;
};

struct FleetEvent {
    string id;
    string vehicleId;
    string action;
    string details;
    string actor;
    string timestamp;
};

struct AuditEvent {
    string id;
    string eventType;
    string actor;
    string payload;
    string timestamp;
};

static map<string, Location> kLocations = {
    {"Graphic Era University", {"Graphic Era University", 30.2835, 78.0139}},
    {"ISBT Dehradun", {"ISBT Dehradun", 30.2886, 77.9984}},
    {"Clock Tower Dehradun", {"Clock Tower Dehradun", 30.3256, 78.0419}},
    {"Forest Research Institute", {"Forest Research Institute", 30.3380, 77.9994}},
    {"Clement Town Market", {"Clement Town Market", 30.2709, 78.0181}}
};

static map<string, vector<string>> kGraph = {
    {"Graphic Era University", {"ISBT Dehradun", "Clement Town Market"}},
    {"ISBT Dehradun", {"Graphic Era University", "Forest Research Institute", "Clock Tower Dehradun"}},
    {"Clock Tower Dehradun", {"ISBT Dehradun", "Forest Research Institute", "Clement Town Market"}},
    {"Forest Research Institute", {"ISBT Dehradun", "Clock Tower Dehradun"}},
    {"Clement Town Market", {"Graphic Era University", "Clock Tower Dehradun"}}
};

static vector<User> gUsers = {
    {"u-admin", "admin", "admin123", "admin"},
    {"u-operator", "operator", "operator123", "operator"},
    {"u-viewer", "viewer", "viewer123", "viewer"}
};

static vector<TrafficAlert> gTrafficAlerts = {
    {"alert-seed-1", "Accident", "Traffic slowdown near ISBT flyover", "ISBT Dehradun", "critical", "2026-03-23T00:00:00.000Z"},
    {"alert-seed-2", "Construction", "Road construction near Clement Town Market", "Clement Town Market", "moderate", "2026-03-23T00:00:00.000Z"}
};

static vector<RouteHistoryItem> gRouteHistory;
static vector<FleetEvent> gFleetEvents;
static vector<AuditEvent> gAuditLogs;

string trim(const string &s) {
    size_t b = s.find_first_not_of(" \t\r\n");
    if (b == string::npos) return "";
    size_t e = s.find_last_not_of(" \t\r\n");
    return s.substr(b, e - b + 1);
}

string toLower(string s) {
    transform(s.begin(), s.end(), s.begin(), [](unsigned char c) {
        return static_cast<char>(tolower(c));
    });
    return s;
}

string jsonEscape(const string &value) {
    string out;
    out.reserve(value.size() + 8);

    for (char c : value) {
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default: out.push_back(c); break;
        }
    }

    return out;
}

string isoNow() {
    auto now = chrono::system_clock::now();
    time_t tt = chrono::system_clock::to_time_t(now);
    tm *tmPtr = gmtime(&tt);
    if (!tmPtr) return "1970-01-01T00:00:00Z";
    tm tmUtc = *tmPtr;
    char buffer[32];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &tmUtc);
    return string(buffer);
}

string makeId(const string &prefix) {
    auto now = chrono::high_resolution_clock::now().time_since_epoch().count();
    ostringstream ss;
    ss << prefix << '-' << now;
    return ss.str();
}

string extractJsonString(const string &json, const string &key) {
    const string quotedKey = "\"" + key + "\"";
    size_t keyPos = json.find(quotedKey);
    if (keyPos == string::npos) return "";

    size_t colonPos = json.find(':', keyPos + quotedKey.size());
    if (colonPos == string::npos) return "";

    size_t firstQuote = json.find('"', colonPos + 1);
    if (firstQuote == string::npos) return "";

    string out;
    bool escape = false;
    for (size_t i = firstQuote + 1; i < json.size(); i++) {
        char c = json[i];
        if (escape) {
            out.push_back(c);
            escape = false;
            continue;
        }
        if (c == '\\') {
            escape = true;
            continue;
        }
        if (c == '"') {
            return out;
        }
        out.push_back(c);
    }

    return "";
}

double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
    const double radiusKm = 6371.0;
    const double dLat = (lat2 - lat1) * M_PI / 180.0;
    const double dLng = (lng2 - lng1) * M_PI / 180.0;

    const double a =
        sin(dLat / 2.0) * sin(dLat / 2.0) +
        cos(lat1 * M_PI / 180.0) * cos(lat2 * M_PI / 180.0) *
        sin(dLng / 2.0) * sin(dLng / 2.0);

    const double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    return radiusKm * c;
}

map<string, vector<WeightedEdge>> buildWeightedGraph() {
    map<string, vector<WeightedEdge>> weighted;

    for (const auto &entry : kGraph) {
        const string &node = entry.first;
        const vector<string> &neighbors = entry.second;

        for (const string &neighbor : neighbors) {
            if (!kLocations.count(node) || !kLocations.count(neighbor)) continue;
            const Location &from = kLocations[node];
            const Location &to = kLocations[neighbor];
            weighted[node].push_back({neighbor, haversineDistance(from.lat, from.lng, to.lat, to.lng)});
        }
    }

    return weighted;
}

vector<string> reconstructPath(const string &start, const string &end, const map<string, string> &previous) {
    if (start == end) return {start};
    if (!previous.count(end)) return {};

    vector<string> path;
    string current = end;
    path.push_back(current);

    while (current != start) {
        if (!previous.count(current)) return {};
        current = previous.at(current);
        path.push_back(current);
    }

    reverse(path.begin(), path.end());
    return path;
}

vector<string> runDijkstra(const string &start, const string &end, const map<string, vector<WeightedEdge>> &weightedGraph) {
    map<string, double> dist;
    map<string, string> prev;
    set<string> visited;

    for (const auto &entry : weightedGraph) {
        dist[entry.first] = numeric_limits<double>::infinity();
    }
    dist[start] = 0.0;

    while (visited.size() < weightedGraph.size()) {
        string current;
        double best = numeric_limits<double>::infinity();

        for (const auto &entry : dist) {
            if (visited.count(entry.first)) continue;
            if (entry.second < best) {
                best = entry.second;
                current = entry.first;
            }
        }

        if (current.empty() || !isfinite(best) || current == end) break;
        visited.insert(current);

        auto it = weightedGraph.find(current);
        if (it == weightedGraph.end()) continue;

        for (const WeightedEdge &edge : it->second) {
            const double candidate = dist[current] + edge.weight;
            if (!dist.count(edge.to) || candidate < dist[edge.to]) {
                dist[edge.to] = candidate;
                prev[edge.to] = current;
            }
        }
    }

    return reconstructPath(start, end, prev);
}

vector<string> runAStar(const string &start, const string &end, const map<string, vector<WeightedEdge>> &weightedGraph) {
    map<string, double> gScore;
    map<string, double> fScore;
    map<string, string> prev;
    set<string> open;

    for (const auto &entry : weightedGraph) {
        gScore[entry.first] = numeric_limits<double>::infinity();
        fScore[entry.first] = numeric_limits<double>::infinity();
    }

    gScore[start] = 0.0;
    fScore[start] = haversineDistance(kLocations[start].lat, kLocations[start].lng, kLocations[end].lat, kLocations[end].lng);
    open.insert(start);

    while (!open.empty()) {
        string current;
        double best = numeric_limits<double>::infinity();

        for (const string &node : open) {
            if (fScore[node] < best) {
                best = fScore[node];
                current = node;
            }
        }

        if (current == end) return reconstructPath(start, end, prev);
        open.erase(current);

        auto it = weightedGraph.find(current);
        if (it == weightedGraph.end()) continue;

        for (const WeightedEdge &edge : it->second) {
            const double tentativeG = gScore[current] + edge.weight;
            if (tentativeG < gScore[edge.to]) {
                prev[edge.to] = current;
                gScore[edge.to] = tentativeG;
                fScore[edge.to] = tentativeG + haversineDistance(kLocations[edge.to].lat, kLocations[edge.to].lng, kLocations[end].lat, kLocations[end].lng);
                open.insert(edge.to);
            }
        }
    }

    return {};
}

vector<string> runBellmanFord(const string &start, const string &end, const map<string, vector<WeightedEdge>> &weightedGraph) {
    struct FlatEdge { string from; string to; double weight; };
    vector<FlatEdge> edges;
    map<string, double> dist;
    map<string, string> prev;

    for (const auto &entry : weightedGraph) {
        dist[entry.first] = numeric_limits<double>::infinity();
        for (const auto &edge : entry.second) {
            edges.push_back({entry.first, edge.to, edge.weight});
        }
    }

    dist[start] = 0.0;
    for (size_t i = 0; i + 1 < weightedGraph.size(); i++) {
        bool updated = false;
        for (const auto &edge : edges) {
            if (!isfinite(dist[edge.from])) continue;
            const double candidate = dist[edge.from] + edge.weight;
            if (candidate < dist[edge.to]) {
                dist[edge.to] = candidate;
                prev[edge.to] = edge.from;
                updated = true;
            }
        }
        if (!updated) break;
    }

    return reconstructPath(start, end, prev);
}

string normalizeAlgorithm(string raw) {
    raw = toLower(raw.empty() ? "dijkstra" : raw);
    if (raw == "a*" || raw == "astar" || raw == "a-star") return "astar";
    if (raw == "bellman-ford" || raw == "bellmanford") return "bellman-ford";
    return "dijkstra";
}

double calculatePathDistance(const vector<string> &path) {
    double total = 0.0;
    for (size_t i = 0; i + 1 < path.size(); i++) {
        const Location &a = kLocations[path[i]];
        const Location &b = kLocations[path[i + 1]];
        total += haversineDistance(a.lat, a.lng, b.lat, b.lng);
    }
    return total;
}

double calculateTime(double distance, const string &emergencyType) {
    map<string, double> speedMap = {
        {"ambulance", 40.0},
        {"fire", 35.0},
        {"police", 50.0}
    };
    double speed = speedMap.count(emergencyType) ? speedMap[emergencyType] : 40.0;
    return (distance / speed) * 60.0;
}

RouteResult findRoute(const string &start, const string &end, const string &rawAlgorithm, const string &emergencyType) {
    if (!kLocations.count(start) || !kLocations.count(end)) {
        return {false, "Invalid location", "", {}, 0.0, 0.0};
    }

    const auto weighted = buildWeightedGraph();
    const string algo = normalizeAlgorithm(rawAlgorithm);
    vector<string> path;

    if (algo == "astar") path = runAStar(start, end, weighted);
    else if (algo == "bellman-ford") path = runBellmanFord(start, end, weighted);
    else path = runDijkstra(start, end, weighted);

    if (path.empty()) {
        return {false, "No route found between selected locations", algo, {}, 0.0, 0.0};
    }

    double distance = calculatePathDistance(path);
    double time = calculateTime(distance, emergencyType.empty() ? "ambulance" : emergencyType);

    return {true, "", algo, path, distance, time};
}

string urlDecode(const string &in) {
    string out;
    out.reserve(in.size());
    for (size_t i = 0; i < in.size(); i++) {
        if (in[i] == '%' && i + 2 < in.size()) {
            string hex = in.substr(i + 1, 2);
            char c = static_cast<char>(strtol(hex.c_str(), nullptr, 16));
            out.push_back(c);
            i += 2;
        } else if (in[i] == '+') {
            out.push_back(' ');
        } else {
            out.push_back(in[i]);
        }
    }
    return out;
}

map<string, string> parseQuery(const string &queryString) {
    map<string, string> out;
    size_t start = 0;
    while (start < queryString.size()) {
        size_t amp = queryString.find('&', start);
        string pair = queryString.substr(start, amp == string::npos ? string::npos : amp - start);
        size_t eq = pair.find('=');
        string key = urlDecode(eq == string::npos ? pair : pair.substr(0, eq));
        string val = urlDecode(eq == string::npos ? "" : pair.substr(eq + 1));
        if (!key.empty()) out[key] = val;
        if (amp == string::npos) break;
        start = amp + 1;
    }
    return out;
}

bool parseHttpRequest(const string &raw, HttpRequest &req) {
    size_t headerEnd = raw.find("\r\n\r\n");
    if (headerEnd == string::npos) return false;

    string headerText = raw.substr(0, headerEnd);
    req.body = raw.substr(headerEnd + 4);

    istringstream hs(headerText);
    string line;
    if (!getline(hs, line)) return false;
    if (!line.empty() && line.back() == '\r') line.pop_back();

    istringstream rl(line);
    string version;
    if (!(rl >> req.method >> req.rawPath >> version)) return false;

    size_t qPos = req.rawPath.find('?');
    req.path = qPos == string::npos ? req.rawPath : req.rawPath.substr(0, qPos);
    req.query = qPos == string::npos ? map<string, string>() : parseQuery(req.rawPath.substr(qPos + 1));

    while (getline(hs, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        size_t colon = line.find(':');
        if (colon == string::npos) continue;
        string key = toLower(trim(line.substr(0, colon)));
        string value = trim(line.substr(colon + 1));
        req.headers[key] = value;
    }

    req.method = toLower(req.method);
    return true;
}

string getHeader(const HttpRequest &req, const string &key) {
    auto it = req.headers.find(toLower(key));
    if (it == req.headers.end()) return "";
    return it->second;
}

bool readHttpRequest(SOCKET client, HttpRequest &req) {
    string data;
    char buf[4096];

    while (data.find("\r\n\r\n") == string::npos) {
        int received = recv(client, buf, sizeof(buf), 0);
        if (received <= 0) return false;
        data.append(buf, received);
        if (data.size() > 1024 * 1024) return false;
    }

    size_t headerEnd = data.find("\r\n\r\n");
    string headerText = data.substr(0, headerEnd + 4);
    HttpRequest tmp;
    if (!parseHttpRequest(headerText, tmp)) return false;

    int contentLength = 0;
    string cl = getHeader(tmp, "content-length");
    if (!cl.empty()) contentLength = atoi(cl.c_str());

    size_t haveBody = data.size() - (headerEnd + 4);
    while (static_cast<int>(haveBody) < contentLength) {
        int received = recv(client, buf, sizeof(buf), 0);
        if (received <= 0) return false;
        data.append(buf, received);
        haveBody = data.size() - (headerEnd + 4);
    }

    return parseHttpRequest(data.substr(0, headerEnd + 4 + contentLength), req);
}

string statusText(int status) {
    switch (status) {
        case 200: return "OK";
        case 201: return "Created";
        case 204: return "No Content";
        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 405: return "Method Not Allowed";
        case 500: return "Internal Server Error";
        default: return "OK";
    }
}

void sendResponse(SOCKET client, const HttpResponse &resp) {
    ostringstream ss;
    ss << "HTTP/1.1 " << resp.status << " " << statusText(resp.status) << "\r\n";
    ss << "Content-Type: " << resp.contentType << "\r\n";
    ss << "Content-Length: " << resp.body.size() << "\r\n";
    ss << "Access-Control-Allow-Origin: *\r\n";
    ss << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    ss << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    ss << "Connection: close\r\n";

    for (const auto &h : resp.headers) {
        ss << h.first << ": " << h.second << "\r\n";
    }

    ss << "\r\n";
    ss << resp.body;
    string payload = ss.str();
    send(client, payload.c_str(), static_cast<int>(payload.size()), 0);
}

bool extractBearerToken(const HttpRequest &req, string &token) {
    string auth = getHeader(req, "authorization");
    if (auth.size() < 8) return false;
    string low = toLower(auth);
    if (low.rfind("bearer ", 0) != 0) return false;
    token = auth.substr(7);
    return !token.empty();
}

bool resolveUserFromToken(const string &token, User &user) {
    for (const auto &u : gUsers) {
        string expected = "cpp-token-" + u.username;
        if (token == expected) {
            user = u;
            return true;
        }
    }
    return false;
}

HttpResponse jsonResponse(int status, const string &body) {
    HttpResponse r;
    r.status = status;
    r.body = body;
    return r;
}

HttpResponse handleRoute(const HttpRequest &req) {
    string start = extractJsonString(req.body, "start");
    string end = extractJsonString(req.body, "end");
    string emergencyType = extractJsonString(req.body, "emergency_type");
    string algorithm = extractJsonString(req.body, "algorithm");
    if (algorithm.empty()) {
        auto it = req.query.find("algorithm");
        if (it != req.query.end()) algorithm = it->second;
    }

    if (start.empty() || end.empty()) {
        return jsonResponse(400, "{\"error\":\"Start and end locations required\"}");
    }

    RouteResult result = findRoute(start, end, algorithm.empty() ? "dijkstra" : algorithm, emergencyType.empty() ? "ambulance" : emergencyType);
    if (!result.success) {
        return jsonResponse(result.error == "Invalid location" ? 400 : 404, "{\"error\":\"" + jsonEscape(result.error) + "\"}");
    }

    vector<string> middlePath;
    if (result.path.size() > 2) {
        middlePath.assign(result.path.begin() + 1, result.path.end() - 1);
    }

    RouteHistoryItem item;
    item.id = makeId("route");
    item.start = start;
    item.end = end;
    item.emergencyType = emergencyType.empty() ? "ambulance" : emergencyType;
    item.distance = result.distance;
    item.time = result.time;
    item.timestamp = isoNow();

    gRouteHistory.push_back(item);
    gAuditLogs.push_back({makeId("audit"), "route_calculated", "anonymous", "{\"routeId\":\"" + item.id + "\"}", isoNow()});

    ostringstream pathJson;
    for (size_t i = 0; i < middlePath.size(); i++) {
        if (i) pathJson << ',';
        pathJson << '"' << jsonEscape(middlePath[i]) << '"';
    }

    ostringstream fullPathJson;
    for (size_t i = 0; i < result.path.size(); i++) {
        if (i) fullPathJson << ',';
        fullPathJson << '"' << jsonEscape(result.path[i]) << '"';
    }

    ostringstream body;
    body << fixed << setprecision(2);
    body
        << "{"
        << "\"id\":\"" << jsonEscape(item.id) << "\"," 
        << "\"start\":\"" << jsonEscape(start) << "\"," 
        << "\"end\":\"" << jsonEscape(end) << "\"," 
        << "\"emergencyType\":\"" << jsonEscape(item.emergencyType) << "\"," 
        << "\"distance\":" << item.distance << ","
        << "\"time\":" << item.time << ","
        << "\"status\":\"Optimal\"," 
        << "\"path\":[" << pathJson.str() << "],"
        << "\"fullPath\":[" << fullPathJson.str() << "],"
        << "\"traffic\":[],"
        << "\"timestamp\":\"" << item.timestamp << "\"," 
        << "\"algorithmUsed\":\"" << result.algorithmUsed << "\"," 
        << "\"algorithmOptions\":[\"dijkstra\",\"astar\",\"bellman-ford\"],"
        << "\"engineSource\":\"cpp-native\"," 
        << "\"weather\":{\"provider\":\"openweather\",\"configured\":false,\"condition\":\"unknown\",\"recommendation\":\"Set OPENWEATHER_API_KEY for live weather impact.\"},"
        << "\"cacheHit\":false"
        << "}";

    return jsonResponse(200, body.str());
}

HttpResponse handleRouteOptimize(const HttpRequest &req) {
    string start = extractJsonString(req.body, "start");
    string end = extractJsonString(req.body, "end");
    string emergencyType = extractJsonString(req.body, "emergency_type");

    if (start.empty() || end.empty()) {
        return jsonResponse(400, "{\"error\":\"start and end are required\"}");
    }

    if (!kLocations.count(start) || !kLocations.count(end)) {
        return jsonResponse(400, "{\"error\":\"Invalid location in start or end\"}");
    }

    double distance = haversineDistance(kLocations[start].lat, kLocations[start].lng, kLocations[end].lat, kLocations[end].lng);
    double time = calculateTime(distance, emergencyType.empty() ? "ambulance" : emergencyType);

    ostringstream body;
    body << fixed << setprecision(2);
    body
        << "{"
        << "\"start\":\"" << jsonEscape(start) << "\"," 
        << "\"end\":\"" << jsonEscape(end) << "\"," 
        << "\"orderedStops\":[],"
        << "\"fullStops\":[\"" << jsonEscape(start) << "\",\"" << jsonEscape(end) << "\"],"
        << "\"estimatedDistanceKm\":" << distance << ","
        << "\"estimatedTimeMinutes\":" << time << ","
        << "\"emergencyType\":\"" << jsonEscape(emergencyType.empty() ? "ambulance" : emergencyType) << "\"," 
        << "\"timeWindowWarnings\":[]"
        << "}";

    return jsonResponse(200, body.str());
}

HttpResponse handleLogin(const HttpRequest &req) {
    string username = extractJsonString(req.body, "username");
    string password = extractJsonString(req.body, "password");
    if (username.empty() || password.empty()) {
        return jsonResponse(400, "{\"error\":\"username and password are required\"}");
    }

    for (const auto &u : gUsers) {
        if (u.username == username && u.password == password) {
            string token = "cpp-token-" + u.username;
            ostringstream body;
            body
                << "{\"token\":\"" << token << "\",\"user\":{"
                << "\"id\":\"" << u.id << "\"," 
                << "\"username\":\"" << u.username << "\"," 
                << "\"role\":\"" << u.role << "\"}}";
            return jsonResponse(200, body.str());
        }
    }

    return jsonResponse(401, "{\"error\":\"Invalid credentials\"}");
}

HttpResponse handleAnalytics(const HttpRequest &req) {
    string token;
    if (!extractBearerToken(req, token)) {
        return jsonResponse(401, "{\"error\":\"Authentication token required\"}");
    }

    User user;
    if (!resolveUserFromToken(token, user)) {
        return jsonResponse(401, "{\"error\":\"Invalid or expired token\"}");
    }

    double totalDistance = 0.0;
    double totalTime = 0.0;
    map<string, int> byType;
    int totalRoutes = 0;
    int alerts = 0;

    totalRoutes = static_cast<int>(gRouteHistory.size());
    alerts = static_cast<int>(gTrafficAlerts.size());
    for (const auto &r : gRouteHistory) {
        totalDistance += r.distance;
        totalTime += r.time;
        byType[r.emergencyType] += 1;
    }

    double avgDistance = totalRoutes > 0 ? totalDistance / totalRoutes : 0.0;
    double avgTime = totalRoutes > 0 ? totalTime / totalRoutes : 0.0;

    ostringstream typeJson;
    bool first = true;
    for (const auto &kv : byType) {
        if (!first) typeJson << ',';
        first = false;
        typeJson << '"' << jsonEscape(kv.first) << "\":" << kv.second;
    }

    ostringstream body;
    body << fixed << setprecision(2);
    body
        << "{\"routes\":{"
        << "\"totalRoutes\":" << totalRoutes << ','
        << "\"averageDistanceKm\":" << avgDistance << ','
        << "\"averageTimeMinutes\":" << avgTime << ','
        << "\"byEmergencyType\":{" << typeJson.str() << "}},"
        << "\"trafficAlerts\":" << alerts << ','
        << "\"fleetEvents\":" << gFleetEvents.size() << ','
        << "\"auditEvents\":" << gAuditLogs.size() << ','
        << "\"generatedAt\":\"" << isoNow() << "\"}"
        << "}";

    return jsonResponse(200, body.str());
}

HttpResponse handleAuditLogs(const HttpRequest &req) {
    string token;
    if (!extractBearerToken(req, token)) {
        return jsonResponse(401, "{\"error\":\"Authentication token required\"}");
    }

    User user;
    if (!resolveUserFromToken(token, user)) {
        return jsonResponse(401, "{\"error\":\"Invalid or expired token\"}");
    }

    if (user.role != "admin") {
        return jsonResponse(403, "{\"error\":\"Insufficient permissions\"}");
    }

    ostringstream logs;
    for (size_t i = 0; i < gAuditLogs.size(); i++) {
        const auto &a = gAuditLogs[i];
        if (i) logs << ',';
        logs << "{"
             << "\"id\":\"" << jsonEscape(a.id) << "\"," 
             << "\"eventType\":\"" << jsonEscape(a.eventType) << "\"," 
             << "\"actor\":\"" << jsonEscape(a.actor) << "\"," 
             << "\"payload\":" << a.payload << ","
             << "\"timestamp\":\"" << jsonEscape(a.timestamp) << "\""
             << "}";
    }

    return jsonResponse(200, "{\"logs\":[" + logs.str() + "]}");
}

HttpResponse handleFleetEventAdd(const HttpRequest &req) {
    string token;
    if (!extractBearerToken(req, token)) {
        return jsonResponse(401, "{\"error\":\"Authentication token required\"}");
    }

    User user;
    if (!resolveUserFromToken(token, user)) {
        return jsonResponse(401, "{\"error\":\"Invalid or expired token\"}");
    }

    if (user.role != "admin" && user.role != "operator") {
        return jsonResponse(403, "{\"error\":\"Insufficient permissions\"}");
    }

    string vehicleId = extractJsonString(req.body, "vehicleId");
    string action = extractJsonString(req.body, "action");
    string details = extractJsonString(req.body, "details");
    if (vehicleId.empty() || action.empty()) {
        return jsonResponse(400, "{\"error\":\"vehicleId and action are required\"}");
    }

    FleetEvent ev{makeId("fleet"), vehicleId, action, details, user.username, isoNow()};
    gFleetEvents.push_back(ev);
    gAuditLogs.push_back({makeId("audit"), "fleet_event", user.username, "{\"vehicleId\":\"" + jsonEscape(vehicleId) + "\",\"action\":\"" + jsonEscape(action) + "\"}", ev.timestamp});

    ostringstream body;
    body
        << "{\"message\":\"Fleet event recorded\",\"event\":{"
        << "\"id\":\"" << ev.id << "\"," 
        << "\"vehicleId\":\"" << jsonEscape(ev.vehicleId) << "\"," 
        << "\"action\":\"" << jsonEscape(ev.action) << "\"," 
        << "\"details\":" << (ev.details.empty() ? "null" : ("\"" + jsonEscape(ev.details) + "\"")) << ','
        << "\"actor\":\"" << jsonEscape(ev.actor) << "\"," 
        << "\"timestamp\":\"" << ev.timestamp << "\"}}";

    return jsonResponse(201, body.str());
}

HttpResponse handleAllRoutes() {
    ostringstream routes;
    bool first = true;
    for (const auto &kv : kLocations) {
        if (!first) routes << ',';
        first = false;
        routes << '"' << jsonEscape(kv.first) << '"';
    }
    return jsonResponse(200, "{\"routes\":[" + routes.str() + "],\"total\":" + to_string(kLocations.size()) + "}");
}

HttpResponse handleTrafficList() {
    ostringstream alerts;
    for (size_t i = 0; i < gTrafficAlerts.size(); i++) {
        const auto &a = gTrafficAlerts[i];
        if (i) alerts << ',';
        alerts << "{"
            << "\"id\":\"" << jsonEscape(a.id) << "\"," 
            << "\"type\":\"" << jsonEscape(a.type) << "\"," 
            << "\"message\":\"" << jsonEscape(a.message) << "\"," 
            << "\"location\":\"" << jsonEscape(a.location) << "\"," 
            << "\"severity\":\"" << jsonEscape(a.severity) << "\"," 
            << "\"timestamp\":\"" << jsonEscape(a.timestamp) << "\"}"
            ;
    }
    return jsonResponse(200, "{\"alerts\":[" + alerts.str() + "],\"timestamp\":\"" + isoNow() + "\"}");
}

HttpResponse handleTrafficAlertAdd(const HttpRequest &req) {
    string token;
    if (!extractBearerToken(req, token)) {
        return jsonResponse(401, "{\"error\":\"Authentication token required\"}");
    }

    User user;
    if (!resolveUserFromToken(token, user)) {
        return jsonResponse(401, "{\"error\":\"Invalid or expired token\"}");
    }

    if (user.role != "admin" && user.role != "operator") {
        return jsonResponse(403, "{\"error\":\"Insufficient permissions\"}");
    }

    string type = extractJsonString(req.body, "type");
    string message = extractJsonString(req.body, "message");
    string location = extractJsonString(req.body, "location");
    string severity = extractJsonString(req.body, "severity");
    if (severity.empty()) severity = "moderate";

    if (type.empty() || message.empty() || location.empty()) {
        return jsonResponse(400, "{\"error\":\"Type, message, and location required\"}");
    }

    TrafficAlert alert;
    alert.id = makeId("alert");
    alert.type = type;
    alert.message = message;
    alert.location = location;
    alert.severity = severity;
    alert.timestamp = isoNow();

    gTrafficAlerts.push_back(alert);

    ostringstream body;
    body
        << "{\"message\":\"Traffic alert added\",\"alert\":{"
        << "\"id\":\"" << alert.id << "\"," 
        << "\"type\":\"" << jsonEscape(alert.type) << "\"," 
        << "\"message\":\"" << jsonEscape(alert.message) << "\"," 
        << "\"location\":\"" << jsonEscape(alert.location) << "\"," 
        << "\"severity\":\"" << jsonEscape(alert.severity) << "\"," 
        << "\"timestamp\":\"" << alert.timestamp << "\"}}";

    return jsonResponse(201, body.str());
}

HttpResponse handleStatistics() {
    double totalDistance = 0.0;
    double totalTime = 0.0;
    for (const auto &r : gRouteHistory) {
        totalDistance += r.distance;
        totalTime += r.time;
    }

    int count = static_cast<int>(gRouteHistory.size());
    double avgDistance = count > 0 ? totalDistance / count : 0.0;
    double avgTime = count > 0 ? totalTime / count : 0.0;

    ostringstream body;
    body << fixed << setprecision(2);
    body
        << "{"
        << "\"totalRoutes\":" << count << ','
        << "\"averageDistance\":" << avgDistance << ','
        << "\"averageTime\":" << avgTime << ','
        << "\"totalAlerts\":" << gTrafficAlerts.size() << ','
        << "\"locations\":" << kLocations.size() << ','
        << "\"timestamp\":\"" << isoNow() << "\""
        << "}";

    return jsonResponse(200, body.str());
}

HttpResponse handleLiveTraffic() {
    string body = "{\"provider\":\"tomtom\",\"providerConfigured\":false,\"incidents\":["
                  "{\"id\":\"fallback-1\",\"lat\":30.2886,\"lng\":77.9984,\"severity\":\"critical\",\"description\":\"Accident near ISBT Dehradun\"},"
                  "{\"id\":\"fallback-2\",\"lat\":30.2709,\"lng\":78.0181,\"severity\":\"moderate\",\"description\":\"Road maintenance near Clement Town\"}"
                  "],\"message\":\"Set TOMTOM_API_KEY to enable real-time traffic incidents.\",\"fetchedAt\":\"" + isoNow() + "\"}";
    return jsonResponse(200, body);
}

HttpResponse handleWeather(const HttpRequest &req) {
    auto latIt = req.query.find("lat");
    auto lngIt = req.query.find("lng");
    if (latIt == req.query.end() || lngIt == req.query.end()) {
        return jsonResponse(400, "{\"error\":\"lat and lng query params are required\"}");
    }

    return jsonResponse(200, "{\"provider\":\"openweather\",\"configured\":false,\"condition\":\"unknown\",\"recommendation\":\"Set OPENWEATHER_API_KEY for live weather impact.\"}");
}

HttpResponse handleAuthMe(const HttpRequest &req) {
    string token;
    if (!extractBearerToken(req, token)) {
        return jsonResponse(401, "{\"error\":\"Authentication token required\"}");
    }
    User user;
    if (!resolveUserFromToken(token, user)) {
        return jsonResponse(401, "{\"error\":\"Invalid or expired token\"}");
    }
    string body = "{\"user\":{\"id\":\"" + user.id + "\",\"username\":\"" + user.username + "\",\"role\":\"" + user.role + "\"}}";
    return jsonResponse(200, body);
}

HttpResponse routeRequest(const HttpRequest &req) {
    if (req.method == "options") {
        HttpResponse r;
        r.status = 204;
        r.body.clear();
        return r;
    }

    if (req.method == "get" && req.path == "/health") {
        return jsonResponse(200, "{\"status\":\"OK\",\"service\":\"Emergency Route System\",\"realtime\":false,\"timestamp\":\"" + isoNow() + "\"}");
    }

    if (req.method == "post" && req.path == "/api/auth/login") return handleLogin(req);
    if (req.method == "get" && req.path == "/api/auth/me") return handleAuthMe(req);

    if (req.method == "post" && req.path == "/api/route") return handleRoute(req);
    if (req.method == "post" && req.path == "/api/route/optimize") return handleRouteOptimize(req);
    if (req.method == "get" && req.path == "/api/routes") return handleAllRoutes();
    if (req.method == "get" && req.path == "/api/traffic") return handleTrafficList();
    if (req.method == "post" && req.path == "/api/traffic/alert") return handleTrafficAlertAdd(req);
    if (req.method == "get" && req.path == "/api/statistics") return handleStatistics();

    if (req.method == "get" && req.path == "/api/live-traffic") return handleLiveTraffic();
    if (req.method == "get" && req.path == "/api/weather") return handleWeather(req);

    if (req.method == "get" && req.path == "/api/ops/analytics") return handleAnalytics(req);
    if (req.method == "get" && req.path == "/api/ops/audit-logs") return handleAuditLogs(req);
    if (req.method == "post" && req.path == "/api/ops/fleet/events") return handleFleetEventAdd(req);
    if (req.method == "get" && req.path == "/api/ops/live-traffic") return handleLiveTraffic();
    if (req.method == "get" && req.path == "/api/ops/weather") return handleWeather(req);

    return jsonResponse(404, "{\"error\":\"Route not found\"}");
}

void handleClient(SOCKET client) {
    HttpRequest req;
    if (!readHttpRequest(client, req)) {
        CLOSESOCKET(client);
        return;
    }

    HttpResponse resp = routeRequest(req);
    sendResponse(client, resp);
    CLOSESOCKET(client);
}

int main() {
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cerr << "WSAStartup failed\n";
        return 1;
    }
#endif

    int port = 3000;
    const char *envPort = getenv("PORT");
    if (envPort && atoi(envPort) > 0) port = atoi(envPort);

    SOCKET serverSock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSock == INVALID_SOCKET) {
        cerr << "Failed to create socket\n";
        return 1;
    }

    int opt = 1;
#ifdef _WIN32
    setsockopt(serverSock, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char *>(&opt), sizeof(opt));
#else
    setsockopt(serverSock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(static_cast<uint16_t>(port));

    if (bind(serverSock, reinterpret_cast<sockaddr *>(&addr), sizeof(addr)) == SOCKET_ERROR) {
        cerr << "Failed to bind on port " << port << "\n";
        CLOSESOCKET(serverSock);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    if (listen(serverSock, 16) == SOCKET_ERROR) {
        cerr << "Failed to listen\n";
        CLOSESOCKET(serverSock);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    cout << "\nEmergency Route C++ Backend Server\n";
    cout << "--------------------------------\n";
    cout << "HTTP   : http://localhost:" << port << "\n";
    cout << "API    : http://localhost:" << port << "/api\n";
    cout << "Health : http://localhost:" << port << "/health\n";
    cout << "--------------------------------\n\n";

    while (true) {
        sockaddr_in clientAddr;
#ifdef _WIN32
        int clientLen = sizeof(clientAddr);
#else
        socklen_t clientLen = sizeof(clientAddr);
#endif
        SOCKET client = accept(serverSock, reinterpret_cast<sockaddr *>(&clientAddr), &clientLen);
        if (client == INVALID_SOCKET) continue;
        handleClient(client);
    }

    CLOSESOCKET(serverSock);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
