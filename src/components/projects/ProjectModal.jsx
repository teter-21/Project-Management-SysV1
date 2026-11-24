import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import ProjectForm from "./ProjectForm";

function ProjectModal({ project = null, onClose, onSubmit, submitting }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="project-dialog" onClose={onClose}>
      <div className="modal-heading">
        <h2>{project ? "Edit Project" : "New Project"}</h2>

        <button
          type="button"
          className="icon-button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <ProjectForm
        initialValues={project}
        onSubmit={onSubmit}
        onCancel={() => dialogRef.current?.close()}
        submitting={submitting}
      />
    </dialog>
  );
}

export default ProjectModal;
