#include "dijkstra.h"
#include <queue>
#include <limits>
#include <algorithm>

using namespace std;

vector<string> Dijkstra::findShortestPath(
    const vector<string>& nodes,
    const map<string, vector<pair<string, double>>>& graph,
    const string& start,
    const string& end
) {
    // Create node index map
    map<string, int> nodeIndex;
    for (size_t i = 0; i < nodes.size(); i++) {
        nodeIndex[nodes[i]] = i;
    }

    if (nodeIndex.find(start) == nodeIndex.end() || nodeIndex.find(end) == nodeIndex.end()) {
        return vector<string>();
    }

    int startIdx = nodeIndex[start];
    int endIdx = nodeIndex[end];

    // Convert graph to adjacency list with indices
    vector<vector<pair<int, double>>> adjacencyList(nodes.size());
    
    for (size_t i = 0; i < nodes.size(); i++) {
        const string& node = nodes[i];
        int fromIdx = nodeIndex[node];
        if (graph.find(node) != graph.end()) {
            const vector<pair<string, double>>& edges = graph.at(node);
            for (size_t j = 0; j < edges.size(); j++) {
                const pair<string, double>& edge = edges[j];
                if (nodeIndex.find(edge.first) != nodeIndex.end()) {
                    int toIdx = nodeIndex[edge.first];
                    adjacencyList[fromIdx].push_back(make_pair(toIdx, edge.second));
                }
            }
        }
    }

    // Run Dijkstra
    pair<vector<double>, vector<int>> result = dijkstraImpl(nodeIndex, adjacencyList, startIdx);
    vector<double> distances = result.first;
    vector<int> previous = result.second;

    // Reconstruct path
    vector<string> path;
    int current = endIdx;
    
    while (current != -1) {
        path.push_back(nodes[current]);
        if (previous[current] == -1) break;
        current = previous[current];
    }

    reverse(path.begin(), path.end());

    if (path.empty() || path[0] != start) {
        return vector<string>();
    }

    return path;
}

double Dijkstra::calculateTotalDistance(
    const vector<string>& path,
    const map<string, vector<pair<string, double>>>& graph
) {
    double totalDistance = 0.0;

    for (size_t i = 0; i + 1 < path.size(); i++) {
        const string& from = path[i];
        const string& to = path[i + 1];

        if (graph.find(from) != graph.end()) {
            const vector<pair<string, double>>& edges = graph.at(from);
            for (size_t j = 0; j < edges.size(); j++) {
                if (edges[j].first == to) {
                    totalDistance += edges[j].second;
                    break;
                }
            }
        }
    }

    return totalDistance;
}

pair<vector<double>, vector<int>> Dijkstra::dijkstraImpl(
    const map<string, int>& nodeIndex,
    const vector<vector<pair<int, double>>>& adjacencyList,
    int startIdx
) {
    int n = adjacencyList.size();
    vector<double> dist(n, numeric_limits<double>::max());
    vector<int> prev(n, -1);
    
    priority_queue<pair<double, int>, vector<pair<double, int>>, greater<pair<double, int>>> pq;

    dist[startIdx] = 0.0;
    pq.push(make_pair(0.0, startIdx));

    while (!pq.empty()) {
        double d = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (d > dist[u]) continue;

        for (size_t i = 0; i < adjacencyList[u].size(); i++) {
            const pair<int, double>& edge = adjacencyList[u][i];
            int v = edge.first;
            double w = edge.second;

            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                prev[v] = u;
                pq.push(make_pair(dist[v], v));
            }
        }
    }

    return make_pair(dist, prev);
}

