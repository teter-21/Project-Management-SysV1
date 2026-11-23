import { supabase } from "../../lib/supabaseClient";

export async function getProjectMembers(projectId) {
  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) throw error;

  return data;
}

export async function addProjectMember(projectId, email, role = "member") {
  const { data, error } = await supabase.rpc("add_project_member", {
    p_project_id: projectId,
    p_email: email.trim(),
    p_role: role,
  });

  if (error) throw error;

  return data;
}

export async function removeProjectMember(projectId, userId) {
  const { error } = await supabase.rpc("remove_project_member", {
    p_project_id: projectId,
    p_user_id: userId,
  });

  if (error) throw error;
}

export async function setProjectMemberRole(projectId, userId, role) {
  const { error } = await supabase.rpc("set_project_member_role", {
    p_project_id: projectId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) throw error;
}
