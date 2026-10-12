-- =====================================================================
-- Event-Gate : Supabase schema, security (RLS) and workflow functions
-- Run this whole file once in Supabase -> SQL Editor.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

-- Every person in the system. Students do NOT all need a login;
-- user_id links a profile to a Supabase Auth account when one exists.
create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null,
  email       text unique not null,
  roll_no     text unique,
  full_name   text not null,
  role        text not null check (role in ('student','proctor','incharge')),
  department  text,
  year        text,
  section     text,
  proctor_id  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- Single-row configuration editable by the in-charge.
create table public.settings (
  id               int primary key default 1 check (id = 1),
  min_attendance   numeric not null default 75 check (min_attendance between 0 and 100),
  stale_after_days int     not null default 7 check (stale_after_days > 0),
  allow_override   boolean not null default true,
  updated_at       timestamptz not null default now()
);
insert into public.settings default values;

-- One row per uploaded file (import history).
create table public.attendance_imports (
  id              uuid primary key default gen_random_uuid(),
  file_name       text not null,
  uploaded_by     uuid references public.profiles(id),
  uploaded_at     timestamptz not null default now(),
  total_rows      int not null default 0,
  valid_rows      int not null default 0,
  invalid_rows    int not null default 0,
  unmatched_rows  int not null default 0,
  duplicate_rows  int not null default 0,
  is_active       boolean not null default false,
  errors          jsonb not null default '[]'::jsonb
);
-- Only one import can be the live dataset at a time.
create unique index one_active_import on public.attendance_imports (is_active) where is_active;

-- Attendance rows belong to an import, so older versions are never overwritten.
create table public.attendance_records (
  id                bigint generated always as identity primary key,
  import_id         uuid not null references public.attendance_imports(id) on delete cascade,
  student_id        uuid not null references public.profiles(id),
  classes_conducted int  not null check (classes_conducted >= 0),
  classes_attended  int  not null check (classes_attended >= 0),
  data_as_of        date not null,
  check (classes_attended <= classes_conducted),
  unique (import_id, student_id)
);

create sequence public.request_ref_seq;

create table public.event_requests (
  id                       uuid primary key default gen_random_uuid(),
  ref_no                   text unique not null
                           default ('EVT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.request_ref_seq')::text, 4, '0')),
  student_id               uuid not null references public.profiles(id),
  title                    text not null check (length(trim(title)) > 0),
  organizer                text not null check (length(trim(organizer)) > 0),
  category                 text not null check (category in
                           ('Hackathon','Workshop','Conference','Technical Competition','Industrial Visit','Other')),
  venue                    text not null,
  city                     text not null,
  start_date               date not null,
  end_date                 date not null,
  event_url                text,
  purpose                  text not null check (length(trim(purpose)) > 0),
  document_path            text,
  status                   text not null default 'Draft' check (status in
                           ('Draft','Submitted','Under Proctor Review','Returned for Correction',
                            'Recommended for Approval','Recommended for Rejection','Pending Final Decision',
                            'Approved','Rejected','Withdrawn')),
  proctor_recommendation   text check (proctor_recommendation in ('Recommend Approval','Recommend Rejection')),
  proctor_remarks          text,
  decision_remarks         text,
  decided_at               timestamptz,
  eligibility_at_submit    text,
  attendance_pct_at_submit numeric,
  overlap_flag             boolean not null default false,
  override_used            boolean not null default false,
  submitted_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (end_date >= start_date)
);

-- Append-only audit trail. No one can update or delete rows here.
create table public.request_history (
  id                      bigint generated always as identity primary key,
  request_id              uuid not null references public.event_requests(id),
  actor_id                uuid references public.profiles(id),
  actor_role              text,
  action                  text not null,
  from_status             text,
  to_status               text,
  remarks                 text,
  eligibility_snapshot    text,
  attendance_pct_snapshot numeric,
  created_at              timestamptz not null default now()
);

-- Indexes for dashboard filters
create index on public.profiles (role, department, section);
create index on public.profiles (proctor_id);
create index on public.attendance_records (student_id);
create index on public.attendance_records (data_as_of);
create index on public.event_requests (student_id);
create index on public.event_requests (status);
create index on public.event_requests (start_date, end_date);
create index on public.event_requests (category);
create index on public.request_history (request_id, created_at);

-- ---------------------------------------------------------------------
-- 2. HELPER FUNCTIONS (used by RLS and workflow functions)
-- ---------------------------------------------------------------------

create or replace function public.my_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from profiles where user_id = auth.uid()
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where user_id = auth.uid()
$$;

-- True if the logged-in user may see this student's data:
-- the student themself, their assigned proctor, or the in-charge.
create or replace function public.can_view_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles me
    where me.user_id = auth.uid()
      and ( me.role = 'incharge'
         or me.id = p_student
         or (me.role = 'proctor' and exists (
               select 1 from profiles s where s.id = p_student and s.proctor_id = me.id)) )
  )
$$;

-- Auto-link a new Auth user to the profile with the same email.
create or replace function public.link_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set user_id = new.id where lower(email) = lower(new.email);
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.link_profile();

-- ---------------------------------------------------------------------
-- 3. ELIGIBILITY VIEW (always computed from the active import)
-- ---------------------------------------------------------------------
create or replace function public.active_attendance_import_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.attendance_imports
  where is_active
  limit 1
$$;

revoke all on function public.active_attendance_import_id ()
from public, anon;

grant
execute on function public.active_attendance_import_id () to authenticated;

create view public.student_eligibility with (security_invoker = true) as
select
  p.id as student_id, p.roll_no, p.full_name, p.department, p.year, p.section, p.proctor_id,
  ar.classes_conducted, ar.classes_attended, ar.data_as_of,
  case when ar.classes_conducted > 0
       then round(ar.classes_attended * 100.0 / ar.classes_conducted, 2) end as attendance_pct,
  s.min_attendance as threshold,
  case
    when ar.id is null or ar.classes_conducted = 0                   then 'Unavailable'
    when ar.data_as_of < current_date - s.stale_after_days            then 'Needs Verification'
    when ar.classes_attended * 100.0 / ar.classes_conducted
         >= s.min_attendance                                          then 'Eligible'
    else 'Ineligible'
  end as eligibility,
  case
    when ar.id is null                                     then 'No record in the latest accepted attendance import'
    when ar.classes_conducted = 0                          then 'No classes conducted yet'
    when ar.data_as_of < current_date - s.stale_after_days then 'Attendance data older than ' || s.stale_after_days || ' days: needs verification'
    when ar.classes_attended * 100.0 / ar.classes_conducted < s.min_attendance
                                                           then 'Below the ' || s.min_attendance || '% threshold'
  end as reason
from public.profiles p
    cross join public.settings s
    left join public.attendance_records ar on ar.import_id = public.active_attendance_import_id ()
    and ar.student_id = p.id
where
    p.role = 'student';

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.settings           enable row level security;
alter table public.attendance_imports enable row level security;
alter table public.attendance_records enable row level security;
alter table public.event_requests     enable row level security;
alter table public.request_history    enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated using (public.can_view_student(id));

create policy settings_select on public.settings
  for select to authenticated using (true);
create policy settings_update on public.settings
  for update to authenticated
  using (public.my_role() = 'incharge') with check (public.my_role() = 'incharge');

create policy imports_select on public.attendance_imports
  for select to authenticated using (public.my_role() = 'incharge');

create policy attendance_select on public.attendance_records
  for select to authenticated using (public.can_view_student(student_id));

create policy requests_select on public.event_requests
  for select to authenticated using (public.can_view_student(student_id));
create policy requests_insert on public.event_requests
  for insert to authenticated
  with check (student_id = public.my_id() and public.my_role() = 'student' and status = 'Draft');
-- Students may edit only their own Draft / Returned requests (and cannot change status, see grants).
create policy requests_update on public.event_requests
  for update to authenticated
  using      (student_id = public.my_id() and status in ('Draft','Returned for Correction'))
  with check (student_id = public.my_id() and status in ('Draft','Returned for Correction'));

create policy history_select on public.request_history
  for select to authenticated using (
    exists (select 1 from public.event_requests r
            where r.id = request_id and public.can_view_student(r.student_id)));

-- Column-level grants: the browser can never write status, flags or audit data directly.
revoke all on public.profiles, public.attendance_imports, public.attendance_records,
              public.request_history from anon;
revoke insert, update, delete on public.profiles, public.attendance_imports,
              public.attendance_records, public.request_history from authenticated;
revoke all on public.event_requests, public.settings from anon;
revoke insert, update, delete on public.event_requests from authenticated;
grant insert (student_id, title, organizer, category, venue, city, start_date, end_date,
              event_url, purpose, document_path) on public.event_requests to authenticated;
grant update (title, organizer, category, venue, city, start_date, end_date,
              event_url, purpose, document_path) on public.event_requests to authenticated;
revoke insert, update, delete on public.settings from authenticated;
grant update (min_attendance, stale_after_days, allow_override) on public.settings to authenticated;
revoke all on public.student_eligibility from anon;
grant select on public.student_eligibility to authenticated;

-- ---------------------------------------------------------------------
-- 5. WORKFLOW FUNCTIONS (the only way statuses change)
-- ---------------------------------------------------------------------

-- Student: submit (or resubmit) a request.
create or replace function public.submit_request(p_request uuid)
returns public.event_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.event_requests; e record; v_from text; v_overlap boolean;
begin
  select * into r from event_requests where id = p_request for update;
  if r.id is null or r.student_id is distinct from my_id() then
    raise exception 'Request not found or not yours';
  end if;
  if r.status not in ('Draft','Returned for Correction') then
    raise exception 'A request in status "%" cannot be submitted', r.status;
  end if;
  if r.end_date < r.start_date then raise exception 'End date cannot be before start date'; end if;
  if r.start_date < current_date then raise exception 'Event start date is in the past'; end if;

  v_from := r.status;
  select * into e from student_eligibility where student_id = r.student_id;
  select exists (
    select 1 from event_requests o
    where o.student_id = r.student_id and o.id <> r.id
      and o.status not in ('Draft','Withdrawn','Rejected')
      and o.start_date <= r.end_date and o.end_date >= r.start_date
  ) into v_overlap;

  update event_requests
     set status = 'Under Proctor Review', submitted_at = now(), updated_at = now(),
         eligibility_at_submit = e.eligibility, attendance_pct_at_submit = e.attendance_pct,
         overlap_flag = v_overlap, override_used = false,
         proctor_recommendation = null, proctor_remarks = null, decision_remarks = null, decided_at = null
   where id = p_request
  returning * into r;

  -- Two traceable steps: student submits, then the system eligibility check routes it to the proctor.
  insert into request_history (request_id, actor_id, actor_role, action, from_status, to_status)
  values (r.id, my_id(), 'student', 'submit', v_from, 'Submitted');
  insert into request_history (request_id, actor_id, actor_role, action, from_status, to_status,
                               remarks, eligibility_snapshot, attendance_pct_snapshot)
  values (r.id, null, 'system', 'eligibility_check', 'Submitted', 'Under Proctor Review',
          concat_ws('; ', 'Eligibility: ' || e.eligibility, e.reason,
                    case when v_overlap then 'Flag: dates overlap another active request' end),
          e.eligibility, e.attendance_pct);
  return r;
end $$;

-- Proctor: recommend approval / rejection, or return for correction.
-- p_action: 'recommend_approve' | 'recommend_reject' | 'return'
create or replace function public.proctor_review(p_request uuid, p_action text, p_remarks text default null)
returns public.event_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.event_requests; e record; v_to text; v_proctor uuid;
begin
  if my_role() is distinct from 'proctor' then raise exception 'Only proctors can review requests'; end if;
  select * into r from event_requests where id = p_request for update;
  if r.id is null then raise exception 'Request not found'; end if;
  select proctor_id into v_proctor from profiles where id = r.student_id;
  if v_proctor is distinct from my_id() then raise exception 'This student is not assigned to you'; end if;
  if r.status <> 'Under Proctor Review' then
    raise exception 'Request is "%", not awaiting proctor review', r.status;
  end if;

  v_to := case p_action
            when 'recommend_approve' then 'Recommended for Approval'
            when 'recommend_reject'  then 'Recommended for Rejection'
            when 'return'            then 'Returned for Correction'
          end;
  if v_to is null then raise exception 'Unknown action %', p_action; end if;
  if p_action in ('recommend_reject','return') and coalesce(trim(p_remarks),'') = '' then
    raise exception 'Remarks are required to reject or return a request';
  end if;

  select * into e from student_eligibility where student_id = r.student_id;
  insert into request_history (request_id, actor_id, actor_role, action, from_status, to_status,
                               remarks, eligibility_snapshot, attendance_pct_snapshot)
  values (r.id, my_id(), 'proctor', p_action, 'Under Proctor Review', v_to, p_remarks,
          e.eligibility, e.attendance_pct);

  if p_action = 'return' then
    update event_requests set status = v_to, proctor_remarks = p_remarks, updated_at = now()
     where id = p_request returning * into r;
  else
    -- Recommendation recorded, then the system moves it to the in-charge's queue.
    update event_requests
       set status = 'Pending Final Decision', updated_at = now(), proctor_remarks = p_remarks,
           proctor_recommendation = case when p_action = 'recommend_approve'
                                         then 'Recommend Approval' else 'Recommend Rejection' end
     where id = p_request returning * into r;
    insert into request_history (request_id, actor_id, actor_role, action, from_status, to_status)
    values (r.id, null, 'system', 'route_to_incharge', v_to, 'Pending Final Decision');
  end if;
  return r;
end $$;

-- In-charge: final decision. Approving a student who is not 'Eligible'
-- requires p_override = true AND remarks; the override is recorded, never hidden.
create or replace function public.final_decision(p_request uuid, p_decision text,
                                                 p_remarks text default null, p_override boolean default false)
returns public.event_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.event_requests; e record; v_from text; v_override boolean := false;
begin
  if my_role() is distinct from 'incharge' then
    raise exception 'Only the technical-event in-charge can make the final decision';
  end if;
  select * into r from event_requests where id = p_request for update;
  if r.id is null then raise exception 'Request not found'; end if;
  if r.status <> 'Pending Final Decision' then
    raise exception 'Request is "%"; it needs a proctor recommendation first', r.status;
  end if;
  if p_decision not in ('Approved','Rejected','Returned for Correction') then
    raise exception 'Unknown decision %', p_decision;
  end if;
  if p_decision in ('Rejected','Returned for Correction') and coalesce(trim(p_remarks),'') = '' then
    raise exception 'A reason is required to reject or return a request';
  end if;


  select * into e
  from public.student_eligibility
  where student_id = r.student_id;

  if p_decision = 'Approved' then
    if not found or e.eligibility is null then
      raise exception 'Eligibility data is unavailable; approval is blocked';
    end if;

    if e.eligibility is distinct from 'Eligible' then
      if not (
        select allow_override
        from public.settings
        where id = 1
      ) then
        raise exception 'Student is "%" and overrides are disabled in settings',
          e.eligibility;
      end if;

      if not coalesce(p_override, false)
         or coalesce(trim(p_remarks), '') = '' then
        raise exception 'Student is "%" (%). Approval needs an explicit override with remarks.',
          e.eligibility, coalesce(e.reason, '');
      end if;

      v_override := true;
    end if;
  end if;

  v_from := r.status;
  update event_requests set status = p_decision, override_used = v_override, updated_at = now(),
         decision_remarks = p_remarks, decided_at = now()
   where id = p_request returning * into r;
  insert into request_history (request_id, actor_id, actor_role, action, from_status, to_status,
                               remarks, eligibility_snapshot, attendance_pct_snapshot)
  values (r.id, my_id(), 'incharge',
          case when v_override then 'override_approve' else 'final_decision' end,
          v_from, p_decision, p_remarks, e.eligibility, e.attendance_pct);
  return r;
end $$;

-- Student: withdraw a request that is not finalized.
create or replace function public.withdraw_request(p_request uuid, p_remarks text default null)
returns public.event_requests
language plpgsql security definer set search_path = public as $$
declare r public.event_requests; v_from text;
begin
  select * into r from event_requests where id = p_request for update;
  if r.id is null or r.student_id is distinct from my_id() then raise exception 'Request not found or not yours'; end if;
  if r.status in ('Approved','Rejected','Withdrawn') then
    raise exception 'A "%" request cannot be withdrawn', r.status;
  end if;
  v_from := r.status;
  update event_requests set status = 'Withdrawn', updated_at = now() where id = p_request returning * into r;
  insert into request_history (request_id, actor_id, actor_role, action, from_status, to_status, remarks)
  values (r.id, my_id(), 'student', 'withdraw', v_from, 'Withdrawn', p_remarks);
  return r;
end $$;

-- In-charge: import attendance. p_rows is a JSON array of
-- { "roll_no", "classes_conducted", "classes_attended", "data_as_of", "attendance_pct" (optional) }
-- data_as_of accepts YYYY-MM-DD or DD-MM-YYYY. Every row is validated again on the server.
-- If no row is valid, the previous dataset stays active (nothing is corrupted).
create or replace function public.import_attendance(p_file_name text, p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_import uuid; v_row jsonb; v_idx int := 0; v_errors jsonb := '[]'::jsonb;
  v_valid int := 0; v_invalid int := 0; v_unmatched int := 0; v_dup int := 0;
  v_seen text[] := '{}'; v_roll text; v_student uuid; v_cond int; v_att int;
  v_date date; v_raw_date text; v_pct numeric;
begin
  if my_role() is distinct from 'incharge' then
    raise exception 'Only the technical-event in-charge can import attendance';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The file contains no data rows';
  end if;

  insert into attendance_imports (file_name, uploaded_by, total_rows)
  values (coalesce(p_file_name,'upload'), my_id(), jsonb_array_length(p_rows))
  returning id into v_import;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_idx := v_idx + 1;
    v_roll := upper(trim(v_row->>'roll_no'));

    if v_roll is null or v_roll = '' then
      v_invalid := v_invalid + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'roll_no', null, 'error', 'Missing roll number');
      continue;
    end if;
    if v_roll = any(v_seen) then
      v_dup := v_dup + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'roll_no', v_roll, 'error', 'Duplicate roll number in file');
      continue;
    end if;
    v_seen := v_seen || v_roll;

    select id into v_student from profiles where upper(roll_no) = v_roll and role = 'student';
    if v_student is null then
      v_unmatched := v_unmatched + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'roll_no', v_roll, 'error', 'No student with this roll number');
      continue;
    end if;

    begin
      if coalesce(trim(v_row->>'classes_conducted'),'') = '' or coalesce(trim(v_row->>'classes_attended'),'') = '' then
        raise exception 'Classes conducted and classes attended are required';
      end if;
      v_cond := (v_row->>'classes_conducted')::int;
      v_att  := (v_row->>'classes_attended')::int;
      if v_cond < 0 or v_att < 0 then raise exception 'Counts cannot be negative'; end if;
      if v_att > v_cond then raise exception 'Classes attended (%) exceeds classes conducted (%)', v_att, v_cond; end if;

      v_raw_date := trim(v_row->>'data_as_of');
      if coalesce(v_raw_date,'') = '' then raise exception 'Data As Of date is required'; end if;
      v_date := case when v_raw_date ~ '^\d{2}-\d{2}-\d{4}$' then to_date(v_raw_date, 'DD-MM-YYYY')
                     else v_raw_date::date end;
      if v_date > current_date then raise exception 'Data As Of date is in the future'; end if;

      v_pct := nullif(
        replace(trim(coalesce(v_row->>'attendance_pct', '')), '%', ''),
        ''
      )::numeric;

      if v_pct is not null and (v_pct < 0 or v_pct > 100) then
        raise exception 'Attendance percentage must be between 0 and 100';
      end if;

      if v_pct is not null and v_cond > 0
         and abs(v_pct - round(v_att * 100.0 / v_cond, 2)) > 1 then
        raise exception 'Attendance %% (%) does not match counts (% / %)',
          v_pct, v_att, v_cond;
      end if;

      insert into attendance_records (import_id, student_id, classes_conducted, classes_attended, data_as_of)
      values (v_import, v_student, v_cond, v_att, v_date);
      v_valid := v_valid + 1;
    exception when others then
      v_invalid := v_invalid + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'roll_no', v_roll, 'error', sqlerrm);
    end;
  end loop;

  if v_valid > 0 then
    update attendance_imports set is_active = false where is_active;
  end if;
  update attendance_imports
     set valid_rows = v_valid, invalid_rows = v_invalid, unmatched_rows = v_unmatched,
         duplicate_rows = v_dup, errors = v_errors, is_active = (v_valid > 0)
   where id = v_import;

  return jsonb_build_object('import_id', v_import, 'activated', v_valid > 0,
                            'total', v_idx, 'valid', v_valid, 'invalid', v_invalid,
                            'unmatched', v_unmatched, 'duplicates', v_dup, 'errors', v_errors);
end $$;

-- Only logged-in users can call functions; each function checks the role itself.
revoke execute on all functions in schema public from public, anon;
grant  execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------------
-- 6. STORAGE for supporting documents (private bucket)
-- Upload path must be: <student profile id>/<file name>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('event-docs', 'event-docs', false)
on conflict (id) do nothing;

create policy "students upload own docs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-docs' and (storage.foldername(name))[1] = public.my_id()::text);

create policy "authorised users read docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-docs'
         and public.can_view_student(((storage.foldername(name))[1])::uuid));
