import { projects } from "../data/mockData";

function Projects() {
  return (
    <section className="page">
      <div className="page-heading">
        <h1>Projects</h1>
        <p>Manage and monitor your projects.</p>
      </div>

      <div className="section-card">
        <h2>All Projects</h2>

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <h3>{project.name}</h3>
                <span className="status-badge">{project.status}</span>
              </div>

              <p>{project.description}</p>

              <div className="progress-info">
                <span>Progress</span>
                <strong>{project.progress}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
