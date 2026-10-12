import express from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import {
  parseAttendanceCsv,
} from './attendanceCsv.js'

const categories = new Set([
  'Hackathon',
  'Workshop',
  'Conference',
  'Technical Competition',
  'Industrial Visit',
  'Other',
])
const statuses = new Set([
  'Draft',
  'Submitted',
  'Under Proctor Review',
  'Returned for Correction',
  'Recommended for Approval',
  'Recommended for Rejection',
  'Pending Final Decision',
  'Approved',
  'Rejected',
  'Withdrawn',
])
const requestFields = new Set([
  'title',
  'organizer',
  'category',
  'venue',
  'city',
  'start_date',
  'end_date',
  'event_url',
  'purpose',
])
const requestStringLimits = {
  title: 200,
  organizer: 200,
  venue: 200,
  city: 120,
  purpose: 5000,
}
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      callback(new Error('Only .csv attendance files are supported'))
      return
    }
    callback(null, true)
  },
})

function errorResponse(response, status, error, details) {
  response.status(status).json({
    error,
    ...(details ? { details } : {}),
  })
}

function hasOnlyFields(body, allowedFields) {
  if (body === undefined) return true
  return (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.keys(body).every((field) => allowedFields.has(field))
  )
}

function databaseError(response, error, fallback) {
  const code = error?.code
  let status = 500
  let message = fallback

  if (code === '42501' || code === 'PGRST301') {
    status = 403
    message = 'You are not allowed to perform this operation.'
  } else if (code === 'PGRST116') {
    status = 404
    message = 'The requested record was not found.'
  } else if (code === '23505' || code?.startsWith('23')) {
    status = 409
    message = 'The request conflicts with existing data.'
  } else if (code?.startsWith('22')) {
    status = 400
    message = 'The request contains invalid data.'
  } else if (code === 'P0001') {
    status = 409
    message = 'The operation is not valid for the current record state.'
  } else {
    console.error('Supabase operation failed', { code: code ?? 'unknown' })
  }

  errorResponse(response, status, message)
}

function validateRequestBody(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' }
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !requestFields.has(field),
  )
  if (unknownFields.length) {
    return { error: 'Request contains unsupported fields.' }
  }
  if (partial && Object.keys(body).length === 0) {
    return { error: 'At least one editable field is required.' }
  }

  const values = {}
  for (const field of requestFields) {
    if (!Object.hasOwn(body, field)) {
      if (!partial && field !== 'event_url') {
        return { error: `${field} is required.` }
      }
      continue
    }

    const value = body[field]
    if (field === 'category') {
      if (!categories.has(value)) {
        return { error: 'category is not a supported event category.' }
      }
      values[field] = value
      continue
    }

    if (field === 'start_date' || field === 'end_date') {
      if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
      ) {
        return { error: `${field} must be a valid YYYY-MM-DD date.` }
      }
      values[field] = value
      continue
    }

    if (field === 'event_url') {
      if (value === null || value === '') {
        values[field] = null
        continue
      }
      if (typeof value !== 'string' || value.length > 2048) {
        return { error: 'event_url must be a valid URL under 2048 characters.' }
      }
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) {
          return { error: 'event_url must use HTTP or HTTPS.' }
        }
      } catch {
        return { error: 'event_url must be a valid URL.' }
      }
      values[field] = value
      continue
    }

    const maxLength = requestStringLimits[field]
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.trim().length > maxLength
    ) {
      return {
        error: `${field} must be a non-empty string of at most ${maxLength} characters.`,
      }
    }
    values[field] = value.trim()
  }

  if (
    values.start_date &&
    values.end_date &&
    values.end_date < values.start_date
  ) {
    return { error: 'end_date cannot be earlier than start_date.' }
  }

  return { values }
}

function safeFileName(originalName) {
  const baseName = originalName.replace(/\\/g, '/').split('/').pop()
  return baseName.slice(0, 255)
}

function buildImportPreview(rows, validationErrors, matchedRolls) {
  const errorsByRow = new Map()
  for (const error of validationErrors) {
    const rowErrors = errorsByRow.get(error.row) ?? []
    rowErrors.push({ field: error.field, error: error.error })
    errorsByRow.set(error.row, rowErrors)
  }

  let validRows = 0
  let invalidRows = 0
  let unmatchedRows = 0
  let duplicateRows = 0

  const previewRows = rows.map((row) => {
    const rowErrors = errorsByRow.get(row.row) ?? []
    const isDuplicate = rowErrors.some((item) => item.error.includes('Duplicate'))
    const hasRollLengthError = rowErrors.some(
      (item) =>
        item.field === 'roll_no' && item.error.includes('cannot exceed'),
    )
    const isUnmatched =
      !isDuplicate &&
      !hasRollLengthError &&
      Boolean(row.roll_no) &&
      !matchedRolls.has(row.roll_no.toUpperCase())

    if (isDuplicate) {
      duplicateRows += 1
    } else if (isUnmatched) {
      unmatchedRows += 1
      rowErrors.push({ field: 'roll_no', error: 'No student with this roll number' })
    } else if (rowErrors.length) {
      invalidRows += 1
    } else {
      validRows += 1
    }

    return {
      ...row,
      status: isDuplicate
        ? 'duplicate'
        : isUnmatched
          ? 'unmatched'
          : rowErrors.length
            ? 'invalid'
            : 'valid',
      errors: rowErrors,
    }
  })

  return {
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
      unmatchedRows,
      duplicateRows,
    },
    rows: previewRows,
  }
}

export function createApp({
  config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    frontendOrigins: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  clientFactory = createClient,
} = {}) {
  const app = express()
  const allowedOrigins = new Set(config.frontendOrigins ?? [])

  app.use((request, response, next) => {
    const origin = request.get('Origin')
    response.vary('Origin')

    if (origin && !allowedOrigins.has(origin)) {
      errorResponse(response, 403, 'This origin is not allowed.')
      return
    }

    if (origin) {
      response.set('Access-Control-Allow-Origin', origin)
      response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      response.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, OPTIONS',
      )
    }

    if (request.method === 'OPTIONS') {
      response.sendStatus(204)
      return
    }
    next()
  })
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.get('/api/supabase-health', (_request, response) => {
    const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey)
    response.status(configured ? 200 : 503).json({
      status: configured ? 'ok' : 'error',
      supabaseConfigured: configured,
    })
  })

  const authenticate = async (request, response, next) => {
    const match = /^Bearer\s+(\S+)$/i.exec(
      request.get('Authorization') ?? '',
    )
    if (!match) {
      errorResponse(response, 401, 'A valid Bearer access token is required.')
      return
    }
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      errorResponse(response, 503, 'Supabase authentication is not configured.')
      return
    }

    try {
      const authClient = clientFactory(
        config.supabaseUrl,
        config.supabaseAnonKey,
      )
      const { data, error } = await authClient.auth.getUser(match[1])
      if (error || !data?.user) {
        errorResponse(response, 401, 'The access token is invalid or expired.')
        return
      }

      const supabase = clientFactory(
        config.supabaseUrl,
        config.supabaseAnonKey,
        { accessToken: async () => match[1] },
      )
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, user_id, email, roll_no, full_name, role, department, year, section, proctor_id',
        )
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (profileError) {
        databaseError(
          response,
          profileError,
          'Unable to load the authenticated user profile.',
        )
        return
      }
      if (
        !profile ||
        !['student', 'proctor', 'incharge'].includes(profile.role)
      ) {
        errorResponse(
          response,
          403,
          'This account does not have an active Event Gate profile.',
        )
        return
      }

      request.user = data.user
      request.profile = profile
      request.supabase = supabase
      next()
    } catch {
      errorResponse(
        response,
        503,
        'The authentication service is temporarily unavailable.',
      )
    }
  }

  const requireRole = (...roles) => (request, response, next) => {
    if (!roles.includes(request.profile.role)) {
      errorResponse(response, 403, 'Your role cannot perform this operation.')
      return
    }
    next()
  }

  const validateRequestId = (request, response, next) => {
    if (!uuidPattern.test(request.params.id)) {
      errorResponse(response, 400, 'Request id must be a UUID.')
      return
    }
    next()
  }

  const uploadCsv = (request, response, next) => {
    upload.single('file')(request, response, (error) => {
      if (error) {
        const status = error instanceof multer.MulterError
          ? error.code === 'LIMIT_FILE_SIZE'
            ? 413
            : 400
          : 400
        errorResponse(response, status, error.message)
        return
      }
      if (!request.file) {
        errorResponse(response, 400, 'Upload a CSV file in the "file" field.')
        return
      }
      next()
    })
  }

  const readCsvFile = (request, response) => {
    let csvText
    try {
      csvText = new TextDecoder('utf-8', { fatal: true }).decode(
        request.file.buffer,
      )
      if (csvText.includes('\0')) {
        throw new Error('CSV file contains invalid text data.')
      }
      return {
        fileName: safeFileName(request.file.originalname),
        ...parseAttendanceCsv(csvText),
      }
    } catch (error) {
      errorResponse(response, 400, error.message)
      return null
    }
  }

  app.get('/api/me', authenticate, (request, response) => {
    response.json({ profile: request.profile })
  })

  app.get('/api/requests', authenticate, async (request, response) => {
    const { status, limit = '100', offset = '0' } = request.query
    const pageSize = Number(limit)
    const start = Number(offset)

    if (
      (status && (typeof status !== 'string' || !statuses.has(status))) ||
      !/^\d+$/.test(String(limit)) ||
      !/^\d+$/.test(String(offset)) ||
      pageSize < 1 ||
      pageSize > 100 ||
      start > 100000
    ) {
      errorResponse(response, 400, 'Invalid request list filters.')
      return
    }

    let query = request.supabase
      .from('event_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(start, start + pageSize - 1)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) {
      databaseError(response, error, 'Unable to retrieve event requests.')
      return
    }
    response.json({ requests: data })
  })

  app.post(
    '/api/requests',
    authenticate,
    requireRole('student'),
    async (request, response) => {
      const result = validateRequestBody(request.body)
      if (result.error) {
        errorResponse(response, 400, result.error)
        return
      }

      const { data, error } = await request.supabase
        .from('event_requests')
        .insert({ ...result.values, student_id: request.profile.id })
        .select('*')
        .single()
      if (error) {
        databaseError(response, error, 'Unable to create the event request.')
        return
      }
      response.status(201).json({ request: data })
    },
  )

  app.get(
    '/api/requests/:id',
    authenticate,
    validateRequestId,
    async (request, response) => {
      const { data, error } = await request.supabase
        .from('event_requests')
        .select('*')
        .eq('id', request.params.id)
        .maybeSingle()
      if (error) {
        databaseError(response, error, 'Unable to retrieve the event request.')
        return
      }
      if (!data) {
        errorResponse(response, 404, 'Event request was not found.')
        return
      }
      response.json({ request: data })
    },
  )

  app.patch(
    '/api/requests/:id',
    authenticate,
    requireRole('student'),
    validateRequestId,
    async (request, response) => {
      const result = validateRequestBody(request.body, true)
      if (result.error) {
        errorResponse(response, 400, result.error)
        return
      }

      const { data: existing, error: lookupError } = await request.supabase
        .from('event_requests')
        .select('student_id, status, start_date, end_date')
        .eq('id', request.params.id)
        .maybeSingle()
      if (lookupError) {
        databaseError(response, lookupError, 'Unable to retrieve the event request.')
        return
      }
      if (!existing || existing.student_id !== request.profile.id) {
        errorResponse(response, 404, 'Event request was not found.')
        return
      }
      if (!['Draft', 'Returned for Correction'].includes(existing.status)) {
        errorResponse(response, 409, 'This event request can no longer be edited.')
        return
      }

      const startDate = result.values.start_date ?? existing.start_date
      const endDate = result.values.end_date ?? existing.end_date
      if (endDate < startDate) {
        errorResponse(response, 400, 'end_date cannot be earlier than start_date.')
        return
      }

      const { data, error } = await request.supabase
        .from('event_requests')
        .update(result.values)
        .eq('id', request.params.id)
        .select('*')
        .single()
      if (error) {
        databaseError(response, error, 'Unable to update the event request.')
        return
      }
      response.json({ request: data })
    },
  )

  app.get(
    '/api/requests/:id/history',
    authenticate,
    validateRequestId,
    async (request, response) => {
      const { data, error } = await request.supabase
        .from('request_history')
        .select('*')
        .eq('request_id', request.params.id)
        .order('created_at', { ascending: true })
      if (error) {
        databaseError(response, error, 'Unable to retrieve request history.')
        return
      }
      response.json({ history: data })
    },
  )

  app.post(
    '/api/requests/:id/submit',
    authenticate,
    requireRole('student'),
    validateRequestId,
    async (request, response) => {
      const { data, error } = await request.supabase.rpc('submit_request', {
        p_request: request.params.id,
      })
      if (error) {
        databaseError(response, error, 'Unable to submit the event request.')
        return
      }
      response.json({ request: data })
    },
  )

  app.post(
    '/api/requests/:id/proctor-review',
    authenticate,
    requireRole('proctor'),
    validateRequestId,
    async (request, response) => {
      if (!hasOnlyFields(request.body, new Set(['action', 'remarks']))) {
        errorResponse(response, 400, 'Provide only action and remarks.')
        return
      }
      const { action, remarks } = request.body ?? {}
      const allowed = ['recommend_approve', 'recommend_reject', 'return']
      if (!allowed.includes(action)) {
        errorResponse(
          response,
          400,
          'action must be recommend_approve, recommend_reject, or return.',
        )
        return
      }
      if (remarks !== undefined && remarks !== null && typeof remarks !== 'string') {
        errorResponse(response, 400, 'remarks must be a string.')
        return
      }
      if (
        ['recommend_reject', 'return'].includes(action) &&
        !remarks?.trim()
      ) {
        errorResponse(response, 400, 'Remarks are required for this action.')
        return
      }
      if (remarks && remarks.length > 2000) {
        errorResponse(response, 400, 'remarks cannot exceed 2000 characters.')
        return
      }

      const { data, error } = await request.supabase.rpc('proctor_review', {
        p_request: request.params.id,
        p_action: action,
        p_remarks: remarks?.trim() || null,
      })
      if (error) {
        databaseError(response, error, 'Unable to submit the proctor review.')
        return
      }
      response.json({ request: data })
    },
  )

  app.post(
    '/api/requests/:id/final-decision',
    authenticate,
    requireRole('incharge'),
    validateRequestId,
    async (request, response) => {
      if (
        !hasOnlyFields(
          request.body,
          new Set(['decision', 'remarks', 'override']),
        )
      ) {
        errorResponse(response, 400, 'Provide only decision, remarks, and override.')
        return
      }
      const { decision, remarks, override = false } = request.body ?? {}
      const allowed = ['Approved', 'Rejected', 'Returned for Correction']
      if (!allowed.includes(decision)) {
        errorResponse(
          response,
          400,
          'decision must be Approved, Rejected, or Returned for Correction.',
        )
        return
      }
      if (remarks !== undefined && remarks !== null && typeof remarks !== 'string') {
        errorResponse(response, 400, 'remarks must be a string.')
        return
      }
      if (
        ['Rejected', 'Returned for Correction'].includes(decision) &&
        !remarks?.trim()
      ) {
        errorResponse(response, 400, 'Remarks are required for this decision.')
        return
      }
      if (remarks && remarks.length > 2000) {
        errorResponse(response, 400, 'remarks cannot exceed 2000 characters.')
        return
      }
      if (typeof override !== 'boolean') {
        errorResponse(response, 400, 'override must be true or false.')
        return
      }
      if (decision !== 'Approved' && override) {
        errorResponse(response, 400, 'override can only be used for approval.')
        return
      }
      if (override && !remarks?.trim()) {
        errorResponse(response, 400, 'Remarks are required when using an override.')
        return
      }

      const { data, error } = await request.supabase.rpc('final_decision', {
        p_request: request.params.id,
        p_decision: decision,
        p_remarks: remarks?.trim() || null,
        p_override: override,
      })
      if (error) {
        databaseError(response, error, 'Unable to record the final decision.')
        return
      }
      response.json({ request: data })
    },
  )

  app.post(
    '/api/requests/:id/withdraw',
    authenticate,
    requireRole('student'),
    validateRequestId,
    async (request, response) => {
      if (!hasOnlyFields(request.body, new Set(['remarks']))) {
        errorResponse(response, 400, 'Only remarks may be provided.')
        return
      }
      const { remarks } = request.body ?? {}
      if (
        remarks !== undefined &&
        remarks !== null &&
        typeof remarks !== 'string'
      ) {
        errorResponse(response, 400, 'remarks must be a string.')
        return
      }
      if (remarks && remarks.length > 2000) {
        errorResponse(response, 400, 'remarks cannot exceed 2000 characters.')
        return
      }
      const { data, error } = await request.supabase.rpc('withdraw_request', {
        p_request: request.params.id,
        p_remarks: remarks?.trim() || null,
      })
      if (error) {
        databaseError(response, error, 'Unable to withdraw the event request.')
        return
      }
      response.json({ request: data })
    },
  )

  app.get('/api/settings', authenticate, async (request, response) => {
    const { data, error } = await request.supabase
      .from('settings')
      .select('id, min_attendance, stale_after_days, allow_override, updated_at')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      databaseError(response, error, 'Unable to retrieve system settings.')
      return
    }
    if (!data) {
      errorResponse(response, 404, 'System settings were not found.')
      return
    }
    response.json({ settings: data })
  })

  app.patch(
    '/api/settings',
    authenticate,
    requireRole('incharge'),
    async (request, response) => {
      const body = request.body
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        errorResponse(response, 400, 'Request body must be a JSON object.')
        return
      }
      const allowedFields = new Set([
        'min_attendance',
        'stale_after_days',
        'allow_override',
      ])
      if (
        Object.keys(body).length === 0 ||
        Object.keys(body).some((field) => !allowedFields.has(field))
      ) {
        errorResponse(response, 400, 'Provide supported settings fields only.')
        return
      }
      if (
        Object.hasOwn(body, 'min_attendance') &&
        (typeof body.min_attendance !== 'number' ||
          !Number.isFinite(body.min_attendance) ||
          body.min_attendance < 0 ||
          body.min_attendance > 100)
      ) {
        errorResponse(response, 400, 'min_attendance must be a number from 0 to 100.')
        return
      }
      if (
        Object.hasOwn(body, 'stale_after_days') &&
        (!Number.isInteger(body.stale_after_days) || body.stale_after_days < 1)
      ) {
        errorResponse(response, 400, 'stale_after_days must be a positive integer.')
        return
      }
      if (
        Object.hasOwn(body, 'allow_override') &&
        typeof body.allow_override !== 'boolean'
      ) {
        errorResponse(response, 400, 'allow_override must be true or false.')
        return
      }

      const { data, error } = await request.supabase
        .from('settings')
        .update(body)
        .eq('id', 1)
        .select('id, min_attendance, stale_after_days, allow_override, updated_at')
        .single()
      if (error) {
        databaseError(response, error, 'Unable to update system settings.')
        return
      }
      response.json({ settings: data })
    },
  )

  app.get(
    '/api/attendance/eligibility',
    authenticate,
    async (request, response) => {
      const studentId = request.query.student_id
      if (studentId && (typeof studentId !== 'string' || !uuidPattern.test(studentId))) {
        errorResponse(response, 400, 'student_id must be a UUID.')
        return
      }
      if (
        studentId &&
        request.profile.role === 'student' &&
        studentId !== request.profile.id
      ) {
        errorResponse(response, 403, 'Students may only view their own eligibility.')
        return
      }

      let query = request.supabase
        .from('student_eligibility')
        .select('*')
        .limit(1000)
      if (studentId) query = query.eq('student_id', studentId)
      const { data, error } = await query
      if (error) {
        databaseError(response, error, 'Unable to retrieve attendance eligibility.')
        return
      }
      response.json({ eligibility: data })
    },
  )

  app.get(
    '/api/attendance/imports',
    authenticate,
    requireRole('incharge'),
    async (request, response) => {
      const { data, error } = await request.supabase
        .from('attendance_imports')
        .select(
          'id, file_name, uploaded_at, total_rows, valid_rows, invalid_rows, unmatched_rows, duplicate_rows, is_active, errors',
        )
        .order('uploaded_at', { ascending: false })
        .limit(100)
      if (error) {
        databaseError(response, error, 'Unable to retrieve attendance imports.')
        return
      }
      response.json({ imports: data })
    },
  )

  app.post(
    '/api/attendance/import/preview',
    authenticate,
    requireRole('incharge'),
    uploadCsv,
    async (request, response) => {
      const parsed = readCsvFile(request, response)
      if (!parsed) return

      const rollNumbers = [
        ...new Set(
          parsed.rows
            .map((row) => row.roll_no.toUpperCase())
            .filter((rollNumber) => rollNumber.length > 0 && rollNumber.length <= 100),
        ),
      ]
      let matchedRolls = new Set()
      if (rollNumbers.length) {
        for (let index = 0; index < rollNumbers.length; index += 50) {
          const batch = rollNumbers.slice(index, index + 50)
          const { data, error } = await request.supabase
            .from('profiles')
            .select('roll_no')
            .eq('role', 'student')
            .in('roll_no', batch)
          if (error) {
            databaseError(
              response,
              error,
              'Unable to match attendance rows to students.',
            )
            return
          }
          matchedRolls = new Set([
            ...matchedRolls,
            ...data.map((profile) => profile.roll_no.toUpperCase()),
          ])
        }
      }

      response.json({
        fileName: parsed.fileName,
        ...buildImportPreview(parsed.rows, parsed.errors, matchedRolls),
      })
    },
  )

  app.post(
    '/api/attendance/import/confirm',
    authenticate,
    requireRole('incharge'),
    uploadCsv,
    async (request, response) => {
      const parsed = readCsvFile(request, response)
      if (!parsed) return

      const percentageRangeErrors = parsed.errors.filter(
        (error) => error.field === 'attendance_pct' && error.code === 'range',
      )
      if (percentageRangeErrors.length) {
        errorResponse(
          response,
          422,
          'Attendance Percentage values must be between 0 and 100; no rows were imported.',
          { rows: percentageRangeErrors },
        )
        return
      }

      const { data, error } = await request.supabase.rpc('import_attendance', {
        p_file_name: parsed.fileName,
        p_rows: parsed.rows.map(
          ({ roll_no, classes_conducted, classes_attended, attendance_pct, data_as_of }) => ({
            roll_no,
            classes_conducted,
            classes_attended,
            attendance_pct,
            data_as_of,
          }),
        ),
      })
      if (error) {
        databaseError(response, error, 'Unable to import attendance.')
        return
      }
      if (!data || typeof data.activated !== 'boolean') {
        errorResponse(response, 502, 'The attendance import returned an invalid response.')
        return
      }
      response.json({ import: data, activated: data.activated })
    },
  )

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.too.large') {
      errorResponse(response, 413, 'Request body is too large.')
      return
    }
    if (error?.type === 'entity.parse.failed') {
      errorResponse(response, 400, 'Request body must contain valid JSON.')
      return
    }
    console.error('Unhandled API error', { name: error?.name ?? 'Error' })
    errorResponse(response, 500, 'An unexpected server error occurred.')
  })

  return app
}

const app = createApp()
export default app
