# Emergency Route System

A system that calculates the fastest route for emergency vehicles (ambulances,
police, fire services) using **Dijkstra's shortest-path algorithm**.  Locations
are modelled as graph nodes and roads as weighted edges (travel time in
minutes).

---

## Features

- **Dijkstra's algorithm** – guarantees the globally optimal (fastest) route.
- **Bidirectional roads** – roads are two-way by default; one-way roads are
  also supported.
- **Interactive CLI** – enter any start and destination location to get the
  fastest route instantly.  Locations are matched **case-insensitively**.
- **Custom locations & roads** – add your own locations and roads at runtime
  via the CLI without modifying any source code.
- **Demo city graph** – a built-in sample network of 9 locations so the system
  works out of the box.

## Requirements

- Python 3.9 or later (no third-party runtime dependencies)

## Usage

```bash
python3 emergency_route.py
```

Sample session:

```
============================================================
       EMERGENCY ROUTE SYSTEM
  Fastest route calculator for emergency vehicles
============================================================

Options:
  1. Find fastest route
  2. List all locations
  3. Add a custom location
  4. Add a custom road
  5. Exit
Select option [1/2/3/4/5]: 1

Available locations:
  • Airport
  • City Center
  • East Junction
  • Hospital
  • North Station
  • South Market
  • Suburb North
  • Suburb South
  • West Bridge

Enter start location: hospital
Enter destination: airport

✔ Fastest route found:

  Route  : Hospital → City Center → East Junction → Airport
  Stops  : 4 location(s)
  Time   : 18.0 minutes
```

## Programmatic API

```python
from emergency_route import Graph

g = Graph()
g.add_road("Fire Station", "Main Street", 3)
g.add_road("Main Street",  "Hospital",    5)
g.add_road("Fire Station", "Hospital",   12)

total_time, path = g.dijkstra("Fire Station", "Hospital")
print(total_time)  # 8.0
print(path)        # ['Fire Station', 'Main Street', 'Hospital']
```

## Running Tests

```bash
python3 -m pytest tests/ -v
```
