"""
Emergency Route System
======================
Calculates the fastest route for emergency vehicles using Dijkstra's
shortest-path algorithm.  Locations are modelled as graph nodes; roads
(with travel-time weights) are the edges.
"""

import heapq
from typing import Dict, List, Optional, Set, Tuple


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

        visited: Set[str] = set()

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
# CLI helpers
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
    if not graph.locations:
        print("\n  (no locations added yet)\n")
        return
    print("\nAvailable locations:")
    for loc in graph.locations:
        print(f"  • {loc}")
    print()


def _resolve_location(graph: Graph, raw: str) -> Optional[str]:
    """
    Return the canonical location name that matches *raw* case-insensitively.
    Returns ``None`` when no match is found.
    """
    target = raw.strip().lower()
    for loc in graph.locations:
        if loc.lower() == target:
            return loc
    return None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    """Interactive command-line interface for the Emergency Route System."""
    print("=" * 60)
    print("       EMERGENCY ROUTE SYSTEM")
    print("  Fastest route calculator for emergency vehicles")
    print("=" * 60)
    print("\nStarting with the built-in demo city graph.")
    print("Use options 3 and 4 to add your own locations and roads.\n")

    graph = build_demo_graph()

    while True:
        print("Options:")
        print("  1. Find fastest route")
        print("  2. List all locations")
        print("  3. Add a location")
        print("  4. Add a road between two locations")
        print("  5. Exit")
        choice = input("Select option [1-5]: ").strip()

        if choice == "5":
            print("Goodbye.")
            break

        elif choice == "2":
            _list_locations(graph)

        elif choice == "3":
            name = input("Enter new location name: ").strip()
            if not name:
                print("  Location name cannot be empty.\n")
                continue
            existing = _resolve_location(graph, name)
            if existing is not None:
                print(f"  Location '{existing}' already exists.\n")
            else:
                graph.add_location(name)
                print(f"  ✔ Location '{name}' added.\n")

        elif choice == "4":
            _list_locations(graph)
            if len(graph.locations) < 2:
                print("  Need at least 2 locations to add a road.\n")
                continue
            origin_raw = input("Enter origin location: ").strip()
            dest_raw = input("Enter destination location: ").strip()
            origin = _resolve_location(graph, origin_raw)
            dest = _resolve_location(graph, dest_raw)
            if origin is None:
                print(f"  Error: location '{origin_raw}' not found.\n")
                continue
            if dest is None:
                print(f"  Error: location '{dest_raw}' not found.\n")
                continue
            time_str = input("Enter travel time in minutes: ").strip()
            try:
                travel_time = float(time_str)
            except ValueError:
                print("  Error: travel time must be a number.\n")
                continue
            bidir_str = input("Bidirectional road? [y/n] (default y): ").strip().lower()
            bidirectional = bidir_str != "n"
            try:
                graph.add_road(origin, dest, travel_time, bidirectional)
            except ValueError as exc:
                print(f"  Error: {exc}\n")
                continue
            direction = "↔" if bidirectional else "→"
            print(f"  ✔ Road added: {origin} {direction} {dest} ({travel_time} min)\n")

        elif choice == "1":
            _list_locations(graph)
            if len(graph.locations) < 2:
                print("  Need at least 2 locations to find a route.\n")
                continue
            start_raw = input("Enter start location: ").strip()
            end_raw = input("Enter destination: ").strip()
            start = _resolve_location(graph, start_raw)
            end = _resolve_location(graph, end_raw)
            if start is None:
                print(f"\n  Error: location '{start_raw}' not found.\n")
                continue
            if end is None:
                print(f"\n  Error: location '{end_raw}' not found.\n")
                continue
            total_time, path = graph.dijkstra(start, end)
            if total_time is None:
                print(f"\n  No route found from '{start}' to '{end}'.\n")
            else:
                print("\n✔ Fastest route found:")
                print(_format_route(path, total_time))

        else:
            print("  Invalid option. Please enter a number from 1 to 5.\n")


if __name__ == "__main__":
    main()
