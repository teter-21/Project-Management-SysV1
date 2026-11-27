import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import KanbanColumn from "./KanbanColumn";

const COLUMNS = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

function KanbanBoard({ tasks, members = [], onMove, disabled = false }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || disabled) return;

    const movingTask = tasks.find((task) => task.id === active.id);

    if (!movingTask) return;

    const overId = String(over.id);
    const targetTask = tasks.find((task) => task.id === over.id);

    // A drop can target either a task card or a column.
    const targetStatus = targetTask
      ? targetTask.status
      : overId.startsWith("column:")
        ? overId.slice("column:".length)
        : null;

    if (!COLUMNS.some((c) => c.status === targetStatus)) {
      return;
    }

    // Remove the moving task from the destination list
    // before calculating its new zero-based index.
    const destination = tasks
      .filter(
        (task) => task.status === targetStatus && task.id !== movingTask.id,
      )
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.created_at.localeCompare(b.created_at) ||
          a.id.localeCompare(b.id),
      );

    const targetIndex = targetTask
      ? destination.findIndex((task) => task.id === targetTask.id)
      : destination.length;

    if (targetIndex < 0) return;

    // No request if already in the same position.
    const currentColumn = tasks
      .filter((task) => task.status === movingTask.status)
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.created_at.localeCompare(b.created_at) ||
          a.id.localeCompare(b.id),
      );

    const currentIndex = currentColumn.findIndex(
      (task) => task.id === movingTask.id,
    );

    if (movingTask.status === targetStatus && currentIndex === targetIndex) {
      return;
    }

    await onMove(movingTask.id, targetStatus, targetIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            tasks={tasks
              .filter((task) => task.status === column.status)
              .sort(
                (a, b) =>
                  a.position - b.position ||
                  a.created_at.localeCompare(b.created_at) ||
                  a.id.localeCompare(b.id),
              )}
            members={members}
            disabled={disabled}
          />
        ))}
      </div>
    </DndContext>
  );
}

export default KanbanBoard;
