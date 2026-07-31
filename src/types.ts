/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlaceType =
  | 'Main Temple'
  | 'Mountain Temple'
  | 'Hindu Temple'
  | 'Monastery Temple'
  | 'Historical Monument';

export interface Place {
  id: string;
  templeId: string; // Human-readable ID, e.g. "T01", matching the Excel dataset's Temple ID column
  name: string;
  type: PlaceType;
  openingHours: string;
  description: string;
  x: number; // SVG mapping coordinates (0 - 1000)
  y: number; // SVG mapping coordinates (0 - 1000)
}

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isPlace: boolean;
  placeId?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  distance: number; // in meters
  roadName: string;
  isBlocked: boolean;
}

export interface HashTableItem {
  key: string;
  value: Place;
  hashCode: number;
}

export interface HashBucket {
  index: number;
  items: HashTableItem[];
}

export type GraphAlgorithm = 'dijkstra' | 'bfs' | 'dfs';

export interface PathfindingStep {
  currentNodeId: string | null;
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  visited: string[];
  frontier: string[]; // queue / stack / min-heap items
  description: string;
}

// ==========================================
// Binary Search Tree (ordered by Category)
// ==========================================
export interface BSTNode {
  id: string;
  category: PlaceType;
  places: Place[];
  left: BSTNode | null;
  right: BSTNode | null;
}

export interface BSTStep {
  currentId: string | null;
  visitedIds: string[];
  description: string;
  comparison?: 'left' | 'right' | 'found' | 'none';
  result?: Place[] | null;
}
