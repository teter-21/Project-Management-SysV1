import { FolderKanban, ListTodo, CircleCheck, Clock3 } from "lucide-react";

import { projects } from "../data/mockData";

const totalTasks = projects.reduce((sum, project) => sum + project.tasks, 0);

const completedTasks = projects.reduce(
  (sum, project) => sum + project.completed,
  0,
);

const stats = [
  {
    title: "Total Projects",
    value: projects.length,
    icon: FolderKanban,
  },
  {
    title: "Total Tasks",
    value: totalTasks,
    icon: ListTodo,
  },
  {
    title: "Completed Tasks",
    value: completedTasks,
    icon: CircleCheck,
  },
  {
    title: "Pending Tasks",
    value: totalTasks - completedTasks,
    icon: Clock3,
  },
];

function Dashboard() {
  return (
    <section className="page">
      <div className="page-heading">
        <h1>Dashboard</h1>
        <p>Overview of your workspace.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.title}>
              <div className="stat-card-header">
                <span>{stat.title}</span>
                <Icon size={20} />
              </div>

              <h2>{stat.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="section-card">
        <div className="section-heading">
          <h2>Recent Projects</h2>
          <p>Monitor your ongoing projects.</p>
        </div>

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

              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${project.name} progress`}
                aria-valuenow={project.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <div className="project-footer">
                <span>
                  {project.completed}/{project.tasks} tasks
                </span>
                <span>Due {project.dueDate}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
