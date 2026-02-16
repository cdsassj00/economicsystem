import React from 'react';
import { NODES_LAYOUT, CONNECTIONS } from '../constants';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EcoMapProps {
  nodeValues: Record<string, number>; // Mapped values for each node ID
}

export const EcoMap: React.FC<EcoMapProps> = ({ nodeValues }) => {
  
  const getImpactColor = (val: number) => {
    if (val > 0.2) return '#22c55e'; // Green
    if (val < -0.2) return '#ef4444'; // Red
    return '#94a3b8'; // Slate 400
  };

  const getImpactClass = (val: number) => {
    if (val > 0.2) return 'bg-green-100 border-green-500 text-green-700 shadow-green-100';
    if (val < -0.2) return 'bg-red-100 border-red-500 text-red-700 shadow-red-100';
    return 'bg-slate-50 border-slate-300 text-slate-600';
  };

  // Helper to find node coordinates
  const getNode = (id: string) => NODES_LAYOUT.find((n) => n.id === id);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 p-4 overflow-hidden select-none">
      <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Economic Interaction Map</h3>
      
      {/* SVG Layer for Connections */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <defs>
          <marker id="arrowhead-gray" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
        </defs>
        {CONNECTIONS.map((conn, idx) => {
          const start = getNode(conn.from);
          const end = getNode(conn.to);
          if (!start || !end) return null;

          // Simple logic to color lines based on source node activity
          const sourceVal = nodeValues[start.id] || 0;
          const strokeColor = Math.abs(sourceVal) > 0.1 ? (sourceVal > 0 ? '#22c55e' : '#ef4444') : '#cbd5e1';
          const opacity = Math.abs(sourceVal) > 0.1 ? 1 : 0.4;
          const strokeWidth = Math.abs(sourceVal) > 0.1 ? 2 : 1.5;

          return (
            <line
              key={`${conn.from}-${conn.to}`}
              x1={`${start.x}%`}
              y1={`${start.y}%`}
              x2={`${end.x}%`}
              y2={`${end.y}%`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              markerEnd="url(#arrowhead-gray)"
              className="transition-all duration-500 ease-out"
            />
          );
        })}
      </svg>

      {/* Nodes Layer */}
      {NODES_LAYOUT.map((node) => {
        const val = nodeValues[node.id] || 0;
        const impactClass = getImpactClass(val);
        const size = Math.abs(val) > 0.5 ? 'scale-110' : 'scale-100';

        return (
          <div
            key={node.id}
            className={`absolute z-10 flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-2 shadow-lg transition-all duration-500 ease-out transform -translate-x-1/2 -translate-y-1/2 ${impactClass} ${size}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="mb-1">
              {val > 0.2 ? (
                <TrendingUp size={20} />
              ) : val < -0.2 ? (
                <TrendingDown size={20} />
              ) : (
                <Minus size={20} />
              )}
            </div>
            <span className="text-xs md:text-sm font-bold text-center leading-tight">
              {node.label}
            </span>
          </div>
        );
      })}

      <div className="absolute bottom-2 right-2 flex gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>긍정적/상승</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>부정적/하락</div>
      </div>
    </div>
  );
};