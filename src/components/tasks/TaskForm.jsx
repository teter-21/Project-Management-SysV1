import { useState } from "react";

import {
  TASK_STATUSES,
  TASK_PRIORITIES,
} from "../../features/tasks/taskService";

function TaskForm({
  task = null,
  members = [],
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    due_date: task?.due_date ?? "",
    assignee_id: task?.assignee_id ?? "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (form.title.trim().length > 200) {
      setError("Task title is too long.");
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Unable to save the task.");
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="task-title">Task Title *</label>

        <input
          id="task-title"
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Design login page"
          maxLength={200}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="task-description">Description</label>

        <textarea
          id="task-description"
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
          placeholder="Describe what needs to be done..."
        />
      </div>

      <div className="task-form-grid">
        <div className="form-field">
          <label htmlFor="task-status">Status</label>

          <select
            id="task-status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="task-priority">Priority</label>

          <select
            id="task-priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="task-assignee">Assign To</label>

          <select
            id="task-assignee"
            name="assignee_id"
            value={form.assignee_id}
            onChange={handleChange}
          >
            <option value="">Unassigned</option>

            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile?.full_name || "Unknown Member"}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="task-due-date">Due Date</label>

          <input
            id="task-due-date"
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : task ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
