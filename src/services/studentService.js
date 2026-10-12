import { supabase } from '../lib/supabase'

// Get currently logged-in user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

// Get student's profile
export async function getStudentProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}

// Get student's eligibility
export async function getStudentEligibility(studentId) {
  const { data, error } = await supabase
    .from('student_eligibility')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (error) {
    throw error
  }

  return data
}

// Get student's requests
export async function getStudentRequests(studentId) {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

// Get request history
export async function getRequestHistory(requestId) {
  const { data, error } = await supabase
    .from('request_history')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

// Create a new draft request
export async function createDraft({
  studentId,
  title,
  organizer,
  category,
  venue,
  city,
  startDate,
  endDate,
  eventUrl,
  purpose,
}) {
  const { data, error } = await supabase
    .from('event_requests')
    .insert({
      student_id: studentId,
      title,
      organizer,
      category,
      venue,
      city,
      start_date: startDate,
      end_date: endDate,
      event_url: eventUrl,
      purpose,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Edit an existing draft or returned request
export async function updateDraft({
  requestId,
  title,
  organizer,
  category,
  venue,
  city,
  startDate,
  endDate,
  eventUrl,
  purpose,
}) {
  const { data, error } = await supabase
    .from('event_requests')
    .update({
      title,
      organizer,
      category,
      venue,
      city,
      start_date: startDate,
      end_date: endDate,
      event_url: eventUrl,
      purpose,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Submit or resubmit a request
export async function submitRequest(requestId) {
  const { data, error } = await supabase.rpc('submit_request', {
    p_request: requestId,
  })

  if (error) {
    throw error
  }

  return data
}

// Withdraw a request
export async function withdrawRequest(requestId, remarks) {
  const { data, error } = await supabase.rpc('withdraw_request', {
    p_request: requestId,
    p_remarks: remarks,
  })

  if (error) {
    throw error
  }

  return data
}

// Upload supporting document
export async function uploadSupportingDocument(userId, file) {
  const path = `${userId}/${file.name}`

  const { error } = await supabase.storage
    .from('event-docs')
    .upload(path, file)

  if (error) {
    throw error
  }

  return path
}

// Save uploaded document path to the request
export async function saveDocumentPath(requestId, documentPath) {
  const { data, error } = await supabase
    .from('event_requests')
    .update({
      document_path: documentPath,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}