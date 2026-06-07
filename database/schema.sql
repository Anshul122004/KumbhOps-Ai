create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('volunteer', 'manager')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create own volunteer profile" on public.users;
create policy "Users can create own volunteer profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id and role = 'volunteer');

drop policy if exists "Managers can read all profiles" on public.users;
create policy "Managers can read all profiles"
on public.users
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

create extension if not exists pgcrypto;

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text,
  phone text,
  age integer,
  gender text,
  address text,
  city text,
  preferred_zone text,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  experience_level text,
  medical_training boolean not null default false,
  crowd_control boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  suitability_score integer,
  recommended_role text,
  ai_reason text,
  created_at timestamptz not null default now()
);

alter table public.volunteers
add column if not exists suitability_score integer;

alter table public.volunteers
add column if not exists recommended_role text;

alter table public.volunteers
add column if not exists ai_reason text;

alter table public.volunteers enable row level security;

drop policy if exists "Volunteers can read own profile" on public.volunteers;
create policy "Volunteers can read own profile"
on public.volunteers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Volunteers can create own profile" on public.volunteers;
create policy "Volunteers can create own profile"
on public.volunteers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Volunteers can update own profile" on public.volunteers;
create policy "Volunteers can update own profile"
on public.volunteers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Managers can read volunteer profiles" on public.volunteers;
create policy "Managers can read volunteer profiles"
on public.volunteers
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can update volunteer status" on public.volunteers;
create policy "Managers can update volunteer status"
on public.volunteers
for update
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  assigned_zone text,
  assigned_role text,
  assignment_reason text,
  assignment_status text not null default 'assigned'
    check (assignment_status in ('assigned','active','completed')),
  created_at timestamptz not null default now()
);

drop index if exists assignments_volunteer_id_unique;

create unique index if not exists assignments_open_volunteer_id_unique
on public.assignments(volunteer_id)
where assignment_status in ('assigned','active');

alter table public.assignments enable row level security;

drop policy if exists "Volunteers can read own assignments" on public.assignments;
create policy "Volunteers can read own assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.volunteers volunteer_profile
    where volunteer_profile.id = assignments.volunteer_id
      and volunteer_profile.user_id = auth.uid()
  )
);

drop policy if exists "Managers can read all assignments" on public.assignments;
create policy "Managers can read all assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can create assignments" on public.assignments;
create policy "Managers can create assignments"
on public.assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can update assignment status" on public.assignments;
create policy "Managers can update assignment status"
on public.assignments
for update
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Volunteers can update own assignment status" on public.assignments;
create policy "Volunteers can update own assignment status"
on public.assignments
for update
to authenticated
using (
  exists (
    select 1
    from public.volunteers volunteer_profile
    where volunteer_profile.id = assignments.volunteer_id
      and volunteer_profile.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.volunteers volunteer_profile
    where volunteer_profile.id = assignments.volunteer_id
      and volunteer_profile.user_id = auth.uid()
  )
);

create table if not exists public.emergencies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  incident_type text not null
    check (incident_type in ('medical','lost_person','crowd_surge','fire','security')),
  zone text not null,
  priority text not null
    check (priority in ('low','medium','high','critical')),
  description text,
  status text not null default 'active'
    check (status in ('active','resolved')),
  response_plan text,
  recommended_responder_count integer not null default 0,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

alter table public.emergencies
add column if not exists recommended_responder_count integer not null default 0;

alter table public.emergencies enable row level security;

drop policy if exists "Managers can create emergencies" on public.emergencies;
create policy "Managers can create emergencies"
on public.emergencies
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can read all emergencies" on public.emergencies;
create policy "Managers can read all emergencies"
on public.emergencies
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can update emergencies" on public.emergencies;
create policy "Managers can update emergencies"
on public.emergencies
for update
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Volunteers can read active emergencies" on public.emergencies;
create policy "Volunteers can read active emergencies"
on public.emergencies
for select
to authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.users volunteer_profile
    where volunteer_profile.id = auth.uid()
      and volunteer_profile.role = 'volunteer'
  )
);

create table if not exists public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  scenario_type text not null
    check (scenario_type in ('medical','crowd_surge','fire','security','lost_person')),
  zone text not null,
  priority text not null
    check (priority in ('low','medium','high','critical')),
  status text not null default 'running'
    check (status in ('running','completed')),
  timeline jsonb not null default '[]'::jsonb,
  started_by uuid references public.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.simulation_runs enable row level security;

drop policy if exists "Managers can create simulations" on public.simulation_runs;
create policy "Managers can create simulations"
on public.simulation_runs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can read simulations" on public.simulation_runs;
create policy "Managers can read simulations"
on public.simulation_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can update simulations" on public.simulation_runs;
create policy "Managers can update simulations"
on public.simulation_runs
for update
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Volunteers can read active simulations" on public.simulation_runs;
create policy "Volunteers can read active simulations"
on public.simulation_runs
for select
to authenticated
using (
  status = 'running'
  and exists (
    select 1
    from public.users volunteer_profile
    where volunteer_profile.id = auth.uid()
      and volunteer_profile.role = 'volunteer'
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text check(type in ('assignment','approval','emergency','announcement','simulation')),
  recipient_role text,
  recipient_user_id uuid references public.users(id),
  zone text,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Managers can create notifications" on public.notifications;
create policy "Managers can create notifications"
on public.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Managers can read all notifications" on public.notifications;
create policy "Managers can read all notifications"
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

drop policy if exists "Volunteers can read own notifications" on public.notifications;
create policy "Volunteers can read own notifications"
on public.notifications
for select
to authenticated
using (
  recipient_user_id = auth.uid()
  or recipient_role = 'volunteer'
);

drop policy if exists "Volunteers can mark own notifications read" on public.notifications;
create policy "Volunteers can mark own notifications read"
on public.notifications
for update
to authenticated
using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());

drop policy if exists "Volunteers can create manager task notifications" on public.notifications;
create policy "Volunteers can create manager task notifications"
on public.notifications
for insert
to authenticated
with check (
  recipient_role = 'manager'
  and type = 'assignment'
  and exists (
    select 1
    from public.users volunteer_profile
    where volunteer_profile.id = auth.uid()
      and volunteer_profile.role = 'volunteer'
  )
);

create table if not exists public.task_updates (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  volunteer_id uuid references public.volunteers(id) on delete cascade,
  status text check (status in ('assigned','accepted','en_route','active','completed')),
  notes text,
  updated_at timestamptz default now()
);

alter table public.task_updates enable row level security;

drop policy if exists "Volunteers can read own task updates" on public.task_updates;
create policy "Volunteers can read own task updates"
on public.task_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.volunteers volunteer_profile
    where volunteer_profile.id = task_updates.volunteer_id
      and volunteer_profile.user_id = auth.uid()
  )
);

drop policy if exists "Volunteers can create own task updates" on public.task_updates;
create policy "Volunteers can create own task updates"
on public.task_updates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.volunteers volunteer_profile
    where volunteer_profile.id = task_updates.volunteer_id
      and volunteer_profile.user_id = auth.uid()
  )
);

drop policy if exists "Managers can read all task updates" on public.task_updates;
create policy "Managers can read all task updates"
on public.task_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.users manager_profile
    where manager_profile.id = auth.uid()
      and manager_profile.role = 'manager'
  )
);

