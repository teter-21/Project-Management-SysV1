import { supabase } from "../../lib/supabaseClient";

// READ — all members of a project
export async function getProjectMembers(projectId) {
  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      profile:profiles!project_members_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data;
}

// CREATE — add a member to a project
export async function addProjectMember(projectId, email, role = "member") {
  const { data, error } = await supabase.rpc("add_project_member", {
    p_project_id: projectId,
    p_email: email.trim(),
    p_role: role,
  });

  if (error) throw error;
  return data;
}

// DELETE — remove a member from a project
export async function removeProjectMember(projectId, userId) {
  const { error } = await supabase.rpc("remove_project_member", {
    p_project_id: projectId,
    p_user_id: userId,
  });

  if (error) throw error;
}

// UPDATE — change a member's role in a project
export async function setProjectMemberRole(projectId, userId, role) {
  const { error } = await supabase.rpc("set_project_member_role", {
    p_project_id: projectId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) throw error;
}
