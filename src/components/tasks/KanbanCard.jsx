import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CalendarDays } from "lucide-react";

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function KanbanCard({ task, members, disabled = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const assignee = members.find(
    (member) => member.user_id === task.assignee_id,
  );

  const assigneeName = assignee?.profile?.full_name || "Unassigned";

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const overdue =
    task.due_date && task.due_date < todayString && task.status !== "done";

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? "dragging" : ""}`}
    >
      <div className="kanban-card-heading">
        <h3>{task.title}</h3>

        <button
          type="button"
          className="kanban-drag-handle"
          aria-label={`Drag ${task.title}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </div>

      {task.description && (
        <p className="kanban-description">{task.description}</p>
      )}

      <div className="kanban-badges">
        <span className={`task-priority priority-${task.priority}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>

        {overdue && <span className="kanban-overdue">Overdue</span>}
      </div>

      <div className="kanban-card-footer">
        <span title={assigneeName}>{assigneeName}</span>

        {task.due_date && (
          <span className="kanban-date">
            <CalendarDays size={13} />
            {task.due_date}
          </span>
        )}
      </div>
    </article>
  );
}

export default KanbanCard;
