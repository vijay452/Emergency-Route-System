#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include <vector>
#include <string>
#include <map>

using namespace std;

class Dijkstra {
public:
    // Find shortest path between two nodes
    static vector<string> findShortestPath(
        const vector<string>& nodes,
        const map<string, vector<pair<string, double>>>& graph,
        const string& start,
        const string& end
    );

    // Calculate total distance
    static double calculateTotalDistance(
        const vector<string>& path,
        const map<string, vector<pair<string, double>>>& graph
    );

private:
    // Helper function for Dijkstra implementation
    static pair<vector<double>, vector<int>> dijkstraImpl(
        const map<string, int>& nodeIndex,
        const vector<vector<pair<int, double>>>& adjacencyList,
        int startIdx
    );
};

#endif
