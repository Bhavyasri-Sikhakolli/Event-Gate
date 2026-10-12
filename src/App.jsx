import { useState } from 'react'
import './App.css'
import './SignIn.css'
import ProctorDashboard from './ProctorDashboard'
import HODDashboard from './HODDashboard'

const initialRequests = [
  {
    id: 'EG-2026-001',
    event: 'Tech Innovation Summit 2026',
    organizer: 'Department of Computer Science',
    category: 'Conference',
    venue: 'Main Auditorium',
    city: 'Hyderabad',
    startDate: '2026-10-18',
    endDate: '2026-10-18',
    purpose: 'To learn about current developments in technology and innovation.',
    status: 'Approved',
  },
  {
    id: 'EG-2026-002',
    event: 'AI & Machine Learning Workshop',
    organizer: 'AI Research Club',
    category: 'Workshop',
    venue: 'Lab Block',
    city: 'Hyderabad',
    startDate: '2026-10-22',
    endDate: '2026-10-22',
    purpose: 'To gain practical knowledge of AI and machine learning.',
    status: 'Pending Review',
  },
  {
    id: 'EG-2026-003',
    event: 'National Hackathon',
    organizer: 'Innovation Hub',
    category: 'Hackathon',
    venue: 'Innovation Hub',
    city: 'Bengaluru',
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    purpose: 'To participate in a technical competition and develop problem-solving skills.',
    status: 'Approved',
  },
  {
    id: 'EG-2026-004',
    event: 'Pixel to Product',
    organizer: 'Innovation Club',
    category: 'Technical Competition',
    venue: 'Innovation Centre',
    city: 'Hyderabad',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    purpose: 'To participate in a technical event and gain practical experience.',
    status: 'Under Proctor Review',
  },
]

const upcomingEvents = [
  { event: 'Tech Innovation Summit 2026', organizer: 'Department of Computer Science', category: 'Conference', venue: 'Main Auditorium', city: 'Hyderabad', startDate: '2026-10-18', endDate: '2026-10-18', day: '18', month: 'OCT' },
  { event: 'AI & Machine Learning Workshop', organizer: 'AI Research Club', category: 'Workshop', venue: 'Lab Block', city: 'Hyderabad', startDate: '2026-10-22', endDate: '2026-10-22', day: '22', month: 'OCT' },
  { event: 'National Hackathon', organizer: 'Innovation Hub', category: 'Hackathon', venue: 'Innovation Hub', city: 'Bengaluru', startDate: '2026-11-02', endDate: '2026-11-03', day: '02', month: 'NOV' },
  { event: 'AI Innovation Challenge', organizer: 'AI Student Community', category: 'Technical Competition', venue: 'Innovation Lab', city: 'Hyderabad', startDate: '2026-11-12', endDate: '2026-11-13', day: '12', month: 'NOV' },
]

const emptyForm = {
  event: '', organizer: '', category: '', venue: '', city: '',
  startDate: '', endDate: '', eventUrl: '', purpose: '', supportingDocument: null,
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'proctor', label: 'Proctor' },
  { value: 'hod', label: 'Head of Department (HOD)' },
  { value: 'event-in-charge', label: 'Technical Event In-Charge' },
]

function SignInPage({ onSignIn }) {
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      alert('Please enter your email and password.')
      return
    }
    onSignIn(role, email.trim())
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-brand">
          <div className="signin-logo">EG</div>
          <p className="signin-eyebrow">COLLEGE EVENT MANAGEMENT</p>
          <h1>Event Gate</h1>
          <p className="signin-subtitle">One portal. Clear approvals. Confident participation.</p>
        </div>

        <div className="signin-divider" />

        <form className="signin-form" onSubmit={handleSubmit}>
          <div>
            <h2>Welcome back</h2>
            <p className="signin-description">Sign in to continue to your dashboard.</p>
          </div>

          <label htmlFor="signin-role">Sign in as</label>
          <select id="signin-role" value={role} onChange={(event) => setRole(event.target.value)}>
            {roleOptions.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>

          <label htmlFor="signin-email">Email address</label>
          <input
            id="signin-email"
            type="email"
            autoComplete="username"
            placeholder="you@college.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="signin-password">Password</label>
          <div className="signin-password-wrap">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="button" className="signin-show-password" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className="signin-submit" type="submit">Sign In <span>→</span></button>
          <p className="signin-demo-note">
            Frontend demo: any non-empty email and password will work. Real authentication will be connected through Supabase later.
          </p>
        </form>
        <p className="signin-footer">Event Gate · Academic Year 2026–2027</p>
      </div>
    </div>
  )
}

function EventInChargePlaceholder({ onBackToStudent, onSignOut }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><h2>Event Gate</h2><p>Event Participation Portal</p></div>
        <nav><a className="active" href="#" onClick={(event) => event.preventDefault()}>Dashboard</a></nav>
        <div className="sidebar-bottom"><p>Technical Event In-Charge</p><span>Final approval authority</span></div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><p className="welcome">Approval workspace</p><h1>Technical Event In-Charge</h1></div>
          <div className="student-info">
            <button className="secondary-btn" onClick={onBackToStudent}>Student Demo</button>
            <button className="secondary-btn" onClick={onSignOut}>Sign Out</button>
          </div>
        </header>
        <section className="card full-page-card">
          <div className="card-header"><div><h2>Final Approval & Reports</h2><p>This dashboard is the next page we are building.</p></div></div>
          <p>It will include requests approved by the HOD, final approve/reject actions, and Excel/PDF export for approved participation records.</p>
          <p>The HOD will also receive an attendance list for approval and sign-off, including the recorded date and time.</p>
          <button className="primary-btn" onClick={onBackToStudent}>Return to Student Demo</button>
        </section>
      </main>
    </div>
  )
}

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [signedInEmail, setSignedInEmail] = useState('')
  const [dashboardMode, setDashboardMode] = useState('student')
  const [activePage, setActivePage] = useState('Dashboard')
  const [showRequest, setShowRequest] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [requests, setRequests] = useState(initialRequests)
  const [formData, setFormData] = useState(emptyForm)

  const signIn = (role, email) => {
    setSignedInEmail(email)
    setDashboardMode(role)
    setActivePage('Dashboard')
    setIsSignedIn(true)
  }

  const signOut = () => {
    setIsSignedIn(false)
    setSignedInEmail('')
    setDashboardMode('student')
    setActivePage('Dashboard')
    setShowRequest(false)
  }

  if (!isSignedIn) {
    return <SignInPage onSignIn={signIn} />
  }

  if (dashboardMode === 'proctor') {
    return (
      <ProctorDashboard
        onBackToStudent={() => { setDashboardMode('student'); setActivePage('Dashboard') }}
      />
    )
  }

  if (dashboardMode === 'hod') {
    return (
      <HODDashboard
        onBackToStudent={() => { setDashboardMode('student'); setActivePage('Dashboard') }}
      />
    )
  }

  if (dashboardMode === 'event-in-charge') {
    return (
      <EventInChargePlaceholder
        onBackToStudent={() => { setDashboardMode('student'); setActivePage('Dashboard') }}
        onSignOut={signOut}
      />
    )
  }

  const approvedCount = requests.filter((request) => request.status === 'Approved').length
  const pendingCount = requests.filter((request) =>
    ['Pending Review', 'Under Proctor Review', 'Pending HOD Review', 'Pending Final Decision'].includes(request.status)
  ).length

  const handleChange = (event) => {
    const { name, value, files } = event.target
    setFormData((current) => ({ ...current, [name]: files ? files[0] : value }))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setSelectedEvent(null)
  }

  const openBlankRequest = () => {
    resetForm()
    setShowRequest(true)
  }

  const openEventRequest = (event) => {
    setSelectedEvent(event)
    setFormData({
      event: event.event,
      organizer: event.organizer,
      category: event.category,
      venue: event.venue,
      city: event.city,
      startDate: event.startDate,
      endDate: event.endDate,
      eventUrl: '',
      purpose: '',
      supportingDocument: null,
    })
    setShowRequest(true)
  }

  const closeRequest = () => {
    setShowRequest(false)
    resetForm()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (formData.endDate < formData.startDate) {
      alert('End date cannot be before start date.')
      return
    }
    const nextNumber = Math.max(0, ...requests.map((request) => Number(request.id.split('-').at(-1)) || 0)) + 1
    const newRequest = {
      id: `EG-2026-${String(nextNumber).padStart(3, '0')}`,
      event: formData.event,
      organizer: formData.organizer,
      category: formData.category,
      venue: formData.venue,
      city: formData.city,
      startDate: formData.startDate,
      endDate: formData.endDate,
      purpose: formData.purpose,
      status: 'Under Proctor Review',
      submittedOn: new Date().toLocaleDateString(),
    }
    setRequests((current) => [newRequest, ...current])
    closeRequest()
    setActivePage('My Requests')
  }

  const statusClass = (status) => {
    if (status === 'Approved') return 'approved'
    if (status === 'Rejected' || status === 'Recommended for Rejection') return 'rejected'
    return 'pending'
  }

  const renderRequestItems = () => (
    <div className="request-list">
      {requests.map((request) => (
        <div className="request" key={request.id}>
          <div className="request-main">
            <div>
              <span className="request-id">{request.id}</span>
              <h3>{request.event}</h3>
              <p>{request.organizer} · {request.category}</p>
              <p>{request.venue}, {request.city}</p>
              {request.proctorRemark && <p><strong>Review remark:</strong> {request.proctorRemark}</p>}
            </div>
            <span className={`status ${statusClass(request.status)}`}>{request.status}</span>
          </div>
          <div className="request-date">{request.startDate} → {request.endDate}</div>
        </div>
      ))}
    </div>
  )

  const renderRequestList = () => (
    <section className="card requests-card full-page-card">
      <div className="card-header">
        <div><h2>My Event Requests</h2><p>View and track all your submitted event participation requests.</p></div>
        <button className="primary-btn" onClick={openBlankRequest}>+ Submit Request</button>
      </div>
      {renderRequestItems()}
    </section>
  )

  const renderUpcomingEvents = () => (
    <section className="card upcoming-card full-page-card">
      <div className="card-header"><div><h2>Upcoming Events</h2><p>Explore upcoming technical events and submit a participation request.</p></div></div>
      <div className="upcoming-events-page">
        {upcomingEvents.map((event) => (
          <button key={event.event} className="upcoming-event" onClick={() => openEventRequest(event)}>
            <div className="event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
            <div><h3>{event.event}</h3><p>{event.organizer}</p><p>{event.venue}, {event.city}</p></div>
            <span className="event-action">Request →</span>
          </button>
        ))}
      </div>
    </section>
  )

  const renderProfile = () => (
    <section className="profile-page">
      <div className="card profile-header-card">
        <div className="profile-avatar">BS</div>
        <div><h2>Bhavyasri</h2><p>Student · Department of Artificial Intelligence</p></div>
      </div>
      <div className="profile-grid">
        <div className="card profile-card">
          <div className="card-header"><div><h2>Personal Information</h2><p>Your student profile details.</p></div></div>
          <div className="profile-details">
            <div className="profile-field"><span>Full Name</span><strong>Bhavyasri</strong></div>
            <div className="profile-field"><span>Role</span><strong>Student</strong></div>
            <div className="profile-field"><span>Roll Number</span><strong>Example</strong></div>
            <div className="profile-field"><span>Email</span><strong>{signedInEmail || 'Example'}</strong></div>
            <div className="profile-field"><span>Phone</span><strong>Example</strong></div>
          </div>
        </div>
        <div className="card profile-card">
          <div className="card-header"><div><h2>Academic Information</h2><p>Current academic details.</p></div></div>
          <div className="profile-details">
            <div className="profile-field"><span>Department</span><strong>Artificial Intelligence (AI)</strong></div>
            <div className="profile-field"><span>Year</span><strong>2nd Year</strong></div>
            <div className="profile-field"><span>Section</span><strong>AI&ML-B</strong></div>
            <div className="profile-field"><span>Academic Year</span><strong>2026 - 2027</strong></div>
          </div>
        </div>
      </div>
      <div className="card profile-card">
        <div className="card-header"><div><h2>Attendance & Eligibility</h2><p>Example attendance details for the demo.</p></div></div>
        <div className="profile-stats">
          <div className="profile-stat"><span>Attendance</span><strong>82%</strong></div>
          <div className="profile-stat"><span>Required Threshold</span><strong>75%</strong></div>
          <div className="profile-stat"><span>Eligibility</span><strong className="eligible-text">Eligible</strong></div>
        </div>
      </div>
    </section>
  )

  const renderDashboard = () => (
    <>
      <section className="stats-grid">
        <div className="stat-card"><span className="stat-label">Total Requests</span><strong>{requests.length}</strong><small>All submitted requests</small></div>
        <div className="stat-card"><span className="stat-label">Pending</span><strong>{pendingCount}</strong><small>Awaiting review</small></div>
        <div className="stat-card"><span className="stat-label">Approved</span><strong>{approvedCount}</strong><small>Ready to participate</small></div>
        <div className="stat-card"><span className="stat-label">Attendance</span><strong>82%</strong><small>Eligible · Threshold 75%</small></div>
      </section>
      <section className="dashboard-grid">
        <div className="card requests-card">
          <div className="card-header"><div><h2>My Event Requests</h2><p>Track the status of your event participation requests.</p></div><button className="primary-btn" onClick={openBlankRequest}>+ Submit Request</button></div>
          {renderRequestItems()}
        </div>
        <div className="card upcoming-card">
          <div className="card-header"><div><h2>Upcoming Events</h2><p>Click an event to start your participation request.</p></div></div>
          {upcomingEvents.map((event) => (
            <button key={event.event} className="upcoming-event" onClick={() => openEventRequest(event)}>
              <div className="event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
              <div><h3>{event.event}</h3><p>{event.venue}</p></div>
            </button>
          ))}
        </div>
      </section>
    </>
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><h2>Event Gate</h2><p>Event Participation Portal</p></div>
        <nav>
          {['Dashboard', 'My Requests', 'Upcoming Events', 'Profile'].map((page) => (
            <a key={page} href="#" className={activePage === page ? 'active' : ''} onClick={(event) => { event.preventDefault(); setActivePage(page) }}>{page}</a>
          ))}
        </nav>
        <div className="sidebar-bottom"><p>Student Portal</p><span>Academic Year 2026</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="welcome">{activePage === 'Dashboard' ? 'Welcome back 👋' : 'Student Portal'}</p>
            <h1>{activePage}</h1>
          </div>
          <div className="student-info">
            {activePage === 'Dashboard' && (
              <div className="demo-dashboard-buttons">
                <button className="primary-btn" onClick={() => setDashboardMode('proctor')}>Open Proctor Demo →</button>
                <button className="primary-btn" onClick={() => setDashboardMode('hod')}>Open HOD Demo →</button>
                <button className="primary-btn" onClick={() => setDashboardMode('event-in-charge')}>Open Event In-Charge →</button>
              </div>
            )}
            <div className="avatar">BS</div>
            <div><strong>Bhavyasri</strong><span>Student</span></div>
            <button className="secondary-btn" onClick={signOut}>Sign Out</button>
          </div>
        </header>

        {activePage === 'Dashboard' && renderDashboard()}
        {activePage === 'My Requests' && renderRequestList()}
        {activePage === 'Upcoming Events' && renderUpcomingEvents()}
        {activePage === 'Profile' && renderProfile()}

        {showRequest && (
          <div className="modal-overlay" onClick={closeRequest}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div><h2>Event Participation Request</h2><p>{selectedEvent ? 'Review the event details and provide your participation purpose.' : 'Provide the event details to submit your request.'}</p></div>
                <button className="close-btn" onClick={closeRequest} aria-label="Close">×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Event Details</h3>
                  {selectedEvent && <div className="form-info"><strong>Event selected</strong><p>You selected <b>{selectedEvent.event}</b> from Upcoming Events. The event information is already filled in for you.</p></div>}
                  <div className="form-grid">
                    <div className="form-group full-width"><label>Event Title *</label><input name="event" value={formData.event} onChange={handleChange} placeholder="Enter event name" readOnly={!!selectedEvent} required /></div>
                    <div className="form-group"><label>Organizer *</label><input name="organizer" value={formData.organizer} onChange={handleChange} placeholder="Enter organizer name" readOnly={!!selectedEvent} required /></div>
                    <div className="form-group"><label>Event Category *</label><select name="category" value={formData.category} onChange={handleChange} disabled={!!selectedEvent} required><option value="">Select category</option><option>Hackathon</option><option>Workshop</option><option>Conference</option><option>Technical Competition</option><option>Industrial Visit</option><option>Other</option></select></div>
                    <div className="form-group"><label>Venue *</label><input name="venue" value={formData.venue} onChange={handleChange} placeholder="Enter venue" readOnly={!!selectedEvent} required /></div>
                    <div className="form-group"><label>City *</label><input name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" readOnly={!!selectedEvent} required /></div>
                    <div className="form-group"><label>Start Date *</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} readOnly={!!selectedEvent} required /></div>
                    <div className="form-group"><label>End Date *</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} readOnly={!!selectedEvent} required /></div>
                    <div className="form-group full-width"><label>Event URL</label><input type="url" name="eventUrl" value={formData.eventUrl} onChange={handleChange} placeholder="https://example.com/event" readOnly={!!selectedEvent} /></div>
                  </div>
                </div>
                <div className="form-section"><h3>Participation Details</h3><div className="form-group"><label>Purpose / Academic or Technical Benefit *</label><textarea name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Explain why you want to attend this event and how it will benefit your academic or technical development." rows="5" required /></div></div>
                <div className="form-section"><h3>Supporting Document</h3><div className="form-group"><label>Upload Supporting Document</label><input type="file" name="supportingDocument" onChange={handleChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /><small className="field-help">Optional. Accepted formats: PDF, DOC, DOCX, JPG, PNG.</small></div></div>
                <div className="form-info"><strong>Before submitting</strong><p>Your request will first be reviewed by your assigned Proctor. If the Proctor recommends you for participation, the request will move to the HOD and then to the Technical Event In-Charge for final approval.</p></div>
                <div className="modal-actions"><button type="button" className="secondary-btn" onClick={closeRequest}>Cancel</button><button type="submit" className="primary-btn">Submit Request</button></div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App