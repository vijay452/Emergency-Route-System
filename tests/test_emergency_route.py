"""
Unit tests for the Emergency Route System (emergency_route.py).
"""

import pytest
from typing import Dict, Tuple
from emergency_route import Graph, build_demo_graph, _format_route, _resolve_location


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

class TestGraphConstruction:
    def test_add_location(self):
        g = Graph()
        g.add_location("A")
        assert "A" in g.locations

    def test_add_duplicate_location_is_idempotent(self):
        g = Graph()
        g.add_location("A")
        g.add_location("A")
        assert g.locations.count("A") == 1

    def test_add_road_registers_both_locations(self):
        g = Graph()
        g.add_road("A", "B", 5)
        assert "A" in g.locations
        assert "B" in g.locations

    def test_add_road_bidirectional_default(self):
        g = Graph()
        g.add_road("A", "B", 5)
        # Both directions should be reachable
        _, path_ab = g.dijkstra("A", "B")
        _, path_ba = g.dijkstra("B", "A")
        assert path_ab == ["A", "B"]
        assert path_ba == ["B", "A"]

    def test_add_road_one_way(self):
        g = Graph()
        g.add_road("A", "B", 5, bidirectional=False)
        time_ab, path_ab = g.dijkstra("A", "B")
        time_ba, path_ba = g.dijkstra("B", "A")
        assert path_ab == ["A", "B"]
        assert time_ab == 5
        # Reverse direction has no path
        assert time_ba is None
        assert path_ba == []

    def test_add_road_invalid_travel_time(self):
        g = Graph()
        with pytest.raises(ValueError):
            g.add_road("A", "B", 0)
        with pytest.raises(ValueError):
            g.add_road("A", "B", -3)

    def test_locations_sorted(self):
        g = Graph()
        for loc in ["Charlie", "Alpha", "Bravo"]:
            g.add_location(loc)
        assert g.locations == ["Alpha", "Bravo", "Charlie"]

    def test_add_duplicate_road_adds_parallel_edge(self):
        """Adding the same road twice creates a parallel edge (both stored)."""
        g = Graph()
        g.add_road("A", "B", 5, bidirectional=False)
        g.add_road("A", "B", 3, bidirectional=False)
        # Dijkstra should pick the cheaper parallel edge
        time, path = g.dijkstra("A", "B")
        assert time == 3
        assert path == ["A", "B"]


# ---------------------------------------------------------------------------
# Dijkstra – basic cases
# ---------------------------------------------------------------------------

class TestDijkstraBasic:
    def _simple_graph(self) -> Graph:
        """
        A --- 4 --- B
        |           |
        1           2
        |           |
        C --- 1 --- D
        """
        g = Graph()
        g.add_road("A", "B", 4)
        g.add_road("A", "C", 1)
        g.add_road("C", "D", 1)
        g.add_road("B", "D", 2)
        return g

    def test_same_start_and_end(self):
        g = self._simple_graph()
        time, path = g.dijkstra("A", "A")
        assert time == 0.0
        assert path == ["A"]

    def test_direct_route(self):
        g = self._simple_graph()
        time, path = g.dijkstra("A", "B")
        # Shortest: A→C→D→B = 1+1+2 = 4, same as direct A→B = 4
        assert time == 4.0

    def test_indirect_shorter_route(self):
        g = self._simple_graph()
        time, path = g.dijkstra("A", "D")
        # A→C→D = 1+1 = 2, shorter than A→B→D = 4+2 = 6
        assert time == 2.0
        assert path == ["A", "C", "D"]

    def test_no_path_returns_none(self):
        g = Graph()
        g.add_location("A")
        g.add_location("B")
        time, path = g.dijkstra("A", "B")
        assert time is None
        assert path == []

    def test_unknown_start_raises(self):
        g = self._simple_graph()
        with pytest.raises(KeyError):
            g.dijkstra("X", "A")

    def test_unknown_end_raises(self):
        g = self._simple_graph()
        with pytest.raises(KeyError):
            g.dijkstra("A", "Z")


# ---------------------------------------------------------------------------
# Dijkstra – path correctness
# ---------------------------------------------------------------------------

class TestDijkstraPath:
    def test_path_starts_and_ends_correctly(self):
        g = Graph()
        g.add_road("Hospital", "City Center", 5)
        g.add_road("City Center", "Airport", 10)
        _, path = g.dijkstra("Hospital", "Airport")
        assert path[0] == "Hospital"
        assert path[-1] == "Airport"

    def test_path_continuity(self):
        """Every consecutive pair in the path must share a direct road."""
        g = build_demo_graph()
        _, path = g.dijkstra("Hospital", "Airport")
        assert len(path) >= 2
        # Verify the path is actually connected
        for i in range(len(path) - 1):
            neighbours = [n for n, _ in g._adj[path[i]]]
            assert path[i + 1] in neighbours, (
                f"No direct road from '{path[i]}' to '{path[i + 1]}'"
            )

    def test_total_time_matches_path_edges(self):
        """Sum of edge weights along the returned path equals total_time."""
        g = build_demo_graph()
        total_time, path = g.dijkstra("Hospital", "Suburb North")
        # Build a lookup for quick edge-weight retrieval
        edge_map: Dict[Tuple[str, str], float] = {}
        for node, neighbours in g._adj.items():
            for neighbour, weight in neighbours:
                edge_map[(node, neighbour)] = weight

        computed = sum(
            edge_map[(path[i], path[i + 1])] for i in range(len(path) - 1)
        )
        assert computed == pytest.approx(total_time)


# ---------------------------------------------------------------------------
# Demo graph
# ---------------------------------------------------------------------------

class TestDemoGraph:
    def test_demo_graph_has_expected_locations(self):
        g = build_demo_graph()
        expected = {
            "Airport", "City Center", "East Junction", "Hospital",
            "North Station", "South Market", "Suburb North",
            "Suburb South", "West Bridge",
        }
        assert expected.issubset(set(g.locations))

    def test_hospital_to_airport_route_exists(self):
        g = build_demo_graph()
        time, path = g.dijkstra("Hospital", "Airport")
        assert time is not None
        assert len(path) >= 2

    def test_shortest_path_is_optimal(self):
        """Hospital → Airport fastest known path is 18 min (via City Center → East Junction)."""
        g = build_demo_graph()
        time, _ = g.dijkstra("Hospital", "Airport")
        assert time == pytest.approx(18.0)


# ---------------------------------------------------------------------------
# Formatting helper
# ---------------------------------------------------------------------------

class TestFormatRoute:
    def test_format_contains_locations(self):
        result = _format_route(["A", "B", "C"], 12.5)
        assert "A" in result
        assert "B" in result
        assert "C" in result

    def test_format_contains_time(self):
        result = _format_route(["A", "B"], 7.0)
        assert "7.0" in result

    def test_format_arrow_separator(self):
        result = _format_route(["X", "Y", "Z"], 5.0)
        assert "→" in result


# ---------------------------------------------------------------------------
# Case-insensitive location resolver
# ---------------------------------------------------------------------------

class TestResolveLocation:
    def test_exact_match_returned(self):
        g = build_demo_graph()
        assert _resolve_location(g, "Hospital") == "Hospital"

    def test_lowercase_resolves_to_canonical(self):
        g = build_demo_graph()
        assert _resolve_location(g, "hospital") == "Hospital"

    def test_uppercase_resolves_to_canonical(self):
        g = build_demo_graph()
        assert _resolve_location(g, "AIRPORT") == "Airport"

    def test_mixed_case_resolves_to_canonical(self):
        g = build_demo_graph()
        assert _resolve_location(g, "city center") == "City Center"

    def test_unknown_location_returned_unchanged(self):
        g = build_demo_graph()
        assert _resolve_location(g, "Atlantis") == "Atlantis"

