import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import KanbanCard from "./KanbanCard";

function KanbanColumn({ status, label, tasks, members, disabled }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
    disabled,
  });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "column-over" : ""}`}
      aria-label={`${label} tasks`}
    >
      <div className="kanban-column-header">
        <h3>{label}</h3>
        <span>{tasks.length}</span>
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column-body">
          {tasks.length === 0 && (
            <p className="kanban-empty">Drop tasks here</p>
          )}

          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              members={members}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export default KanbanColumn;
