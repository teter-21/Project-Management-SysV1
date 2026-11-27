-- Phase 7: Atomic task ordering
-- Intended for the existing Phase 4 TaskFlow schema.

create or replace function public.move_project_task(
  p_project_id uuid,
  p_task_id uuid,
  p_new_status text,
  p_new_index integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status text;
  v_ids uuid[];
  v_task uuid;
  v_status text;
  v_index integer;
  v_target_index integer;
  v_length integer;
  v_i integer;
begin
  -- 1. Validate inputs.
  if p_project_id is null
    or p_task_id is null
    or p_new_status not in ('todo', 'in_progress', 'done')
    or p_new_status is null
    or p_new_index is null
    or p_new_index < 0
  then
    raise exception 'Invalid move parameters';
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- 2. Check membership using our existing
  -- private Phase 4 authorization helper.
  if not private.is_project_member(p_project_id) then
    raise exception 'Project access denied'
      using errcode = '42501';
  end if;

  -- 3. Serialize move operations for this project.
  -- This row lock lasts until the RPC transaction ends.
  perform 1
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found';
  end if;

  -- 4. Read the task's current status.
  select status into v_old_status
  from public.tasks
  where id = p_task_id
    and project_id = p_project_id
  for update;

  if not found then
    raise exception 'Task not found';
  end if;

  -- 5. Re-number the affected columns.
  -- Exclude the moved task from the initial arrays.
  for v_status in
    select distinct s.status
    from (
      values (v_old_status), (p_new_status)
    ) as s(status)
  loop
    select coalesce(
      array_agg(
        id order by position, created_at, id
      ),
      array[]::uuid[]
    )
    into v_ids
    from public.tasks
    where project_id = p_project_id
      and status = v_status
      and id <> p_task_id;

    v_length := coalesce(array_length(v_ids, 1), 0);
    v_index := 0;

    if v_status = p_new_status then
      v_target_index := least(p_new_index, v_length);

      -- Insert moved task into the requested index.
      for v_i in 0..v_length loop
        if v_i = v_target_index then
          update public.tasks
          set status = p_new_status,
              position = v_index
          where id = p_task_id
            and project_id = p_project_id;

          v_index := v_index + 1;
        end if;

        if v_i < v_length then
          v_task := v_ids[v_i + 1];

          update public.tasks
          set position = v_index
          where id = v_task
            and project_id = p_project_id;

          v_index := v_index + 1;
        end if;
      end loop;

    else
      -- Close gaps in the original column.
      for v_i in 1..v_length loop
        update public.tasks
        set position = v_i - 1
        where id = v_ids[v_i]
          and project_id = p_project_id;
      end loop;
    end if;
  end loop;
end;
$$;

-- Functions can inherit broad EXECUTE permissions.
-- Revoke first, then allow only authenticated users.
revoke all on function public.move_project_task(
  uuid, uuid, text, integer
) from public, anon, authenticated;

grant execute on function public.move_project_task(
  uuid, uuid, text, integer
) to authenticated;