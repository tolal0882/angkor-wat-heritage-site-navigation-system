/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { PLACES } from '../data/places';
import { buildBST, solveBSTBrowseCategory } from '../utils/algorithms';
import { BSTNode, BSTStep, Place, PlaceType } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  GitCompare,
  Tags,
  ClipboardList,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Alphabetical order, used for the category picker buttons
const CATEGORIES: PlaceType[] = [
  'Hindu Temple',
  'Historical Monument',
  'Main Temple',
  'Monastery Temple',
  'Mountain Temple',
];

// Left-to-right order for the tree diagram, matching the reference chart
// (Tree Algorithms/Tree.png): Main -> Mountain -> Hindu -> Monastery -> Historical
const CATEGORY_ORDER: PlaceType[] = [
  'Main Temple',
  'Mountain Temple',
  'Hindu Temple',
  'Monastery Temple',
  'Historical Monument',
];

// Default (unexplored) colors per category, matching the reference chart's palette
const CATEGORY_STYLES: Record<PlaceType, { node: string; leaf: string }> = {
  'Main Temple': { node: 'bg-sky-100 border-sky-400 text-sky-900', leaf: 'bg-sky-50 border-sky-300 text-sky-800' },
  'Mountain Temple': { node: 'bg-lime-100 border-lime-400 text-lime-900', leaf: 'bg-lime-50 border-lime-300 text-lime-800' },
  'Hindu Temple': { node: 'bg-slate-200 border-slate-400 text-slate-900', leaf: 'bg-slate-100 border-slate-300 text-slate-700' },
  'Monastery Temple': { node: 'bg-cyan-300 border-cyan-500 text-cyan-950', leaf: 'bg-cyan-100 border-cyan-400 text-cyan-900' },
  'Historical Monument': { node: 'bg-orange-100 border-orange-400 text-orange-900', leaf: 'bg-orange-50 border-orange-300 text-orange-800' },
};

const LEAF_WIDTH = 150;
const CATEGORY_MIN_WIDTH = 160;
const ROOT_Y = 40;
const CATEGORY_Y = 180;
const LEAF_Y = 320;

// Lays out a fixed 3-level hierarchy diagram - root -> category -> sites -
// matching Tree Algorithms/Tree.png, rather than a binary left/right shape.
// Category slot widths scale with how many sites they hold, so wider
// categories (e.g. Historical Monument) naturally span more space.
function computeCategoryTreeLayout(places: Place[]) {
  const positions: Record<string, { x: number; y: number }> = {};
  const connections: { from: string; to: string }[] = [];

  const catWidths = CATEGORY_ORDER.map((cat) =>
    Math.max(places.filter((p) => p.type === cat).length * LEAF_WIDTH, CATEGORY_MIN_WIDTH)
  );
  const totalWidth = catWidths.reduce((a, b) => a + b, 0);

  let cursor = 0;
  CATEGORY_ORDER.forEach((cat, ci) => {
    const w = catWidths[ci];
    positions[cat] = { x: cursor + w / 2, y: CATEGORY_Y };
    connections.push({ from: 'root', to: cat });

    const sites = places.filter((p) => p.type === cat);
    sites.forEach((site, si) => {
      positions[site.id] = { x: cursor + LEAF_WIDTH * si + LEAF_WIDTH / 2, y: LEAF_Y };
      connections.push({ from: cat, to: site.id });
    });

    cursor += w;
  });

  positions.root = { x: totalWidth / 2, y: ROOT_Y };

  return { positions, connections, width: totalWidth, height: LEAF_Y + 70 };
}

export default function TreeVisualizer() {
  // The BST (built/searched exactly like HeritageBST in the Python reference)
  // still drives the Browse-by-Category algorithm and its step trace -
  // only the on-screen layout below is the fixed hierarchy diagram.
  const bstRoot = useMemo(() => buildBST(PLACES), []);
  const { positions, connections, width, height } = useMemo(() => computeCategoryTreeLayout(PLACES), []);

  const [category, setCategory] = useState<PlaceType>('Main Temple');
  const [steps, setSteps] = useState<BSTStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const runOperation = (selectedCategory: string) => {
    stopPlayback();
    const computedSteps = solveBSTBrowseCategory(bstRoot, selectedCategory);
    setSteps(computedSteps);
    setCurrentStepIndex(0);
  };

  // Run once on mount with defaults
  useEffect(() => {
    runOperation(category);
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
    currentStep?.comparison === 'found' && currentStep?.currentId === nodeId;
  const isLeafResult = (placeId: string) =>
    currentStep?.comparison === 'found' && (currentStep?.result?.some((p) => p.id === placeId) ?? false);

  const getCategoryStyle = (cat: PlaceType) => {
    if (isResult(cat)) {
      return 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 font-bold';
    }
    if (isActive(cat)) {
      return 'bg-amber-400 border-amber-500 text-slate-900 ring-4 ring-amber-200 font-bold';
    }
    if (isVisited(cat)) {
      return 'bg-sky-500 border-sky-600 text-white font-medium';
    }
    return `${CATEGORY_STYLES[cat].node} font-semibold`;
  };

  const getLeafStyle = (place: Place) => {
    if (isLeafResult(place.id)) {
      return 'bg-emerald-400 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-200';
    }
    return CATEGORY_STYLES[place.type].leaf;
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
      {/* Visual Canvas of the Heritage Site Tree */}
      <div
        className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col ${
          isExpanded ? 'lg:h-[800px] md:h-[680px] h-[550px]' : 'lg:h-[520px] md:h-[460px] h-[380px]'
        } overflow-hidden relative transition-all duration-300`}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 mb-3 gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-emerald-600 animate-pulse" />
              Angkor Heritage Site Tree (Root → Category → Site)
            </h3>
            <p className="text-xs text-slate-500">
              Heritage sites grouped by category for fast Browse lookups
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
            className={`${isExpanded ? 'h-[690px]' : 'h-[410px]'} mx-auto block select-none pointer-events-none transition-all duration-300`}
            style={{ width: Math.max(width, 1020) }}
            viewBox={`0 0 ${width} ${height}`}
          >
            {/* Draw Elegant Curved Connector Lines */}
            {connections.map((c, i) => {
              const start = positions[c.from];
              const end = positions[c.to];
              if (!start || !end) return null;

              let strokeColor = '#e2e8f0'; // default slate-200
              let strokeWidth = 1.5;

              if (c.from === 'root') {
                if (isResult(c.to)) {
                  strokeColor = '#10b981'; // emerald-500
                  strokeWidth = 3;
                } else if (isActive(c.to)) {
                  strokeColor = '#fbbf24'; // amber-400
                  strokeWidth = 2.5;
                } else if (isVisited(c.to)) {
                  strokeColor = '#38bdf8'; // sky-400
                  strokeWidth = 2.5;
                }
              } else if (isLeafResult(c.to)) {
                strokeColor = '#10b981'; // emerald-500
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

            {/* Root node: "Angkor Heritage Site" */}
            <g transform={`translate(${positions.root.x}, ${positions.root.y})`}>
              <foreignObject x="-100" y="-18" width="200" height="36" className="overflow-visible">
                <div className="w-[200px] h-[34px] rounded-lg border-2 bg-indigo-50 border-indigo-300 text-indigo-900 flex items-center justify-center text-center px-2 font-sans font-bold text-[11px] shadow-sm select-none">
                  Angkor Heritage Site
                </div>
              </foreignObject>
            </g>

            {/* Category nodes */}
            {CATEGORY_ORDER.map((cat) => {
              const coords = positions[cat];
              const node = nodeById(cat);
              const count = node?.places.length ?? PLACES.filter((p) => p.type === cat).length;
              const label = `${cat} (${count})`;

              return (
                <g key={cat} transform={`translate(${coords.x}, ${coords.y})`}>
                  {(isActive(cat) || isResult(cat)) && (
                    <circle r="27" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pingSlow" />
                  )}
                  <foreignObject x="-65" y="-17" width="130" height="34" className="overflow-visible">
                    <div
                      className={`w-[130px] h-[32px] rounded-lg border-2 text-[10px] flex items-center justify-center text-center px-1 font-sans transition-all duration-300 leading-tight shadow-sm select-none
                        ${getCategoryStyle(cat)}`}
                      title={label}
                    >
                      {label}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* Leaf nodes: individual heritage sites */}
            {PLACES.map((place) => {
              const coords = positions[place.id];
              if (!coords) return null;

              return (
                <g key={place.id} transform={`translate(${coords.x}, ${coords.y})`}>
                  {isLeafResult(place.id) && (
                    <circle r="24" fill="none" stroke="#34d399" strokeWidth="2" className="animate-pingSlow" />
                  )}
                  <foreignObject x="-62" y="-15" width="124" height="30" className="overflow-visible">
                    <div
                      className={`w-[124px] h-[28px] rounded-md border text-[9.5px] flex items-center justify-center text-center px-1 font-sans transition-all duration-300 leading-tight shadow-sm select-none
                        ${getLeafStyle(place)}`}
                      title={place.name}
                    >
                      {place.name.length > 20 ? `${place.name.slice(0, 17)}...` : place.name}
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
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Tags className="w-3.5 h-3.5 text-indigo-600" />
                  BST Browse Controls
                </h4>
                <p className="text-xs text-slate-500">Pick a category and control step playback</p>
              </div>
            </div>

            {/* Category picker */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    runOperation(cat);
                  }}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs border transition-all duration-150
                    ${category === cat ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
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
            <span>Operation: BROWSE</span>
            <span>Comparisons: {currentStep?.visitedIds.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Result / Comparison trail panel */}
      {currentStep && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600" />
            Comparison Path (Root → Result)
          </h4>
          <p className="text-xs text-slate-500">
            Each hop compares the target category against the current node and moves left (smaller) or right (larger),
            just like <code className="text-[11px] bg-slate-100 px-1 rounded">HeritageBST</code> in the Python reference implementation.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {currentStep.visitedIds.length === 0 ? (
              <span className="text-xs text-slate-400 font-mono italic">No comparisons yet</span>
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
                      {node?.category || id}
                    </motion.div>
                    {!isLast && <span className="text-slate-300 font-bold">&rarr;</span>}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {currentStep.comparison === 'found' && currentStep.result && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-1.5">
              <span className="font-bold block">Temples in this category:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentStep.result.map((place) => (
                  <span key={place.id} className="bg-white border border-emerald-200 rounded-lg px-2 py-1 font-mono text-[11px]">
                    {place.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {currentStep.comparison === 'none' && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
              No matching category was found for this query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
