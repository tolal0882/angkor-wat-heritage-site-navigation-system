/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GRAPH_NODES, INITIAL_EDGES } from './data/graph';
import { PLACES } from './data/places';
import { GraphAlgorithm, PathfindingStep, GraphEdge, GraphNode } from './types';
import { solveDijkstra, solveGraphBFS, solveGraphDFS } from './utils/algorithms';

// Components
import MapContainer from './components/MapContainer';
import AlgorithmControls from './components/AlgorithmControls';
import TreeVisualizer from './components/TreeVisualizer';
import HashTableVisualizer from './components/HashTableVisualizer';

// Icons
import {
  Compass,
  MapPin,
  Network,
  Hash,
  Award,
  ChevronRight,
  BookOpen,
  Info,
  History,
  Workflow,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'navigation' | 'tree' | 'hash_table'>('navigation');

  // Graph state (allows toggling blocked status of road connections)
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [nodes] = useState<GraphNode[]>(GRAPH_NODES);

  // Pathfinding / traversal states
  const [startId, setStartId] = useState<string | null>('angkor_wat'); // default starting point: Angkor Wat
  const [endId, setEndId] = useState<string | null>('kravan'); // default target: Kravan (only used by Dijkstra)
  const [algorithm, setAlgorithm] = useState<GraphAlgorithm>('dijkstra');
  const [speed, setSpeed] = useState<number>(600); // simulation timer delay

  // Active step playback states
  const [steps, setSteps] = useState<PathfindingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [shortestPath, setShortestPath] = useState<string[]>([]);
  const [directions, setDirections] = useState<{ road: string; dist: number; node: string }[]>([]);
  const [traversalOrder, setTraversalOrder] = useState<string[]>([]);

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Re-generate steps on endpoint, routing, algorithm, or edge constraint updates
  useEffect(() => {
    handleResetSimulation();

    if (algorithm === 'dijkstra') {
      if (startId && endId) {
        const resolvedSteps = solveDijkstra(nodes, edges, startId, endId);
        setSteps(resolvedSteps);
        setTraversalOrder([]);

        // Calculate final path for instant evaluation
        const finalStep = resolvedSteps[resolvedSteps.length - 1];
        if (finalStep && finalStep.currentNodeId === endId) {
          rebuildFinalPath(finalStep.previous);
        } else {
          setShortestPath([]);
          setDirections([]);
        }
      } else {
        setSteps([]);
        setShortestPath([]);
        setDirections([]);
        setTraversalOrder([]);
      }
    } else {
      if (startId) {
        const resolvedSteps = algorithm === 'bfs' ? solveGraphBFS(nodes, edges, startId) : solveGraphDFS(nodes, edges, startId);
        setSteps(resolvedSteps);
        const finalStep = resolvedSteps[resolvedSteps.length - 1];
        setTraversalOrder(finalStep?.visited ?? []);
        setShortestPath([]);
        setDirections([]);
      } else {
        setSteps([]);
        setTraversalOrder([]);
        setShortestPath([]);
        setDirections([]);
      }
    }
  }, [startId, endId, algorithm, edges]);

  // Handle Playback Loop
  useEffect(() => {
    if (isRunning) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            handlePauseSimulation();
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isRunning, steps, speed]);

  const handlePlayPauseSimulation = () => {
    if (isRunning) {
      handlePauseSimulation();
    } else {
      if (currentStepIndex >= steps.length - 1) {
        setCurrentStepIndex(0);
      }
      setIsRunning(true);
    }
  };

  const handlePauseSimulation = () => {
    setIsRunning(false);
  };

  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleResetSimulation = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
  };

  // Build the final highlight path by backtracking parent maps
  const rebuildFinalPath = (parentMap: Record<string, string | null>) => {
    if (!endId || !startId) return;
    const path: string[] = [];
    let curr: string | null = endId;
    
    while (curr !== null) {
      path.push(curr);
      curr = parentMap[curr];
    }
    path.reverse();

    if (path[0] === startId) {
      setShortestPath(path);
      
      // Generate written directional itinerary
      const routeDirections: { road: string; dist: number; node: string }[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edge = edges.find(
          (e) => (e.from === u && e.to === v) || (e.from === v && e.to === u)
        );
        if (edge) {
          const nextNodeName = nodes.find((n) => n.id === v)?.name || v;
          routeDirections.push({
            road: edge.roadName,
            dist: edge.distance,
            node: nextNodeName,
          });
        }
      }
      setDirections(routeDirections);
    } else {
      setShortestPath([]);
      setDirections([]);
    }
  };

  // Toggle blocked road edges
  const handleToggleEdge = (edgeId: string) => {
    setEdges((prev) =>
      prev.map((e) => (e.id === edgeId ? { ...e, isBlocked: !e.isBlocked } : e))
    );
  };

  const currentStep = steps[currentStepIndex] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F5] via-[#F4F2E9] to-[#EAE6D8] text-slate-800 font-sans flex flex-col selection:bg-amber-200">
      
      {/* 1. Header Banner */}
      <header className="bg-slate-900 text-white relative overflow-hidden border-b-4 border-amber-500 shadow-md">
        {/* Khmer Decorative Background layer */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-6 py-6 md:py-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                Cambodia Heritage Site
              </span>
              <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Workflow className="w-3 h-3" />
                DSA Course Project
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-amber-400">
              Angkor Wat Heritage Site Navigation System
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-sans max-w-3xl leading-relaxed">
              An advanced interactive simulator combining three fundamental computer science structures:
              <strong className="text-amber-300 font-medium"> Hash Tables</strong> for high-speed indexing,
              <strong className="text-amber-300 font-medium"> Binary Search Trees</strong> for Search / Find-Min / Find-Max lookups, and
              <strong className="text-amber-300 font-medium"> Graph Theory</strong> with Dijkstra's, BFS & DFS routing.
            </p>
          </div>

          {/* Core metrics HUD */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex gap-6 text-xs backdrop-blur-xs shadow-inner">
            <div className="text-center">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Graph Vertices</span>
              <span className="font-mono font-bold text-amber-400 text-base">{nodes.length} Nodes</span>
            </div>
            <div className="border-l border-slate-700" />
            <div className="text-center">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Graph Edges</span>
              <span className="font-mono font-bold text-amber-400 text-base">{edges.length} Roads</span>
            </div>
            <div className="border-l border-slate-700" />
            <div className="text-center">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Hash Capacity</span>
              <span className="font-mono font-bold text-amber-400 text-base">13 Buckets</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Unified Navigation Tabs */}
      <nav className="max-w-7xl mx-auto w-full px-6 mt-6">
        <div className="bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-1.5">
          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200
              ${
                activeTab === 'navigation'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Compass className={`w-4 h-4 ${activeTab === 'navigation' ? 'text-amber-400' : 'text-slate-500'}`} />
            Site Transit Map (Graph Routing)
          </button>
          
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200
              ${
                activeTab === 'tree'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Network className={`w-4 h-4 ${activeTab === 'tree' ? 'text-amber-400' : 'text-slate-500'}`} />
            Site Directory (Binary Search Tree)
          </button>
          
          <button
            onClick={() => setActiveTab('hash_table')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200
              ${
                activeTab === 'hash_table'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Hash className={`w-4 h-4 ${activeTab === 'hash_table' ? 'text-amber-400' : 'text-slate-500'}`} />
            High-Speed Search (Hash Table Chaining)
          </button>
        </div>
      </nav>

      {/* 3. Primary Content Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'navigation' && (
            <motion.div
              key="navigation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Map Canvas and Info */}
              <MapContainer
                nodes={nodes}
                edges={edges}
                places={PLACES}
                startId={startId}
                endId={endId}
                setStartId={setStartId}
                setEndId={setEndId}
                currentStep={currentStep}
                shortestPath={shortestPath}
                onToggleEdge={handleToggleEdge}
                requireTarget={algorithm === 'dijkstra'}
              />

              {/* Pathfinding controllers and queue tracking */}
              <AlgorithmControls
                algorithm={algorithm}
                setAlgorithm={setAlgorithm}
                isRunning={isRunning}
                onPlayPause={handlePlayPauseSimulation}
                onStepForward={handleStepForward}
                onStepBackward={handleStepBackward}
                onReset={handleResetSimulation}
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                currentStep={currentStep}
                speed={speed}
                setSpeed={setSpeed}
                nodes={nodes}
              />

              {/* Traversal Order Card (BFS / DFS) */}
              {algorithm !== 'dijkstra' && traversalOrder.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    {algorithm === 'bfs' ? 'BFS' : 'DFS'} Traversal Order
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Order in which heritage sites are visited starting from{' '}
                    <strong className="text-slate-700">{nodes.find((n) => n.id === startId)?.name}</strong>, following the{' '}
                    {algorithm === 'bfs' ? 'FIFO queue' : 'LIFO stack'} discipline.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {traversalOrder.map((id, idx) => (
                      <React.Fragment key={id}>
                        <span className="bg-slate-900 text-white text-xs font-mono px-2.5 py-1 rounded-lg">
                          {nodes.find((n) => n.id === id)?.name || id}
                        </span>
                        {idx < traversalOrder.length - 1 && <span className="text-slate-300 font-bold">&rarr;</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Shortest Path Written Directions Card */}
              {algorithm === 'dijkstra' && shortestPath.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4 space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      Calculated Routing Itinerary
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Generated path finding directives detailing chronological waypoints, corresponding roadways, and distance segments.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2 font-sans text-slate-700">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Total Transit Distance:</span>
                        <span className="font-mono text-emerald-600">
                          {(directions.reduce((sum, d) => sum + d.dist, 0) / 1000).toFixed(2)} km
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Est. TukTuk Duration:</span>
                        <span>
                          {Math.round(directions.reduce((sum, d) => sum + d.dist, 0) / 333)} mins (20km/h)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-8 overflow-y-auto max-h-[220px] pr-2 space-y-2">
                    <div className="relative pl-5 border-l-2 border-dashed border-emerald-300 space-y-4 py-1">
                      {/* Start Waypoint marker */}
                      <div className="absolute -left-[7px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                      <div className="text-xs">
                        <span className="font-bold text-emerald-700">Departing from:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {nodes.find((n) => n.id === startId)?.name}
                        </span>
                      </div>

                      {/* Direction items */}
                      {directions.map((dir, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300 border-2 border-white" />
                          <div className="text-xs leading-relaxed text-slate-600">
                            Navigate along <span className="font-semibold text-slate-800">"{dir.road}"</span> for{' '}
                            <span className="font-mono font-semibold text-slate-800">{(dir.dist / 1000).toFixed(2)}km</span>
                            {' '}to reach <span className="font-semibold text-slate-800">{dir.node}</span>.
                          </div>
                        </div>
                      ))}

                      {/* End Waypoint marker */}
                      <div className="absolute -left-[7px] bottom-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tree' && (
            <motion.div
              key="tree"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TreeVisualizer />
            </motion.div>
          )}

          {activeTab === 'hash_table' && (
            <motion.div
              key="hash_table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HashTableVisualizer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Academic Cooperation/Report Footer */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800 py-10 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* DSA Integration Flow diagram */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 animate-pulse" />
              Academic Report: How the Three Data Structures Collaborate
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-5xl">
              In a professional-grade production suite, data structures rarely operate in isolation. This application connects them in an end-to-end data pipelines model suitable for architectural reviews:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Box 1 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-mono font-bold">1</span>
                  <h5 className="font-semibold text-xs text-white">O(1) Hash Query Entry</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When a traveler inputs a destination, the system avoids costly linear searches. It queries the <strong className="text-slate-300">Hash Table</strong> which executes a polynomial hash index probe in constant time <strong className="text-amber-400">O(1)</strong>, immediately locating metadata.
                </p>
              </div>

              {/* Box 2 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-mono font-bold">2</span>
                  <h5 className="font-semibold text-xs text-white">Binary Search Tree Lookup</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Retrieved metadata is indexed inside a <strong className="text-slate-300">Binary Search Tree</strong> ordered alphabetically by site name. It supports <strong className="text-amber-400">Search</strong>, <strong className="text-amber-400">Find-Min</strong>, and <strong className="text-amber-400">Find-Max</strong> in O(log n) average time.
                </p>
              </div>

              {/* Box 3 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-mono font-bold">3</span>
                  <h5 className="font-semibold text-xs text-white">Graph Routing & Traversal</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Finally, the site is passed to the <strong className="text-slate-300">Graph Adjacency List</strong>. Dijkstra's algorithm finds the shortest weighted route in <strong className="text-indigo-400">O((V + E) log V)</strong> time, while BFS/DFS explore full reachability from a chosen starting temple.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright/Closing credits */}
          <div className="flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 font-mono gap-4 pt-4 border-t border-slate-800">
            <div>
              <span>Angkor Wat Heritage Site Navigation System v1.0.0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Built for Data Structures & Algorithms Coursework</span>
              <span>•</span>
              <span className="text-slate-400">Siem Reap, Cambodia</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
