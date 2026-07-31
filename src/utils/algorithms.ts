/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GraphNode,
  GraphEdge,
  PathfindingStep,
  Place,
  HashBucket,
  HashTableItem,
  BSTNode,
  BSTStep,
} from '../types';

// ==========================================
// Shared adjacency list helper
// ==========================================
function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[]) {
  const adj: Record<string, { target: string; distance: number; roadName: string }[]> = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
  });
  edges.forEach((e) => {
    if (e.isBlocked) return; // ignore blocked roads
    adj[e.from]?.push({ target: e.to, distance: e.distance, roadName: e.roadName });
    adj[e.to]?.push({ target: e.from, distance: e.distance, roadName: e.roadName });
  });

  const nameOf = (id: string) => nodes.find((n) => n.id === id)?.name || id;

  // Sort neighbors alphabetically for deterministic traversal order,
  // matching `sorted(self.graph.get(node, []))` in Smart_Tour_Planning_System.py
  Object.keys(adj).forEach((k) => {
    adj[k].sort((a, b) => nameOf(a.target).localeCompare(nameOf(b.target)));
  });

  return { adj, nameOf };
}

// ==========================================
// 1. GRAPH PATHFINDING - DIJKSTRA'S ALGORITHM
// ==========================================

/**
 * Generates all steps for Dijkstra's Shortest Path Algorithm
 */
export function solveDijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const { adj, nameOf } = buildAdjacency(nodes, edges);

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited: string[] = [];
  const frontier: string[] = [startId];

  nodes.forEach((n) => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  });
  distances[startId] = 0;

  steps.push({
    currentNodeId: null,
    distances: { ...distances },
    previous: { ...previous },
    visited: [],
    frontier: [startId],
    description: `Initialize Dijkstra: Start node is set to ${nameOf(startId)} with distance 0m. All other node distances are initialized to Infinity.`,
  });

  while (frontier.length > 0) {
    // Sort frontier by distance (Min-Priority Queue behavior)
    frontier.sort((a, b) => distances[a] - distances[b]);
    const currId = frontier.shift()!;
    visited.push(currId);

    const currNodeName = nameOf(currId);

    if (distances[currId] === Infinity) {
      steps.push({
        currentNodeId: currId,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        frontier: [...frontier],
        description: `No reachable paths remaining. Rest of the unvisited nodes are inaccessible.`,
      });
      break;
    }

    steps.push({
      currentNodeId: currId,
      distances: { ...distances },
      previous: { ...previous },
      visited: [...visited],
      frontier: [...frontier],
      description: `Extract node with minimum distance: ${currNodeName} (${distances[currId]}m) from priority queue. Visiting and exploring its neighbors.`,
    });

    if (currId === endId) {
      steps.push({
        currentNodeId: currId,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        frontier: [...frontier],
        description: `Destination node ${currNodeName} reached! Shortest path search is complete. Recalculating path by backtracking.`,
      });
      break;
    }

    // Process neighbors
    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      if (visited.includes(edge.target)) continue;

      const alt = distances[currId] + edge.distance;
      const targetName = nameOf(edge.target);

      if (alt < distances[edge.target]) {
        const oldDist = distances[edge.target] === Infinity ? 'Infinity' : `${distances[edge.target]}m`;
        distances[edge.target] = alt;
        previous[edge.target] = currId;

        if (!frontier.includes(edge.target)) {
          frontier.push(edge.target);
        }

        steps.push({
          currentNodeId: currId,
          distances: { ...distances },
          previous: { ...previous },
          visited: [...visited],
          frontier: [...frontier],
          description: `Relaxing edge along "${edge.roadName}": Found shorter route to ${targetName}. Distance updated from ${oldDist} to ${alt}m via ${currNodeName}.`,
        });
      } else {
        steps.push({
          currentNodeId: currId,
          distances: { ...distances },
          previous: { ...previous },
          visited: [...visited],
          frontier: [...frontier],
          description: `Evaluating edge along "${edge.roadName}" to ${targetName}: Path through ${currNodeName} (${alt}m) is not shorter than current known distance (${distances[edge.target]}m). Skipping.`,
        });
      }
    }
  }

  return steps;
}

// ==========================================
// 2. GRAPH TRAVERSAL - BFS & DFS
// ==========================================

/**
 * Generates all steps for a Breadth-First Search traversal of the road network,
 * starting from a single site (FIFO queue).
 */
export function solveGraphBFS(nodes: GraphNode[], edges: GraphEdge[], startId: string): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const { adj, nameOf } = buildAdjacency(nodes, edges);

  const distances: Record<string, number> = {}; // hop level from start
  const previous: Record<string, string | null> = {};
  const visited: string[] = [];
  const discovered = new Set<string>([startId]);
  const queue: string[] = [startId];

  nodes.forEach((n) => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  });
  distances[startId] = 0;

  steps.push({
    currentNodeId: null,
    distances: { ...distances },
    previous: { ...previous },
    visited: [],
    frontier: [...queue],
    description: `Initialize BFS: Enqueue start node ${nameOf(startId)}. BFS explores the road network level by level (nearest sites first).`,
  });

  while (queue.length > 0) {
    const currId = queue.shift()!;
    visited.push(currId);
    const currName = nameOf(currId);

    steps.push({
      currentNodeId: currId,
      distances: { ...distances },
      previous: { ...previous },
      visited: [...visited],
      frontier: [...queue],
      description: `Dequeue ${currName} (hop ${distances[currId]}) from the front of the queue and visit it.`,
    });

    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      if (discovered.has(edge.target)) continue;
      discovered.add(edge.target);
      distances[edge.target] = distances[currId] + 1;
      previous[edge.target] = currId;
      queue.push(edge.target);

      steps.push({
        currentNodeId: currId,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        frontier: [...queue],
        description: `Enqueue ${nameOf(edge.target)}, reached via "${edge.roadName}" from ${currName} (hop ${distances[edge.target]}).`,
      });
    }
  }

  return steps;
}

/**
 * Generates all steps for a Depth-First Search traversal of the road network,
 * starting from a single site (LIFO stack).
 */
export function solveGraphDFS(nodes: GraphNode[], edges: GraphEdge[], startId: string): PathfindingStep[] {
  const steps: PathfindingStep[] = [];
  const { adj, nameOf } = buildAdjacency(nodes, edges);

  const distances: Record<string, number> = {}; // depth level from start
  const previous: Record<string, string | null> = {};
  const visited: string[] = [];
  const visitedSet = new Set<string>();
  const stack: string[] = [startId];

  nodes.forEach((n) => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  });
  distances[startId] = 0;

  steps.push({
    currentNodeId: null,
    distances: { ...distances },
    previous: { ...previous },
    visited: [],
    frontier: [...stack],
    description: `Initialize DFS: Push start node ${nameOf(startId)} onto the stack. DFS explores as deep as possible along one route before backtracking.`,
  });

  while (stack.length > 0) {
    const currId = stack.pop()!;

    if (visitedSet.has(currId)) {
      continue;
    }

    visitedSet.add(currId);
    visited.push(currId);
    const currName = nameOf(currId);

    steps.push({
      currentNodeId: currId,
      distances: { ...distances },
      previous: { ...previous },
      visited: [...visited],
      frontier: [...stack],
      description: `Pop ${currName} (depth ${distances[currId]}) from the top of the stack and visit it.`,
    });

    const neighbors = adj[currId] || [];
    const unvisitedNeighbors = neighbors.filter((edge) => !visitedSet.has(edge.target));

    // Push in reverse alphabetical order so the alphabetically-first neighbor is popped next (LIFO)
    for (const edge of [...unvisitedNeighbors].reverse()) {
      if (previous[edge.target] === null && edge.target !== startId) {
        previous[edge.target] = currId;
        distances[edge.target] = distances[currId] + 1;
      }
      stack.push(edge.target);
    }

    if (unvisitedNeighbors.length > 0) {
      steps.push({
        currentNodeId: currId,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        frontier: [...stack],
        description: `Push unvisited neighbors of ${currName} onto the stack: [${unvisitedNeighbors.map((e) => nameOf(e.target)).join(', ')}].`,
      });
    }
  }

  return steps;
}

// ==========================================
// 3. HASH TABLE IMPLEMENTATION
// ==========================================

export const HASH_TABLE_CAPACITY = 13;

export function computeCustomHash(key: string): { hashCode: number; index: number } {
  let hashCode = 0;
  for (let i = 0; i < key.length; i++) {
    // Elegant weighted ASCII sum hash function
    hashCode += key.charCodeAt(i) * (i + 1) * 31;
  }
  const index = Math.abs(hashCode) % HASH_TABLE_CAPACITY;
  return { hashCode, index };
}

export function buildHashTable(places: Place[]): HashBucket[] {
  const table: HashBucket[] = Array.from({ length: HASH_TABLE_CAPACITY }, (_, index) => ({
    index,
    items: [],
  }));

  places.forEach((place) => {
    const { hashCode, index } = computeCustomHash(place.name);
    table[index].items.push({
      key: place.name,
      value: place,
      hashCode,
    });
  });

  return table;
}

// ==========================================
// 4. TREE - BINARY SEARCH TREE (ordered by name)
//    Exposed operations: Search
// ==========================================

/**
 * Builds a BST from the heritage site list, inserting in dataset order and
 * comparing by lowercase Name - mirroring HeritageBST.insert() in
 * Smart_Tour_Planning_System.py
 */
export function buildBST(places: Place[]): BSTNode | null {
  const insert = (node: BSTNode | null, place: Place): BSTNode => {
    if (node === null) {
      return { id: place.id, place, left: null, right: null };
    }
    if (place.name.toLowerCase() < node.place.name.toLowerCase()) {
      node.left = insert(node.left, place);
    } else {
      node.right = insert(node.right, place);
    }
    return node;
  };

  let root: BSTNode | null = null;
  places.forEach((p) => {
    root = insert(root, p);
  });
  return root;
}

/**
 * Step-by-step BST search by site Name (mirrors HeritageBST.search())
 */
export function solveBSTSearch(root: BSTNode | null, query: string): BSTStep[] {
  const steps: BSTStep[] = [];
  const target = query.trim().toLowerCase();
  const visited: string[] = [];

  steps.push({
    currentId: null,
    visitedIds: [],
    description: `Start BST search for "${query}" at the root node.`,
  });

  let current = root;
  while (current) {
    visited.push(current.id);
    const currentName = current.place.name.toLowerCase();

    if (target === currentName) {
      steps.push({
        currentId: current.id,
        visitedIds: [...visited],
        description: `Match found! "${current.place.name}" equals the search key "${query}".`,
        comparison: 'found',
        result: current.place,
      });
      return steps;
    }

    if (target < currentName) {
      steps.push({
        currentId: current.id,
        visitedIds: [...visited],
        description: `"${query}" comes before "${current.place.name}" alphabetically. Move to the left subtree.`,
        comparison: 'left',
      });
      current = current.left;
    } else {
      steps.push({
        currentId: current.id,
        visitedIds: [...visited],
        description: `"${query}" comes after "${current.place.name}" alphabetically. Move to the right subtree.`,
        comparison: 'right',
      });
      current = current.right;
    }
  }

  steps.push({
    currentId: null,
    visitedIds: [...visited],
    description: `Reached an empty subtree. "${query}" was not found in the tree.`,
    comparison: 'none',
    result: null,
  });

  return steps;
}

