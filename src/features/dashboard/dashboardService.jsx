import { supabase } from "../../lib/supabaseClient";

// Fetch all visible rows in batches.
// This avoids relying on Supabase's default row limit.
async function fetchAllRows(table, columns) {
  const pageSize = 500;
  const results = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    results.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return results;
}

// Get the current date in YYYY-MM-DD format.
function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Get dashboard analytics data.
export async function getDashboardAnalytics() {
  const [projects, tasks] = await Promise.all([
    fetchAllRows("projects", "id,name,description,status,created_at"),
    fetchAllRows("tasks", "id,project_id,status,due_date"),
  ]);

  const today = getLocalDateString();

  const completedTasks = tasks.filter((task) => task.status === "done").length;

  const overdueTasks = tasks.filter(
    (task) => task.due_date && task.due_date < today && task.status !== "done",
  ).length;

  const pendingTasks = tasks.filter((task) => task.status !== "done").length;

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;

  const projectSummaries = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);

    const completed = projectTasks.filter(
      (task) => task.status === "done",
    ).length;

    const total = projectTasks.length;

    return {
      ...project,
      totalTasks: total,
      completedTasks: completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });

  return {
    totalProjects: projects.length,
    activeProjects,
    totalTasks: tasks.length,
    completedTasks,
    pendingTasks,
    overdueTasks,
    projectSummaries,
  };
}
