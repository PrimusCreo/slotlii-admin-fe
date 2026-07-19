import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, MessageSquare, Zap } from 'lucide-react';

function StateNode({ id, data, selected }) {
  const { message, isTemplate, options = [], transitions = {}, isStart, isTerminal, isOrphan } = data;

  return (
    <div className={`flow-node ${selected ? 'flow-node-selected' : ''} ${isStart ? 'flow-node-start' : ''} ${isTerminal ? 'flow-node-terminal' : ''} ${isOrphan ? 'flow-node-orphan' : ''}`}>
      <Handle type="target" position={Position.Left} className="flow-handle flow-handle-target" />

      <div className="flow-node-header">
        <div className="flow-node-title">
          {isStart && <Zap size={12} />}
          <span>{id}</span>
        </div>
        {isTemplate ? (
          <span className="flow-node-badge flow-node-badge-template">
            <FileText size={10} /> template
          </span>
        ) : message ? (
          <span className="flow-node-badge flow-node-badge-message">
            <MessageSquare size={10} /> message
          </span>
        ) : null}
      </div>

      {message ? (
        <div className="flow-node-message" title={message}>
          {message.length > 120 ? message.slice(0, 120) + '…' : message}
        </div>
      ) : (
        <div className="flow-node-message flow-node-message-empty">No message</div>
      )}

      {options.length > 0 && (
        <div className="flow-node-options">
          {options.map((opt) => {
            const target = transitions[opt.id];
            return (
              <div key={opt.id} className={`flow-node-option ${target ? '' : 'flow-node-option-unbound'}`}>
                <div className="flow-node-option-title">{opt.title}</div>
                <div className="flow-node-option-id">{opt.id}</div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={opt.id}
                  className="flow-handle flow-handle-source"
                />
              </div>
            );
          })}
        </div>
      )}

      {options.length === 0 && Object.keys(transitions).length === 0 && (
        <div className="flow-node-no-transitions">— input / leaf —</div>
      )}

      {options.length === 0 && Object.keys(transitions).length > 0 && (
        <div className="flow-node-options">
          {Object.entries(transitions).map(([key]) => (
            <div key={key} className="flow-node-option">
              <div className="flow-node-option-title">{key}</div>
              <Handle
                type="source"
                position={Position.Right}
                id={key}
                className="flow-handle flow-handle-source"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(StateNode);
