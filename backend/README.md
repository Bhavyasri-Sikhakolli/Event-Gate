# Event Gate API

The API is a Node.js/Express service. The React app sends its Supabase Auth
access token as a Bearer token; the API verifies it with Supabase Auth, loads
the caller's profile from `profiles`, and forwards the token to Supabase so
database RLS remains active. Workflow transitions use the existing database
functions. The API never uses a service-role key.

## Setup

Use Node.js 20 or later. From `backend/`:

```sh
npm install
cp .env.example .env
npm run dev
```

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the local, ignored `.env` file.
Set `FRONTEND_ORIGIN` to the exact browser origin (default
`http://localhost:5173`). Do not add a service-role key. The API listens on
port `3001` by default.

Run backend tests with `npm test`; run the production server with `npm start`.

## API

All protected routes require `Authorization: Bearer <Supabase access token>`.
The server derives the caller's profile and role from Supabase; request bodies
cannot supply identity, ownership, or status. PostgreSQL RLS remains enabled.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API liveness |
| `GET` | `/api/supabase-health` | Public | Reports whether Supabase env settings are present |
| `GET` | `/api/me` | Authenticated | Current database profile and role |
| `GET` | `/api/requests` | Authenticated | List visible requests; optional `status`, `limit`, and `offset` |
| `POST` | `/api/requests` | Student | Create a draft; student ID is taken from the verified profile |
| `GET` | `/api/requests/:id` | Authenticated | Get a request visible under RLS |
| `PATCH` | `/api/requests/:id` | Student | Edit own draft/returned request fields |
| `GET` | `/api/requests/:id/history` | Authenticated | Read visible request history |
| `POST` | `/api/requests/:id/submit` | Student | Call `submit_request` |
| `POST` | `/api/requests/:id/proctor-review` | Proctor | Call `proctor_review` |
| `POST` | `/api/requests/:id/final-decision` | In-charge | Call `final_decision` |
| `POST` | `/api/requests/:id/withdraw` | Student | Call `withdraw_request` |
| `GET` | `/api/attendance/eligibility` | Authenticated | Read eligibility rows visible under RLS; optional `student_id` |
| `GET` | `/api/attendance/imports` | In-charge | Read the latest 100 import records |
| `GET` | `/api/settings` | Authenticated | Read attendance and override settings |
| `PATCH` | `/api/settings` | In-charge | Update `min_attendance`, `stale_after_days`, or `allow_override` |
| `POST` | `/api/attendance/import/preview` | In-charge | Multipart CSV field `file`; validate and match rows without importing |
| `POST` | `/api/attendance/import/confirm` | In-charge | Multipart CSV field `file`; call `import_attendance` and return its summary |

Request creation/edit payloads use the existing `event_requests` fields:
`title`, `organizer`, `category`, `venue`, `city`, `start_date`, `end_date`,
`event_url`, and `purpose`. Success responses wrap records as `{ "request": ... }`.
Errors use `{ "error": "..." }`, with optional `details` for row validation.
Workflow RPC error messages are not returned raw, to avoid exposing database
internals.

Example workflow payloads:

```json
{ "action": "recommend_approve", "remarks": "Meets the requirements." }
```

```json
{
  "decision": "Approved",
  "remarks": "Attendance verified.",
  "override": false
}
```

`action` may be `recommend_approve`, `recommend_reject`, or `return`.
`decision` may be `Approved`, `Rejected`, or `Returned for Correction`.
Rejection/return remarks are required. Override remarks are also required.
These actions call the matching existing database functions; the database
remains authoritative for assignment, ownership, workflow state, and override
policy.

CSV requires `Roll Number`, `Classes Conducted`, `Classes Attended`, and
`Data As Of` headers. `Attendance Percentage` is optional; if present, it must
be between 0 and 100 and consistent with the counts. Dates may be
`YYYY-MM-DD` or `DD-MM-YYYY`. Files are limited to 5 MiB and 1,000 rows.
Preview returns row statuses and counts. Confirmation re-parses the file and
the database function re-validates every row. An import with no valid rows
returns `activated: false`; the prior active dataset is preserved by the
database function.

For local browser integration, set the Vite API base URL to
`http://localhost:3001` and attach the current Supabase session's `access_token`
to each protected request as a Bearer token. The backend's CORS allowlist is
controlled by `FRONTEND_ORIGIN`.

## Database coordination

The API uses existing `profiles`, `event_requests`, `request_history`,
`student_eligibility`, and `attendance_imports` objects and the existing
`submit_request`, `proctor_review`, `final_decision`, `withdraw_request`, and
`import_attendance` functions. It does not run or modify SQL.

The checkout has no `migrations/` directory, and the provided
`002_import_attendance_percentage_range.sql` attachment is empty. Local
schema snapshots disagree: `01_schema.sql` and `schema_review.txt` do not
show the range guard, while `schema_909c52b.sql` does. None of these files
proves which function is deployed. The live migration status has not been
queried. Verify the deployed `import_attendance(text,jsonb)` definition in the
Supabase SQL Editor; if the 0–100 guard is absent, obtain and review the
database teammate's focused migration, then apply only that migration through
the normal database review process. Do not rerun `01_schema.sql`. Until the
guard is confirmed live, the API blocks confirmation of out-of-range
percentages, but the database RPC must also enforce that rule because
authenticated users can potentially call granted RPCs outside this API.
