import { supabase } from "../../lib/supabaseClient";

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function createProject({ name, description = "" }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Authentication required.");

  const cleanName = name.trim();

  if (!cleanName || cleanName.length > 150) {
    throw new Error("Project name must contain 1–150 characters.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: cleanName,
      description,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateProject(projectId, updates) {
  const allowedUpdates = {};

  if (updates.name !== undefined) {
    allowedUpdates.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    allowedUpdates.description = updates.description;
  }

  if (updates.status !== undefined) {
    allowedUpdates.status = updates.status;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(allowedUpdates)
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

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
