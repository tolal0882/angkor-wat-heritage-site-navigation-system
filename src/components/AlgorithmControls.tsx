/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Clock, Compass, HelpCircle } from 'lucide-react';
import { GraphAlgorithm, PathfindingStep, GraphNode } from '../types';

interface AlgorithmControlsProps {
  algorithm: GraphAlgorithm;
  setAlgorithm: (alg: GraphAlgorithm) => void;
  isRunning: boolean;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: PathfindingStep | null;
  speed: number; // in ms
  setSpeed: (ms: number) => void;
  nodes: GraphNode[];
}

const FRONTIER_LABEL: Record<GraphAlgorithm, string> = {
  dijkstra: 'Min-Priority Queue (Frontier Set)',
  bfs: 'FIFO Queue (Frontier Set)',
  dfs: 'LIFO Stack (Frontier Set)',
};

const FRONTIER_TAG: Record<GraphAlgorithm, string> = {
  dijkstra: 'Min-PQ',
  bfs: 'Queue',
  dfs: 'Stack',
};

export default function AlgorithmControls({
  algorithm,
  setAlgorithm,
  isRunning,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onReset,
  currentStepIndex,
  totalSteps,
  currentStep,
  speed,
  setSpeed,
  nodes,
}: AlgorithmControlsProps) {
  const formatNodeName = (id: string) => {
    return nodes.find((n) => n.id === id)?.name || id;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* 1. Algorithm Selection Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            Graph Routing & Traversal Engine
          </h3>
          <p className="text-xs text-slate-500">
            Compare Dijkstra's shortest path, Breadth-First Search, and Depth-First Search step-by-step
          </p>
        </div>

        {/* Custom Segmented Buttons */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full md:w-auto">
          <button
            onClick={() => setAlgorithm('dijkstra')}
            disabled={isRunning}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-medium text-xs transition-all duration-200
              ${
                algorithm === 'dijkstra'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'
              }`}
          >
            Dijkstra's Algorithm
          </button>
          <button
            onClick={() => setAlgorithm('bfs')}
            disabled={isRunning}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-medium text-xs transition-all duration-200
              ${
                algorithm === 'bfs'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'
              }`}
          >
            BFS (Breadth-First)
          </button>
          <button
            onClick={() => setAlgorithm('dfs')}
            disabled={isRunning}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-medium text-xs transition-all duration-200
              ${
                algorithm === 'dfs'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'
              }`}
          >
            DFS (Depth-First)
          </button>
        </div>
      </div>

      {/* 2. Controls Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Playback Buttons */}
        <div className="md:col-span-6 flex flex-wrap items-center gap-2">
          <button
            onClick={onReset}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-slate-700 transition-all"
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onStepBackward}
            disabled={currentStepIndex <= 0 || isRunning}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-slate-700 transition-all disabled:opacity-40 disabled:pointer-events-none"
            title="Step Backward"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-xs text-white transition-all active:scale-95 shadow-sm
              ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
              }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                Pause Solve
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Start Step Solve
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStepIndex >= totalSteps - 1 || isRunning}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-slate-700 transition-all disabled:opacity-40 disabled:pointer-events-none"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Progress Indicator */}
          <span className="text-xs font-mono font-medium text-slate-500 ml-2">
            Step {currentStepIndex + 1} / {Math.max(1, totalSteps)}
          </span>
        </div>

        {/* Speed Adjustment */}
        <div className="md:col-span-6 flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
              <span>Simulation Interval Speed</span>
              <span className="font-mono">{speed}ms</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Terminal Log & Explainer */}
      {currentStep && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Detailed step console log */}
          <div className="md:col-span-8 space-y-2">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Engine Traversal Step Log
            </h4>
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed min-h-[96px] shadow-inner border border-slate-800">
              <span className="text-emerald-400 font-bold">[STEP {currentStepIndex + 1}]:</span> {currentStep.description}
            </div>
          </div>

          {/* Algorithm Info block */}
          <div className="md:col-span-4 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-indigo-950 text-xs flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Algorithm Formulation
              </h5>
              <p className="text-[11px] text-indigo-900 mt-1.5 leading-relaxed">
                {algorithm === 'dijkstra' ? (
                  <>
                    Dijkstra extracts the node with the smallest accumulated road distance <strong className="font-semibold text-indigo-950">g(n)</strong> from a min-priority queue:
                    <code className="block bg-indigo-100/60 p-1 rounded font-mono text-[10px] text-indigo-950 mt-1">f(n) = g(n)</code>
                  </>
                ) : algorithm === 'bfs' ? (
                  <>
                    BFS uses a <strong className="font-semibold text-indigo-950">FIFO Queue</strong>: nodes are enqueued at the rear and dequeued from the front, exploring the road network level by level (unweighted).
                  </>
                ) : (
                  <>
                    DFS uses a <strong className="font-semibold text-indigo-950">LIFO Stack</strong>: nodes are pushed and popped from the top, exploring one route as deep as possible before backtracking.
                  </>
                )}
              </p>
            </div>
            <div className="mt-3 text-[10px] text-indigo-500 italic">
              {algorithm === 'dijkstra'
                ? '*Guarantees the shortest weighted path between two heritage sites.'
                : '*Visits every reachable heritage site from the chosen starting point.'}
            </div>
          </div>
        </div>
      )}

      {/* 4. Data Structure State Panel (Frontier & Visited Set) */}
      {currentStep && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          {/* Frontier */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="bg-indigo-100 text-indigo-700 p-1 rounded text-[10px] font-mono">{FRONTIER_TAG[algorithm]}</span>
              {FRONTIER_LABEL[algorithm]}
            </h4>
            <p className="text-[11px] text-slate-500">
              {algorithm === 'dijkstra'
                ? 'Sorted queue of discovered nodes waiting to be expanded. Shows accumulated distance.'
                : algorithm === 'bfs'
                ? 'Nodes discovered but not yet visited, in enqueue order.'
                : 'Nodes discovered but not yet visited, in push order (top of stack is last).'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {currentStep.frontier.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  {algorithm === 'dfs' ? 'Stack is empty' : 'Queue is empty'}
                </span>
              ) : (
                currentStep.frontier
                  .slice()
                  .sort((a, b) => {
                    if (algorithm === 'dijkstra') {
                      return (currentStep.distances[a] ?? Infinity) - (currentStep.distances[b] ?? Infinity);
                    }
                    return 0; // preserve queue/stack order for BFS/DFS
                  })
                  .map((nodeId) => {
                    const g = currentStep.distances[nodeId];
                    return (
                      <div
                        key={nodeId}
                        className="bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-[11px] font-mono shadow-sm flex items-center gap-1"
                      >
                        <span className="font-semibold text-slate-800">{formatNodeName(nodeId)}</span>
                        <span className="text-indigo-600 bg-indigo-50 px-1 rounded font-bold text-[10px]">
                          {algorithm === 'dijkstra' ? `${g}m` : `hop ${g}`}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Visited (Closed) Set */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="bg-slate-200 text-slate-700 p-1 rounded text-[10px] font-mono">Visited</span>
              Evaluated Nodes (Visited Set)
            </h4>
            <p className="text-[11px] text-slate-500">
              {algorithm === 'dijkstra'
                ? 'Nodes with fully finalized shortest path distance from start.'
                : 'Nodes already dequeued/popped and recorded in the traversal order.'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {currentStep.visited.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No nodes visited yet</span>
              ) : (
                currentStep.visited.map((nodeId) => {
                  const dist = currentStep.distances[nodeId];
                  return (
                    <div
                      key={nodeId}
                      className="bg-slate-200/60 text-slate-600 border border-slate-300/40 rounded-lg px-2.5 py-1.5 text-[11px] font-mono flex items-center gap-1"
                    >
                      <span className="font-medium">{formatNodeName(nodeId)}</span>
                      <span className="text-slate-500 text-[10px]">
                        ({dist === Infinity ? '∞' : algorithm === 'dijkstra' ? `${dist}m` : `hop ${dist}`})
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
