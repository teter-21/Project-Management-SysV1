import { useEffect, useState } from "react";
import { Link } from "react-router";

import { FolderKanban, ListTodo, CircleCheck, ClockAlert } from "lucide-react";

import { getDashboardAnalytics } from "../features/dashboard/dashboardService";

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const data = await getDashboardAnalytics();

        if (active) {
          setAnalytics(data);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="page" role="status">
        Loading dashboard...
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <p className="form-error" role="alert">
          Unable to load analytics: {error}
        </p>
      </section>
    );
  }

  const stats = [
    {
      title: "Total Projects",
      value: analytics.totalProjects,
      icon: FolderKanban,
    },
    {
      title: "Total Tasks",
      value: analytics.totalTasks,
      icon: ListTodo,
    },
    {
      title: "Completed Tasks",
      value: analytics.completedTasks,
      icon: CircleCheck,
    },
    {
      title: "Overdue Tasks",
      value: analytics.overdueTasks,
      icon: ClockAlert,
    },
  ];

  const recentProjects = [...analytics.projectSummaries]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <section className="page">
      <div className="page-heading">
        <h1>Dashboard</h1>
        <p>Monitor project performance and task progress.</p>
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
          <h2>Project Progress</h2>
          <p>Completion rates calculated from actual tasks.</p>
        </div>

        {recentProjects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <div className="project-grid">
            {recentProjects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-top">
                  <h3>{project.name}</h3>

                  <span className="status-badge">{project.status}</span>
                </div>

                <p>{project.description || "No description provided."}</p>

                <div className="progress-info">
                  <span>
                    {project.completedTasks}/{project.totalTasks} tasks
                    completed
                  </span>

                  <strong>{project.progress}%</strong>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={`${project.name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={project.progress}
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>

                <div className="project-footer">
                  <span>{project.totalTasks} total tasks</span>

                  <Link to={`/projects/${project.id}`} className="project-link">
                    View Project
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
