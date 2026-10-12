import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createApp } from '../src/app.js'

const authUser = {
  id: 'auth-user-id',
  email: 'user@example.test',
}
const studentProfile = {
  id: 'profile-student-id',
  user_id: authUser.id,
  email: authUser.email,
  roll_no: '24CS001',
  full_name: 'Test Student',
  role: 'student',
  department: 'CSE',
  year: 'II',
  section: 'A',
  proctor_id: null,
}

function createTestApp({
  profile = studentProfile,
  invalidToken = false,
  queryData = {},
  requestData = { id: 'request-id' },
  rpcData = { id: 'request-id' },
} = {}) {
  const calls = []
  const config = {
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    frontendOrigins: ['http://localhost:5173'],
  }

  const clientFactory = (_url, _key, options) => {
    if (!options) {
      return {
        auth: {
          getUser: async () =>
            invalidToken
              ? { data: { user: null }, error: new Error('invalid') }
              : { data: { user: authUser }, error: null },
        },
      }
    }

    return {
      from(table) {
        let operation = 'select'
        let payload
        const builder = {
          select() {
            return builder
          },
          eq(field, value) {
            calls.push({ type: 'filter', table, field, value })
            return builder
          },
          in(field, values) {
            calls.push({ type: 'in', table, field, values })
            return builder
          },
          order() {
            return builder
          },
          range() {
            return builder
          },
          limit() {
            return builder
          },
          insert(value) {
            operation = 'insert'
            payload = value
            calls.push({ type: operation, table, payload })
            return builder
          },
          update(value) {
            operation = 'update'
            payload = value
            calls.push({ type: operation, table, payload })
            return builder
          },
          async maybeSingle() {
            if (table === 'profiles') return { data: profile, error: null }
            return { data: queryData[table]?.single ?? null, error: null }
          },
          async single() {
            return { data: requestData, error: null }
          },
          then(resolve, reject) {
            return Promise.resolve({
              data: queryData[table]?.rows ?? [],
              error: null,
            }).then(resolve, reject)
          },
        }
        return builder
      },
      async rpc(name, args) {
        calls.push({ type: 'rpc', name, args })
        return { data: rpcData, error: null }
      },
    }
  }

  return {
    app: createApp({ config, clientFactory }),
    calls,
  }
}

async function request(app, path, options = {}) {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const { port } = server.address()
    const { token, body, headers = {}, ...fetchOptions } = options
    const requestHeaders = {
      Connection: 'close',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    }
    let requestBody = body
    if (body instanceof FormData) {
      requestBody = body
    } else if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }

    return await fetch(`http://127.0.0.1:${port}${path}`, {
      ...fetchOptions,
      headers: requestHeaders,
      body: requestBody,
    })
  } finally {
    server.close()
    await once(server, 'close')
  }
}

test('protected routes reject a missing Bearer token', async () => {
  const { app } = createTestApp()
  const response = await request(app, '/api/me')

  assert.equal(response.status, 401)
  assert.match((await response.json()).error, /Bearer access token/)
})

test('protected routes reject an invalid Supabase token', async () => {
  const { app } = createTestApp({ invalidToken: true })
  const response = await request(app, '/api/me', { token: 'invalid' })

  assert.equal(response.status, 401)
  assert.match((await response.json()).error, /invalid or expired/)
})

test('GET /api/me returns the database role, not a client-supplied role', async () => {
  const { app } = createTestApp()
  const response = await request(app, '/api/me', { token: 'verified-token' })

  assert.equal(response.status, 200)
  assert.equal((await response.json()).profile.role, 'student')
})

test('role checks prevent students from making final decisions', async () => {
  const { app, calls } = createTestApp()
  const response = await request(app, '/api/requests/not-used/final-decision', {
    method: 'POST',
    token: 'verified-token',
    body: { decision: 'Approved', role: 'incharge' },
  })

  assert.equal(response.status, 403)
  assert.equal(calls.some((call) => call.type === 'rpc'), false)
})

test('request creation derives the student profile id and rejects ownership fields', async () => {
  const { app, calls } = createTestApp()
  const invalidResponse = await request(app, '/api/requests', {
    method: 'POST',
    token: 'verified-token',
    body: { student_id: 'attacker-id' },
  })
  assert.equal(invalidResponse.status, 400)

  const response = await request(app, '/api/requests', {
    method: 'POST',
    token: 'verified-token',
    body: {
      title: 'Engineering Challenge',
      organizer: 'University',
      category: 'Hackathon',
      venue: 'Campus',
      city: 'Chennai',
      start_date: '2026-10-20',
      end_date: '2026-10-21',
      event_url: '',
      purpose: 'Build a technical prototype.',
    },
  })

  assert.equal(response.status, 201)
  const insert = calls.find((call) => call.type === 'insert')
  assert.equal(insert.payload.student_id, studentProfile.id)
  assert.equal(Object.hasOwn(insert.payload, 'status'), false)
})

test('invalid request IDs are rejected before workflow RPCs', async () => {
  const { app, calls } = createTestApp()
  const response = await request(app, '/api/requests/not-a-uuid/submit', {
    method: 'POST',
    token: 'verified-token',
    body: {},
  })

  assert.equal(response.status, 400)
  assert.equal(calls.some((call) => call.type === 'rpc'), false)
})

test('proctor review validates the action and calls the existing RPC', async () => {
  const proctor = { ...studentProfile, id: 'profile-proctor-id', role: 'proctor' }
  const { app, calls } = createTestApp({ profile: proctor })
  const response = await request(
    app,
    '/api/requests/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/proctor-review',
    {
      method: 'POST',
      token: 'verified-token',
      body: { action: 'recommend_approve' },
    },
  )

  assert.equal(response.status, 200)
  assert.deepEqual(calls.find((call) => call.type === 'rpc'), {
    type: 'rpc',
    name: 'proctor_review',
    args: {
      p_request: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      p_action: 'recommend_approve',
      p_remarks: null,
    },
  })
})

test('in-charge decisions use the database role and existing final_decision RPC', async () => {
  const incharge = { ...studentProfile, id: 'profile-incharge-id', role: 'incharge' }
  const { app, calls } = createTestApp({
    profile: incharge,
    rpcData: { status: 'Approved' },
  })
  const response = await request(
    app,
    '/api/requests/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/final-decision',
    {
      method: 'POST',
      token: 'verified-token',
      body: {
        decision: 'Approved',
        remarks: 'Attendance verified.',
        override: false,
      },
    },
  )

  assert.equal(response.status, 200)
  assert.deepEqual(calls.find((call) => call.type === 'rpc'), {
    type: 'rpc',
    name: 'final_decision',
    args: {
      p_request: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      p_decision: 'Approved',
      p_remarks: 'Attendance verified.',
      p_override: false,
    },
  })
})

test('settings updates are limited to in-charge and validated fields', async () => {
  const { app: studentApp, calls: studentCalls } = createTestApp()
  const forbidden = await request(studentApp, '/api/settings', {
    method: 'PATCH',
    token: 'verified-token',
    body: { min_attendance: 80 },
  })
  assert.equal(forbidden.status, 403)
  assert.equal(studentCalls.some((call) => call.type === 'update'), false)

  const incharge = { ...studentProfile, id: 'profile-incharge-id', role: 'incharge' }
  const { app: inchargeApp, calls } = createTestApp({ profile: incharge })
  const invalid = await request(inchargeApp, '/api/settings', {
    method: 'PATCH',
    token: 'verified-token',
    body: { min_attendance: 101 },
  })
  assert.equal(invalid.status, 400)
  assert.equal(calls.some((call) => call.type === 'update'), false)
})

test('attendance confirmation blocks out-of-range percentages without calling the import RPC', async () => {
  const incharge = { ...studentProfile, id: 'profile-incharge-id', role: 'incharge' }
  const { app, calls } = createTestApp({ profile: incharge })
  const form = new FormData()
  form.append(
    'file',
    new Blob(
      [
        'Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of\n' +
          '24CS001,0,0,101%,2026-10-10',
      ],
      { type: 'text/csv' },
    ),
    'attendance.csv',
  )
  const response = await request(
    app,
    '/api/attendance/import/confirm',
    {
      method: 'POST',
      token: 'verified-token',
      body: form,
    },
  )

  assert.equal(response.status, 422)
  assert.match((await response.json()).error, /no rows were imported/)
  assert.equal(calls.some((call) => call.type === 'rpc'), false)
})

test('attendance preview reports valid, unmatched, duplicate, and invalid rows', async () => {
  const incharge = { ...studentProfile, id: 'profile-incharge-id', role: 'incharge' }
  const { app } = createTestApp({
    profile: incharge,
    queryData: {
      profiles: {
        rows: [{ roll_no: '24CS001' }, { roll_no: '24CS002' }],
      },
    },
  })
  const form = new FormData()
  form.append(
    'file',
    new Blob(
      [
        'Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of\n' +
          '24CS001,100,80,80%,2026-10-10\n' +
          '99XX001,100,90,90%,2026-10-10\n' +
          '24cs001,100,70,70%,2026-10-10\n' +
          '24CS002,100,110,110%,2026-10-10',
      ],
      { type: 'text/csv' },
    ),
    'attendance.csv',
  )
  const response = await request(app, '/api/attendance/import/preview', {
    method: 'POST',
    token: 'verified-token',
    body: form,
  })

  assert.equal(response.status, 200)
  const preview = await response.json()
  assert.deepEqual(preview.summary, {
    totalRows: 4,
    validRows: 1,
    invalidRows: 1,
    unmatchedRows: 1,
    duplicateRows: 1,
  })
  assert.deepEqual(
    preview.rows.map((row) => row.status),
    ['valid', 'unmatched', 'duplicate', 'invalid'],
  )
})

test('attendance confirmation reports inactive imports without calling them successful', async () => {
  const incharge = { ...studentProfile, id: 'profile-incharge-id', role: 'incharge' }
  const { app, calls } = createTestApp({
    profile: incharge,
    rpcData: { import_id: 'import-id', activated: false, valid: 0, errors: [] },
  })
  const form = new FormData()
  form.append(
    'file',
    new Blob(
      [
        'Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of\n' +
          '24CS001,100,85,85%,2026-10-10',
      ],
      { type: 'text/csv' },
    ),
    'attendance.csv',
  )
  const response = await request(
    app,
    '/api/attendance/import/confirm',
    {
      method: 'POST',
      token: 'verified-token',
      body: form,
    },
  )

  assert.equal(response.status, 200)
  assert.equal((await response.json()).activated, false)
  assert.equal(calls.find((call) => call.type === 'rpc').name, 'import_attendance')
})
