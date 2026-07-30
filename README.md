# Angkor Wat Heritage Site Navigation System

An interactive data structures and algorithms visualizer for the Angkor Wat
Archaeological Park, built for a DSA (Data Structures & Algorithms) course
project. It mirrors the canonical dataset and algorithms used in
`Smart_Tour_Planning_System.py`, the Python reference implementation for the
same project.

## What it demonstrates

- **Graph** (`src/utils/algorithms.ts`) - the road network between 14
  heritage sites, modeled as a weighted, undirected adjacency list.
  - **Dijkstra's Algorithm** - shortest route between any two sites.
  - **BFS** - level-by-level exploration from a chosen starting site.
  - **DFS** - depth-first exploration from a chosen starting site.
- **Binary Search Tree** - sites indexed alphabetically by name, supporting
  **Search**, **Find-Min**, **Find-Max**, and **Preorder Traversal**.
- **Hash Table** - O(1) average lookup of a heritage site by name, with a
  visualized chaining/collision model.

See [ANGKOR_WAT_DATASET.md](ANGKOR_WAT_DATASET.md) for the full dataset and
road network.

## Run locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Other commands

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # TypeScript type-check
```
