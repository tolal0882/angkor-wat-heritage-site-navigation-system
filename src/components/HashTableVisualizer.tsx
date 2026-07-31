/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PLACES } from '../data/places';
import { Place, PlaceType, HashBucket, HashTableItem } from '../types';
import { buildHashTable, computeCustomHash, HASH_TABLE_CAPACITY } from '../utils/algorithms';
import { Hash, Search, Plus, Cpu, RefreshCw, Layers, CheckCircle, AlertTriangle, Maximize2, Minimize2, List, Grid, Database, Binary } from 'lucide-react';

export default function HashTableVisualizer() {
  const [placesData, setPlacesData] = useState<Place[]>(PLACES);
  const [hashTable, setHashTable] = useState<HashBucket[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [insertName, setInsertName] = useState<string>('');
  const [insertType, setInsertType] = useState<PlaceType>('Historical Monument');
  
  // UI Style state: 'chaining' | 'matrix' | 'cards'
  const [uiStyle, setUiStyle] = useState<'chaining' | 'matrix' | 'cards'>('chaining');
  
  // Animation state trackers
  const [activeBucketIndex, setActiveBucketIndex] = useState<number | null>(null);
  const [activeChainIndex, setActiveChainIndex] = useState<number | null>(null);
  const [foundItem, setFoundItem] = useState<HashTableItem | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [traceLog, setTraceLog] = useState<string[]>([]);
  const [formulaLogs, setFormulaLogs] = useState<{ key: string; charSum: string; hashResult: number; bucketIdx: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Rebuild table whenever places change
  useEffect(() => {
    setHashTable(buildHashTable(placesData));
  }, [placesData]);

  // Execute hash lookup step-by-step. Every site is hashed under BOTH its
  // Temple ID (e.g. "T01") and its Name, so either one resolves here.
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    const normalizedQuery = query.trim().toUpperCase();
    setSearching(true);
    setFoundItem(null);
    setActiveBucketIndex(null);
    setActiveChainIndex(null);

    const logs: string[] = [];
    logs.push(`Initializing lookup for: "${query.trim()}"`);

    // 1. Calculate custom hash
    const { hashCode, index } = computeCustomHash(normalizedQuery);

    // Build breakdown visualizer mathematical log
    let breakDownStr = '';
    for (let i = 0; i < Math.min(normalizedQuery.length, 6); i++) {
      const ch = normalizedQuery[i];
      const code = normalizedQuery.charCodeAt(i);
      breakDownStr += `'${ch}'(${code}) * 31 * ${i + 1} + `;
    }
    if (normalizedQuery.length > 6) breakDownStr += '...';
    else breakDownStr = breakDownStr.slice(0, -3);

    setFormulaLogs({
      key: normalizedQuery,
      charSum: breakDownStr,
      hashResult: hashCode,
      bucketIdx: index,
    });

    logs.push(`Step 1: Compute hash signature sum.`);
    logs.push(`Formula: h(k) = Σ (char[i] * 31 * (i + 1)) = ${hashCode}`);
    logs.push(`Step 2: Map to table boundary via modulo calculation: index = h(k) % ${HASH_TABLE_CAPACITY} = ${index}`);

    setTraceLog([...logs]);

    // Delay to simulate computation phases
    await new Promise((r) => setTimeout(r, 800));
    setActiveBucketIndex(index);
    logs.push(`Step 3: Accessing Bucket Array directly at Index [${index}]. (O(1) Array Probe Success)`);
    setTraceLog([...logs]);

    const bucket = hashTable[index];
    if (!bucket || bucket.items.length === 0) {
      await new Promise((r) => setTimeout(r, 600));
      logs.push(`Result: Bucket [${index}] is empty. "${query.trim()}" does not exist in Hash Table.`);
      setTraceLog([...logs]);
      setSearching(false);
      return;
    }

    // 2. Traverse Chained list (collision chaining)
    logs.push(`Collision resolution check: Bucket contains ${bucket.items.length} node(s). Starting linear chaining traversal.`);
    setTraceLog([...logs]);

    let matchFound = false;
    for (let i = 0; i < bucket.items.length; i++) {
      setActiveChainIndex(i);
      const item = bucket.items[i];
      await new Promise((r) => setTimeout(r, 700));

      if (item.key.toUpperCase() === normalizedQuery) {
        matchFound = true;
        setFoundItem(item);
        logs.push(`Match Found! Linked node [${i}] key: "${item.key}" (${item.value.name}) matches search query: "${query.trim()}".`);
        logs.push(`Retrieved item data: "${item.value.description.slice(0, 70)}..."`);
        setTraceLog([...logs]);
        break;
      } else {
        logs.push(`Comparing node [${i}] key: "${item.key}" with query. (Collision check: Not matching. Advancing pointer...)`);
        setTraceLog([...logs]);
      }
    }

    if (!matchFound) {
      logs.push(`Result: Searched entire bucket chain. "${query.trim()}" is not registered.`);
      setTraceLog([...logs]);
    }

    setSearching(false);
  };

  // Add custom site (auto-assigns the next sequential Temple ID)
  const handleInsert = () => {
    if (!insertName.trim()) return;

    // Prevent duplicates
    if (placesData.some((p) => p.name.toLowerCase() === insertName.trim().toLowerCase())) {
      alert('This place name already exists!');
      return;
    }

    const nextTempleId = `T${String(placesData.length + 1).padStart(2, '0')}`;

    const newPlace: Place = {
      id: `custom_${Date.now()}`,
      templeId: nextTempleId,
      name: insertName.trim(),
      type: insertType,
      openingHours: '7:30 AM - 5:30 PM',
      description: 'A custom added site in the Angkor Archaeological Park. Handled inside HashTable chaining.',
      x: 500,
      y: 500,
    };

    setPlacesData([...placesData, newPlace]);

    // Scroll and trigger search look up
    setInsertName('');
    setTimeout(() => {
      handleSearch(newPlace.templeId);
    }, 150);
  };

  const handleReset = () => {
    setPlacesData(PLACES);
    setActiveBucketIndex(null);
    setActiveChainIndex(null);
    setFoundItem(null);
    setTraceLog([]);
    setFormulaLogs(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* 1. Interactive Control & Formula Board (Left side) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        {/* Probe controls card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Search className="w-4 h-4 text-emerald-600" />
              O(1) Hash Probe Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Lookup any temple by ID (e.g. T01) or by Name instantly to trigger bucket tracing animations
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. T01, Bayon, Kravan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searching}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              Search
            </button>
          </div>

          {/* Quick Click Search lists */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Probe Shortcuts</span>
            <div className="flex flex-wrap gap-1.5">
              {placesData.slice(0, 14).filter((_, i) => [0, 2, 10, 12, 13].includes(i)).map((place) => (
                <button
                  key={place.templeId}
                  onClick={() => {
                    setSearchQuery(place.templeId);
                    handleSearch(place.templeId);
                  }}
                  disabled={searching}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold font-sans px-2.5 py-1 rounded-lg border border-slate-200/50 transition-colors"
                >
                  {place.templeId} · {place.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add custom node to prove chaining */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Insert Custom Chained Key
            </h3>
            <p className="text-xs text-slate-500">
              Create a custom place - it's auto-assigned the next Temple ID (used as the hash key).
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Place Name</label>
              <input
                type="text"
                placeholder="e.g. Preah Vihear, Phnom Bakheng..."
                value={insertName}
                onChange={(e) => setInsertName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Place Type Category</label>
              <select
                value={insertType}
                onChange={(e) => setInsertType(e.target.value as PlaceType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
              >
                <option value="Main Temple">Main Temple</option>
                <option value="Mountain Temple">Mountain Temple</option>
                <option value="Hindu Temple">Hindu Temple</option>
                <option value="Monastery Temple">Monastery Temple</option>
                <option value="Historical Monument">Historical Monument</option>
              </select>
            </div>

            <button
              onClick={handleInsert}
              disabled={!insertName.trim()}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              Insert into Hash Table
            </button>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Reset Table to Default
        </button>
      </div>

      {/* 2. Visual Table & Chaining visualization (Center grid) */}
      <div className={`lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${isExpanded ? 'lg:h-[800px] md:h-[680px] h-[550px]' : 'lg:h-[580px] md:h-[480px] h-[380px]'} overflow-hidden transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 animate-pulse" />
              Bucketed Memory Structure
            </h3>
            <p className="text-xs text-slate-500">
              Visualizes array buckets (size 13) showing resolving chains for overlapping keys
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-auto sm:ml-0">
            {/* UI Style Selector Pill Switch */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setUiStyle('chaining')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-150 ${
                  uiStyle === 'chaining'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Chaining List View: Linear buckets with node links"
              >
                <List className="w-3 h-3" />
                <span>Chaining</span>
              </button>
              <button
                onClick={() => setUiStyle('matrix')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-150 ${
                  uiStyle === 'matrix'
                    ? 'bg-slate-900 text-emerald-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="RAM Matrix View: Cybernetic memory grid with hex offsets"
              >
                <Binary className="w-3 h-3" />
                <span>RAM Matrix</span>
              </button>
              <button
                onClick={() => setUiStyle('cards')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-150 ${
                  uiStyle === 'cards'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Card Dashboard View: Compact multi-column bucket cards"
              >
                <Grid className="w-3 h-3" />
                <span>Card Grid</span>
              </button>
            </div>

            <div className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shrink-0">
              Load: {(placesData.length / 13).toFixed(2)}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg shadow-xs font-semibold transition-all duration-150 shrink-0"
              title={isExpanded ? "Switch to Compact Height" : "Switch to Flexible/Expanded Height"}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>
          </div>
        </div>

        {/* ----------------- STYLE 1: CHAINING LIST (Standard) ----------------- */}
        {uiStyle === 'chaining' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {hashTable.map((bucket, bIdx) => {
              const isTargetBucket = activeBucketIndex === bIdx;

              return (
                <div
                  key={bIdx}
                  className={`flex items-start gap-4 p-2 rounded-xl transition-all duration-300 border
                    ${
                      isTargetBucket
                        ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                        : 'bg-slate-50/40 border-slate-100'
                    }`}
                >
                  {/* Bucket Index Marker */}
                  <div
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[11px] font-mono font-bold border shrink-0 transition-colors duration-300
                      ${
                        isTargetBucket
                          ? 'bg-indigo-600 border-indigo-700 text-white'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                  >
                    <span className="text-[8px] opacity-75">IDX</span>
                    <span>{bIdx}</span>
                  </div>

                  {/* Linked chain of items */}
                  <div className="flex flex-wrap items-center gap-2 py-1.5 flex-1 overflow-x-auto">
                    {bucket.items.length === 0 ? (
                      <span className="text-[11px] font-mono text-slate-400 italic">EMPTY [NULL]</span>
                    ) : (
                      bucket.items.map((item, cIdx) => {
                        const isTargetNode = isTargetBucket && activeChainIndex === cIdx;
                        const isSuccessMatch = isTargetNode && foundItem && foundItem.key === item.key;

                        return (
                          <div key={item.key} className="flex items-center gap-2">
                            {/* Chain Box Node */}
                            <motion.div
                              animate={
                                isSuccessMatch
                                  ? { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }
                                  : {}
                              }
                              transition={{ repeat: isSuccessMatch ? Infinity : 0, duration: 1.5 }}
                              className={`rounded-xl border px-3 py-1 text-xs font-mono font-medium shadow-sm transition-all duration-300 select-none
                                ${
                                  isSuccessMatch
                                    ? 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-100 font-semibold'
                                    : isTargetNode
                                    ? 'bg-amber-400 border-amber-500 text-slate-900 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-[9px] opacity-70">Key: "{item.key}" ({item.value.name})</span>
                                <span className="text-[8px] font-bold opacity-60">Hash: {item.hashCode}</span>
                              </div>
                            </motion.div>

                            {/* Link Pointer Arrow */}
                            {cIdx < bucket.items.length - 1 && (
                              <span className="text-slate-300 font-bold select-none text-sm">→</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------- STYLE 2: RAM MATRIX VIEW (Cybernetic Memory) ----------------- */}
        {uiStyle === 'matrix' && (
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              <span>RAM Bus Sector: 0x7F00 - 0x7F0C</span>
              <span>Architecture: Direct-Mapped Bucket Arrays</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {hashTable.map((bucket, bIdx) => {
                const isTargetBucket = activeBucketIndex === bIdx;
                const hexAddr = `0x7F0${bIdx.toString(16).toUpperCase().padStart(2, '0')}`;
                const hasCollision = bucket.items.length > 1;

                return (
                  <div
                    key={bIdx}
                    className={`p-2.5 rounded-lg border transition-all duration-300 flex flex-col justify-between ${
                      isTargetBucket
                        ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg'
                        : bucket.items.length > 0
                        ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-900/30 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 border-b border-slate-800/80 pb-1">
                      <span className="text-emerald-400 font-bold">{hexAddr}</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        IDX [{bIdx}]
                      </span>
                    </div>

                    <div className="space-y-1 my-1">
                      {bucket.items.length === 0 ? (
                        <div className="text-[10px] text-slate-600 italic py-1">[0x0000 UNALLOCATED]</div>
                      ) : (
                        bucket.items.map((item, cIdx) => {
                          const isTargetNode = isTargetBucket && activeChainIndex === cIdx;
                          const isSuccessMatch = isTargetNode && foundItem && foundItem.key === item.key;

                          return (
                            <div
                              key={item.key}
                              className={`text-[10px] px-2 py-1 rounded border flex items-center justify-between gap-1 transition-all ${
                                isSuccessMatch
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold animate-pulse'
                                  : isTargetNode
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
                              }`}
                            >
                              <span className="truncate">"{item.key}" {item.value.name}</span>
                              <span className="text-[8px] opacity-70 shrink-0">#{item.hashCode}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-slate-800/60 mt-1">
                      <span className="text-slate-500">Nodes: {bucket.items.length}</span>
                      {hasCollision && (
                        <span className="text-amber-400 text-[8px] bg-amber-950/60 border border-amber-800/60 px-1 rounded font-bold">
                          COLLISION
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- STYLE 3: CARD DASHBOARD GRID ----------------- */}
        {uiStyle === 'cards' && (
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hashTable.map((bucket, bIdx) => {
                const isTargetBucket = activeBucketIndex === bIdx;

                return (
                  <div
                    key={bIdx}
                    className={`rounded-xl p-3 border transition-all duration-300 flex flex-col justify-between ${
                      isTargetBucket
                        ? 'bg-indigo-50 border-indigo-300 shadow-md ring-2 ring-indigo-400/20'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                            isTargetBucket ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {bIdx}
                          </span>
                          <span className="text-xs font-bold text-slate-800">Bucket #{bIdx}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          bucket.items.length === 0
                            ? 'bg-slate-200/50 text-slate-500'
                            : bucket.items.length === 1
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {bucket.items.length} {bucket.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {/* Items Pills */}
                      <div className="space-y-1.5 min-h-[48px]">
                        {bucket.items.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic text-center py-2 font-mono">
                            Empty Bucket
                          </div>
                        ) : (
                          bucket.items.map((item, cIdx) => {
                            const isTargetNode = isTargetBucket && activeChainIndex === cIdx;
                            const isSuccessMatch = isTargetNode && foundItem && foundItem.key === item.key;

                            return (
                              <div
                                key={item.key}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center justify-between transition-all ${
                                  isSuccessMatch
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs font-bold ring-2 ring-emerald-200'
                                    : isTargetNode
                                    ? 'bg-amber-400 text-slate-900 border-amber-500 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="truncate">{item.key} · {item.value.name}</span>
                                <span className="text-[9px] font-mono opacity-75 shrink-0 ml-1">h:{item.hashCode}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Footer load bar */}
                    <div className="mt-2 pt-1.5 border-t border-slate-200/40">
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            bucket.items.length > 1
                              ? 'bg-amber-500'
                              : bucket.items.length === 1
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(bucket.items.length * 33, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Mathematical Trace log (Full width footer) */}
      <AnimatePresence>
        {(formulaLogs || traceLog.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="col-span-1 lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950 text-slate-200 p-5 rounded-2xl shadow-xl border border-slate-800"
          >
            {/* Hash Calculation Breakdown */}
            {formulaLogs && (
              <div className="md:col-span-6 space-y-3">
                <h4 className="font-mono text-indigo-400 font-bold text-xs flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  Hash Mathematics Core Engine
                </h4>
                <div className="space-y-2.5 text-xs bg-black/40 border border-slate-800 p-4 rounded-xl font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Input String Key</span>
                    <span className="text-emerald-400 font-semibold">"{formulaLogs.key}"</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Summing Polynomial weight</span>
                    <span className="text-slate-300 text-[10px] break-all leading-tight">{formulaLogs.charSum}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Polyhash Signature h(k)</span>
                      <span className="text-amber-400 font-bold">{formulaLogs.hashResult}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Modulo Bucket: index = h(k) % 13</span>
                      <span className="text-sky-400 font-bold">{formulaLogs.bucketIdx}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trace Steps list */}
            <div className="md:col-span-6 flex flex-col justify-between">
              <div>
                <h4 className="font-mono text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-2.5">
                  <CheckCircle className="w-4 h-4" />
                  Step-by-step Trace console
                </h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-2 text-[11px] font-mono leading-relaxed text-slate-300">
                  {traceLog.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">{idx + 1}.</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {foundItem && (
                <div className="mt-3 bg-emerald-950/60 border border-emerald-900/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-[11px]">
                    <span className="text-emerald-300 font-bold">O(1) Retrieval SUCCESS:</span> Key matches with <span className="font-semibold text-white">"{foundItem.key}"</span>. Description is synchronized!
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
