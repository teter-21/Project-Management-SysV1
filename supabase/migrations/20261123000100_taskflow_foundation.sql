-- TaskFlow Phase 4: database foundation
-- Apply as a migration in a NEW development Supabase project.
-- SECURITY DEFINER functions are intentionally narrow and have fixed search_path.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- A user has one public profile; no password stored here.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  description text not null default '',
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create unique index project_one_owner on public.project_members(project_id) where role = 'owner';
create index project_members_user_id_idx on public.project_members(user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  due_date date,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_project_status_position_idx on public.tasks(project_id, status, position);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_created_by_idx on public.tasks(created_by);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index comments_task_created_idx on public.task_comments(task_id, created_at);
create index comments_author_idx on public.task_comments(author_id);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_project_created_idx on public.activity_logs(project_id, created_at desc);
create index activity_task_idx on public.activity_logs(task_id);
create index activity_actor_idx on public.activity_logs(actor_id);

-- Common update timestamp function.
create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function private.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function private.set_updated_at();

-- Trigger for new registered users (runs as migration owner).
create function private.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'New User'
  );
  insert into public.profiles(id, full_name)
  values (new.id, case when char_length(v_name) < 2 then 'New User' else left(v_name, 100) end)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger taskflow_on_auth_user_created
  after insert on auth.users
  for each row execute function private.create_profile_for_auth_user();

-- Backfill accounts created during Phase 3 before this migration existed.
insert into public.profiles(id, full_name)
select id, case when char_length(v_name) < 2 then 'New User' else left(v_name, 100) end
from (
  select id, coalesce(
    nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(email, '@', 1), ''),
    'New User'
  ) as v_name from auth.users
) existing_users
on conflict (id) do nothing;

-- Helpers run with migration owner's table-reading privileges, avoiding
-- recursive RLS policies on project_members.
create function private.is_project_member(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id and m.user_id = (select auth.uid())
  );
$$;
create function private.is_project_owner(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = (select auth.uid())
  );
$$;
create function private.shares_project(p_other_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members mine
    join public.project_members theirs on theirs.project_id = mine.project_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_other_user
  );
$$;

-- Creating a project automatically creates the immutable owner membership.
create function private.add_project_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_members(project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;
create trigger taskflow_project_created
  after insert on public.projects
  for each row execute function private.add_project_owner();

-- Database-level guard for assignees, including callers that bypass frontend forms.
create function private.check_task_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assignee_id is not null and not exists (
    select 1 from public.project_members m
    where m.project_id = new.project_id and m.user_id = new.assignee_id
  ) then
    raise exception 'Assignee must be a project member' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger taskflow_check_task_assignee
  before insert or update of assignee_id, project_id on public.tasks
  for each row execute function private.check_task_assignee();

-- Enable RLS before granting table access.
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.activity_logs enable row level security;

create policy profiles_read_shared on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.shares_project(id)));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy projects_select_member on public.projects for select to authenticated
  using ((select private.is_project_member(id)));
create policy projects_insert_own on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy projects_update_owner on public.projects for update to authenticated
  using ((select private.is_project_owner(id)))
  with check ((select private.is_project_owner(id)));
create policy projects_delete_owner on public.projects for delete to authenticated
  using ((select private.is_project_owner(id)));

create policy members_select_member on public.project_members for select to authenticated
  using ((select private.is_project_member(project_id)));
-- No direct INSERT/UPDATE/DELETE policy for project_members.

create policy tasks_select_member on public.tasks for select to authenticated
  using ((select private.is_project_member(project_id)));
create policy tasks_insert_member on public.tasks for insert to authenticated
  with check ((select private.is_project_member(project_id)) and created_by = (select auth.uid()));
create policy tasks_update_member on public.tasks for update to authenticated
  using ((select private.is_project_member(project_id)))
  with check ((select private.is_project_member(project_id)));
create policy tasks_delete_member on public.tasks for delete to authenticated
  using ((select private.is_project_member(project_id)));

create policy comments_select_member on public.task_comments for select to authenticated
  using (exists(select 1 from public.tasks t where t.id = task_id and (select private.is_project_member(t.project_id))));
create policy comments_insert_author on public.task_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and exists(
    select 1 from public.tasks t where t.id = task_id and (select private.is_project_member(t.project_id))
  ));
create policy comments_delete_author on public.task_comments for delete to authenticated
  using (author_id = (select auth.uid()) and exists(
    select 1 from public.tasks t where t.id = task_id and (select private.is_project_member(t.project_id))
  ));
create policy activity_select_member on public.activity_logs for select to authenticated
  using ((select private.is_project_member(project_id)));
-- Activity rows intentionally cannot be forged by frontend callers.

-- Explicit minimal table grants (RLS alone is not enough).
revoke all on public.profiles, public.projects, public.project_members,
  public.tasks, public.task_comments, public.activity_logs from anon, authenticated;
grant select on public.profiles, public.projects, public.project_members,
  public.tasks, public.task_comments, public.activity_logs to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant insert (owner_id, name, description, status) on public.projects to authenticated;
grant update (name, description, status) on public.projects to authenticated;
grant delete on public.projects to authenticated;
grant insert (project_id, title, description, status, priority,
  assignee_id, created_by, due_date, position) on public.tasks to authenticated;
grant update (title, description, status, priority, assignee_id,
  due_date, position) on public.tasks to authenticated;
grant delete on public.tasks to authenticated;
grant insert (task_id, author_id, content) on public.task_comments to authenticated;
grant delete on public.task_comments to authenticated;

-- Owner-only role administration. Existing registered users are found by email.
-- It does not expose auth.users to normal SQL / API callers.
create function public.add_project_member(
  p_project_id uuid,
  p_email text,
  p_role text default 'member'
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_target_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.is_project_owner(p_project_id) then
    raise exception 'Only project owners can manage members' using errcode = '42501';
  end if;
  if p_role not in ('member','admin') then
    raise exception 'Invalid membership role' using errcode = '22023';
  end if;
  if p_email is null or char_length(btrim(p_email)) > 320 then
    raise exception 'Invalid email' using errcode = '22023';
  end if;

  select u.id into v_target_id from auth.users u
  where lower(u.email) = lower(btrim(p_email))
    and u.email_confirmed_at is not null
  limit 1;
  if v_target_id is null then
    raise exception 'No confirmed registered user with this email' using errcode = '22023';
  end if;
  insert into public.project_members(project_id,user_id,role)
  values (p_project_id,v_target_id,p_role)
  on conflict (project_id,user_id) do nothing;
  return v_target_id;
end;
$$;

create function public.remove_project_member(p_project_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not private.is_project_owner(p_project_id) then
    raise exception 'Only project owners can manage members' using errcode = '42501';
  end if;
  if exists(select 1 from public.projects p where p.id = p_project_id and p.owner_id = p_user_id) then
    raise exception 'Project owner cannot be removed' using errcode = '22023';
  end if;
  -- Clear assigned tasks so no orphaned project assignments remain.
  update public.tasks t set assignee_id = null
  where t.project_id = p_project_id and t.assignee_id = p_user_id;
  delete from public.project_members m
  where m.project_id = p_project_id and m.user_id = p_user_id;
end;
$$;

create function public.set_project_member_role(p_project_id uuid, p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not private.is_project_owner(p_project_id) then
    raise exception 'Only project owners can manage members' using errcode = '42501';
  end if;
  if p_role not in ('member','admin') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  update public.project_members m set role = p_role
  where m.project_id = p_project_id and m.user_id = p_user_id and m.role <> 'owner';
  if not found then
    raise exception 'Membership not found or cannot be changed' using errcode = '22023';
  end if;
end;
$$;

-- Explicitly lock down every newly created function.
revoke execute on all functions in schema private from public, anon, authenticated;
revoke execute on function public.add_project_member(uuid,text,text) from public, anon, authenticated;
revoke execute on function public.remove_project_member(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.set_project_member_role(uuid,uuid,text) from public, anon, authenticated;

grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.is_project_owner(uuid) to authenticated;
grant execute on function private.shares_project(uuid) to authenticated;
grant execute on function public.add_project_member(uuid,text,text) to authenticated;
grant execute on function public.remove_project_member(uuid,uuid) to authenticated;
grant execute on function public.set_project_member_role(uuid,uuid,text) to authenticated;
