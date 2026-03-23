#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include <map>
#include <string>
#include <cmath>

using namespace std;

// Node structure
struct Node {
    string name;
    double latitude;
    double longitude;
    string type;
};

// Edge structure
struct Edge {
    int to;
    double weight;
    double traffic_multiplier;
};

// Graph class
class Graph {
private:
    vector<Node> nodes;
    map<string, int> nodeIndex;
    vector<vector<Edge>> adjacencyList;

public:
    Graph();
    void addNode(const string& name, double lat, double lng, const string& type);
    void addEdge(const string& from, const string& to, double distance, double traffic = 1.0);
    double haversineDistance(double lat1, double lng1, double lat2, double lng2);
    vector<string> dijkstra(const string& start, const string& end);
    double getPathDistance(const vector<string>& path);
    vector<Node> getNodes();
    Node getNode(const string& name);
};

#endif
