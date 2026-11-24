import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";

import {
  getProjects,
  createProject,
} from "../features/projects/projectService";

import ProjectModal from "../components/projects/ProjectModal";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const data = await getProjects();

        if (active) setProjects(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(values) {
    setSaving(true);

    try {
      const project = await createProject(values);

      setProjects((previous) => [project, ...previous]);

      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="page-toolbar">
        <div className="page-heading">
          <h1>Projects</h1>
          <p>Organize and manage your team projects.</p>
        </div>

        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          New Project
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="section-card" role="status">
          Loading your projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="section-card empty-state">
          <FolderKanban size={40} />

          <h2>No projects yet</h2>
          <p>Create your first project to get started.</p>

          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article key={project.id} className="project-card">
              <div className="project-card-top">
                <h3>{project.name}</h3>

                <span className="status-badge">{project.status}</span>
              </div>

              <p>{project.description || "No description provided."}</p>

              <div className="project-footer">
                <span>
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>

                <Link to={`/projects/${project.id}`} className="project-link">
                  View Details
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <>
          <p
            style={{
              position: "fixed",
              top: 10,
              right: 10,
              zIndex: 9999,
              background: "red",
              color: "white",
              padding: "12px",
            }}
          >
            MODAL STATE IS TRUE
          </p>

          <ProjectModal
            onClose={() => setModalOpen(false)}
            onSubmit={handleCreate}
            submitting={saving}
          />
        </>
      )}
    </section>
  );
}

export default Projects;
