"""
Emergency Route System
======================
Calculates the fastest route for emergency vehicles using Dijkstra's
shortest-path algorithm.  Locations are modelled as graph nodes; roads
(with travel-time weights) are the edges.
"""

import heapq
from typing import Dict, List, Optional, Tuple


class Graph:
    """Weighted directed graph representing a city road network."""

    def __init__(self) -> None:
        # adjacency list: node -> list of (neighbour, weight)
        self._adj: Dict[str, List[Tuple[str, float]]] = {}

    # ------------------------------------------------------------------
    # Graph construction helpers
    # ------------------------------------------------------------------

    def add_location(self, name: str) -> None:
        """Register a location (node) in the graph."""
        if name not in self._adj:
            self._adj[name] = []

    def add_road(
        self,
        origin: str,
        destination: str,
        travel_time: float,
        bidirectional: bool = True,
    ) -> None:
        """
        Add a road (edge) between two locations.

        Parameters
        ----------
        origin, destination : str
            Location names (auto-registered if not already present).
        travel_time : float
            Estimated travel time in minutes (must be positive).
        bidirectional : bool
            When True (default) traffic can flow in both directions.
        """
        if travel_time <= 0:
            raise ValueError("travel_time must be positive")
        self.add_location(origin)
        self.add_location(destination)
        self._adj[origin].append((destination, travel_time))
        if bidirectional:
            self._adj[destination].append((origin, travel_time))

    @property
    def locations(self) -> List[str]:
        """Return a sorted list of all locations in the graph."""
        return sorted(self._adj.keys())

    # ------------------------------------------------------------------
    # Dijkstra's algorithm
    # ------------------------------------------------------------------

    def dijkstra(
        self, start: str, end: str
    ) -> Tuple[Optional[float], List[str]]:
        """
        Find the fastest route from *start* to *end* using Dijkstra's
        shortest-path algorithm.

        Returns
        -------
        (total_time, path) :
            *total_time* is the minimum travel time in minutes, or
            ``None`` when no path exists.  *path* is the ordered list of
            location names from *start* to *end* (empty when no path).

        Raises
        ------
        KeyError
            If either *start* or *end* is not in the graph.
        """
        if start not in self._adj:
            raise KeyError(f"Location not found in graph: '{start}'")
        if end not in self._adj:
            raise KeyError(f"Location not found in graph: '{end}'")

        if start == end:
            return 0.0, [start]

        # dist[node] = best known travel time from start
        dist: Dict[str, float] = {node: float("inf") for node in self._adj}
        dist[start] = 0.0
        prev: Dict[str, Optional[str]] = {node: None for node in self._adj}

        # min-heap: (cost, node)
        heap: List[Tuple[float, str]] = [(0.0, start)]

        visited: set = set()

        while heap:
            cost, node = heapq.heappop(heap)

            if node in visited:
                continue
            visited.add(node)

            if node == end:
                break

            for neighbour, weight in self._adj[node]:
                new_cost = cost + weight
                if new_cost < dist[neighbour]:
                    dist[neighbour] = new_cost
                    prev[neighbour] = node
                    heapq.heappush(heap, (new_cost, neighbour))

        if dist[end] == float("inf"):
            return None, []

        # Reconstruct path
        path: List[str] = []
        current: Optional[str] = end
        while current is not None:
            path.append(current)
            current = prev[current]
        path.reverse()

        return dist[end], path


# ---------------------------------------------------------------------------
# Built-in demo city graph
# ---------------------------------------------------------------------------

def build_demo_graph() -> Graph:
    """
    Return a sample city graph for demonstration purposes.

    Nodes represent key city locations; edge weights represent estimated
    travel times (minutes) for an emergency vehicle.
    """
    g = Graph()
    roads = [
        ("Hospital",       "City Center",    5,  True),
        ("Hospital",       "North Station",  8,  True),
        ("City Center",    "South Market",   6,  True),
        ("City Center",    "East Junction",  4,  True),
        ("North Station",  "East Junction",  7,  True),
        ("North Station",  "Airport",        12, True),
        ("South Market",   "West Bridge",    5,  True),
        ("East Junction",  "Airport",        9,  True),
        ("East Junction",  "West Bridge",    6,  True),
        ("West Bridge",    "Airport",        10, True),
        ("Airport",        "Suburb North",   15, True),
        ("West Bridge",    "Suburb South",   8,  True),
        ("Suburb South",   "Suburb North",   11, True),
    ]
    for origin, dest, time, bidir in roads:
        g.add_road(origin, dest, time, bidir)
    return g


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _format_route(path: List[str], total_time: float) -> str:
    """Return a human-readable route summary."""
    route_str = " → ".join(path)
    return (
        f"\n  Route  : {route_str}\n"
        f"  Stops  : {len(path)} location(s)\n"
        f"  Time   : {total_time:.1f} minutes\n"
    )


def _list_locations(graph: Graph) -> None:
    print("\nAvailable locations:")
    for loc in graph.locations:
        print(f"  • {loc}")
    print()


def main() -> None:
    """Interactive command-line interface for the Emergency Route System."""
    print("=" * 60)
    print("       EMERGENCY ROUTE SYSTEM")
    print("  Fastest route calculator for emergency vehicles")
    print("=" * 60)

    graph = build_demo_graph()

    while True:
        print("\nOptions:")
        print("  1. Find fastest route")
        print("  2. List all locations")
        print("  3. Exit")
        choice = input("Select option [1/2/3]: ").strip()

        if choice == "3":
            print("Goodbye.")
            break

        if choice == "2":
            _list_locations(graph)
            continue

        if choice == "1":
            _list_locations(graph)
            start = input("Enter start location: ").strip()
            end = input("Enter destination: ").strip()

            try:
                total_time, path = graph.dijkstra(start, end)
            except KeyError as exc:
                print(f"\n  Error: {exc}")
                continue

            if total_time is None:
                print(f"\n  No route found from '{start}' to '{end}'.")
            else:
                print("\n✔ Fastest route found:")
                print(_format_route(path, total_time))
        else:
            print("  Invalid option. Please enter 1, 2, or 3.")


if __name__ == "__main__":
    main()
