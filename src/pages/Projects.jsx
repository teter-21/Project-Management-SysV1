import { useEffect, useState } from "react";

import {
  createProject,
  getProjects,
} from "../features/projects/projectService";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const data = await getProjects();

        if (active) {
          setProjects(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateProject(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const newProject = await createProject({
        name,
        description: "",
      });

      setProjects((previous) => [newProject, ...previous]);

      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <h1>Projects</h1>
        <p>Manage your team projects.</p>
      </div>

      <div className="section-card">
        <h2>Create Project</h2>

        <form
          onSubmit={handleCreateProject}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <input
            type="text"
            placeholder="Enter project name"
            aria-label="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={150}
            required
            style={{
              flex: "1 1 200px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#fff",
            }}
          />

          <button
            type="submit"
            disabled={saving}
            className="auth-submit"
            style={{ width: "auto", marginTop: 0 }}
          >
            {saving ? "Creating..." : "Create Project"}
          </button>
        </form>

        {error && (
          <p role="alert" style={{ color: "#fca5a5" }}>
            {error}
          </p>
        )}

        <h2>My Projects</h2>

        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects found. Create your first project.</p>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <h3>{project.name}</h3>
                <p>{project.description || "No description"}</p>

                <span className="status-badge">{project.status}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Projects;
