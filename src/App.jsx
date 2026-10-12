import { useState } from 'react'
import './App.css'
import './SignIn.css'
import { supabase } from './lib/supabase'
import ProctorDashboard from './ProctorDashboard'
import HODDashboard from './HODDashboard'
import EventInChargeDashboard from './EventInChargeDashboard'

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
    purpose:
      'To participate in a technical competition and develop problem-solving skills.',
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
    purpose:
      'To participate in a technical event and gain practical experience.',
    status: 'Under Proctor Review',
  },
]

const upcomingEvents = [
  {
    event: 'Tech Innovation Summit 2026',
    organizer: 'Department of Computer Science',
    category: 'Conference',
    venue: 'Main Auditorium',
    city: 'Hyderabad',
    startDate: '2026-10-18',
    endDate: '2026-10-18',
    day: '18',
    month: 'OCT',
  },
  {
    event: 'AI & Machine Learning Workshop',
    organizer: 'AI Research Club',
    category: 'Workshop',
    venue: 'Lab Block',
    city: 'Hyderabad',
    startDate: '2026-10-22',
    endDate: '2026-10-22',
    day: '22',
    month: 'OCT',
  },
  {
    event: 'National Hackathon',
    organizer: 'Innovation Hub',
    category: 'Hackathon',
    venue: 'Innovation Hub',
    city: 'Bengaluru',
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    day: '02',
    month: 'NOV',
  },
  {
    event: 'AI Innovation Challenge',
    organizer: 'AI Student Community',
    category: 'Technical Competition',
    venue: 'Innovation Lab',
    city: 'Hyderabad',
    startDate: '2026-11-12',
    endDate: '2026-11-13',
    day: '12',
    month: 'NOV',
  },
]

const emptyForm = {
  event: '',
  organizer: '',
  category: '',
  venue: '',
  city: '',
  startDate: '',
  endDate: '',
  eventUrl: '',
  purpose: '',
  supportingDocument: null,
}

function SignInPage({ onSignIn }) {
  const [loginType, setLoginType] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!identifier.trim() || !password.trim()) {
      alert('Please enter your login details.')
      return
    }

    /*
      TEMPORARY FRONTEND STEP

      Real authentication will be connected to Supabase after
      the Project URL and anon/publishable key are available.

      Student:
      - Roll number + password
      - Email + password
      - Google

      Staff:
      - Email + password
      - Google

      IMPORTANT:
      The final role will come from the user's Supabase profile.
      Users will NOT choose Proctor/HOD/Event In-Charge themselves.
    */

    onSignIn({
      loginType,
      identifier: identifier.trim(),
    })
  }

  const handleGoogleLogin = () => {
    alert(
      'Google Sign-In will be connected through Supabase after the Supabase configuration is ready.'
    )
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-brand">
          <div className="signin-logo">EG</div>

          <p className="signin-eyebrow">
            COLLEGE EVENT MANAGEMENT
          </p>

          <h1>Event Gate</h1>

          <p className="signin-subtitle">
            One portal. Clear approvals. Confident participation.
          </p>
        </div>

        <div className="signin-divider" />

        <div className="signin-login-switch">
          <button
            type="button"
            className={loginType === 'student' ? 'active' : ''}
            onClick={() => {
              setLoginType('student')
              setIdentifier('')
              setPassword('')
            }}
          >
            Student
          </button>

          <button
            type="button"
            className={loginType === 'staff' ? 'active' : ''}
            onClick={() => {
              setLoginType('staff')
              setIdentifier('')
              setPassword('')
            }}
          >
            Staff
          </button>
        </div>

        <form className="signin-form" onSubmit={handleSubmit}>
          <div>
            <h2>
              {loginType === 'student'
                ? 'Student Sign In'
                : 'Staff Sign In'}
            </h2>

            <p className="signin-description">
              {loginType === 'student'
                ? 'Sign in using your roll number or college email.'
                : 'Sign in using your registered college email.'}
            </p>
          </div>

          <label htmlFor="signin-identifier">
            {loginType === 'student'
              ? 'Roll Number or Email'
              : 'Email Address'}
          </label>

          <input
            id="signin-identifier"
            type={loginType === 'student' ? 'text' : 'email'}
            autoComplete="username"
            placeholder={
              loginType === 'student'
                ? 'Enter roll number or email'
                : 'you@college.edu'
            }
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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

            <button
              type="button"
              className="signin-show-password"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className="signin-submit" type="submit">
            Sign In <span>→</span>
          </button>

          <div className="signin-or">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleLogin}
          >
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <p className="signin-demo-note">
            {loginType === 'student'
              ? 'Students can use their roll number or registered email. Google Sign-In will use the role assigned to the account.'
              : 'Staff members will be automatically directed to their assigned dashboard after authentication.'}
          </p>
        </form>

        <p className="signin-footer">
          Event Gate · Academic Year 2026–2027
        </p>
      </div>
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

  /*
    TEMPORARY ROLE HANDLER

    Until Supabase is connected, this keeps the existing frontend
    dashboards working.

    Once Supabase is ready, this function will be replaced with:

    Supabase Login
        ↓
    Get authenticated user
        ↓
    Get profile.role
        ↓
    Set dashboardMode from database role
  */

  const signIn = ({ loginType, identifier }) => {
    setSignedInEmail(
      loginType === 'student'
        ? identifier.includes('@')
          ? identifier
          : `${identifier}@college.edu`
        : identifier
    )

    /*
      Temporary behaviour:
      Student login opens Student Dashboard.

      Staff dashboards will no longer be selected from the login page.
      Their real dashboard will be determined by their Supabase role.
    */
    if (loginType === 'student') {
      setDashboardMode('student')
    } else {
      alert(
        'Staff authentication is ready for Supabase integration. Once your Supabase URL and key are added, the account role will automatically open Proctor, HOD, or Event In-Charge.'
      )

      return
    }

    setActivePage('Dashboard')
    setIsSignedIn(true)
  }

  const signOut = () => {
    setIsSignedIn(false)
    setSignedInEmail('')
    setDashboardMode('student')
    setActivePage('Dashboard')
    setShowRequest(false)
    setSelectedEvent(null)
  }

  const backToStudent = () => {
    setDashboardMode('student')
    setActivePage('Dashboard')
  }

  if (!isSignedIn) {
    return <SignInPage onSignIn={signIn} />
  }

  if (dashboardMode === 'proctor') {
    return (
      <ProctorDashboard
        onBackToStudent={backToStudent}
        onSignOut={signOut}
      />
    )
  }

  if (dashboardMode === 'hod') {
    return (
      <HODDashboard
        onBackToStudent={backToStudent}
        onSignOut={signOut}
      />
    )
  }

  if (dashboardMode === 'event-in-charge') {
    return (
      <EventInChargeDashboard
        onBackToStudent={backToStudent}
        onSignOut={signOut}
      />
    )
  }

  const approvedCount = requests.filter(
    (request) => request.status === 'Approved'
  ).length

  const pendingCount = requests.filter((request) =>
    [
      'Pending Review',
      'Under Proctor Review',
      'Pending HOD Review',
      'Pending Final Decision',
    ].includes(request.status)
  ).length

  const handleChange = (event) => {
    const { name, value, files } = event.target

    setFormData((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }))
  }

  const resetForm = () => {
    setFormData({ ...emptyForm })
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

    const nextNumber =
      Math.max(
        0,
        ...requests.map(
          (request) => Number(request.id.split('-').at(-1)) || 0
        )
      ) + 1

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

    if (
      status === 'Rejected' ||
      status === 'Recommended for Rejection'
    ) {
      return 'rejected'
    }

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

              <p>
                {request.organizer} · {request.category}
              </p>

              <p>
                {request.venue}, {request.city}
              </p>

              {request.proctorRemark && (
                <p>
                  <strong>Review remark:</strong>{' '}
                  {request.proctorRemark}
                </p>
              )}
            </div>

            <span className={`status ${statusClass(request.status)}`}>
              {request.status}
            </span>
          </div>

          <div className="request-date">
            {request.startDate} → {request.endDate}
          </div>
        </div>
      ))}
    </div>
  )

  const renderRequestList = () => (
    <section className="card requests-card full-page-card">
      <div className="card-header">
        <div>
          <h2>My Event Requests</h2>

          <p>
            View and track all your submitted event participation requests.
          </p>
        </div>

        <button className="primary-btn" onClick={openBlankRequest}>
          + Submit Request
        </button>
      </div>

      {renderRequestItems()}
    </section>
  )

  const renderUpcomingEvents = () => (
    <section className="card upcoming-card full-page-card">
      <div className="card-header">
        <div>
          <h2>Upcoming Events</h2>

          <p>
            Explore upcoming technical events and submit a participation
            request.
          </p>
        </div>
      </div>

      <div className="upcoming-events-page">
        {upcomingEvents.map((event) => (
          <button
            key={event.event}
            className="upcoming-event"
            onClick={() => openEventRequest(event)}
          >
            <div className="event-date">
              <strong>{event.day}</strong>
              <span>{event.month}</span>
            </div>

            <div>
              <h3>{event.event}</h3>

              <p>{event.organizer}</p>

              <p>
                {event.venue}, {event.city}
              </p>
            </div>

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

        <div>
          <h2>Bhavyasri</h2>

          <p>
            Student · Department of Artificial Intelligence
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card profile-card">
          <div className="card-header">
            <div>
              <h2>Personal Information</h2>
              <p>Your student profile details.</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-field">
              <span>Full Name</span>
              <strong>Bhavyasri</strong>
            </div>

            <div className="profile-field">
              <span>Role</span>
              <strong>Student</strong>
            </div>

            <div className="profile-field">
              <span>Roll Number</span>
              <strong>Example</strong>
            </div>

            <div className="profile-field">
              <span>Email</span>
              <strong>{signedInEmail || 'Example'}</strong>
            </div>

            <div className="profile-field">
              <span>Phone</span>
              <strong>Example</strong>
            </div>
          </div>
        </div>

        <div className="card profile-card">
          <div className="card-header">
            <div>
              <h2>Academic Information</h2>
              <p>Current academic details.</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-field">
              <span>Department</span>
              <strong>Artificial Intelligence (AI)</strong>
            </div>

            <div className="profile-field">
              <span>Year</span>
              <strong>2nd Year</strong>
            </div>

            <div className="profile-field">
              <span>Section</span>
              <strong>AI&ML-B</strong>
            </div>

            <div className="profile-field">
              <span>Academic Year</span>
              <strong>2026 - 2027</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card profile-card">
        <div className="card-header">
          <div>
            <h2>Attendance & Eligibility</h2>
            <p>Example attendance details for the demo.</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span>Attendance</span>
            <strong>82%</strong>
          </div>

          <div className="profile-stat">
            <span>Required Threshold</span>
            <strong>75%</strong>
          </div>

          <div className="profile-stat">
            <span>Eligibility</span>
            <strong className="eligible-text">Eligible</strong>
          </div>
        </div>
      </div>
    </section>
  )

  const renderDashboard = () => (
    <>
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Requests</span>
          <strong>{requests.length}</strong>
          <small>All submitted requests</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <strong>{pendingCount}</strong>
          <small>Awaiting review</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Approved</span>
          <strong>{approvedCount}</strong>
          <small>Ready to participate</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Attendance</span>
          <strong>82%</strong>
          <small>Eligible · Threshold 75%</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card requests-card">
          <div className="card-header">
            <div>
              <h2>My Event Requests</h2>

              <p>
                Track the status of your event participation requests.
              </p>
            </div>

            <button className="primary-btn" onClick={openBlankRequest}>
              + Submit Request
            </button>
          </div>

          {renderRequestItems()}
        </div>

        <div className="card upcoming-card">
          <div className="card-header">
            <div>
              <h2>Upcoming Events</h2>

              <p>
                Click an event to start your participation request.
              </p>
            </div>
          </div>

          {upcomingEvents.map((event) => (
            <button
              key={event.event}
              className="upcoming-event"
              onClick={() => openEventRequest(event)}
            >
              <div className="event-date">
                <strong>{event.day}</strong>
                <span>{event.month}</span>
              </div>

              <div>
                <h3>{event.event}</h3>
                <p>{event.venue}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="card workflow-info-card">
        <div className="card-header">
          <div>
            <h2>Approval Workflow</h2>
            <p>
              Your request moves through these stages before participation.
            </p>
          </div>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step">
            <strong>1</strong>
            <span>Student</span>
            <small>Submit Request</small>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <strong>2</strong>
            <span>System</span>
            <small>Eligibility Check</small>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <strong>3</strong>
            <span>Proctor</span>
            <small>Suitability Review</small>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <strong>4</strong>
            <span>HOD</span>
            <small>Approval</small>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <strong>5</strong>
            <span>Event In-Charge</span>
            <small>Final Approval</small>
          </div>
        </div>
      </section>
    </>
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h2>Event Gate</h2>
          <p>Event Participation Portal</p>
        </div>

        <nav>
          {[
            'Dashboard',
            'My Requests',
            'Upcoming Events',
            'Profile',
          ].map((page) => (
            <a
              key={page}
              href="#"
              className={activePage === page ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                setActivePage(page)
              }}
            >
              {page}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p>Student Portal</p>
          <span>Academic Year 2026</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="welcome">
              {activePage === 'Dashboard'
                ? 'Welcome back 👋'
                : 'Student Portal'}
            </p>

            <h1>{activePage}</h1>
          </div>

          <div className="student-info">
            <div className="avatar">BS</div>

            <div>
              <strong>Bhavyasri</strong>
              <span>Student</span>
            </div>

            <button className="secondary-btn" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </header>

        {activePage === 'Dashboard' && renderDashboard()}
        {activePage === 'My Requests' && renderRequestList()}
        {activePage === 'Upcoming Events' && renderUpcomingEvents()}
        {activePage === 'Profile' && renderProfile()}

        {showRequest && (
          <div className="modal-overlay" onClick={closeRequest}>
            <div
              className="modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>Event Participation Request</h2>

                  <p>
                    {selectedEvent
                      ? 'Review the event details and provide your participation purpose.'
                      : 'Provide the event details to submit your request.'}
                  </p>
                </div>

                <button
                  className="close-btn"
                  onClick={closeRequest}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Event Details</h3>

                  {selectedEvent && (
                    <div className="form-info">
                      <strong>Event selected</strong>

                      <p>
                        You selected <b>{selectedEvent.event}</b> from
                        Upcoming Events. The event information is already
                        filled in for you.
                      </p>
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Event Title *</label>

                      <input
                        name="event"
                        value={formData.event}
                        onChange={handleChange}
                        placeholder="Enter event name"
                        readOnly={!!selectedEvent}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Organizer *</label>

                      <input
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleChange}
                        placeholder="Enter organizer name"
                        readOnly={!!selectedEvent}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Event Category *</label>

                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        disabled={!!selectedEvent}
                        required
                      >
                        <option value="">Select category</option>
                        <option>Hackathon</option>
                        <option>Workshop</option>
                        <option>Conference</option>
                        <option>Technical Competition</option>
                        <option>Industrial Visit</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Venue *</label>

                      <input
                        name="venue"
                        value={formData.venue}
                        onChange={handleChange}
                        placeholder="Enter venue"
                        readOnly={!!selectedEvent}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>City *</label>

                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter city"
                        readOnly={!!selectedEvent}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Start Date *</label>

                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        readOnly={!!selectedEvent}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Date *</label>

                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        readOnly={!!selectedEvent}
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Event URL</label>

                      <input
                        type="url"
                        name="eventUrl"
                        value={formData.eventUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/event"
                        readOnly={!!selectedEvent}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Participation Details</h3>

                  <div className="form-group">
                    <label>
                      Purpose / Academic or Technical Benefit *
                    </label>

                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      placeholder="Explain why you want to attend this event and how it will benefit your academic or technical development."
                      rows="5"
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Supporting Document</h3>

                  <div className="form-group">
                    <label>Upload Supporting Document</label>

                    <input
                      type="file"
                      name="supportingDocument"
                      onChange={handleChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />

                    <small className="field-help">
                      Optional. Accepted formats: PDF, DOC, DOCX, JPG, PNG.
                    </small>
                  </div>
                </div>

                <div className="form-info">
                  <strong>Before submitting</strong>

                  <p>
                    Your request will first be reviewed by your assigned
                    Proctor. If the Proctor recommends you for
                    participation, the request will move to the HOD and
                    then to the Technical Event In-Charge for final
                    approval.
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeRequest}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App