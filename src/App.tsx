import { Link } from "react-router-dom";
import { Button } from "./components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-extrabold">DS Visualizer</h1>
        <p className="text-gray-400 text-lg">
          Interactive visualizations of algorithms and data structures
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl justify-items-center">
        {/* Graph Visualization */}
        <Link to="/graph">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-xl font-bold">Graph Visualization</h2>
            <p className="text-gray-400 text-sm">
              Visualize BFS and DFS traversals on a graph
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full text-white">
              Open
            </Button>
          </div>
        </Link>

        {/* Tree Visualization */}
        <Link to="/tree">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-xl font-bold">Tree Visualization</h2>
            <p className="text-gray-400 text-sm">
              Visualize Preorder, Inorder, Postorder traversals
            </p>
            <Button className="bg-green-600 hover:bg-green-700 w-full text-white">
              Open
            </Button>
          </div>
        </Link>

        {/* Linked List (Coming Soon) */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center space-y-4 text-center opacity-70 cursor-not-allowed">
          <h2 className="text-xl font-bold">Linked List Visualization</h2>
          <p className="text-gray-400 text-sm">Coming Soon</p>
          <Button disabled className="bg-gray-700 w-full text-gray-400">
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Developer Credit Footer */}
      <footer className="text-center text-gray-400 text-sm">
        Developed by{" "}
        <a
          href="https://github.com/Kuldeep-Sahoo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Kuldeep Sahoo
        </a>
      </footer>
    </div>
  );
}
