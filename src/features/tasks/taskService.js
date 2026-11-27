import { supabase } from "../../lib/supabaseClient";

export const TASK_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const validStatuses = TASK_STATUSES.map((item) => item.value);

const validPriorities = TASK_PRIORITIES.map((item) => item.value);

// Validate task input values
function validateTask(values) {
  const title = values.title?.trim();
  const description = values.description?.trim() ?? "";
  const status = values.status ?? "todo";
  const priority = values.priority ?? "medium";
  const assignee_id = values.assignee_id || null;
  const due_date = values.due_date || null;

  if (!title || title.length > 200) {
    throw new Error("Task title must contain 1–200 characters.");
  }

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid task status.");
  }

  if (!validPriorities.includes(priority)) {
    throw new Error("Invalid task priority.");
  }

  if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
    throw new Error("Invalid due date format.");
  }

  return {
    title,
    description,
    status,
    priority,
    assignee_id,
    due_date,
  };
}

// READ tasks inside one project
export async function getProjectTasks(projectId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
}

// CREATE task
export async function createTask(projectId, values) {
  const validated = validateTask(values);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...validated,
      project_id: projectId,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// UPDATE task
export async function updateTask(projectId, taskId, values) {
  const validated = validateTask(values);

  const { data, error } = await supabase
    .from("tasks")
    .update(validated)
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// UPDATE status only
export async function updateTaskStatus(projectId, taskId, status) {
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid task status.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// DELETE task
export async function deleteTask(projectId, taskId) {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

// Move and reorder a task.
// The database handles all affected positions atomically.
export async function moveTask(projectId, taskId, newStatus, newIndex) {
  if (!["todo", "in_progress", "done"].includes(newStatus)) {
    throw new Error("Invalid destination column.");
  }

  if (!Number.isInteger(newIndex) || newIndex < 0) {
    throw new Error("Invalid task position.");
  }

  const { error } = await supabase.rpc("move_project_task", {
    p_project_id: projectId,
    p_task_id: taskId,
    p_new_status: newStatus,
    p_new_index: newIndex,
  });

  if (error) throw error;
}
