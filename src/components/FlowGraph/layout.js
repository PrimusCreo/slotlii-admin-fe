/**
 * Simple layered (BFS) layout for the flow state machine.
 * START is placed at column 0; every state is assigned a column based on
 * shortest path from START. Unreachable states are appended at the end.
 */
export function computeLayout(states, opts = {}) {
  const COL_W = opts.colW || 360;
  const ROW_H = opts.rowH || 260;
  const stateIds = Object.keys(states || {});
  const levels = {};
  const visited = new Set();

  if (states.START) {
    levels.START = 0;
    visited.add('START');
    const queue = ['START'];
    while (queue.length) {
      const cur = queue.shift();
      const trans = states[cur]?.transitions || {};
      for (const tgt of Object.values(trans)) {
        if (states[tgt] && !visited.has(tgt)) {
          visited.add(tgt);
          levels[tgt] = levels[cur] + 1;
          queue.push(tgt);
        }
      }
    }
  }

  let maxLevel = Object.values(levels).reduce((m, l) => Math.max(m, l), 0);
  stateIds.forEach((id) => {
    if (!(id in levels)) {
      levels[id] = ++maxLevel;
    }
  });

  const byLevel = {};
  Object.entries(levels).forEach(([id, l]) => {
    (byLevel[l] = byLevel[l] || []).push(id);
  });

  const positions = {};
  Object.entries(byLevel).forEach(([level, ids]) => {
    ids.sort((a, b) => (a === 'START' ? -1 : b === 'START' ? 1 : a.localeCompare(b)));
    const offset = ((ids.length - 1) * ROW_H) / 2;
    ids.forEach((id, i) => {
      positions[id] = {
        x: Number(level) * COL_W,
        y: i * ROW_H - offset,
      };
    });
  });

  return positions;
}

export function buildGraph(flow) {
  if (!flow || typeof flow !== 'object' || !flow.states) {
    return { nodes: [], edges: [] };
  }
  const positions = computeLayout(flow.states);
  const stateIds = Object.keys(flow.states);

  const incoming = {};
  stateIds.forEach((id) => (incoming[id] = 0));
  stateIds.forEach((id) => {
    const trans = flow.states[id]?.transitions || {};
    Object.values(trans).forEach((t) => {
      if (t in incoming) incoming[t] += 1;
    });
  });

  const nodes = stateIds.map((id) => {
    const s = flow.states[id] || {};
    const isStart = id === 'START';
    const hasTransitions = Object.keys(s.transitions || {}).length > 0;
    const isTerminal = !hasTransitions && !(s.options && s.options.length);
    const isOrphan = !isStart && incoming[id] === 0;
    return {
      id,
      type: 'state',
      position: positions[id] || { x: 0, y: 0 },
      data: {
        message: s.message || s.messageTemplate || '',
        isTemplate: !!s.messageTemplate,
        options: s.options || [],
        transitions: s.transitions || {},
        isStart,
        isTerminal,
        isOrphan,
      },
    };
  });

  const edges = [];
  stateIds.forEach((id) => {
    const trans = flow.states[id]?.transitions || {};
    Object.entries(trans).forEach(([optId, target]) => {
      const exists = !!flow.states[target];
      edges.push({
        id: `${id}__${optId}__${target}`,
        source: id,
        sourceHandle: optId,
        target,
        label: optId,
        animated: false,
        style: exists ? undefined : { stroke: 'var(--status-cancelled)', strokeDasharray: '4 4' },
        labelStyle: { fill: 'var(--text-secondary)', fontSize: 11 },
        labelBgStyle: { fill: 'var(--bg-card)', fillOpacity: 0.9 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
      });
    });
  });

  return { nodes, edges };
}
