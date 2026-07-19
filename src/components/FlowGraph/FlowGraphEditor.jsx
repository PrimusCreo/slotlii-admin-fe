import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, X, Info } from 'lucide-react';
import StateNode from './StateNode';
import { buildGraph, computeLayout } from './layout';

const nodeTypes = { state: StateNode };

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed' },
  style: { stroke: '#7c3aed', strokeWidth: 1.5 },
};

function tryParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export default function FlowGraphEditor({ value, onChange }) {
  const parsed = useMemo(() => tryParse(value), [value]);
  const flow = parsed.ok ? parsed.value : null;

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(flow),
    [flow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    // Sync graph when the underlying JSON changes (e.g. edits from the JSON tab
    // or a commit mutation). React Flow's internal state must be reseeded.
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const commit = useCallback(
    (mutator) => {
      if (!flow) return;
      const next = JSON.parse(JSON.stringify(flow));
      mutator(next);
      onChange(JSON.stringify(next, null, 2));
    },
    [flow, onChange]
  );

  const onConnect = useCallback(
    (params) => {
      const { source, target, sourceHandle } = params;
      if (!source || !target || !sourceHandle) return;
      commit((next) => {
        const s = next.states[source];
        if (!s) return;
        s.transitions = s.transitions || {};
        s.transitions[sourceHandle] = target;
      });
    },
    [commit]
  );

  const onEdgeClick = useCallback(
    (_e, edge) => {
      if (!window.confirm(`Remove transition "${edge.label}" from ${edge.source} → ${edge.target}?`)) return;
      commit((next) => {
        const s = next.states[edge.source];
        if (s?.transitions) {
          delete s.transitions[edge.label];
          if (Object.keys(s.transitions).length === 0) delete s.transitions;
        }
      });
    },
    [commit]
  );

  const onNodeClick = useCallback((_e, node) => {
    setSelectedId(node.id);
  }, []);

  const relayout = useCallback(() => {
    if (!flow) return;
    const positions = computeLayout(flow.states);
    setNodes((nds) =>
      nds.map((n) => ({ ...n, position: positions[n.id] || n.position }))
    );
  }, [flow, setNodes]);

  const addState = useCallback(() => {
    const name = window.prompt('New state name (UPPER_SNAKE_CASE):');
    if (!name) return;
    const key = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!key) return;
    if (flow?.states?.[key]) {
      alert(`State "${key}" already exists`);
      return;
    }
    commit((next) => {
      next.states = next.states || {};
      next.states[key] = { message: 'New state message' };
    });
  }, [flow, commit]);

  const selectedState = selectedId && flow?.states?.[selectedId] ? flow.states[selectedId] : null;

  if (!parsed.ok) {
    return (
      <div className="flow-graph-error">
        <Info size={16} /> JSON is invalid — fix it in the JSON tab to preview the diagram.
        <div className="flow-graph-error-detail">{parsed.error}</div>
      </div>
    );
  }

  if (!flow?.states || Object.keys(flow.states).length === 0) {
    return (
      <div className="flow-graph-empty">
        <p>No states defined yet.</p>
        <button className="btn btn-primary btn-sm" onClick={addState}>
          <Plus size={14} /> Add First State
        </button>
      </div>
    );
  }

  return (
    <div className="flow-graph-wrapper">
      <div className="flow-graph-toolbar">
        <button className="btn btn-secondary btn-sm" onClick={addState}>
          <Plus size={14} /> State
        </button>
        <button className="btn btn-ghost btn-sm" onClick={relayout}>
          Auto Layout
        </button>
        <div className="flow-graph-legend">
          <span><span className="legend-dot legend-start" /> Start</span>
          <span><span className="legend-dot legend-orphan" /> Orphan</span>
          <span><span className="legend-dot legend-terminal" /> Input/Leaf</span>
          <span className="flow-graph-legend-help">Drag from an option handle to a state to connect · Click edge to delete</span>
        </div>
      </div>

      <div className="flow-graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedId(null)}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="rgba(255,255,255,0.04)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) =>
              n.id === 'START' ? '#7c3aed' : n.data?.isTerminal ? '#64748b' : '#3b82f6'
            }
            maskColor="rgba(5, 8, 22, 0.7)"
            style={{ background: 'var(--bg-card)' }}
          />
        </ReactFlow>

        {selectedState && (
          <StateInspector
            key={selectedId}
            stateId={selectedId}
            state={selectedState}
            allStateIds={Object.keys(flow.states)}
            onClose={() => setSelectedId(null)}
            onChangeState={(mutator) =>
              commit((next) => {
                const s = next.states[selectedId];
                if (s) mutator(s, next);
              })
            }
            onRenameState={(newId) =>
              commit((next) => {
                if (!newId || newId === selectedId) return;
                if (next.states[newId]) return;
                next.states[newId] = next.states[selectedId];
                delete next.states[selectedId];
                Object.values(next.states).forEach((st) => {
                  if (st.transitions) {
                    Object.entries(st.transitions).forEach(([k, v]) => {
                      if (v === selectedId) st.transitions[k] = newId;
                    });
                  }
                });
                if (next.globalCommands) {
                  Object.entries(next.globalCommands).forEach(([k, v]) => {
                    if (v === selectedId) next.globalCommands[k] = newId;
                  });
                }
                setSelectedId(newId);
              })
            }
            onDeleteState={() => {
              if (!window.confirm(`Delete state "${selectedId}" and all transitions pointing to it?`)) return;
              commit((next) => {
                delete next.states[selectedId];
                Object.values(next.states).forEach((st) => {
                  if (st.transitions) {
                    Object.entries(st.transitions).forEach(([k, v]) => {
                      if (v === selectedId) delete st.transitions[k];
                    });
                    if (Object.keys(st.transitions).length === 0) delete st.transitions;
                  }
                });
              });
              setSelectedId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StateInspector({ stateId, state, allStateIds, onClose, onChangeState, onRenameState, onDeleteState }) {
  const [idDraft, setIdDraft] = useState(stateId);

  const messageKey = state.messageTemplate !== undefined ? 'messageTemplate' : 'message';
  const messageValue = state[messageKey] || '';

  return (
    <div className="flow-inspector">
      <div className="flow-inspector-header">
        <div>
          <div className="flow-inspector-subtitle">State</div>
          <div className="flow-inspector-title">{stateId}</div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="flow-inspector-body">
        <div className="form-group">
          <label className="form-label">State ID</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              value={idDraft}
              onChange={(e) => setIdDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
            />
            <button
              className="btn btn-secondary btn-sm"
              disabled={!idDraft || idDraft === stateId || allStateIds.includes(idDraft)}
              onClick={() => onRenameState(idDraft)}
            >
              Rename
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Message type</label>
          <div className="flow-inspector-segmented">
            <button
              className={messageKey === 'message' ? 'segmented-active' : ''}
              onClick={() =>
                onChangeState((s) => {
                  const val = s.messageTemplate ?? s.message ?? '';
                  delete s.messageTemplate;
                  s.message = val;
                })
              }
            >
              Plain
            </button>
            <button
              className={messageKey === 'messageTemplate' ? 'segmented-active' : ''}
              onClick={() =>
                onChangeState((s) => {
                  const val = s.message ?? s.messageTemplate ?? '';
                  delete s.message;
                  s.messageTemplate = val;
                })
              }
            >
              Template
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            {messageKey === 'messageTemplate' ? 'Message template (supports {{placeholders}})' : 'Message'}
          </label>
          <textarea
            className="form-input"
            rows={4}
            value={messageValue}
            onChange={(e) =>
              onChangeState((s) => {
                s[messageKey] = e.target.value;
              })
            }
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>Options</label>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                onChangeState((s) => {
                  s.options = s.options || [];
                  const base = 'new_option';
                  let i = s.options.length;
                  let id = `${base}_${i}`;
                  while (s.options.some((o) => o.id === id)) id = `${base}_${++i}`;
                  s.options.push({ id, title: 'New Option' });
                })
              }
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {(state.options || []).length === 0 ? (
            <div className="form-hint">No options. This state waits for free-text input.</div>
          ) : (
            <div className="flow-inspector-options">
              {(state.options || []).map((opt, idx) => (
                <div key={idx} className="flow-inspector-option">
                  <input
                    className="form-input form-input-sm"
                    placeholder="option_id"
                    value={opt.id}
                    onChange={(e) => {
                      const newId = e.target.value;
                      onChangeState((s) => {
                        const oldId = s.options[idx].id;
                        s.options[idx].id = newId;
                        if (s.transitions && oldId in s.transitions) {
                          s.transitions[newId] = s.transitions[oldId];
                          delete s.transitions[oldId];
                        }
                      });
                    }}
                  />
                  <input
                    className="form-input form-input-sm"
                    placeholder="Title shown to user"
                    value={opt.title}
                    onChange={(e) =>
                      onChangeState((s) => {
                        s.options[idx].title = e.target.value;
                      })
                    }
                  />
                  <select
                    className="form-input form-input-sm"
                    value={(state.transitions && state.transitions[opt.id]) || ''}
                    onChange={(e) =>
                      onChangeState((s) => {
                        s.transitions = s.transitions || {};
                        if (!e.target.value) {
                          delete s.transitions[opt.id];
                          if (Object.keys(s.transitions).length === 0) delete s.transitions;
                        } else {
                          s.transitions[opt.id] = e.target.value;
                        }
                      })
                    }
                  >
                    <option value="">— no transition —</option>
                    {allStateIds.map((sid) => (
                      <option key={sid} value={sid}>{sid}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() =>
                      onChangeState((s) => {
                        const removed = s.options[idx];
                        s.options.splice(idx, 1);
                        if (s.transitions && removed.id in s.transitions) {
                          delete s.transitions[removed.id];
                          if (Object.keys(s.transitions).length === 0) delete s.transitions;
                        }
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flow-inspector-footer">
        <button className="btn btn-danger btn-sm" onClick={onDeleteState} disabled={stateId === 'START'}>
          <Trash2 size={14} /> Delete State
        </button>
      </div>
    </div>
  );
}
