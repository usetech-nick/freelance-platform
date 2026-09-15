import { Routes, Route, Link } from "react-router-dom";
import ProjectList from "./pages/ProjectList.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import BrowseProjects from "./pages/BrowseProjects.jsx";
import CreateProject from "./pages/CreateProject.jsx";
import { useAuth } from "./AuthContext.jsx";

function App() {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <div className="app-title">Freelance Platform</div>
      <nav className="nav">
        <Link to="/">My Projects</Link>
        {user?.role === "client" && <Link to="/create">Create Project</Link>}
        {user?.role === "freelancer" && (
          <Link to="/browse">Browse Open Projects</Link>
        )}
      </nav>{" "}
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/browse" element={<BrowseProjects />} />
        <Route path="/create" element={<CreateProject />} />
      </Routes>
    </div>
  );
}

export default App;
