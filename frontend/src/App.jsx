import { Routes, Route, Link } from "react-router-dom";
import ProjectList from "./pages/ProjectList.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import BrowseProjects from "./pages/BrowseProjects.jsx";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Freelance Platform</h1>
      <nav style={{ marginBottom: "1rem" }}>
        <Link to="/">My Projects</Link> |{" "}
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
