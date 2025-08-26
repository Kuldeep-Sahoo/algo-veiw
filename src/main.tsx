import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Grid from "./components/Grid.tsx";
import Tree from "./components/Tree.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<App />} />

        {/* Graph Visualizer */}
        <Route path="/graph" element={<Grid />} />
        <Route path="/tree" element={<Tree />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
