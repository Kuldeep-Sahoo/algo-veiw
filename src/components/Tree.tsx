"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Split from "react-split";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sun,
  Moon,
  Play,
  Square,
  Trash2,
  Save,
  Plus,
  Link,
} from "lucide-react";

interface TreeNode {
  id: string;
  value: string;
  x: number;
  y: number;
  left?: string;
  right?: string;
  parent?: string;
}

interface TreeState {
  nodes: { [key: string]: TreeNode };
  root?: string;
}

type TraversalType = "preorder" | "inorder" | "postorder" | "levelorder";
type NodeState = "unvisited" | "visiting" | "visited";

export default function TreeVisualization() {
  const [isDark, setIsDark] = useState(true);
  const [tree, setTree] = useState<TreeState>({ nodes: {} });
  const [savedTrees, setSavedTrees] = useState<{ [key: string]: TreeState }>(
    {}
  );
  const [currentTreeName, setCurrentTreeName] = useState<string>("");
  const [newTreeName, setNewTreeName] = useState<string>("");

  // Traversal states
  const [isTraversing, setIsTraversing] = useState(false);
  const [traversalType, setTraversalType] = useState<TraversalType>("preorder");
  const [nodeStates, setNodeStates] = useState<{ [key: string]: NodeState }>(
    {}
  );
  const [traversalOrder, setTraversalOrder] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataStructure, setDataStructure] = useState<string[]>([]);

  // Node creation and editing
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [newNodeValue, setNewNodeValue] = useState("");
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<"left" | "right">(
    "left"
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with default tree and dark theme
  useEffect(() => {
    document.documentElement.classList.add("dark");

    const defaultTree: TreeState = {
      nodes: {
        A: { id: "A", value: "A", x: 500, y: 50, left: "B", right: "C" },

        B: {
          id: "B",
          value: "B",
          x: 300,
          y: 120,
          parent: "A",
          left: "D",
          right: "E",
        },
        C: {
          id: "C",
          value: "C",
          x: 700,
          y: 120,
          parent: "A",
          left: "F",
          right: "G",
        },

        D: {
          id: "D",
          value: "D",
          x: 200,
          y: 190,
          parent: "B",
          left: "H",
          right: "I",
        },
        E: {
          id: "E",
          value: "E",
          x: 400,
          y: 190,
          parent: "B",
          left: "J",
          right: "K",
        },
        F: {
          id: "F",
          value: "F",
          x: 600,
          y: 190,
          parent: "C",
          left: "L",
          right: "M",
        },
        G: {
          id: "G",
          value: "G",
          x: 800,
          y: 190,
          parent: "C",
          left: "N",
          right: "O",
        },

        H: { id: "H", value: "H", x: 150, y: 260, parent: "D" },
        I: { id: "I", value: "I", x: 250, y: 260, parent: "D" },
        J: { id: "J", value: "J", x: 350, y: 260, parent: "E" },
        K: { id: "K", value: "K", x: 450, y: 260, parent: "E" },
        L: { id: "L", value: "L", x: 550, y: 260, parent: "F" },
        M: { id: "M", value: "M", x: 650, y: 260, parent: "F" },
        N: { id: "N", value: "N", x: 750, y: 260, parent: "G" },
        O: { id: "O", value: "O", x: 850, y: 260, parent: "G" },
      },
      root: "A",
    };

    setTree(defaultTree);

    // Load saved trees from localStorage
    const saved = localStorage.getItem("savedTrees");
    if (saved) {
      setSavedTrees(JSON.parse(saved));
    }
  }, []);

  // Save trees to localStorage
  useEffect(() => {
    localStorage.setItem("savedTrees", JSON.stringify(savedTrees));
  }, [savedTrees]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const addNode = () => {
    if (!newNodeValue.trim()) return;

    const newId = Date.now().toString();
    const newNode: TreeNode = {
      id: newId,
      value: newNodeValue.trim(),
      x: Math.random() * 400 + 100,
      y: Math.random() * 200 + 100,
    };

    setTree((prev) => ({
      ...prev,
      nodes: { ...prev.nodes, [newId]: newNode },
      root: prev.root || newId,
    }));

    setNewNodeValue("");
  };

  const deleteNode = (nodeId: string) => {
    setTree((prev) => {
      const newNodes = { ...prev.nodes };
      const nodeToDelete = newNodes[nodeId];

      // Remove connections to this node
      Object.values(newNodes).forEach((node) => {
        if (node.left === nodeId) node.left = undefined;
        if (node.right === nodeId) node.right = undefined;
        if (node.parent === nodeId) node.parent = undefined;
      });

      // Remove children's parent reference
      if (nodeToDelete.left) {
        const leftChild = newNodes[nodeToDelete.left];
        if (leftChild) leftChild.parent = undefined;
      }
      if (nodeToDelete.right) {
        const rightChild = newNodes[nodeToDelete.right];
        if (rightChild) rightChild.parent = undefined;
      }

      delete newNodes[nodeId];

      return {
        ...prev,
        nodes: newNodes,
        root: prev.root === nodeId ? Object.keys(newNodes)[0] : prev.root,
      };
    });
  };

  const connectNodes = (
    parentId: string,
    childId: string,
    position: "left" | "right"
  ) => {
    setTree((prev) => {
      const newNodes = { ...prev.nodes };
      const parent = newNodes[parentId];
      const child = newNodes[childId];

      if (!parent || !child || parentId === childId) return prev;

      // Remove child from its current parent
      if (child.parent) {
        const oldParent = newNodes[child.parent];
        if (oldParent.left === childId) oldParent.left = undefined;
        if (oldParent.right === childId) oldParent.right = undefined;
      }

      // Remove existing child at position
      if (parent[position]) {
        const oldChild = newNodes[parent[position]!];
        if (oldChild) oldChild.parent = undefined;
      }

      // Make new connection
      parent[position] = childId;
      child.parent = parentId;

      return { ...prev, nodes: newNodes };
    });
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const node = tree.nodes[nodeId];
    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedNode || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      setTree((prev) => ({
        ...prev,
        nodes: {
          ...prev.nodes,
          [draggedNode]: {
            ...prev.nodes[draggedNode],
            x: Math.max(20, Math.min(580, newX)),
            y: Math.max(20, Math.min(380, newY)),
          },
        },
      }));
    },
    [draggedNode, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (draggedNode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedNode, handleMouseMove, handleMouseUp]);

  const getTraversalSteps = (
    type: TraversalType
  ): { order: string[]; steps: { node: string; stack: string[] }[] } => {
    if (!tree.root) return { order: [], steps: [] };

    const order: string[] = [];
    const steps: { node: string; stack: string[] }[] = [];

    switch (type) {
      case "preorder":
        preorderTraversal(tree.root, order, steps);
        break;
      case "inorder":
        inorderTraversal(tree.root, order, steps);
        break;
      case "postorder":
        postorderTraversal(tree.root, order, steps);
        break;
      case "levelorder":
        levelorderTraversal(tree.root, order, steps);
        break;
    }

    return { order, steps };
  };

  const preorderTraversal = (
    nodeId: string,
    order: string[],
    steps: { node: string; stack: string[] }[]
  ) => {
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      order.push(current);
      steps.push({ node: current, stack: [...stack] });

      const node = tree.nodes[current];
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }
  };

  const inorderTraversal = (
    nodeId: string,
    order: string[],
    steps: { node: string; stack: string[] }[]
  ) => {
    const stack: string[] = [];
    let current: string | null = nodeId;

    while (current || stack.length > 0) {
      while (current) {
        stack.push(current);
        steps.push({ node: current, stack: [...stack] });
        current = tree.nodes[current].left || null;
      }

      current = stack.pop()!;
      order.push(current);
      current = tree.nodes[current].right || null;
    }
  };

  const postorderTraversal = (
    nodeId: string,
    order: string[],
    steps: { node: string; stack: string[] }[]
  ) => {
    const stack1 = [nodeId];
    const stack2: string[] = [];

    while (stack1.length > 0) {
      const current = stack1.pop()!;
      stack2.push(current);
      steps.push({ node: current, stack: [...stack1] });

      const node = tree.nodes[current];
      if (node.left) stack1.push(node.left);
      if (node.right) stack1.push(node.right);
    }

    while (stack2.length > 0) {
      order.push(stack2.pop()!);
    }
  };

  const levelorderTraversal = (
    nodeId: string,
    order: string[],
    steps: { node: string; stack: string[] }[]
  ) => {
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);
      steps.push({ node: current, stack: [...queue] });

      const node = tree.nodes[current];
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  };

  const startTraversal = () => {
    if (isTraversing) return;

    const { order, steps } = getTraversalSteps(traversalType);
    setTraversalOrder(order);
    setCurrentStep(0);
    setIsTraversing(true);

    // Reset node states
    const initialStates: { [key: string]: NodeState } = {};
    Object.keys(tree.nodes).forEach((id) => {
      initialStates[id] = "unvisited";
    });
    setNodeStates(initialStates);

    let stepIndex = 0;
    intervalRef.current = setInterval(() => {
      if (stepIndex < order.length) {
        const currentNodeId = order[stepIndex];
        const currentDataStructure =
          stepIndex < steps.length ? steps[stepIndex].stack : [];

        setNodeStates((prev) => ({
          ...prev,
          [currentNodeId]:
            stepIndex === order.length - 1 ? "visited" : "visiting",
        }));

        setDataStructure(currentDataStructure);
        setCurrentStep(stepIndex + 1);

        // Mark previous nodes as visited
        if (stepIndex > 0) {
          const prevNodeId = order[stepIndex - 1];
          setNodeStates((prev) => ({
            ...prev,
            [prevNodeId]: "visited",
          }));
        }

        stepIndex++;
      } else {
        setIsTraversing(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);
  };

  const stopTraversal = () => {
    setIsTraversing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset states
    const resetStates: { [key: string]: NodeState } = {};
    Object.keys(tree.nodes).forEach((id) => {
      resetStates[id] = "unvisited";
    });
    setNodeStates(resetStates);
    setTraversalOrder([]);
    setCurrentStep(0);
    setDataStructure([]);
  };

  const saveTree = () => {
    if (!newTreeName.trim()) return;

    setSavedTrees((prev) => ({
      ...prev,
      [newTreeName.trim()]: { ...tree },
    }));

    setCurrentTreeName(newTreeName.trim());
    setNewTreeName("");
  };

  const loadTree = (name: string) => {
    const savedTree = savedTrees[name];
    if (savedTree) {
      setTree(savedTree);
      setCurrentTreeName(name);
      stopTraversal();
    }
  };

  const deleteTree = (name: string) => {
    setSavedTrees((prev) => {
      const newSaved = { ...prev };
      delete newSaved[name];
      return newSaved;
    });

    if (currentTreeName === name) {
      setCurrentTreeName("");
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (isConnectMode) {
      if (!connectingFrom) {
        setConnectingFrom(nodeId);
      } else if (connectingFrom !== nodeId) {
        connectNodes(connectingFrom, nodeId, connectionType);
        setConnectingFrom(null);
        setIsConnectMode(false);
      }
    } else {
      setSelectedNode(selectedNode === nodeId ? null : nodeId);
    }
  };

  const cancelConnection = () => {
    setIsConnectMode(false);
    setConnectingFrom(null);
  };

  const getNodeColor = (nodeId: string) => {
    const state = nodeStates[nodeId] || "unvisited";
    switch (state) {
      case "visiting":
        return "#3b82f6"; // blue
      case "visited":
        return "#10b981"; // green
      default:
        return isDark ? "#374151" : "#f3f4f6"; // gray
    }
  };

  const getDataStructureName = () => {
    return traversalType === "levelorder" ? "Queue" : "Stack";
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h1 className="text-xl font-bold">Tree Traversal Visualization</h1>
        <Button variant="ghost" size="sm" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Resizable Panels */}
      <div className="flex-1 p-3 overflow-hidden">
        {/* Custom CSS for split gutter styling */}
        {/* <style jsx>{`
          
        `}</style> */}
        <Split
          sizes={[25, 75]}
          minSize={100}
          expandToMin={false}
          gutterSize={4}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
          className="flex h-full gap-3"
        >
          {/* Left Panel - Controls */}
          {/* Custom scrollbar styling and removed visible scrollbar */}
          <div
            className="space-y-3 overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tree Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tree name"
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={saveTree}
                    disabled={!newTreeName.trim()}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {Object.keys(savedTrees).map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <Button
                        variant={currentTreeName === name ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 text-xs justify-start"
                        onClick={() => loadTree(name)}
                      >
                        {name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTree(name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Node Management */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Node Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Node value"
                    value={newNodeValue}
                    onChange={(e) => setNewNodeValue(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={addNode}
                    disabled={!newNodeValue.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isConnectMode ? "default" : "outline"}
                      onClick={() => {
                        if (isConnectMode) {
                          cancelConnection();
                        } else {
                          setIsConnectMode(true);
                          setSelectedNode(null);
                        }
                      }}
                      className="flex-1"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      {isConnectMode ? "Cancel" : "Connect"}
                    </Button>

                    {isConnectMode && (
                      <Select
                        value={connectionType}
                        onValueChange={(value: "left" | "right") =>
                          setConnectionType(value)
                        }
                      >
                        <SelectTrigger className="text-xs w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {isConnectMode && (
                    <p className="text-xs text-muted-foreground">
                      {connectingFrom
                        ? `Click target node to connect as ${connectionType} child`
                        : "Click parent node first"}
                    </p>
                  )}
                </div>

                {selectedNode && !isConnectMode && (
                  <div className="space-y-2 p-2 border rounded">
                    <p className="text-xs font-medium">
                      Selected: {tree.nodes[selectedNode]?.value}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        onClick={() => deleteNode(selectedNode)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        onClick={() => setSelectedNode(null)}
                      >
                        Deselect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traversal Controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Traversal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select
                  value={traversalType}
                  onValueChange={(value: TraversalType) =>
                    setTraversalType(value)
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preorder">Preorder</SelectItem>
                    <SelectItem value="inorder">Inorder</SelectItem>
                    <SelectItem value="postorder">Postorder</SelectItem>
                    <SelectItem value="levelorder">Level Order</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={startTraversal}
                    disabled={isTraversing || !tree.root}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopTraversal}
                    disabled={!isTraversing}
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Structure State */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {getDataStructureName()} State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Size: {dataStructure.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {dataStructure.map((nodeId, index) => (
                      <div
                        key={`${nodeId}-${index}`}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                      >
                        {tree.nodes[nodeId]?.value || nodeId}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traversal Order */}
            {traversalOrder.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Traversal Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {traversalOrder.map((nodeId, index) => (
                      <div
                        key={`order-${nodeId}-${index}`}
                        className={`px-2 py-1 rounded text-xs ${
                          index < currentStep
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {tree.nodes[nodeId]?.value || nodeId}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Tree Visualization */}
          <div className="flex-1">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tree Structure</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-2">
                <svg
                  ref={svgRef}
                  width="100%"
                  height="400"
                  className="border rounded bg-white dark:bg-gray-900"
                  style={{
                    cursor: draggedNode
                      ? "grabbing"
                      : isConnectMode
                      ? "crosshair"
                      : "default",
                  }}
                >
                  {/* Edges */}
                  {Object.values(tree.nodes).map((node) => (
                    <g key={`edges-${node.id}`}>
                      {node.left && tree.nodes[node.left] && (
                        <line
                          x1={node.x}
                          y1={node.y}
                          x2={tree.nodes[node.left].x}
                          y2={tree.nodes[node.left].y}
                          stroke={isDark ? "#6b7280" : "#9ca3af"}
                          strokeWidth="2"
                        />
                      )}
                      {node.right && tree.nodes[node.right] && (
                        <line
                          x1={node.x}
                          y1={node.y}
                          x2={tree.nodes[node.right].x}
                          y2={tree.nodes[node.right].y}
                          stroke={isDark ? "#6b7280" : "#9ca3af"}
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  ))}

                  {/* Nodes */}
                  {Object.values(tree.nodes).map((node) => (
                    <g key={`node-${node.id}`}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="20"
                        fill={getNodeColor(node.id)}
                        stroke={
                          connectingFrom === node.id
                            ? "#f59e0b"
                            : selectedNode === node.id
                            ? "#3b82f6"
                            : isDark
                            ? "#4b5563"
                            : "#d1d5db"
                        }
                        strokeWidth={
                          connectingFrom === node.id || selectedNode === node.id
                            ? "3"
                            : "2"
                        }
                        className={`cursor-pointer ${
                          isConnectMode
                            ? "hover:stroke-orange-500"
                            : "hover:stroke-blue-500"
                        }`}
                        onMouseDown={(e) =>
                          !isConnectMode && handleMouseDown(e, node.id)
                        }
                        onClick={() => handleNodeClick(node.id)}
                      />
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        className="text-sm font-medium pointer-events-none select-none"
                        fill={isDark ? "#ffffff" : "#000000"}
                      >
                        {node.value}
                      </text>
                    </g>
                  ))}
                </svg>
              </CardContent>
            </Card>
          </div>
        </Split>
      </div>
    </div>
  );
}
