import { useCallback, useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Users,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";

import {
  getProjectById,
  updateProject,
  setProjectStatus,
  deleteProject,
} from "../features/projects/projectService";

import { getProjectMembers } from "../features/members/memberService";

import ProjectModal from "../components/projects/ProjectModal";
import MembersPanel from "../components/projects/MembersPanel";

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const isOwner = project?.owner_id === user?.id;

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectData = await getProjectById(projectId);

      if (!projectData) {
        setProject(null);
        setMembers([]);
        return;
      }

      const memberData = await getProjectMembers(projectId);

      setProject(projectData);
      setMembers(memberData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function handleEdit(values) {
    setSaving(true);

    try {
      const updated = await updateProject(projectId, values);

      setProject(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (saving) return;

    const nextStatus = project.status === "active" ? "archived" : "active";

    setSaving(true);
    setError("");

    try {
      const updated = await setProjectStatus(projectId, nextStatus);

      setProject(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;

    const confirmation = window.prompt(
      `Type "${project.name}" to permanently delete this project and its related tasks and memberships.`,
    );

    if (confirmation !== project.name) return;

    setSaving(true);
    setError("");

    try {
      await deleteProject(projectId);
      navigate("/projects", { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="page" role="status">
        Loading project details...
      </section>
    );
  }

  if (!project) {
    return (
      <section className="page">
        <h1>Project unavailable</h1>

        <p>
          This project doesn't exist or you don't have permission to access it.
        </p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <Link to="/projects" className="btn-secondary">
          Back to Projects
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <Link to="/projects" className="back-link">
        <ArrowLeft size={17} />
        Back to Projects
      </Link>

      <div className="page-toolbar project-detail-heading">
        <div className="page-heading">
          <div className="project-title-row">
            <h1>{project.name}</h1>

            <span className="status-badge">{project.status}</span>
          </div>

          <p>{project.description || "No description"}</p>
        </div>

        {isOwner && (
          <div className="project-actions">
            <button
              className="btn-secondary"
              onClick={() => setEditing(true)}
              disabled={saving}
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              className="btn-secondary"
              onClick={handleArchive}
              disabled={saving}
            >
              {project.status === "active" ? (
                <Archive size={16} />
              ) : (
                <ArchiveRestore size={16} />
              )}

              {project.status === "active" ? "Archive" : "Restore"}
            </button>

            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="project-detail-grid">
        <div className="section-card">
          <h2>Project Overview</h2>

          <dl className="project-info">
            <div>
              <dt>Status</dt>
              <dd>{project.status}</dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>{new Date(project.created_at).toLocaleDateString()}</dd>
            </div>

            <div>
              <dt>Last Updated</dt>
              <dd>{new Date(project.updated_at).toLocaleDateString()}</dd>
            </div>

            <div>
              <dt>Team Size</dt>
              <dd>{members.length} members</dd>
            </div>
          </dl>
        </div>

        <div className="section-card">
          <div className="section-title-row">
            <Users size={20} />
            <h2>Team Members</h2>
          </div>

          <MembersPanel
            projectId={projectId}
            members={members}
            isOwner={isOwner}
            onChanged={loadProject}
          />
        </div>
      </div>

      {editing && (
        <ProjectModal
          key={project.id}
          project={project}
          submitting={saving}
          onClose={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      )}
    </section>
  );
}

export default ProjectDetails;
