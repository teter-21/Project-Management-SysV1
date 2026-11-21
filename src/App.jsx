import { Navigate, Route, Routes } from "react-router";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import MyTasks from "./pages/MyTasks";
import TeamMembers from "./pages/TeamMembers";
import Settings from "./pages/Settings";

import "./styles/layout.css";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/team" element={<TeamMembers />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
