import { tasks } from "../data/mockData";

function MyTasks() {
  return (
    <section className="page">
      <div className="page-heading">
        <h1>My Tasks</h1>
        <p>View your assigned tasks.</p>
      </div>

      <div className="section-card">
        <h2>Task List</h2>

        <div className="task-list">
          {tasks.map((task) => (
            <article className="task-item" key={task.id}>
              <div>
                <h3>{task.title}</h3>
                <p>Priority: {task.priority}</p>
              </div>

              <span className="status-badge">{task.status}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MyTasks;
