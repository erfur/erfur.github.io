'use strict';

// wiring[i][j] is the position delta applied to layer j when layer i is moved
// LEFT: -1 = toward hole 1, +1 = toward hole 7, 0 = unaffected. Diagonal is -1.
// Moving a layer RIGHT negates the row. No cascade.
//
// Walls are ALL-OR-NOTHING: a move affects the picked plate plus its wired
// plates. If ANY affected pin would be pushed past hole 1 or 7, the entire move
// is rejected and no plate moves. (Pins never partially slide into a wall.)

// positions: array length N of ints in 1..7. Returns a NEW array; equal to the
// input (a fresh copy) when the move is blocked.
function applyAction(positions, wiring, layer, dir) {
  const sign = dir === 'L' ? 1 : -1;
  const row = wiring[layer];
  // Pass 1: if any affected pin would leave [1, 7], the whole move is blocked.
  for (let j = 0; j < positions.length; j++) {
    const delta = sign * row[j];
    if (delta === 0) continue;
    const target = positions[j] + delta;
    if (target < 1 || target > 7) return positions.slice();
  }
  // Pass 2: every affected pin can move -> apply all deltas together.
  const next = positions.slice();
  for (let j = 0; j < next.length; j++) {
    next[j] += sign * row[j];
  }
  return next;
}

function isSolved(positions) {
  for (let j = 0; j < positions.length; j++) {
    if (positions[j] !== 4) return false;
  }
  return true;
}

// Compact integer key, valid for positions in 1..7 (base-7 digits).
function encodeState(positions) {
  let code = 0;
  for (let j = 0; j < positions.length; j++) {
    code = code * 7 + (positions[j] - 1);
  }
  return code;
}

// Replay the first k steps from config.start; returns positions after k steps.
function replaySteps(config, steps, k) {
  let positions = config.start.slice();
  for (let s = 0; s < k; s++) {
    positions = applyAction(positions, config.wiring, steps[s].layer, steps[s].dir);
  }
  return positions;
}

// BFS for the shortest action sequence to all-4s.
// Returns { solvable: boolean, steps: [{ layer, dir }] }.
function solve(config) {
  const start = config.start.slice();
  const wiring = config.wiring;
  const n = start.length;

  if (isSolved(start)) return { solvable: true, steps: [] };

  const startKey = encodeState(start);
  const visited = new Set([startKey]);
  const parent = new Map(); // key -> { prevKey, action: { layer, dir } }
  let frontier = [[start, startKey]];

  while (frontier.length > 0) {
    const nextFrontier = [];
    for (const [stateArr, stateKey] of frontier) {
      for (let layer = 0; layer < n; layer++) {
        for (const dir of ['L', 'R']) {
          const next = applyAction(stateArr, wiring, layer, dir);
          const key = encodeState(next);
          if (visited.has(key)) continue;
          visited.add(key);
          parent.set(key, { prevKey: stateKey, action: { layer, dir } });
          if (isSolved(next)) {
            return { solvable: true, steps: reconstruct(parent, startKey, key) };
          }
          nextFrontier.push([next, key]);
        }
      }
    }
    frontier = nextFrontier;
  }
  return { solvable: false, steps: [] };
}

function reconstruct(parent, startKey, goalKey) {
  const steps = [];
  let key = goalKey;
  while (key !== startKey) {
    const entry = parent.get(key);
    steps.push(entry.action);
    key = entry.prevKey;
  }
  steps.reverse();
  return steps;
}

// Like solve(), but records the whole BFS as data for visualization.
// Stops the moment the goal is generated (mirrors solve()).
function solveTrace(config) {
  const start = config.start.slice();
  const wiring = config.wiring;
  const n = start.length;

  const nodes = [{ depth: 0, parent: -1, action: null }];
  const indexOf = new Map([[encodeState(start), 0]]);

  if (isSolved(start)) {
    return { solvable: true, nodes, goalIndex: 0, pathIndices: [0], maxDepth: 0 };
  }

  let frontier = [[start, 0]]; // [stateArr, nodeIndex]
  let depth = 0;
  while (frontier.length > 0) {
    const nextFrontier = [];
    depth++;
    for (const [stateArr, stateIndex] of frontier) {
      for (let layer = 0; layer < n; layer++) {
        for (const dir of ['L', 'R']) {
          const next = applyAction(stateArr, wiring, layer, dir);
          const key = encodeState(next);
          if (indexOf.has(key)) continue;
          const idx = nodes.length;
          indexOf.set(key, idx);
          nodes.push({ depth, parent: stateIndex, action: { layer, dir } });
          if (isSolved(next)) {
            return { solvable: true, nodes, goalIndex: idx,
                     pathIndices: tracePath(nodes, idx), maxDepth: depth };
          }
          nextFrontier.push([next, idx]);
        }
      }
    }
    frontier = nextFrontier;
  }
  return { solvable: false, nodes, goalIndex: -1, pathIndices: [],
           maxDepth: nodes[nodes.length - 1].depth };
}

function tracePath(nodes, goalIndex) {
  const path = [];
  for (let i = goalIndex; i !== -1; i = nodes[i].parent) path.push(i);
  path.reverse();
  return path;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyAction, isSolved, encodeState, replaySteps, solve, solveTrace };
}
