import { Routes, Route, Link } from "react-router-dom";
import ProjectList from "./pages/ProjectList.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import BrowseProjects from "./pages/BrowseProjects.jsx";

function App() {
  return (
    <div className="app-shell">
      <div className="app-title">Freelance Platform</div>
      <nav className="nav">
        <Link to="/">My Projects</Link>
        <Link to="/browse">Browse Open Projects</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/browse" element={<BrowseProjects />} />
      </Routes>
    </div>
  );
}

export default App;
