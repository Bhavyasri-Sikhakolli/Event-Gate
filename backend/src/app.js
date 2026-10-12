import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(express.json())

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/supabase-health', (_req, res) => {
  const configured = Boolean(url && key)
  res.status(configured ? 200 : 500).json({
    status: configured ? 'ok' : 'error',
    supabaseConfigured: configured,
  })
})

// Authenticate the user's Supabase access token.
async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' })
  }

  if (!url || !key) {
    return res.status(500).json({ error: 'Supabase is not configured' })
  }

  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = data.user
    req.supabase = createClient(url, key, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    next()
  } catch {
    return res.status(500).json({ error: 'Authentication check failed' })
  }
}

app.get('/api/me', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  })
})

// List requests visible to the authenticated user under database RLS.
app.get('/api/requests', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('event_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ requests: data })
})

// Submit a student's draft or returned request.
app.post('/api/requests/:id/submit', authenticate, async (req, res) => {
  const { data, error } = await req.supabase.rpc('submit_request', {
    p_request: req.params.id,
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ request: data })
})

// Proctor: recommend, reject, or return for correction.
app.post(
  '/api/requests/:id/proctor-review',
  authenticate,
  async (req, res) => {
    const { action, remarks } = req.body || {}
    const allowed = ['recommend_approve', 'recommend_reject', 'return']

    if (!allowed.includes(action)) {
      return res.status(400).json({
        error: 'action must be recommend_approve, recommend_reject, or return',
      })
    }

    if (
      ['recommend_reject', 'return'].includes(action) &&
      !String(remarks || '').trim()
    ) {
      return res.status(400).json({
        error: 'Remarks are required for this action',
      })
    }

    const { data, error } = await req.supabase.rpc('proctor_review', {
      p_request: req.params.id,
      p_action: action,
      p_remarks: remarks || null,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ request: data })
  }
)

// In-charge: make the final decision.
app.post(
  '/api/requests/:id/final-decision',
  authenticate,
  async (req, res) => {
    const { decision, remarks, override = false } = req.body || {}
    const allowed = ['Approved', 'Rejected', 'Returned for Correction']

    if (!allowed.includes(decision)) {
      return res.status(400).json({
        error: 'decision must be Approved, Rejected, or Returned for Correction',
      })
    }

    if (
      ['Rejected', 'Returned for Correction'].includes(decision) &&
      !String(remarks || '').trim()
    ) {
      return res.status(400).json({
        error: 'Remarks are required for this decision',
      })
    }

    if (typeof override !== 'boolean') {
      return res.status(400).json({ error: 'override must be true or false' })
    }

    const { data, error } = await req.supabase.rpc('final_decision', {
      p_request: req.params.id,
      p_decision: decision,
      p_remarks: remarks || null,
      p_override: override,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ request: data })
  }
)

// Student: withdraw a request when the database workflow allows it.
app.post('/api/requests/:id/withdraw', authenticate, async (req, res) => {
  const { remarks } = req.body || {}

  const { data, error } = await req.supabase.rpc('withdraw_request', {
    p_request: req.params.id,
    p_remarks: remarks || null,
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ request: data })
})

export default app

