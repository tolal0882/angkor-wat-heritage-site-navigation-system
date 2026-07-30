/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraphNode, GraphEdge, Place, PathfindingStep } from '../types';
import { MapPin, Navigation, Info, Trash2, Footprints, Maximize2, Minimize2 } from 'lucide-react';

interface MapContainerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  places: Place[];
  startId: string | null;
  endId: string | null;
  setStartId: (id: string | null) => void;
  setEndId: (id: string | null) => void;
  currentStep: PathfindingStep | null;
  shortestPath: string[];
  onToggleEdge: (edgeId: string) => void;
  requireTarget?: boolean;
}

export default function MapContainer({
  nodes,
  edges,
  places,
  startId,
  endId,
  setStartId,
  setEndId,
  currentStep,
  shortestPath,
  onToggleEdge,
  requireTarget = true,
}: MapContainerProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Find place details for a given node
  const getPlaceForNode = (node: GraphNode) => {
    return places.find((p) => p.id === node.placeId);
  };

  // Node visualization states
  const getNodeColor = (nodeId: string) => {
    if (nodeId === startId) return 'bg-emerald-500 ring-4 ring-emerald-300 text-white';
    if (nodeId === endId) return 'bg-red-500 ring-4 ring-red-300 text-white';

    if (currentStep) {
      if (currentStep.currentNodeId === nodeId) return 'bg-amber-400 ring-4 ring-amber-200 text-slate-900 animate-pulseScale';
      if (currentStep.visited.includes(nodeId)) return 'bg-sky-400 ring-2 ring-sky-200 text-slate-900';
      if (currentStep.frontier.includes(nodeId)) return 'bg-indigo-400 ring-2 ring-indigo-200 text-white';
    } else if (shortestPath.includes(nodeId)) {
      return 'bg-emerald-400 ring-2 ring-emerald-200 text-slate-900';
    }

    const n = nodes.find((node) => node.id === nodeId);
    if (n?.isPlace) {
      const p = getPlaceForNode(n);
      if (p?.type === 'Main Temple') return 'bg-slate-800 text-slate-100 border-2 border-amber-500';
      if (p?.type === 'Mountain Temple') return 'bg-emerald-700 text-white';
      if (p?.type === 'Hindu Temple') return 'bg-rose-700 text-white';
      if (p?.type === 'Monastery Temple') return 'bg-indigo-700 text-white';
      return 'bg-slate-500 text-white'; // Historical Monument
    }

    return 'bg-slate-400 text-slate-900';
  };

  const getEdgeStyle = (edge: GraphEdge) => {
    if (edge.isBlocked) {
      return {
        stroke: '#f87171',
        strokeWidth: 3,
        strokeDasharray: '5, 5',
      };
    }

    // Check if this edge lies on the highlighted shortest path
    const isPathEdge = (fromId: string, toId: string) => {
      if (!shortestPath || shortestPath.length < 2) return false;
      for (let i = 0; i < shortestPath.length - 1; i++) {
        const u = shortestPath[i];
        const v = shortestPath[i + 1];
        if ((u === fromId && v === toId) || (u === toId && v === fromId)) {
          return true;
        }
      };
      return false;
    };

    // Check if this edge lies on the current animated path
    const isStepPathEdge = (fromId: string, toId: string) => {
      if (!currentStep) return false;
      const prev = currentStep.previous;

      // If target has a previous parent in the step, and they are from/to
      if (prev[fromId] === toId || prev[toId] === fromId) {
        // Also check if both are visited or in frontier
        const isFromActive = currentStep.visited.includes(fromId) || currentStep.frontier.includes(fromId);
        const isToActive = currentStep.visited.includes(toId) || currentStep.frontier.includes(toId);
        if (isFromActive && isToActive) return true;
      }
      return false;
    };

    if (currentStep && isStepPathEdge(edge.from, edge.to)) {
      return {
        stroke: '#fbbf24',
        strokeWidth: 4,
        strokeDasharray: 'none',
      };
    }

    if (isPathEdge(edge.from, edge.to)) {
      return {
        stroke: '#10b981',
        strokeWidth: 5,
        strokeDasharray: 'none',
        filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))',
      };
    }

    return {
      stroke: '#cbd5e1',
      strokeWidth: 2,
      strokeDasharray: 'none',
    };
  };

  const selectedPlace = selectedNode ? getPlaceForNode(selectedNode) : null;

  // Compute the SVG viewBox directly from the node coordinates (+ padding for
  // labels/circles) so the map always frames the actual vertices, regardless
  // of how the underlying dataset's layout is shaped.
  const nodeXs = nodes.map((n) => n.x);
  const nodeYs = nodes.map((n) => n.y);
  const VIEW_PADDING = 90;
  const viewBoxMinX = Math.min(...nodeXs) - VIEW_PADDING;
  const viewBoxMinY = Math.min(...nodeYs) - VIEW_PADDING;
  const viewBoxWidth = Math.max(...nodeXs) - Math.min(...nodeXs) + VIEW_PADDING * 2;
  const viewBoxHeight = Math.max(...nodeYs) - Math.min(...nodeYs) + VIEW_PADDING * 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
      {/* 1. Map Panel (Left side) */}
      <div className={`lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${isExpanded ? 'lg:h-[800px] md:h-[650px] h-[500px]' : 'lg:h-[600px] md:h-[500px] h-[400px]'} transition-all duration-300 relative`}>
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-3 z-10">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
              Angkor Wat Archaeological Park Map Canvas
            </h3>
            <p className="text-xs text-slate-500">
              Interactive vector-guided road connections & node networks
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap sm:flex-nowrap justify-between w-full lg:w-auto">
            {/* Standard Color Legend */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-600">Start</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-slate-600">Target</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-slate-600">Visiting</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-[10px] text-slate-600">Frontier</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-red-400 border-t border-dashed border-slate-50" />
                <span className="text-[10px] text-slate-600">Blocked</span>
              </div>
            </div>

            {/* Canvas Expand Switch */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg shadow-xs font-semibold transition-all duration-150 shrink-0"
              title={isExpanded ? "Switch to Compact Height" : "Switch to Flexible/Expanded Height"}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] hidden md:inline">Compact</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] hidden md:inline">Flexible</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vector SVG Canvas */}
        <div className="flex-1 bg-[#f1f5f9] relative overflow-hidden select-none">
          <svg
            className="w-full h-full"
            viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Roads/Edges Layer */}
            {edges.map((edge) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const style = getEdgeStyle(edge);
              return (
                <g key={edge.id} className="group">
                  {/* Invisible thick helper line for easier clicking */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="transparent"
                    strokeWidth="12"
                    className="cursor-pointer"
                    onClick={() => onToggleEdge(edge.id)}
                  />
                  {/* Real visual line */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    {...style}
                    className="transition-all duration-300"
                  />
                  {/* Distance label & blockage control on hover */}
                  <foreignObject
                    x={(fromNode.x + toNode.x) / 2 - 25}
                    y={(fromNode.y + toNode.y) / 2 - 10}
                    width="50"
                    height="20"
                  >
                    <div
                      onClick={() => onToggleEdge(edge.id)}
                      className={`flex items-center justify-center rounded-md text-[9px] font-mono px-1 py-0.5 cursor-pointer shadow-sm select-none transition-colors border
                        ${
                          edge.isBlocked
                            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      title={`${edge.roadName}: ${edge.distance}m. Click to ${edge.isBlocked ? 'unblock' : 'block'} road.`}
                    >
                      {edge.isBlocked ? 'BLOCKED' : `${(edge.distance / 1000).toFixed(1)}km`}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* Nodes Layer */}
            {nodes.map((node) => {
              const isPlace = node.isPlace;
              const place = getPlaceForNode(node);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer ring on hover/selected */}
                  {(selectedNode?.id === node.id || hoveredNode?.id === node.id) && (
                    <circle
                      r="20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      className="animate-pingSlow"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={isPlace ? '11' : '8'}
                    className={`transition-all duration-300 fill-current ${
                      getNodeColor(node.id).split(' ')[0]
                    } ${
                      getNodeColor(node.id).includes('ring') ? 'stroke-white stroke-2' : 'stroke-slate-700 stroke'
                    }`}
                  />

                  {/* Inside Text or Dot */}
                  {isPlace ? (
                    <text
                      y="3"
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-white pointer-events-none select-none"
                    >
                      {place?.type === 'Main Temple'
                        ? '卍'
                        : place?.type === 'Mountain Temple'
                        ? '▲'
                        : place?.type === 'Hindu Temple'
                        ? 'ॐ'
                        : place?.type === 'Monastery Temple'
                        ? '⛩'
                        : '◆'}
                    </text>
                  ) : null}

                  {/* Label Text */}
                  <text
                    y={isPlace ? '24' : '18'}
                    textAnchor="middle"
                    style={{
                      paintOrder: 'stroke',
                      stroke: '#f1f5f9',
                      strokeWidth: '3px',
                      strokeLinejoin: 'round',
                    }}
                    className={`text-[10px] font-semibold font-sans select-none pointer-events-none transition-colors duration-200
                      ${
                        startId === node.id
                          ? 'fill-emerald-700 font-bold'
                          : endId === node.id
                          ? 'fill-red-700 font-bold'
                          : selectedNode?.id === node.id
                          ? 'fill-slate-900 font-bold'
                          : 'fill-slate-600'
                      }`}
                  >
                    {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                  </text>
                </g>
              );
            })}

          </svg>

          {/* Inline floating Map HUD Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/90 text-white text-[11px] px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-md flex items-center gap-1.5 pointer-events-auto">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Click a node to select routing checkpoints.</span>
            </div>

            <button
              onClick={() => {
                setStartId(null);
                setEndId(null);
              }}
              className="bg-white/90 hover:bg-white text-slate-700 font-medium text-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-1 transition-all pointer-events-auto active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* 2. Place Details & Route Controls (Right side) */}
      <div className={`lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${isExpanded ? 'lg:h-[800px]' : 'lg:h-[600px]'} h-auto min-h-[300px] overflow-y-auto transition-all duration-300`}>
        {selectedNode ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-lg ${selectedNode.isPlace ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{selectedNode.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                    {selectedNode.isPlace ? 'Heritage Site node' : 'Route Junction'}
                  </p>
                </div>
              </div>
            </div>

            {selectedPlace ? (
              <div className="space-y-4 flex-1">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    selectedPlace.type === 'Main Temple' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    selectedPlace.type === 'Mountain Temple' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    selectedPlace.type === 'Hindu Temple' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                    selectedPlace.type === 'Monastery Temple' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                    'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {selectedPlace.type}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                  {selectedPlace.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-sans">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Temple ID</span>
                    <span className="font-semibold text-slate-700">{selectedPlace.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Opening Hours</span>
                    <span className="font-semibold text-slate-700">{selectedPlace.openingHours}</span>
                  </div>
                </div>

                {/* Set Start/End Buttons */}
                <div className={`grid ${requireTarget ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-4 border-t border-slate-100`}>
                  <button
                    onClick={() => setStartId(selectedNode.id)}
                    className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                      startId === selectedNode.id
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Set as Start
                  </button>
                  {requireTarget && (
                    <button
                      onClick={() => setEndId(selectedNode.id)}
                      className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                        endId === selectedNode.id
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      Set as Target
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">
                  This heritage site can be used as a routing checkpoint. Assist pathfinding calculations across the archaeological park's road network.
                </p>
                <div className={`grid ${requireTarget ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-4 border-t border-slate-100`}>
                  <button
                    onClick={() => setStartId(selectedNode.id)}
                    className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 text-slate-700 transition-all"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Set as Start
                  </button>
                  {requireTarget && (
                    <button
                      onClick={() => setEndId(selectedNode.id)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 text-slate-700 transition-all"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      Set as Target
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400 p-6">
            <Info className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-slate-700 text-sm">No Location Selected</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Click any temple, resort, or junction on the map to explore its history and set routing endpoints.
            </p>
          </div>
        )}

        {/* Current Navigation Summary */}
        <div className="mt-auto border-t border-slate-100 pt-4 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5">Current Setup</h5>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Start Position:
              </span>
              <span className="font-semibold text-slate-800">
                {startId ? nodes.find((n) => n.id === startId)?.name : 'Select node on map'}
              </span>
            </div>
            {requireTarget && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Target Position:
                </span>
                <span className="font-semibold text-slate-800">
                  {endId ? nodes.find((n) => n.id === endId)?.name : 'Select node on map'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
