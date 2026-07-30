/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { PLACES } from '../data/places';
import { buildBST, solveBSTSearch, solveBSTFindMin, solveBSTFindMax, solveBSTPreorder } from '../utils/algorithms';
import { BSTNode, BSTStep, BSTOperation } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  GitCompare,
  Search,
  ArrowDownToLine,
  ArrowUpToLine,
  ListOrdered,
  ClipboardList,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Recursively compute { x, y } coordinates for every node of the BST:
// x follows in-order position (so the tree reads left-to-right alphabetically),
// y follows depth level.
function computeLayout(root: BSTNode | null) {
  const positions: Record<string, { x: number; y: number }> = {};
  const connections: { from: string; to: string }[] = [];
  let order = 0;
  let maxDepth = 0;

  const walk = (node: BSTNode | null, depth: number) => {
    if (!node) return;
    walk(node.left, depth + 1);
    if (node.left) connections.push({ from: node.id, to: node.left.id });

    positions[node.id] = { x: order, y: depth };
    order += 1;
    maxDepth = Math.max(maxDepth, depth);

    if (node.right) connections.push({ from: node.id, to: node.right.id });
    walk(node.right, depth + 1);
  };

  walk(root, 0);

  const totalNodes = Math.max(order, 1);
  const verticalSpacing = Math.min(620 / Math.max(maxDepth, 1), 130);
  const scaled: Record<string, { x: number; y: number }> = {};
  Object.entries(positions).forEach(([id, pos]) => {
    scaled[id] = {
      x: 60 + (pos.x / Math.max(totalNodes - 1, 1)) * 900,
      y: 50 + pos.y * verticalSpacing,
    };
  });

  return { positions: scaled, connections, maxDepth };
}

export default function TreeVisualizer() {
  const bstRoot = useMemo(() => buildBST(PLACES), []);
  const { positions, connections } = useMemo(() => computeLayout(bstRoot), [bstRoot]);

  const [operation, setOperation] = useState<BSTOperation>('search');
  const [query, setQuery] = useState<string>('Bayon');
  const [steps, setSteps] = useState<BSTStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const runOperation = (op: BSTOperation, searchQuery: string) => {
    stopPlayback();
    let computedSteps: BSTStep[] = [];
    if (op === 'search') {
      computedSteps = solveBSTSearch(bstRoot, searchQuery);
    } else if (op === 'min') {
      computedSteps = solveBSTFindMin(bstRoot);
    } else if (op === 'max') {
      computedSteps = solveBSTFindMax(bstRoot);
    } else {
      computedSteps = solveBSTPreorder(bstRoot);
    }
    setSteps(computedSteps);
    setCurrentStepIndex(0);
  };

  // Run once on mount with defaults
  useEffect(() => {
    runOperation('search', query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Playback Interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            stopPlayback();
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, steps, speed]);

  const startPlayback = () => setIsRunning(true);
  const stopPlayback = () => setIsRunning(false);

  const handlePlayPause = () => {
    if (isRunning) {
      stopPlayback();
    } else {
      if (currentStepIndex >= steps.length - 1) {
        setCurrentStepIndex(0);
      }
      startPlayback();
    }
  };

  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((p) => p + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((p) => p - 1);
    }
  };

  const handleReset = () => {
    stopPlayback();
    setCurrentStepIndex(0);
  };

  const currentStep = steps[currentStepIndex] || null;

  const isVisited = (nodeId: string) => currentStep?.visitedIds.includes(nodeId) || false;
  const isActive = (nodeId: string) => currentStep?.currentId === nodeId;
  const isResult = (nodeId: string) =>
    currentStep?.comparison === 'found' && currentStep?.result?.id === nodeId;

  const getNodeStyle = (nodeId: string) => {
    if (isResult(nodeId)) {
      return 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 font-bold';
    }
    if (isActive(nodeId)) {
      return 'bg-amber-400 border-amber-500 text-slate-900 ring-4 ring-amber-200 font-bold';
    }
    if (isVisited(nodeId)) {
      return 'bg-sky-500 border-sky-600 text-white font-medium';
    }
    return 'bg-white border-slate-200 text-slate-600';
  };

  const nodeById = (nodeId: string): BSTNode | null => {
    const walk = (node: BSTNode | null): BSTNode | null => {
      if (!node) return null;
      if (node.id === nodeId) return node;
      return walk(node.left) || walk(node.right);
    };
    return walk(bstRoot);
  };

  return (
    <div className="space-y-6">
      {/* Visual Canvas of the Binary Search Tree */}
      <div
        className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col ${
          isExpanded ? 'lg:h-[800px] md:h-[680px] h-[550px]' : 'lg:h-[520px] md:h-[460px] h-[380px]'
        } overflow-hidden relative transition-all duration-300`}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 mb-3 gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-emerald-600 animate-pulse" />
              Binary Search Tree (ordered by Site Name)
            </h3>
            <p className="text-xs text-slate-500">
              Heritage sites indexed alphabetically for fast Search, Find-Min & Find-Max lookups
            </p>
          </div>
          {/* Status dots */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
              <span className="text-slate-500 text-[11px]">Unexplored</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-sky-600 font-medium text-[11px]">Compared</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-amber-600 font-medium text-[11px]">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 font-medium text-[11px]">Result</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg shadow-xs font-semibold transition-all duration-150 shrink-0 ml-auto"
              title={isExpanded ? 'Switch to Compact Height' : 'Switch to Flexible/Expanded Height'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] hidden md:inline">Compact</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] hidden md:inline">Flexible</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tree Render Block */}
        <div className="flex-1 bg-slate-50 rounded-xl relative overflow-auto border border-slate-100">
          <svg
            className={`w-[1020px] ${isExpanded ? 'h-[690px]' : 'h-[410px]'} mx-auto block select-none pointer-events-none transition-all duration-300`}
            viewBox={`0 0 1020 ${isExpanded ? 690 : 410}`}
          >
            {/* Draw Elegant Curved Connector Lines */}
            {connections.map((c, i) => {
              const start = positions[c.from];
              const end = positions[c.to];
              if (!start || !end) return null;

              let strokeColor = '#e2e8f0'; // default slate-200
              let strokeWidth = 1.5;

              if (isVisited(c.from) && isVisited(c.to)) {
                strokeColor = '#38bdf8'; // sky-400
                strokeWidth = 2.5;
              }

              const dy = (start.y + end.y) / 2;
              const pathData = `M ${start.x} ${start.y} C ${start.x} ${dy}, ${end.x} ${dy}, ${end.x} ${end.y}`;

              return (
                <path
                  key={i}
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw Tree Node circles/bubbles */}
            {Object.keys(positions).map((nodeId) => {
              const coords = positions[nodeId];
              const node = nodeById(nodeId);
              if (!node) return null;
              const label = node.place.name;

              return (
                <g key={nodeId} transform={`translate(${coords.x}, ${coords.y})`}>
                  {(isActive(nodeId) || isResult(nodeId)) && (
                    <circle r="25" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pingSlow" />
                  )}

                  <foreignObject x="-60" y="-15" width="120" height="32" className="overflow-visible">
                    <div
                      className={`w-[120px] h-[30px] rounded-lg border text-[10px] flex items-center justify-center text-center px-1 font-sans transition-all duration-300 leading-tight shadow-sm select-none
                        ${getNodeStyle(nodeId)}`}
                      title={label}
                    >
                      {label.length > 22 ? `${label.slice(0, 19)}...` : label}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Operation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Playback & Mode Selection (Left side) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">BST Operation Controls</h4>
                <p className="text-xs text-slate-500">Pick an operation and control step playback</p>
              </div>

              {/* Segmented Operation selectors */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full md:w-auto">
                <button
                  onClick={() => {
                    setOperation('search');
                    runOperation('search', query);
                  }}
                  disabled={isRunning}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-150
                    ${operation === 'search' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'}`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Search
                </button>
                <button
                  onClick={() => {
                    setOperation('min');
                    runOperation('min', query);
                  }}
                  disabled={isRunning}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-150
                    ${operation === 'min' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'}`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Find Min
                </button>
                <button
                  onClick={() => {
                    setOperation('max');
                    runOperation('max', query);
                  }}
                  disabled={isRunning}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-150
                    ${operation === 'max' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'}`}
                >
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                  Find Max
                </button>
                <button
                  onClick={() => {
                    setOperation('preorder');
                    runOperation('preorder', query);
                  }}
                  disabled={isRunning}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-150
                    ${operation === 'preorder' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'}`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  Preorder
                </button>
              </div>
            </div>

            {/* Search query input (only relevant for Search) */}
            {operation === 'search' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Bayon, Ta Prohm, Kravan..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isRunning}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                />
                <button
                  onClick={() => runOperation('search', query)}
                  disabled={isRunning || !query.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  Run Search
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-slate-700 transition-all"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleStepBackward}
              disabled={currentStepIndex <= 0 || isRunning}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-slate-700 transition-all disabled:opacity-40"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all active:scale-95 shadow-sm
                ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Run Operation
                </>
              )}
            </button>

            <button
              onClick={handleStepForward}
              disabled={currentStepIndex >= steps.length - 1 || isRunning}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-slate-700 transition-all disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-slate-500 ml-2">
              Frame {currentStepIndex + 1} / {Math.max(1, steps.length)}
            </span>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider shrink-0">Interval Speed</span>
            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 accent-indigo-600 h-1 bg-slate-200 rounded-lg"
            />
            <span className="text-xs font-mono text-slate-700">{speed}ms</span>
          </div>
        </div>

        {/* Console Log Panel (Right side) */}
        <div className="md:col-span-5 bg-slate-950 rounded-2xl border border-slate-900 shadow-lg p-5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h5 className="font-mono text-emerald-400 font-bold text-xs flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4" />
              BST Execution Console
            </h5>
            <div className="bg-black/40 border border-slate-800 p-3 rounded-xl min-h-[96px] text-slate-300 font-mono text-xs leading-relaxed max-h-[140px] overflow-y-auto">
              {currentStep ? (
                <>
                  <span className="text-indigo-400">[TRACE]:</span> {currentStep.description}
                </>
              ) : (
                <span className="text-slate-500 italic">Console idle. Hit "Run Operation" to initialize.</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 mt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Operation: {operation.toUpperCase()}</span>
            <span>Comparisons: {currentStep?.visitedIds.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Result / Comparison trail panel */}
      {currentStep && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600" />
            {operation === 'preorder' ? 'Preorder Visit Order (Root → Left → Right)' : 'Comparison Path (Root → Result)'}
          </h4>
          <p className="text-xs text-slate-500">
            {operation === 'preorder' ? (
              <>
                Each node is visited before its children, recursing left before right, just like{' '}
                <code className="text-[11px] bg-slate-100 px-1 rounded">HeritageBST.preorder()</code> in the Python reference implementation.
              </>
            ) : (
              <>
                Each hop compares the target key against the current node and moves left (smaller) or right (larger),
                just like <code className="text-[11px] bg-slate-100 px-1 rounded">HeritageBST</code> in the Python reference implementation.
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {currentStep.visitedIds.length === 0 ? (
              <span className="text-xs text-slate-400 font-mono italic">
                {operation === 'preorder' ? 'No sites visited yet' : 'No comparisons yet'}
              </span>
            ) : (
              currentStep.visitedIds.map((id, idx) => {
                const node = nodeById(id);
                const isLast = idx === currentStep.visitedIds.length - 1;
                return (
                  <React.Fragment key={`${id}-${idx}`}>
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`font-mono text-xs px-2.5 py-1.5 rounded-lg shrink-0 border select-none
                        ${isLast && currentStep.comparison === 'found' ? 'bg-emerald-500 border-emerald-600 text-white font-bold' : isLast ? 'bg-amber-400 border-amber-500 text-slate-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                    >
                      {node?.place.name || id}
                    </motion.div>
                    {!isLast && <span className="text-slate-300 font-bold">&rarr;</span>}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {currentStep.comparison === 'found' && currentStep.result && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800">
              <span className="font-bold">Result:</span> {currentStep.result.name} ({currentStep.result.type}) &middot;{' '}
              {currentStep.result.openingHours}
            </div>
          )}
          {currentStep.comparison === 'none' && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
              No matching heritage site was found for this query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
