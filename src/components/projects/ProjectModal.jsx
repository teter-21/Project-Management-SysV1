import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import ProjectForm from "./ProjectForm";

function ProjectModal({
  project = null,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  function handleCancel(event) {
    event.preventDefault();

    if (!submitting) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="project-dialog"
      aria-labelledby="project-modal-title"
      onCancel={handleCancel}
    >
      <div className="modal-heading">
        <h2 id="project-modal-title">
          {project ? "Edit Project" : "New Project"}
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={handleClose}
          disabled={submitting}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>

      <ProjectForm
        initialValues={project}
        onSubmit={onSubmit}
        onCancel={handleClose}
        submitting={submitting}
      />
    </dialog>
  );
}

export default ProjectModal;
