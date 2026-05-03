import React, { useState, useRef, useEffect } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

const RetroNode = ({ data }: any) => {
  return (
    <div style={{
      background: data.isActive ? '#c13a3a' : data.isVisited ? '#8fa382' : '#e8e6d9',
      border: '4px solid #2b2b2b',
      padding: '12px 18px',
      fontFamily: '"Courier New", Courier, monospace',
      fontWeight: 'bold',
      fontSize: '16px',
      color: (data.isActive || data.isVisited) ? '#fff' : '#2b2b2b',
      boxShadow: '6px 6px 0px #2b2b2b',
      textTransform: 'uppercase',
      textAlign: 'center'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#2b2b2b', borderRadius: 0, border: 'none', width: '10px', height: '10px', top: '-7px' }} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#2b2b2b', borderRadius: 0, border: 'none', width: '10px', height: '10px', bottom: '-7px' }} />
    </div>
  );
};

const nodeTypes = { retro: RetroNode };

const initialNodes: Node[] = [
  { id: '1', type: 'retro', position: { x: 300, y: 50 }, data: { label: 'CHK-1', isActive: false, isVisited: false } },
  { id: '2', type: 'retro', position: { x: 100, y: 200 }, data: { label: 'CHK-2', isActive: false, isVisited: false } },
  { id: '3', type: 'retro', position: { x: 500, y: 200 }, data: { label: 'CHK-3', isActive: false, isVisited: false } },
  { id: '4', type: 'retro', position: { x: 50, y: 350 }, data: { label: 'CHK-4', isActive: false, isVisited: false } },
  { id: '5', type: 'retro', position: { x: 250, y: 350 }, data: { label: 'CHK-5', isActive: false, isVisited: false } },
  { id: '6', type: 'retro', position: { x: 400, y: 350 }, data: { label: 'CHK-6', isActive: false, isVisited: false } },
  { id: '7', type: 'retro', position: { x: 600, y: 350 }, data: { label: 'CHK-7', isActive: false, isVisited: false } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', label: '4', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
  { id: 'e1-3', source: '1', target: '3', label: '2', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
  { id: 'e2-4', source: '2', target: '4', label: '5', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
  { id: 'e2-5', source: '2', target: '5', label: '1', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
  { id: 'e3-6', source: '3', target: '6', label: '7', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
  { id: 'e3-7', source: '3', target: '7', label: '3', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
  { id: 'e5-6', source: '5', target: '6', label: '2', style: { strokeWidth: 3, stroke: '#2b2b2b' }, labelStyle: { fontFamily: 'Courier New', fontWeight: 'bold', fill: '#c13a3a', fontSize: 16 } },
];

type TraversalState = {
  activeNode: string | null;
  visited: string[];
  dsState: any;
};

function getAdjList(edges: Edge[], weighted: boolean) {
  const adj: Record<string, { node: string, weight: number }[]> = {};
  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    if (!adj[edge.target]) adj[edge.target] = [];
    const w = weighted ? parseInt(edge.label as string) || 1 : 1;
    adj[edge.source].push({ node: edge.target, weight: w });
    adj[edge.target].push({ node: edge.source, weight: w });
  }
  return adj;
}

function* runBFS(start: string, edges: Edge[]): Generator<TraversalState> {
  const adj = getAdjList(edges, false);
  const queue: string[] = [start];
  const visited = new Set<string>([start]);

  yield { activeNode: null, visited: Array.from(visited), dsState: [...queue] };

  while (queue.length > 0) {
    const current = queue.shift()!;
    yield { activeNode: current, visited: Array.from(visited), dsState: [...queue] };

    const neighbors = adj[current] || [];
    for (const n of neighbors) {
      if (!visited.has(n.node)) {
        visited.add(n.node);
        queue.push(n.node);
      }
    }
    yield { activeNode: current, visited: Array.from(visited), dsState: [...queue] };
  }
  yield { activeNode: null, visited: Array.from(visited), dsState: [] };
}

function* runDFS(start: string, edges: Edge[]): Generator<TraversalState> {
  const adj = getAdjList(edges, false);
  const stack: string[] = [start];
  const visited = new Set<string>();

  yield { activeNode: null, visited: Array.from(visited), dsState: [...stack] };

  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (!visited.has(current)) {
      visited.add(current);
      yield { activeNode: current, visited: Array.from(visited), dsState: [...stack] };

      const neighbors = adj[current] || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const n = neighbors[i];
        if (!visited.has(n.node)) {
          stack.push(n.node);
        }
      }
      yield { activeNode: current, visited: Array.from(visited), dsState: [...stack] };
    }
  }
  yield { activeNode: null, visited: Array.from(visited), dsState: [] };
}

function* runDijkstra(start: string, edges: Edge[], nodes: Node[]): Generator<TraversalState> {
  const adj = getAdjList(edges, true);
  const dist: Record<string, number> = {};
  const visited = new Set<string>();
  
  nodes.forEach(n => dist[n.id] = Infinity);
  dist[start] = 0;

  yield { activeNode: null, visited: Array.from(visited), dsState: { ...dist } };

  while (visited.size < nodes.length) {
    let current = null;
    let minDist = Infinity;
    
    for (const nodeId in dist) {
      if (!visited.has(nodeId) && dist[nodeId] < minDist) {
        minDist = dist[nodeId];
        current = nodeId;
      }
    }

    if (!current) break;

    visited.add(current);
    yield { activeNode: current, visited: Array.from(visited), dsState: { ...dist } };

    const neighbors = adj[current] || [];
    for (const n of neighbors) {
      if (!visited.has(n.node)) {
        const newDist = dist[current] + n.weight;
        if (newDist < dist[n.node]) {
          dist[n.node] = newDist;
        }
      }
    }
    yield { activeNode: current, visited: Array.from(visited), dsState: { ...dist } };
  }
  yield { activeNode: null, visited: Array.from(visited), dsState: { ...dist } };
}

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);
  const [algo, setAlgo] = useState<'BFS' | 'DFS' | 'DIJKSTRA'>('BFS');
  const [startNode, setStartNode] = useState('1');
  const [ds, setDs] = useState<any>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const genRef = useRef<Generator<TraversalState> | null>(null);

  const updateNodeState = (active: string | null, visited: string[]) => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        isActive: n.id === active,
        isVisited: visited.includes(n.id) && n.id !== active
      }
    })));
  };

  const handleStep = () => {
    if (!genRef.current) {
      if (algo === 'BFS') genRef.current = runBFS(startNode, edges);
      else if (algo === 'DFS') genRef.current = runDFS(startNode, edges);
      else genRef.current = runDijkstra(startNode, edges, nodes);
    }

    const result = genRef.current.next();

    if (!result.done) {
      setDs(result.value.dsState);
      updateNodeState(result.value.activeNode, result.value.visited);
    } else {
      setIsComplete(true);
      updateNodeState(null, result.value.visited);
    }
  };

  const handleReset = () => {
    genRef.current = null;
    setDs(algo === 'DIJKSTRA' ? {} : []);
    setIsComplete(false);
    setNodes(initialNodes);
  };

  useEffect(() => {
    handleReset();
  }, [algo, startNode]);

  const buttonStyle = {
    padding: '12px',
    cursor: isComplete ? 'not-allowed' : 'pointer',
    backgroundColor: isComplete ? '#a3a3a3' : '#c13a3a',
    color: '#e8e6d9',
    border: '4px solid #2b2b2b',
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 'bold',
    fontSize: '16px',
    textTransform: 'uppercase' as const,
    boxShadow: isComplete ? 'none' : '4px 4px 0px #2b2b2b',
    transform: isComplete ? 'translate(4px, 4px)' : 'none',
  };

  const resetStyle = {
    ...buttonStyle,
    backgroundColor: '#e8e6d9',
    color: '#2b2b2b',
    cursor: 'pointer',
    transform: 'none',
    boxShadow: '4px 4px 0px #2b2b2b'
  };

  const selectStyle = {
    padding: '10px',
    border: '4px solid #2b2b2b',
    backgroundColor: '#e8e6d9',
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '4px 4px 0px #2b2b2b',
    outline: 'none'
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', margin: 0, padding: 0, backgroundColor: '#d0cbb8', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ width: '340px', borderRight: '6px solid #2b2b2b', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#9e9c8f', zIndex: 10, boxShadow: '10px 0px 20px rgba(0,0,0,0.2)' }}>
        
        <div style={{ border: '4px solid #2b2b2b', backgroundColor: '#e8e6d9', padding: '15px', textAlign: 'center', boxShadow: '4px 4px 0px #2b2b2b' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#2b2b2b', textTransform: 'uppercase' }}>Dept. of Graphs</h2>
          <div style={{ borderTop: '2px dashed #2b2b2b', marginTop: '10px', paddingTop: '5px', fontSize: '12px' }}>AUTHORIZED PERSONNEL ONLY</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>PROTOCOL (ALGORITHM)</label>
          <select value={algo} onChange={e => setAlgo(e.target.value as any)} style={selectStyle}>
            <option value="BFS">BREADTH-FIRST (BFS)</option>
            <option value="DFS">DEPTH-FIRST (DFS)</option>
            <option value="DIJKSTRA">SHORTEST PATH (DIJKSTRA)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>ENTRY POINT (NODE)</label>
          <select value={startNode} onChange={e => setStartNode(e.target.value)} style={selectStyle}>
            {initialNodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
          </select>
        </div>

        <button onClick={handleStep} disabled={isComplete} style={buttonStyle}>
          {isComplete ? '[ INSPECTION COMPLETE ]' : 'EXECUTE STEP >>'}
        </button>
        <button onClick={handleReset} style={resetStyle}>
          RESET PERMIT
        </button>
        
        <div style={{ marginTop: '10px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', textTransform: 'uppercase', borderBottom: '2px solid #2b2b2b', paddingBottom: '5px' }}>
            {algo === 'DIJKSTRA' ? 'DISTANCE REGISTRY' : (algo === 'BFS' ? 'QUEUE BUFFER' : 'STACK BUFFER')}
          </h3>
          
          <div style={{ minHeight: '150px', border: '4px solid #2b2b2b', padding: '15px', backgroundColor: '#e8e6d9', display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start', boxShadow: 'inset 4px 4px 0px rgba(0,0,0,0.1)' }}>
            
            {algo === 'DIJKSTRA' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontWeight: 'bold' }}>
                <tbody>
                  {Object.entries(ds).map(([node, dist]: any) => (
                    <tr key={node} style={{ borderBottom: '2px dashed #a3a3a3' }}>
                      <td style={{ padding: '4px' }}>CHK-{node}</td>
                      <td style={{ padding: '4px', textAlign: 'right', color: dist === Infinity ? '#c13a3a' : '#2b2b2b' }}>
                        {dist === Infinity ? 'INF' : dist}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              ds.map((item: string, i: number) => (
                <div key={i} style={{ padding: '8px 12px', backgroundColor: '#2b2b2b', color: '#e8e6d9', border: '2px solid #2b2b2b', fontWeight: 'bold' }}>
                  CHK-{item}
                </div>
              ))
            )}
            
            {(algo !== 'DIJKSTRA' && ds.length === 0) && <span style={{ color: '#a3a3a3', fontStyle: 'italic', fontWeight: 'bold' }}>[ EMPTY ]</span>}
          </div>
        </div>
      </div>
      
      <div style={{ flexGrow: 1, backgroundColor: '#d0cbb8' }}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
          <Background color="#2b2b2b" gap={20} size={2} />
        </ReactFlow>
      </div>
    </div>
  );
}