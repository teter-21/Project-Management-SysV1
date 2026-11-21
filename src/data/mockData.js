export const projects = [
  {
    id: 1,
    name: "Company Website Redesign",
    description: "Redesign the company website.",
    status: "In Progress",
    progress: 75,
    tasks: 12,
    completed: 9,
    dueDate: "2026-12-10",
  },
  {
    id: 2,
    name: "Inventory Management System",
    description: "Develop an inventory tracking platform.",
    status: "In Progress",
    progress: 40,
    tasks: 20,
    completed: 8,
    dueDate: "2026-12-20",
  },
  {
    id: 3,
    name: "Portfolio Website",
    description: "Create a developer portfolio.",
    status: "Completed",
    progress: 100,
    tasks: 8,
    completed: 8,
    dueDate: "2026-11-15",
  },
];

export const tasks = [
  {
    id: 1,
    title: "Design homepage",
    projectId: 1,
    status: "Done",
    priority: "High",
  },
  {
    id: 2,
    title: "Build navigation",
    projectId: 1,
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Create inventory database",
    projectId: 2,
    status: "To Do",
    priority: "High",
  },
  {
    id: 4,
    title: "Test responsive layout",
    projectId: 3,
    status: "Done",
    priority: "Low",
  },
];

export const members = [
  { id: 1, name: "Alex Rivera", role: "Project Manager" },
  { id: 2, name: "Jamie Cruz", role: "Frontend Developer" },
  { id: 3, name: "Sam Reyes", role: "Backend Developer" },
];
