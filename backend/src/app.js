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

app.get('/api/me', async (req, res) => {
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

    return res.json({
      id: data.user.id,
      email: data.user.email,
    })
  } catch {
    return res.status(500).json({ error: 'Authentication check failed' })
  }
})

export default app