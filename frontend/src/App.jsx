import { Routes, Route } from "react-router-dom";
import ProjectList from "./pages/ProjectList.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import BrowseProjects from "./pages/BrowseProjects.jsx";
import CreateProject from "./pages/CreateProject.jsx";
import Navbar from "./components/Navbar.jsx";
import ParticleBackground from "./components/ParticleBackground.jsx";
import { Footer } from "./components/ui.jsx";

function App() {
  return (
    <div className="app-shell">
      <ParticleBackground />
      <Navbar />
      <main className="main">
        <div className="wrap">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/browse" element={<BrowseProjects />} />
            <Route path="/create" element={<CreateProject />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
