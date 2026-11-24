import { useState } from "react";

function ProjectForm({
  initialValues = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [name, setName] = useState(initialValues?.name ?? "");

  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );

  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
      });
    } catch (err) {
      setError(err.message || "Unable to save project.");
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="project-name">
          Project Name <span aria-hidden="true">*</span>
        </label>

        <input
          id="project-name"
          type="text"
          value={name}
          maxLength={150}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Website Redesign"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="project-description">Description</label>

        <textarea
          id="project-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe your project..."
        />
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
          {submitting
            ? "Saving..."
            : initialValues
              ? "Save Changes"
              : "Create Project"}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;
