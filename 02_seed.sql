-- =====================================================================
-- Event-Gate : demo data. Run AFTER 01_schema.sql. Safe to re-run (it resets demo data).
-- Matches the spec doc's demo students:
--   24AI001 82% Eligible | 24AI002 75% exactly at threshold | 24AI003 68% Ineligible
--   24AI004 missing attendance (Unavailable) | 24AI005 88% but outdated (Needs Verification)
--   24AI006 zero classes conducted (Unavailable). Others mixed, both sides of 75%.
-- 13 requests covering every workflow state, one recorded override, one overlap.
-- =====================================================================

truncate public.request_history, public.event_requests, public.attendance_records,
         public.attendance_imports, public.profiles restart identity cascade;
alter sequence public.request_ref_seq restart;
update public.settings set min_attendance = 75, stale_after_days = 7, allow_override = true where id = 1;

-- Staff
insert into public.profiles (email, full_name, role, department) values
  ('incharge@eventgate.demo', 'Dr. Ramesh Babu',   'incharge', 'Technical Events Cell'),
  ('proctor1@eventgate.demo', 'Prof. Sujatha Rao', 'proctor',  'AI'),
  ('proctor2@eventgate.demo', 'Prof. Venkat Reddy','proctor',  'CSE');

-- 30 students: 1-15 AI (proctor1), 16-30 CSE (proctor2)
insert into public.profiles (email, roll_no, full_name, role, department, year, section, proctor_id)
select
  'student' || lpad(g::text, 2, '0') || '@eventgate.demo',
  case when g <= 15 then '24AI' else '24CS' end || lpad(g::text, 3, '0'),
  (array['Aarav Reddy','Bhavana Rao','Chaitanya Varma','Divya Lakshmi','Eshwar Naidu',
         'Fathima Shaik','Ganesh Kumar','Harika Devi','Ishaan Chowdary','Jahnavi Prasad',
         'Karthik Raju','Lavanya Sri','Manoj Babu','Navya Teja','Omkar Sai',
         'Pranavi Reddy','Rahul Varma','Sahithi Rao','Tarun Kumar','Usha Kiran',
         'Vamsi Krishna','Yamini Devi','Abhinav Naidu','Bindu Madhavi','Charan Teja',
         'Deepika Sree','Gopi Chand','Hema Latha','Kiran Kumar','Meghana Reddy'])[g],
  'student',
  case when g <= 15 then 'AI' else 'CSE' end,
  'II',
  case when g % 2 = 0 then 'A' else 'B' end,
  (select id from public.profiles where email = case when g <= 15 then 'proctor1@eventgate.demo'
                                                     else 'proctor2@eventgate.demo' end)
from generate_series(1, 30) g;

-- Initial accepted attendance import (24AI004 deliberately missing)
with imp as (
  insert into public.attendance_imports
    (file_name, total_rows, valid_rows, invalid_rows, unmatched_rows, duplicate_rows, is_active, uploaded_at, uploaded_by)
  values ('attendance_initial.xlsx', 29, 29, 0, 0, 0, true, now() - interval '2 days',
          (select id from public.profiles where role = 'incharge'))
  returning id
)
insert into public.attendance_records (import_id, student_id, classes_conducted, classes_attended, data_as_of)
select imp.id, p.id,
  case when g = 6 then 0 else 100 end,
  case g when 1 then 82 when 2 then 75 when 3 then 68 when 5 then 88 when 6 then 0
         else 60 + (g * 7 % 40) end,
  case when g = 5 then current_date - 20 else current_date - 2 end
from imp
cross join generate_series(1, 30) g
join public.profiles p on p.email = 'student' || lpad(g::text, 2, '0') || '@eventgate.demo'
where g <> 4;

-- Helper: inserts a request plus an audit trail consistent with its status.
create or replace function pg_temp.seed_request(
  p_roll text, p_title text, p_org text, p_cat text, p_venue text, p_city text,
  p_start int, p_len int, p_status text,
  p_remarks text default null, p_rec_reject boolean default false,
  p_overlap boolean default false, p_override boolean default false)
returns void language plpgsql as $$
declare
  v_s uuid; v_pr uuid; v_ic uuid; v_req uuid; e record;
  v_rec_status text; v_rec_label text; v_rec_remarks text; v_final boolean;
begin
  select id, proctor_id into v_s, v_pr from public.profiles where roll_no = p_roll;
  select id into v_ic from public.profiles where role = 'incharge';
  select * into e from public.student_eligibility where student_id = v_s;

  v_final := p_status in ('Approved','Rejected');
  v_rec_status := case when p_rec_reject then 'Recommended for Rejection' else 'Recommended for Approval' end;
  v_rec_label  := case when p_rec_reject then 'Recommend Rejection' else 'Recommend Approval' end;
  v_rec_remarks := case when p_status = 'Pending Final Decision' then p_remarks
                        when p_rec_reject then 'Attendance below threshold; recommend rejection.'
                        else 'Relevant to coursework; recommend approval.' end;

  insert into public.event_requests
    (student_id, title, organizer, category, venue, city, start_date, end_date, event_url, purpose,
     status, eligibility_at_submit, attendance_pct_at_submit, overlap_flag, override_used, submitted_at,
     proctor_recommendation, proctor_remarks, decision_remarks, decided_at)
  values
    (v_s, p_title, p_org, p_cat, p_venue, p_city, current_date + p_start, current_date + p_start + p_len,
     'https://example.org/' || lower(replace(p_title, ' ', '-')),
     'Hands-on exposure to real industry problems, peer learning and networking relevant to the curriculum.',
     p_status,
     case when p_status <> 'Draft' then e.eligibility end,
     case when p_status <> 'Draft' then e.attendance_pct end,
     p_overlap, p_override,
     case when p_status <> 'Draft' then now() - interval '2 days' end,
     case when p_status = 'Pending Final Decision' or v_final then v_rec_label end,
     case when p_status = 'Pending Final Decision' or v_final then v_rec_remarks
          when p_status = 'Returned for Correction' then p_remarks end,
     case when v_final then p_remarks end,
     case when v_final then now() - interval '6 hours' end)
  returning id into v_req;

  if p_status = 'Draft' then return; end if;

  insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status, created_at)
  values (v_req, v_s, 'student', 'submit', 'Draft', 'Submitted', now() - interval '2 days');
  insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status,
         remarks, eligibility_snapshot, attendance_pct_snapshot, created_at)
  values (v_req, null, 'system', 'eligibility_check', 'Submitted', 'Under Proctor Review',
          concat_ws('; ', 'Eligibility: ' || e.eligibility, e.reason,
                    case when p_overlap then 'Flag: dates overlap another active request' end),
          e.eligibility, e.attendance_pct, now() - interval '2 days');

  if p_status = 'Under Proctor Review' then return; end if;

  if p_status = 'Withdrawn' then
    insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status, remarks, created_at)
    values (v_req, v_s, 'student', 'withdraw', 'Under Proctor Review', 'Withdrawn', p_remarks, now() - interval '1 day');
    return;
  end if;

  if p_status = 'Returned for Correction' then
    insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status,
           remarks, eligibility_snapshot, attendance_pct_snapshot, created_at)
    values (v_req, v_pr, 'proctor', 'return', 'Under Proctor Review', 'Returned for Correction',
            p_remarks, e.eligibility, e.attendance_pct, now() - interval '1 day');
    return;
  end if;

  insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status,
         remarks, eligibility_snapshot, attendance_pct_snapshot, created_at)
  values (v_req, v_pr, 'proctor', case when p_rec_reject then 'recommend_reject' else 'recommend_approve' end,
          'Under Proctor Review', v_rec_status, v_rec_remarks, e.eligibility, e.attendance_pct,
          now() - interval '1 day');
  insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status, created_at)
  values (v_req, null, 'system', 'route_to_incharge', v_rec_status, 'Pending Final Decision', now() - interval '1 day');

  if p_status = 'Pending Final Decision' then return; end if;

  insert into public.request_history (request_id, actor_id, actor_role, action, from_status, to_status,
         remarks, eligibility_snapshot, attendance_pct_snapshot, created_at)
  values (v_req, v_ic, 'incharge', case when p_override then 'override_approve' else 'final_decision' end,
          'Pending Final Decision', p_status, p_remarks, e.eligibility, e.attendance_pct, now() - interval '6 hours');
end $$;

select pg_temp.seed_request('24AI001','HackVerse 2026','HackVerse Foundation','Hackathon','IIT Hyderabad','Hyderabad',10,1,
  'Approved','Approved. Submit the participation certificate within 7 days of returning.');
select pg_temp.seed_request('24AI003','Applied ML Bootcamp','DataCraft Labs','Workshop','T-Hub','Hyderabad',14,2,
  'Rejected','Attendance 68% is below the 75% threshold.', true);
select pg_temp.seed_request('24AI007','CodeSprint National Finals','CodeSprint India','Technical Competition','Anna University','Chennai',18,1,
  'Approved','Override: national finalist representing the university; HOD approval on file.', false, false, true);
select pg_temp.seed_request('24AI008','Cloud Native Summit','CNCF Community Andhra','Conference','Novotel Varun Beach','Visakhapatnam',20,1,
  'Under Proctor Review');
select pg_temp.seed_request('24AI009','DevOps Day Hyderabad','DevOps India Network','Conference','HICC','Hyderabad',18,1,
  'Pending Final Decision','Good attendance; directly relevant to the cloud elective.');
select pg_temp.seed_request('24AI002','Data Science Conclave','Analytics Society of India','Conference','IIIT Hyderabad','Hyderabad',22,1,
  'Pending Final Decision','Exactly at the 75% threshold, so eligible.');
select pg_temp.seed_request('24AI005','GenAI Product Workshop','Product Guild','Workshop','IIIT Bangalore','Bengaluru',16,1,
  'Under Proctor Review');
select pg_temp.seed_request('24AI001','Open Source Summit','FOSS United','Conference','IISc','Bengaluru',10,2,
  'Under Proctor Review', null, false, true);
select pg_temp.seed_request('24AI004','Smart Cities Hackathon','Urban Tech Forum','Hackathon','KL University','Vijayawada',11,1,
  'Under Proctor Review');
select pg_temp.seed_request('24CS016','Robotics Industrial Visit','Amara Raja Group','Industrial Visit','Plant campus','Tirupati',9,0,
  'Returned for Correction','Please upload the invitation letter from the organiser.');
select pg_temp.seed_request('24CS018','Web3 Builders Meetup','Chain Collective','Other','WeWork Galaxy','Bengaluru',25,0,
  'Draft');
select pg_temp.seed_request('24CS020','Cyber Defence CTF','SecureIndia','Technical Competition','VIT-AP','Amaravati',12,1,
  'Withdrawn','Clashes with the mid-semester exam.');
select pg_temp.seed_request('24CS022','IoT Design Challenge','Embedded Systems Forum','Technical Competition','NIT Warangal','Warangal',15,1,
  'Pending Final Decision','Event clashes with lab internals; recommend rejection.', true);

-- Link any Auth users that already exist to their profiles.
update public.profiles p set user_id = u.id
from auth.users u where lower(u.email) = lower(p.email);
