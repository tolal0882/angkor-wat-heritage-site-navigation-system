/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraphNode, GraphEdge, Place, PathfindingStep } from '../types';
import { MapPin, Navigation, Info, ShieldAlert, ToggleLeft, ToggleRight, Trash2, Footprints, Maximize2, Minimize2 } from 'lucide-react';

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
  const [isTopographical, setIsTopographical] = useState<boolean>(false);

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
        stroke: isTopographical ? '#b91c1c' : '#f87171', // deeper red for topo
        strokeWidth: isTopographical ? 3.5 : 3,
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
        stroke: isTopographical ? '#d97706' : '#fbbf24', // golden amber vs amber-400
        strokeWidth: isTopographical ? 4.5 : 4,
        strokeDasharray: 'none',
      };
    }

    if (isPathEdge(edge.from, edge.to)) {
      return {
        stroke: isTopographical ? '#059669' : '#10b981', // deeper jade green vs emerald-500
        strokeWidth: isTopographical ? 5.5 : 5,
        strokeDasharray: 'none',
        filter: isTopographical
          ? 'drop-shadow(0 0 5px rgba(5, 150, 105, 0.6))'
          : 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))',
      };
    }

    return {
      stroke: isTopographical ? '#C4AF98' : '#cbd5e1', // soft sand wood vs slate-300
      strokeWidth: isTopographical ? 2.5 : 2,
      strokeDasharray: 'none',
    };
  };

  const selectedPlace = selectedNode ? getPlaceForNode(selectedNode) : null;

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

            {/* View Mode Toggle Pill Switch */}
            <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg border border-slate-300 shadow-3xs shrink-0 ml-auto sm:ml-0">
              <button
                onClick={() => setIsTopographical(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight transition-all duration-150 ${
                  !isTopographical
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                }`}
              >
                Schematic
              </button>
              <button
                onClick={() => setIsTopographical(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight transition-all duration-150 ${
                  isTopographical
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                }`}
              >
                Topographical
              </button>
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
        <div className={`flex-1 ${isTopographical ? 'bg-[#F4EFE0]' : 'bg-[#f1f5f9]'} relative overflow-hidden select-none transition-colors duration-500`}>
          <svg
            className="w-full h-full"
            viewBox="300 0 600 1000" // focus on the central park area containing nodes
            preserveAspectRatio="xMidYMid meet"
          >
            {isTopographical && (
              <defs>
                {/* Ancient paper/earth radial shading */}
                <radialGradient id="topo-bg" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#FAF6EC" />
                  <stop offset="60%" stopColor="#F5EFE0" />
                  <stop offset="100%" stopColor="#EADFCE" />
                </radialGradient>
                {/* Lush tropical dense jungle gradient */}
                <linearGradient id="forest-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A8C3A9" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#87A988" stopOpacity="0.5" />
                </linearGradient>
                {/* Serene reservoir/baray water gradient */}
                <linearGradient id="moat-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.75" />
                </linearGradient>
              </defs>
            )}

            {/* Giant Background Cover in Topographical Mode */}
            {isTopographical && (
              <rect x="200" y="0" width="800" height="1050" fill="url(#topo-bg)" />
            )}

            {/* Topographical Contour/Elevation Lines */}
            {isTopographical && (
              <g id="contour-lines" className="pointer-events-none opacity-80 transition-opacity duration-500">
                {/* Phnom Bakheng elevation contours */}
                <path d="M 440 440 Q 460 410 480 410 Q 510 420 515 440 Q 510 470 480 470 Q 450 460 440 440 Z" fill="none" stroke="#D3C2A9" strokeWidth="1" strokeDasharray="3, 3" />
                <path d="M 410 440 Q 450 390 480 390 Q 530 400 540 440 Q 530 490 480 495 Q 430 480 410 440 Z" fill="none" stroke="#C8B89E" strokeWidth="1" strokeDasharray="4, 3" />
                <path d="M 375 440 Q 430 365 480 365 Q 565 380 575 440 Q 560 515 480 520 Q 400 500 375 440 Z" fill="none" stroke="#C8B89E" strokeWidth="1" />
                <text x="480" y="380" fill="#9C8B72" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.8">Phnom Bakheng - 100m</text>

                {/* Natural park undulating isolines */}
                <path d="M 300 200 C 400 250, 500 150, 600 220 C 700 280, 800 180, 900 230" fill="none" stroke="#DCD0BC" strokeWidth="0.75" />
                <path d="M 300 350 C 420 380, 480 310, 620 390 C 720 420, 780 330, 900 360" fill="none" stroke="#DCD0BC" strokeWidth="0.75" />
                <path d="M 300 650 C 390 690, 520 620, 650 710 C 740 760, 820 680, 900 720" fill="none" stroke="#DCD0BC" strokeWidth="0.75" />
                <path d="M 300 800 C 440 850, 510 780, 680 880 C 760 920, 840 850, 900 890" fill="none" stroke="#DCD0BC" strokeWidth="0.75" />

                {/* Grid heights */}
                <text x="310" y="210" fill="#B2A38C" fontSize="7" fontFamily="monospace">60m</text>
                <text x="310" y="360" fill="#B2A38C" fontSize="7" fontFamily="monospace">70m</text>
                <text x="310" y="660" fill="#B2A38C" fontSize="7" fontFamily="monospace">80m</text>
                <text x="310" y="810" fill="#B2A38C" fontSize="7" fontFamily="monospace">90m</text>
              </g>
            )}

            {/* Dense Forest Enclosures in Topographical Mode */}
            {isTopographical && (
              <g id="forest-zones" className="pointer-events-none opacity-85 transition-opacity duration-500">
                {/* Angkor Thom City boundary forest */}
                <rect x="410" y="210" width="180" height="220" rx="6" fill="url(#forest-grad)" stroke="#8FA890" strokeWidth="1" />
                <text x="500" y="235" fill="#5F7D61" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.6" letterSpacing="1">ANGKOR THOM JUNGLE RESERVES</text>

                {/* Ta Prohm forest */}
                <rect x="710" y="310" width="120" height="150" rx="8" fill="url(#forest-grad)" stroke="#8FA890" strokeWidth="1" />
                <text x="770" y="325" fill="#5F7D61" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">TA PROHM FOREST</text>

                {/* Northern sanctuary forest (Tep Pranam / Terrace of the Leper King) */}
                <rect x="440" y="110" width="120" height="90" rx="8" fill="url(#forest-grad)" stroke="#8FA890" strokeWidth="1" />
                <text x="500" y="125" fill="#5F7D61" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">NORTHERN SANCTUARY CANOPY</text>
              </g>
            )}

            {/* Siem Reap River in Topographical Mode */}
            {isTopographical && (
              <g id="siem-reap-river" className="pointer-events-none transition-opacity duration-500">
                {/* Flowing natural riverbed */}
                <path
                  d="M 850 30 Q 750 180 670 280 T 630 500 T 600 700 T 540 980"
                  fill="none"
                  stroke="#E2EDF8"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 850 30 Q 750 180 670 280 T 630 500 T 600 700 T 540 980"
                  fill="none"
                  stroke="#79b6e6"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <text x="640" y="550" fill="#4B88BE" fontSize="8" fontWeight="600" fontFamily="sans-serif" transform="rotate(-35, 640, 550)" opacity="0.75">Siem Reap River</text>
              </g>
            )}

            {/* Barays (Reservoirs) and Moats */}
            {isTopographical ? (
              <g id="topo-reservoirs" className="pointer-events-none">
                {/* Angkor Wat Moat (Filled deep turquoise) */}
                <rect
                  x="420"
                  y="480"
                  width="160"
                  height="100"
                  rx="4"
                  fill="url(#moat-grad)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <rect x="425" y="485" width="150" height="90" rx="3" fill="none" stroke="#0284c7" strokeWidth="0.5" strokeOpacity="0.5" />
                <text x="500" y="535" fill="#0369a1" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">ANGKOR WAT MOAT</text>

                {/* Srah Srang Bathing Pool */}
                <rect
                  x="810"
                  y="420"
                  width="60"
                  height="40"
                  rx="2"
                  fill="url(#moat-grad)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <text x="840" y="445" fill="#0369a1" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.6">Srah Srang</text>

                {/* Angkor Thom Moat Water outline bounds */}
                <rect
                  x="400"
                  y="200"
                  width="200"
                  height="240"
                  rx="6"
                  fill="none"
                  stroke="#7dd3fc"
                  strokeWidth="4"
                  strokeOpacity="0.8"
                />
                <rect
                  x="396"
                  y="196"
                  width="208"
                  height="248"
                  rx="8"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />

                {/* West Baray - Massive Reservoir */}
                <rect
                  x="305"
                  y="250"
                  width="65"
                  height="160"
                  rx="2"
                  fill="url(#moat-grad)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text x="330" y="330" fill="#0369a1" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90, 330, 330)" opacity="0.6">WEST BARAY</text>

                {/* East Baray - Ancient dry/sandy reservoir */}
                <rect
                  x="780"
                  y="200"
                  width="95"
                  height="140"
                  rx="2"
                  fill="url(#moat-grad)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />
                <text x="820" y="270" fill="#0369a1" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" transform="rotate(90, 820, 270)" opacity="0.6">EAST BARAY</text>
              </g>
            ) : (
              <g id="schematic-water">
                {/* Angkor Wat Moat */}
                <rect
                  x="420"
                  y="480"
                  width="160"
                  height="100"
                  rx="4"
                  fill="#bae6fd"
                  fillOpacity="0.45"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="4, 4"
                />
                {/* Srah Srang Bathing Pool */}
                <rect
                  x="810"
                  y="420"
                  width="60"
                  height="40"
                  rx="2"
                  fill="#bae6fd"
                  fillOpacity="0.5"
                  stroke="#0284c7"
                  strokeWidth="1"
                />
                {/* Angkor Thom Moat outline */}
                <rect
                  x="400"
                  y="200"
                  width="200"
                  height="240"
                  rx="6"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeOpacity="0.3"
                />
              </g>
            )}

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
                      getNodeColor(node.id).includes('ring')
                        ? (isTopographical ? 'stroke-[#F4EFE0] stroke-2' : 'stroke-white stroke-2')
                        : (isTopographical ? 'stroke-[#5C4033] stroke-2' : 'stroke-slate-700 stroke')
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
                      stroke: isTopographical ? '#F4EFE0' : '#f1f5f9',
                      strokeWidth: '3px',
                      strokeLinejoin: 'round',
                    }}
                    className={`text-[10px] font-semibold font-sans select-none pointer-events-none transition-colors duration-200
                      ${
                        startId === node.id
                          ? (isTopographical ? 'fill-emerald-800 font-extrabold' : 'fill-emerald-700 font-bold')
                          : endId === node.id
                          ? (isTopographical ? 'fill-red-800 font-extrabold' : 'fill-red-700 font-bold')
                          : selectedNode?.id === node.id
                          ? 'fill-slate-900 font-bold'
                          : (isTopographical ? 'fill-[#451a03] font-medium' : 'fill-slate-600')
                      }`}
                  >
                    {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                  </text>
                </g>
              );
            })}

            {/* Topographical Map Ornaments */}
            {isTopographical && (
              <g id="map-ornaments" className="pointer-events-none opacity-85 transition-opacity duration-500">
                {/* Compass Rose */}
                <g transform="translate(350, 920)">
                  <circle r="18" fill="none" stroke="#9C8B72" strokeWidth="1" />
                  <circle r="2" fill="#9C8B72" />
                  {/* Points */}
                  <polygon points="0,-16 3,-3 0,0" fill="#8B5A2B" />
                  <polygon points="0,-16 -3,-3 0,0" fill="#CD853F" />
                  <polygon points="0,16 3,3 0,0" fill="#CD853F" />
                  <polygon points="0,16 -3,3 0,0" fill="#8B5A2B" />
                  <polygon points="16,0 3,3 0,0" fill="#8B5A2B" />
                  <polygon points="16,0 3,-3 0,0" fill="#CD853F" />
                  <polygon points="-16,0 -3,3 0,0" fill="#CD853F" />
                  <polygon points="-16,0 -3,-3 0,0" fill="#8B5A2B" />
                  {/* Cardinal labels */}
                  <text y="-19" textAnchor="middle" fill="#5C4033" fontSize="8" fontWeight="bold">N</text>
                  <text x="19" y="3" textAnchor="start" fill="#5C4033" fontSize="7" fontWeight="bold">E</text>
                  <text y="24" textAnchor="middle" fill="#5C4033" fontSize="7" fontWeight="bold">S</text>
                  <text x="-19" y="3" textAnchor="end" fill="#5C4033" fontSize="7" fontWeight="bold">W</text>
                </g>

                {/* Scale Indicator */}
                <g transform="translate(315, 960)">
                  {/* Alternating black and white scale block */}
                  <rect x="0" y="0" width="30" height="3" fill="#5C4033" />
                  <rect x="30" y="0" width="30" height="3" fill="#FAF6EC" stroke="#5C4033" strokeWidth="0.5" />
                  <line x1="0" y1="0" x2="60" y2="0" stroke="#5C4033" strokeWidth="1" />
                  <line x1="0" y1="3" x2="60" y2="3" stroke="#5C4033" strokeWidth="1" />
                  <line x1="0" y1="-2" x2="0" y2="5" stroke="#5C4033" strokeWidth="1" />
                  <line x1="30" y1="-2" x2="30" y2="5" stroke="#5C4033" strokeWidth="1" />
                  <line x1="60" y1="-2" x2="60" y2="5" stroke="#5C4033" strokeWidth="1" />
                  <text x="0" y="-5" fill="#5C4033" fontSize="7" fontFamily="monospace">0</text>
                  <text x="30" y="-5" fill="#5C4033" fontSize="7" fontFamily="monospace" textAnchor="middle">1km</text>
                  <text x="60" y="-5" fill="#5C4033" fontSize="7" fontFamily="monospace" textAnchor="end">2km</text>
                  <text x="30" y="14" fill="#8B7E66" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">MAP SCALE 1:50,000</text>
                </g>
              </g>
            )}
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
