#include <algorithm>
#include <cctype>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <queue>
#include <regex>
#include <set>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

using namespace std;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

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
            if (!kLocations.count(node) || !kLocations.count(neighbor)) {
                continue;
            }

            const Location &from = kLocations[node];
            const Location &to = kLocations[neighbor];
            const double weight = haversineDistance(from.lat, from.lng, to.lat, to.lng);
            weighted[node].push_back({neighbor, weight});
        }
    }

    return weighted;
}

vector<string> reconstructPath(const string &start, const string &end, const map<string, string> &previous) {
    if (start == end) {
        return {start};
    }

    if (!previous.count(end)) {
        return {};
    }

    vector<string> path;
    string current = end;
    path.push_back(current);

    while (current != start) {
        if (!previous.count(current)) {
            return {};
        }

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
            if (visited.count(entry.first)) {
                continue;
            }

            if (entry.second < best) {
                best = entry.second;
                current = entry.first;
            }
        }

        if (current.empty() || !isfinite(best)) {
            break;
        }

        if (current == end) {
            break;
        }

        visited.insert(current);

        auto neighborsIt = weightedGraph.find(current);
        if (neighborsIt == weightedGraph.end()) {
            continue;
        }

        for (const WeightedEdge &edge : neighborsIt->second) {
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
    fScore[start] = haversineDistance(
        kLocations[start].lat,
        kLocations[start].lng,
        kLocations[end].lat,
        kLocations[end].lng
    );
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

        if (current == end) {
            return reconstructPath(start, end, prev);
        }

        open.erase(current);

        auto neighborsIt = weightedGraph.find(current);
        if (neighborsIt == weightedGraph.end()) {
            continue;
        }

        for (const WeightedEdge &edge : neighborsIt->second) {
            const double tentativeG = gScore[current] + edge.weight;
            if (tentativeG < gScore[edge.to]) {
                prev[edge.to] = current;
                gScore[edge.to] = tentativeG;
                fScore[edge.to] = tentativeG + haversineDistance(
                    kLocations[edge.to].lat,
                    kLocations[edge.to].lng,
                    kLocations[end].lat,
                    kLocations[end].lng
                );
                open.insert(edge.to);
            }
        }
    }

    return {};
}

vector<string> runBellmanFord(const string &start, const string &end, const map<string, vector<WeightedEdge>> &weightedGraph) {
    struct FlatEdge {
        string from;
        string to;
        double weight;
    };

    vector<FlatEdge> edges;
    map<string, double> dist;
    map<string, string> prev;

    for (const auto &entry : weightedGraph) {
        dist[entry.first] = numeric_limits<double>::infinity();
        for (const WeightedEdge &edge : entry.second) {
            edges.push_back({entry.first, edge.to, edge.weight});
        }
    }

    dist[start] = 0.0;

    for (size_t i = 0; i + 1 < weightedGraph.size(); i++) {
        bool updated = false;

        for (const FlatEdge &edge : edges) {
            if (!isfinite(dist[edge.from])) {
                continue;
            }

            const double candidate = dist[edge.from] + edge.weight;
            if (candidate < dist[edge.to]) {
                dist[edge.to] = candidate;
                prev[edge.to] = edge.from;
                updated = true;
            }
        }

        if (!updated) {
            break;
        }
    }

    return reconstructPath(start, end, prev);
}

double calculatePathDistance(const vector<string> &path) {
    double total = 0.0;

    for (size_t i = 0; i + 1 < path.size(); i++) {
        const Location &from = kLocations[path[i]];
        const Location &to = kLocations[path[i + 1]];
        total += haversineDistance(from.lat, from.lng, to.lat, to.lng);
    }

    return total;
}

double calculateTime(double distance, const string &emergencyType) {
    map<string, double> speedMap = {
        {"ambulance", 40.0},
        {"fire", 35.0},
        {"police", 50.0}
    };

    const double speed = speedMap.count(emergencyType) ? speedMap[emergencyType] : 40.0;
    return (distance / speed) * 60.0;
}

string normalizeAlgorithm(const string &raw) {
    string normalized = raw;
    transform(normalized.begin(), normalized.end(), normalized.begin(), [](unsigned char c) {
        return static_cast<char>(tolower(c));
    });

    if (normalized == "a*" || normalized == "astar" || normalized == "a-star") {
        return "astar";
    }

    if (normalized == "bellman-ford" || normalized == "bellmanford") {
        return "bellman-ford";
    }

    return "dijkstra";
}

string extractJsonString(const string &json, const string &key) {
    const regex pattern("\\\"" + key + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"");
    smatch match;
    if (regex_search(json, match, pattern)) {
        return match[1].str();
    }

    return "";
}

string jsonEscape(const string &value) {
    string out;
    out.reserve(value.size() + 8);

    for (char c : value) {
        if (c == '\\' || c == '"') {
            out.push_back('\\');
        }
        out.push_back(c);
    }

    return out;
}

string buildResultJson(const RouteResult &result) {
    ostringstream ss;
    ss << fixed << setprecision(2);

    if (!result.success) {
        ss << "{\"success\":false,\"error\":\"" << jsonEscape(result.error) << "\"}";
        return ss.str();
    }

    ss << "{\"success\":true";
    ss << ",\"algorithmUsed\":\"" << result.algorithmUsed << "\"";
    ss << ",\"distance\":" << result.distance;
    ss << ",\"time\":" << result.time;
    ss << ",\"path\":[";

    for (size_t i = 0; i < result.path.size(); i++) {
        if (i > 0) {
            ss << ",";
        }
        ss << "\"" << jsonEscape(result.path[i]) << "\"";
    }

    ss << "]}";
    return ss.str();
}

RouteResult findRoute(const string &start, const string &end, const string &rawAlgorithm, const string &emergencyType) {
    if (!kLocations.count(start) || !kLocations.count(end)) {
        return {false, "Invalid location", "", {}, 0.0, 0.0};
    }

    const map<string, vector<WeightedEdge>> weightedGraph = buildWeightedGraph();
    const string algorithm = normalizeAlgorithm(rawAlgorithm);
    vector<string> path;

    if (algorithm == "astar") {
        path = runAStar(start, end, weightedGraph);
    } else if (algorithm == "bellman-ford") {
        path = runBellmanFord(start, end, weightedGraph);
    } else {
        path = runDijkstra(start, end, weightedGraph);
    }

    if (path.empty()) {
        return {false, "No route found between selected locations", algorithm, {}, 0.0, 0.0};
    }

    const double distance = calculatePathDistance(path);
    const double time = calculateTime(distance, emergencyType);

    return {true, "", algorithm, path, distance, time};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    while (getline(cin, line)) {
        if (line.empty()) {
            continue;
        }

        const string start = extractJsonString(line, "start");
        const string end = extractJsonString(line, "end");
        const string algorithm = extractJsonString(line, "algorithm");
        const string emergencyType = extractJsonString(line, "emergency_type");

        RouteResult result = findRoute(
            start,
            end,
            algorithm.empty() ? "dijkstra" : algorithm,
            emergencyType.empty() ? "ambulance" : emergencyType
        );

        cout << buildResultJson(result) << "\n";
        cout.flush();
    }

    return 0;
}

