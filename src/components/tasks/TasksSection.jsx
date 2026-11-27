import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";

import TaskForm from "./TaskForm";
import KanbanBoard from "./KanbanBoard";

import {
  getProjectTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  moveTask,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from "../../features/tasks/taskService";

function TasksSection({ projectId, members = [] }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [view, setView] = useState("board");

  const loadTasks = useCallback(async () => {
    const data = await getProjectTasks(projectId);
    setTasks(data);
  }, [projectId]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      setError("");
      setTasks([]);
      setShowCreate(false);
      setEditingTask(null);

      try {
        const data = await getProjectTasks(projectId);

        if (active) {
          setTasks(data);
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

    initialize();

    return () => {
      active = false;
    };
  }, [projectId]);

  async function runAction(action, successMessage) {
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await action();
      await loadTasks();
      setMessage(successMessage);
      return true;
    } catch (err) {
      setError(err.message || "Task operation failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(values) {
    const success = await runAction(
      () => createTask(projectId, values),
      "Task created successfully.",
    );

    if (success) {
      setShowCreate(false);
    } else {
      throw new Error("Unable to create task. Check the error above.");
    }
  }

  async function handleEdit(values) {
    const success = await runAction(
      () => updateTask(projectId, editingTask.id, values),
      "Task updated successfully.",
    );

    if (success) {
      setEditingTask(null);
    } else {
      throw new Error("Unable to update task. Check the error above.");
    }
  }

  async function handleStatusChange(taskId, status) {
    await runAction(
      () => updateTaskStatus(projectId, taskId, status),
      "Task status updated.",
    );
  }

  async function handleTaskMove(taskId, status, index) {
    await runAction(
      () => moveTask(projectId, taskId, status, index),
      "Task moved successfully.",
    );
  }

  async function handleDelete(task) {
    if (busy) return;

    const confirmed = window.confirm(`Permanently delete "${task.title}"?`);

    if (!confirmed) return;

    await runAction(
      () => deleteTask(projectId, task.id),
      "Task deleted successfully.",
    );
  }

  function getMemberName(userId) {
    if (!userId) return "Unassigned";

    const member = members.find((item) => item.user_id === userId);

    return member?.profile?.full_name || "Unknown Member";
  }

  function getStatusLabel(value) {
    return TASK_STATUSES.find((item) => item.value === value)?.label || value;
  }

  function getPriorityLabel(value) {
    return TASK_PRIORITIES.find((item) => item.value === value)?.label || value;
  }

  return (
    <section className="section-card task-section">
      <div className="task-section-header">
        <div>
          <h2>Project Tasks</h2>
          <p>Manage assignments, deadlines, and progress.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => {
            setEditingTask(null);
            setShowCreate(true);
          }}
        >
          <Plus size={18} />
          New Task
        </button>

        <div className="task-view-switcher">
          <button
            type="button"
            className={view === "board" ? "view-active" : ""}
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
          >
            Board
          </button>

          <button
            type="button"
            className={view === "list" ? "view-active" : ""}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            List
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}

      {showCreate && (
        <div className="task-form-container">
          <h3>Create New Task</h3>

          <TaskForm
            members={members}
            submitting={busy}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {editingTask && (
        <div className="task-form-container">
          <h3>Edit Task</h3>

          <TaskForm
            key={editingTask.id}
            task={editingTask}
            members={members}
            submitting={busy}
            onSubmit={handleEdit}
            onCancel={() => setEditingTask(null)}
          />
        </div>
      )}

      {loading ? (
        <p role="status">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="task-empty">
          <ListTodo size={36} />
          <h3>No tasks yet</h3>
          <p>Create the first task for this project.</p>
        </div>
      ) : view === "board" ? (
        <KanbanBoard
          tasks={tasks}
          members={members}
          onMove={handleTaskMove}
          disabled={busy}
        />
      ) : (
        <div className="task-records">
          {tasks.map((task) => (
            <article className="task-record" key={task.id}>
              <div className="task-record-main">
                <div className="task-record-title">
                  <h3>{task.title}</h3>

                  <span className={`task-priority priority-${task.priority}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>

                {task.description && <p>{task.description}</p>}

                <div className="task-metadata">
                  <span>Assigned: {getMemberName(task.assignee_id)}</span>

                  <span>Due: {task.due_date || "No deadline"}</span>

                  <span>{getStatusLabel(task.status)}</span>
                </div>
              </div>

              <div className="task-record-actions">
                <select
                  aria-label={`Status for ${task.title}`}
                  value={task.status}
                  disabled={busy}
                  onChange={(event) =>
                    handleStatusChange(task.id, event.target.value)
                  }
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => {
                    setShowCreate(false);
                    setEditingTask(task);
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  disabled={busy}
                  onClick={() => handleDelete(task)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TasksSection;
