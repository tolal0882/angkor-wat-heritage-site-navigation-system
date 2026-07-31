# Angkor Heritage Site Dataset Report

This app's dataset mirrors the canonical dataset used across the whole DSA final
project (`Dataset/Data_Collection_PBL.xlsx` and `Smart_Tour_Planning_System.py`),
so the Python CLI and this web visualizer describe the exact same 14 heritage
sites and road network.

## Dataset Overview

- **Total Heritage Sites:** 14
- **Total Road Connections:** 18 bilateral road segments
- **Categories:** Main Temple (2), Mountain Temple (3), Hindu Temple (2), Monastery Temple (2), Historical Monument (5)

## Complete Location Dataset (14 Sites)

| ID | Name | Category | Opening Hours |
| :--- | :--- | :--- | :--- |
| T01 | Angkor Wat | Main Temple | 5:00 AM - 5:30 PM |
| T02 | Phnom Bakheng | Mountain Temple | 5:00 AM - 5:30 PM |
| T03 | Bayon | Main Temple | 7:30 AM - 5:30 PM |
| T04 | Baphuon | Mountain Temple | 7:30 AM - 5:30 PM |
| T05 | Terrace of the Elephants | Historical Monument | 7:30 AM - 5:30 PM |
| T06 | Terrace of the Leper King | Historical Monument | 7:30 AM - 5:30 PM |
| T07 | Tep Pranam | Historical Monument | 7:30 AM - 5:30 PM |
| T08 | Preah Pithu U | Historical Monument | 7:30 AM - 5:30 PM |
| T09 | Ta Tuot | Historical Monument | 7:30 AM - 5:30 PM |
| T10 | Ta Keo | Mountain Temple | 7:30 AM - 5:30 PM |
| T11 | Ta Prohm | Monastery Temple | 7:30 AM - 5:30 PM |
| T12 | Banteay Kdei | Monastery Temple | 7:30 AM - 5:30 PM |
| T13 | Kravan | Hindu Temple | 7:30 AM - 5:30 PM |
| T14 | Thommanon | Hindu Temple | 7:30 AM - 5:30 PM |

Full descriptions, builders, and historical eras are in `src/data/places.ts`.

## Graph Topology: Road Network (18 Edges)

| From | To | Distance (km) |
| :--- | :--- | :---: |
| Angkor Wat | Phnom Bakheng | 1.3 |
| Angkor Wat | Kravan | 5.0 |
| Bayon | Terrace of the Elephants | 1.1 |
| Bayon | Baphuon | 0.9 |
| Thommanon | Bayon | 2.4 |
| Phnom Bakheng | Bayon | 2.0 |
| Baphuon | Terrace of the Elephants | 0.19 |
| Baphuon | Tep Pranam | 0.75 |
| Ta Keo | Ta Prohm | 1.4 |
| Thommanon | Ta Keo | 0.7 |
| Ta Tuot | Ta Keo | 2.8 |
| Terrace of the Elephants | Terrace of the Leper King | 0.35 |
| Terrace of the Leper King | Tep Pranam | 1.0 |
| Tep Pranam | Preah Pithu U | 0.35 |
| Preah Pithu U | Ta Tuot | 0.10 |
| Terrace of the Elephants | Thommanon | 2.0 |
| Ta Prohm | Banteay Kdei | 0.6 |
| Banteay Kdei | Kravan | 1.5 |

Full edge list (converted to meters) is in `src/data/graph.ts`.

## Data Structures & Algorithms Used

1. **Hash Table** (`src/utils/algorithms.ts` - `buildHashTable`, `computeCustomHash`) -
   O(1) average lookup of a heritage site by ID (e.g. `T01`) via a polynomial
   ASCII hash with chaining (13 buckets).
2. **Binary Search Tree** (`buildBST`, `solveBSTBrowseCategory`) - sites are
   filed under their Category, and Category nodes are compared alphabetically.
   Only **Browse by Category** is exposed as a user operation (no
   Insert/Delete UI), matching `HeritageBST` in `Smart_Tour_Planning_System.py`.
3. **Graph** (`solveDijkstra`, `solveGraphBFS`, `solveGraphDFS`) - the road
   network is modeled as a weighted, undirected adjacency list.
   - **Dijkstra's Algorithm** finds the shortest route (by distance) between
     any two sites.
   - **BFS** explores the network level-by-level from a chosen starting site
     (FIFO queue).
   - **DFS** explores as deep as possible along one route before backtracking
     (LIFO stack).
