import { useState, useRef, useEffect } from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: '1' } },
  { id: '2', position: { x: 100, y: 150 }, data: { label: '2' } },
  { id: '3', position: { x: 400, y: 150 }, data: { label: '3' } },
  { id: '4', position: { x: 50, y: 250 }, data: { label: '4' } },
  { id: '5', position: { x: 150, y: 250 }, data: { label: '5' } },
  { id: '6', position: { x: 350, y: 250 }, data: { label: '6' } },
  { id: '7', position: { x: 450, y: 250 }, data: { label: '7' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e2-5', source: '2', target: '5' },
  { id: 'e3-6', source: '3', target: '6' },
  { id: 'e3-7', source: '3', target: '7' },
];

type TraversalState = {
  activeNode: string | null;
  dataStructure: string[];
  visited: string[];
};

function getAdjList(edges: Edge[]) {
  const adj: Record<string, string[]> = {};
  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    if (!adj[edge.target]) adj[edge.target] = [];
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
  }
  return adj;
}

function* runBFS(start: string, edges: Edge[]): Generator<TraversalState> {
  const adj = getAdjList(edges);
  const queue: string[] = [start];
  const visited = new Set<string>([start]);

  yield { activeNode: null, dataStructure: [...queue], visited: Array.from(visited) };

  while (queue.length > 0) {
    const current = queue.shift()!;
    yield { activeNode: current, dataStructure: [...queue], visited: Array.from(visited) };

    const neighbors = adj[current] || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
    yield { activeNode: current, dataStructure: [...queue], visited: Array.from(visited) };
  }
  yield { activeNode: null, dataStructure: [], visited: Array.from(visited) };
}

function* runDFS(start: string, edges: Edge[]): Generator<TraversalState> {
  const adj = getAdjList(edges);
  const stack: string[] = [start];
  const visited = new Set<string>();

  yield { activeNode: null, dataStructure: [...stack], visited: Array.from(visited) };

  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (!visited.has(current)) {
      visited.add(current);
      yield { activeNode: current, dataStructure: [...stack], visited: Array.from(visited) };

      const neighbors = adj[current] || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const n = neighbors[i];
        if (!visited.has(n)) {
          stack.push(n);
        }
      }
      yield { activeNode: current, dataStructure: [...stack], visited: Array.from(visited) };
    }
  }
  yield { activeNode: null, dataStructure: [], visited: Array.from(visited) };
}

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);
  const [algo, setAlgo] = useState<'BFS' | 'DFS'>('BFS');
  const [startNode, setStartNode] = useState('1');
  const [ds, setDs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const genRef = useRef<Generator<TraversalState> | null>(null);

  const updateNodeColors = (active: string | null, visited: string[]) => {
    setNodes(nds => nds.map(n => {
      if (n.id === active) {
        return { ...n, style: { background: '#ff0072', color: '#fff', border: 'none' } };
      }
      if (visited.includes(n.id)) {
        return { ...n, style: { background: '#00c4ff', color: '#fff', border: 'none' } };
      }
      return { ...n, style: { background: '#fff', color: '#222', border: '1px solid #222' } };
    }));
  };

  const handleStep = () => {
    if (!genRef.current) {
      genRef.current = algo === 'BFS' ? runBFS(startNode, edges) : runDFS(startNode, edges);
    }

    const result = genRef.current.next();

    if (!result.done) {
      setDs(result.value.dataStructure);
      updateNodeColors(result.value.activeNode, result.value.visited);
    } else {
      setIsComplete(true);
      updateNodeColors(null, result.value.visited);
    }
  };

  const handleReset = () => {
    genRef.current = null;
    setDs([]);
    setIsComplete(false);
    setNodes(initialNodes);
  };

  useEffect(() => {
    handleReset();
  }, [algo, startNode]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ margin: 0 }}>Graph Traversal</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>Algorithm</label>
          <select value={algo} onChange={e => setAlgo(e.target.value as 'BFS' | 'DFS')} style={{ padding: '8px' }}>
            <option value="BFS">Breadth-First Search (BFS)</option>
            <option value="DFS">Depth-First Search (DFS)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>Start Node</label>
          <select value={startNode} onChange={e => setStartNode(e.target.value)} style={{ padding: '8px' }}>
            {initialNodes.map(n => <option key={n.id} value={n.id}>Node {n.id}</option>)}
          </select>
        </div>

        <button onClick={handleStep} disabled={isComplete} style={{ padding: '10px', cursor: isComplete ? 'not-allowed' : 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          {isComplete ? 'Complete' : 'Step Forward'}
        </button>
        <button onClick={handleReset} style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          Reset
        </button>
        
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{algo === 'BFS' ? 'Queue' : 'Stack'}</h3>
          <div style={{ minHeight: '100px', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', gap: '5px', alignContent: 'flex-start' }}>
            {ds.map((item, i) => (
              <div key={i} style={{ padding: '5px 10px', backgroundColor: '#e9ecef', border: '1px solid #ced4da', borderRadius: '3px' }}>
                {item}
              </div>
            ))}
            {ds.length === 0 && <span style={{ color: '#6c757d' }}>Empty</span>}
          </div>
        </div>
      </div>
      <div style={{ flexGrow: 1 }}>
        <ReactFlow nodes={nodes} edges={edges}>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}