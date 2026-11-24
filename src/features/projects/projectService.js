import { supabase } from "../../lib/supabaseClient";

function validateProject(values) {
  const name = values.name?.trim();
  const description = values.description?.trim() ?? "";

  if (!name || name.length > 150) {
    throw new Error("Project name must be between 1 and 150 characters.");
  }

  return { name, description };
}

// READ — all projects accessible to the current user
export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// READ — one project
export async function getProjectById(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// CREATE
export async function createProject(values) {
  const validated = validateProject(values);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...validated,
      owner_id: user.id,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// UPDATE
export async function updateProject(projectId, values) {
  const validated = validateProject(values);

  const { data, error } = await supabase
    .from("projects")
    .update(validated)
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ARCHIVE OR RESTORE
export async function setProjectStatus(projectId, status) {
  if (!["active", "archived"].includes(status)) {
    throw new Error("Invalid project status.");
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// DELETE — permanent operation
export async function deleteProject(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
