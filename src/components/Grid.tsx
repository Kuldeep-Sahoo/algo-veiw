"use client";

import type React from "react";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Plus, Trash2, Save, FolderOpen } from "lucide-react";

// Graph node type
interface Node {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

// Graph edge type
interface Edge {
  from: string;
  to: string;
}

// Node states for visualization
type NodeState = "unvisited" | "visiting" | "visited" | "current";

// Sample graph data
const SAMPLE_GRAPH: Node[] = [
  { id: "A", x: 200, y: 100, neighbors: ["B", "C"] },
  { id: "B", x: 100, y: 200, neighbors: ["A", "D", "E"] },
  { id: "C", x: 300, y: 200, neighbors: ["A", "F"] },
  { id: "D", x: 50, y: 300, neighbors: ["B"] },
  { id: "E", x: 150, y: 300, neighbors: ["B", "F"] },
  { id: "F", x: 250, y: 300, neighbors: ["C", "E"] },
];

const EDGES: Edge[] = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "D" },
  { from: "B", to: "E" },
  { from: "C", to: "F" },
  { from: "E", to: "F" },
];

export default function GraphTraversal() {
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [isTraversing, setIsTraversing] = useState(false);
  const [traversalOrder, setTraversalOrder] = useState<string[]>([]);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<
    "BFS" | "DFS" | null
  >(null);
  const [startNode, setStartNode] = useState<string>("A");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [currentGraph, setCurrentGraph] = useState<Node[]>(SAMPLE_GRAPH);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>(EDGES);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");
  const [savedGraphs, setSavedGraphs] = useState<
    { name: string; nodes: Node[]; edges: Edge[] }[]
  >([]);
  const [graphName, setGraphName] = useState("");

  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    loadSavedGraphs();
  }, []);

  // Initialize all nodes as unvisited
  useEffect(() => {
    const initialStates: Record<string, NodeState> = {};
    currentGraph.forEach((node) => {
      initialStates[node.id] = "unvisited";
    });
    setNodeStates(initialStates);
  }, [currentGraph]);

  const loadSavedGraphs = () => {
    const saved = localStorage.getItem("graphTraversalGraphs");
    if (saved) {
      setSavedGraphs(JSON.parse(saved));
    }
  };

  const saveCurrentGraph = () => {
    if (!graphName.trim()) return;

    const newGraph = {
      name: graphName,
      nodes: currentGraph,
      edges: currentEdges,
    };

    const updatedGraphs = [...savedGraphs, newGraph];
    setSavedGraphs(updatedGraphs);
    localStorage.setItem("graphTraversalGraphs", JSON.stringify(updatedGraphs));
    setGraphName("");
  };

  const loadGraph = (graph: { name: string; nodes: Node[]; edges: Edge[] }) => {
    setCurrentGraph(graph.nodes);
    setCurrentEdges(graph.edges);
    resetGraph();
  };

  const deleteGraph = (index: number) => {
    const updatedGraphs = savedGraphs.filter((_, i) => i !== index);
    setSavedGraphs(updatedGraphs);
    localStorage.setItem("graphTraversalGraphs", JSON.stringify(updatedGraphs));
  };

  const addNode = () => {
    if (!newNodeId.trim() || currentGraph.find((n) => n.id === newNodeId))
      return;

    const newNode: Node = {
      id: newNodeId,
      x: Math.random() * 300 + 50,
      y: Math.random() * 300 + 50,
      neighbors: [],
    };

    setCurrentGraph([...currentGraph, newNode]);
    setNewNodeId("");
  };

  const removeNode = (nodeId: string) => {
    const updatedNodes = currentGraph.filter((n) => n.id !== nodeId);
    const updatedEdges = currentEdges.filter(
      (e) => e.from !== nodeId && e.to !== nodeId
    );

    // Remove from neighbors
    updatedNodes.forEach((node) => {
      node.neighbors = node.neighbors.filter((n) => n !== nodeId);
    });

    setCurrentGraph(updatedNodes);
    setCurrentEdges(updatedEdges);
  };

  const toggleEdge = (fromId: string, toId: string) => {
    const existingEdge = currentEdges.find(
      (e) =>
        (e.from === fromId && e.to === toId) ||
        (e.from === toId && e.to === fromId)
    );

    if (existingEdge) {
      // Remove edge
      setCurrentEdges(currentEdges.filter((e) => e !== existingEdge));

      // Remove from neighbors
      const updatedNodes = currentGraph.map((node) => {
        if (node.id === fromId) {
          return {
            ...node,
            neighbors: node.neighbors.filter((n) => n !== toId),
          };
        }
        if (node.id === toId) {
          return {
            ...node,
            neighbors: node.neighbors.filter((n) => n !== fromId),
          };
        }
        return node;
      });
      setCurrentGraph(updatedNodes);
    } else {
      // Add edge
      setCurrentEdges([...currentEdges, { from: fromId, to: toId }]);

      // Add to neighbors
      const updatedNodes = currentGraph.map((node) => {
        if (node.id === fromId && !node.neighbors.includes(toId)) {
          return { ...node, neighbors: [...node.neighbors, toId] };
        }
        if (node.id === toId && !node.neighbors.includes(fromId)) {
          return { ...node, neighbors: [...node.neighbors, fromId] };
        }
        return node;
      });
      setCurrentGraph(updatedNodes);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!isEditMode || isTraversing) return;

    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const node = currentGraph.find((n) => n.id === nodeId);
    if (!node) return;

    if (connectionMode) {
      if (!connectionStart) {
        setConnectionStart(nodeId);
      } else if (connectionStart !== nodeId) {
        toggleEdge(connectionStart, nodeId);
        setConnectionStart(null);
        setTempConnection(null);
      }
    } else {
      setDraggedNode(nodeId);
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditMode) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedNode) {
      const newX = Math.max(20, Math.min(380, mouseX - dragOffset.x));
      const newY = Math.max(20, Math.min(380, mouseY - dragOffset.y));

      setCurrentGraph((prev) =>
        prev.map((node) =>
          node.id === draggedNode ? { ...node, x: newX, y: newY } : node
        )
      );
    } else if (connectionStart && connectionMode) {
      setTempConnection({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSVGClick = (e: React.MouseEvent) => {
    if (!isEditMode || isTraversing) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Check if click is on empty space
    const target = e.target as SVGElement;
    if (
      target.tagName === "svg" ||
      target.classList.contains("svg-background")
    ) {
      if (connectionMode) {
        setConnectionStart(null);
        setTempConnection(null);
      }
    }
  };

  // Reset the graph
  const resetGraph = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    const resetStates: Record<string, NodeState> = {};
    currentGraph.forEach((node) => {
      resetStates[node.id] = "unvisited";
    });
    setNodeStates(resetStates);
    setIsTraversing(false);
    setTraversalOrder([]);
    setCurrentAlgorithm(null);
  }, [currentGraph]);

  // BFS implementation with visualization
  const runBFS = useCallback(async () => {
    resetGraph();
    setIsTraversing(true);
    setCurrentAlgorithm("BFS");

    const queue: string[] = [startNode];
    const visited = new Set<string>();
    const order: string[] = [];

    // Helper function to update node state with delay
    const updateNodeState = (nodeId: string, state: NodeState) => {
      return new Promise<void>((resolve) => {
        setNodeStates((prev) => ({ ...prev, [nodeId]: state }));
        timeoutRef.current = setTimeout(resolve, 800);
      });
    };

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current)) continue;

      // Mark as current
      await updateNodeState(current, "current");

      // Mark as visited
      visited.add(current);
      order.push(current);
      setTraversalOrder([...order]);

      await updateNodeState(current, "visited");

      // Add neighbors to queue
      const node = currentGraph.find((n) => n.id === current)!;
      for (const neighbor of node.neighbors) {
        if (!visited.has(neighbor) && !queue.includes(neighbor)) {
          queue.push(neighbor);
          await updateNodeState(neighbor, "visiting");
        }
      }
    }

    setIsTraversing(false);
  }, [startNode, resetGraph, currentGraph]);

  // DFS implementation with visualization
  const runDFS = useCallback(async () => {
    resetGraph();
    setIsTraversing(true);
    setCurrentAlgorithm("DFS");

    const stack: string[] = [startNode];
    const visited = new Set<string>();
    const order: string[] = [];

    // Helper function to update node state with delay
    const updateNodeState = (nodeId: string, state: NodeState) => {
      return new Promise<void>((resolve) => {
        setNodeStates((prev) => ({ ...prev, [nodeId]: state }));
        timeoutRef.current = setTimeout(resolve, 800);
      });
    };

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (visited.has(current)) continue;

      // Mark as current
      await updateNodeState(current, "current");

      // Mark as visited
      visited.add(current);
      order.push(current);
      setTraversalOrder([...order]);

      await updateNodeState(current, "visited");

      // Add neighbors to stack (in reverse order for consistent traversal)
      const node = currentGraph.find((n) => n.id === current)!;
      const unvisitedNeighbors = node.neighbors
        .filter((neighbor) => !visited.has(neighbor))
        .reverse();

      for (const neighbor of unvisitedNeighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
          await updateNodeState(neighbor, "visiting");
        }
      }
    }

    setIsTraversing(false);
  }, [startNode, resetGraph, currentGraph]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Get node color based on state
  const getNodeColor = (state: NodeState) => {
    switch (state) {
      case "unvisited":
        return "fill-gray-200 stroke-gray-400 dark:fill-gray-700 dark:stroke-gray-500";
      case "visiting":
        return "fill-yellow-200 stroke-yellow-500 dark:fill-yellow-300 dark:stroke-yellow-400";
      case "current":
        return "fill-blue-400 stroke-blue-600 dark:fill-blue-500 dark:stroke-blue-400";
      case "visited":
        return "fill-green-400 stroke-green-600 dark:fill-green-500 dark:stroke-green-400";
      default:
        return "fill-gray-200 stroke-gray-400 dark:fill-gray-700 dark:stroke-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-2">
      <div className="max-w-6xl mx-auto space-y-2">
        {/* <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold">
              Graph Traversal Visualization
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="ml-4 bg-transparent"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Interactive BFS and DFS algorithm demonstration
          </p>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Graph Builder
              <div className="flex gap-2">
                {isEditMode && (
                  <Button
                    variant={connectionMode ? "default" : "outline"}
                    onClick={() => {
                      setConnectionMode(!connectionMode);
                      setConnectionStart(null);
                      setTempConnection(null);
                    }}
                    disabled={isTraversing}
                    size="sm"
                  >
                    {connectionMode ? "Exit Connect" : "Connect Mode"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(!isEditMode)}
                  disabled={isTraversing}
                >
                  {isEditMode ? "Exit Edit" : "Edit Graph"}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? connectionMode
                  ? "Click nodes to connect them with edges"
                  : "Drag nodes to reposition them"
                : "Create and save custom graphs"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Node ID (e.g., A, B, C)"
                      value={newNodeId}
                      onChange={(e) =>
                        setNewNodeId(e.target.value.toUpperCase())
                      }
                      onKeyPress={(e) => e.key === "Enter" && addNode()}
                    />
                    <Button onClick={addNode} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {connectionMode
                      ? "Click two nodes to connect/disconnect them"
                      : "Drag nodes to move them around"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Graph name"
                      value={graphName}
                      onChange={(e) => setGraphName(e.target.value)}
                    />
                    <Button
                      onClick={saveCurrentGraph}
                      size="sm"
                      disabled={!graphName.trim()}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {savedGraphs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Saved Graphs:</h4>
                <div className="flex gap-2 flex-wrap">
                  {savedGraphs.map((graph, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted rounded-md p-2"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadGraph(graph)}
                        disabled={isTraversing}
                      >
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {graph.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGraph(index)}
                        disabled={isTraversing}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>
                Choose algorithm and starting node
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Node:</label>
                <div className="flex gap-2 flex-wrap">
                  {currentGraph.map((node) => (
                    <Button
                      key={node.id}
                      variant={startNode === node.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStartNode(node.id)}
                      disabled={isTraversing}
                    >
                      {node.id}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={runBFS}
                  disabled={isTraversing}
                  className="w-full"
                  variant="default"
                >
                  Run BFS (Breadth-First)
                </Button>
                <Button
                  onClick={runDFS}
                  disabled={isTraversing}
                  className="w-full"
                  variant="secondary"
                >
                  Run DFS (Depth-First)
                </Button>
                <Button
                  onClick={resetGraph}
                  disabled={isTraversing}
                  className="w-full bg-transparent"
                  variant="outline"
                >
                  Reset Graph
                </Button>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <h4 className="font-medium">Legend:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-400 dark:bg-gray-700 dark:border-gray-500"></div>
                    <span>Unvisited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-200 border-2 border-yellow-500 dark:bg-yellow-300 dark:border-yellow-400"></div>
                    <span>In Queue/Stack</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-blue-600 dark:bg-blue-500 dark:border-blue-400"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-green-600 dark:bg-green-500 dark:border-green-400"></div>
                    <span>Visited</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Graph Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Graph Visualization
                {currentAlgorithm && (
                  <Badge variant="secondary">{currentAlgorithm}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isTraversing
                  ? "Traversal in progress..."
                  : isEditMode
                  ? connectionMode
                    ? "Click nodes to connect/disconnect them"
                    : "Drag nodes to reposition them"
                  : "Click an algorithm to start"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <svg
                  ref={svgRef}
                  width="400"
                  height="400"
                  className="border rounded-lg bg-white dark:bg-gray-900 cursor-crosshair"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleSVGClick}
                >
                  <rect
                    width="400"
                    height="400"
                    fill="transparent"
                    className="svg-background"
                  />

                  {/* Render edges */}
                  {currentEdges.map((edge, index) => {
                    const fromNode = currentGraph.find(
                      (n) => n.id === edge.from
                    )!;
                    const toNode = currentGraph.find((n) => n.id === edge.to)!;
                    return (
                      <line
                        key={index}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="#e5e7eb"
                        className="dark:stroke-gray-600"
                        strokeWidth="2"
                      />
                    );
                  })}

                  {connectionStart && tempConnection && (
                    <line
                      x1={currentGraph.find((n) => n.id === connectionStart)?.x}
                      y1={currentGraph.find((n) => n.id === connectionStart)?.y}
                      x2={tempConnection.x}
                      y2={tempConnection.y}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Render nodes */}
                  {currentGraph.map((node) => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="20"
                        className={`${getNodeColor(
                          nodeStates[node.id] || "unvisited"
                        )} transition-all duration-300 ${
                          isEditMode ? "cursor-pointer" : ""
                        } ${
                          connectionStart === node.id
                            ? "stroke-blue-500 stroke-4"
                            : ""
                        }`}
                        strokeWidth={connectionStart === node.id ? "4" : "3"}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        style={{
                          cursor: isEditMode
                            ? connectionMode
                              ? "pointer"
                              : "move"
                            : "default",
                        }}
                      />
                      <text
                        x={node.x}
                        y={node.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-bold text-gray-800 dark:text-gray-200 pointer-events-none"
                      >
                        {node.id}
                      </text>
                      {isEditMode && !connectionMode && (
                        <>
                          <circle
                            cx={node.x + 15}
                            cy={node.y - 15}
                            r="8"
                            className="fill-red-500 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode(node.id);
                            }}
                          />
                          <text
                            x={node.x + 15}
                            y={node.y - 15}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs fill-white pointer-events-none"
                          >
                            ×
                          </text>
                        </>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Traversal Order */}
              {traversalOrder.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Traversal Order:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {traversalOrder.map((nodeId, index) => (
                      <Badge key={index} variant="outline">
                        {index + 1}. {nodeId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Algorithm Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Breadth-First Search (BFS)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Data Structure:</strong> Queue (FIFO)
              </p>
              <p>
                <strong>Strategy:</strong> Explore all neighbors at current
                depth before moving deeper
              </p>
              <p>
                <strong>Use Cases:</strong> Shortest path, level-order traversal
              </p>
              <p>
                <strong>Time Complexity:</strong> O(V + E)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Depth-First Search (DFS)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Data Structure:</strong> Stack (LIFO)
              </p>
              <p>
                <strong>Strategy:</strong> Explore as far as possible before
                backtracking
              </p>
              <p>
                <strong>Use Cases:</strong> Topological sorting, cycle detection
              </p>
              <p>
                <strong>Time Complexity:</strong> O(V + E)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
