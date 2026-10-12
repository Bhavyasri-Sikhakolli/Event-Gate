import { useState } from 'react'

import './App.css'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [showRequest, setShowRequest] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const [requests, setRequests] = useState([
    {
      id: 'EG-2026-001',
      event: 'Tech Innovation Summit 2026',
      organizer: 'Department of Computer Science',
      category: 'Conference',
      venue: 'Main Auditorium',
      city: 'Hyderabad',
      startDate: '2026-10-18',
      endDate: '2026-10-18',
      purpose:
        'To learn about current developments in technology and innovation.',
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
  ])

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

  const [formData, setFormData] = useState({
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
  })

  const approvedCount = requests.filter(
    (request) => request.status === 'Approved'
  ).length

  const pendingCount = requests.filter(
    (request) =>
      request.status === 'Pending Review' ||
      request.status === 'Under Proctor Review'
  ).length

  const handleChange = (event) => {
    const { name, value, files } = event.target

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    })
  }

  const resetForm = () => {
    setFormData({
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
    })

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

    const newRequest = {
      id: `EG-2026-${String(requests.length + 1).padStart(3, '0')}`,
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

    setRequests([newRequest, ...requests])

    closeRequest()
  }

  const renderRequestList = () => {
    return (
      <section className="card requests-card full-page-card">

        <div className="card-header">
          <div>
            <h2>My Event Requests</h2>
            <p>
              View and track all your submitted event participation requests.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={openBlankRequest}
          >
            + Submit Request
          </button>
        </div>

        <div className="request-list">

          {requests.map((request) => (
            <div className="request" key={request.id}>

              <div className="request-main">

                <div>
                  <span className="request-id">
                    {request.id}
                  </span>

                  <h3>{request.event}</h3>

                  <p>
                    {request.organizer} · {request.category}
                  </p>

                  <p>
                    {request.venue}, {request.city}
                  </p>
                </div>

                <span
                  className={`status ${
                    request.status === 'Approved'
                      ? 'approved'
                      : 'pending'
                  }`}
                >
                  {request.status}
                </span>

              </div>

              <div className="request-date">
                {request.startDate} → {request.endDate}
              </div>

            </div>
          ))}

        </div>

      </section>
    )
  }

  const renderUpcomingEvents = () => {
    return (
      <section className="card upcoming-card full-page-card">

        <div className="card-header">
          <div>
            <h2>Upcoming Events</h2>
            <p>
              Explore upcoming technical events and submit a participation request.
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

              <span className="event-action">
                Request →
              </span>
            </button>
          ))}

        </div>

      </section>
    )
  }

  const renderProfile = () => {
    return (
      <section className="profile-page">

        <div className="card profile-header-card">

          <div className="profile-avatar">
            BS
          </div>

          <div>
            <h2>Bhavyasri</h2>
            <p>Student · Department of Artificial Intelligence</p>
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
                <strong>AI2026XXX</strong>
              </div>

              <div className="profile-field">
                <span>Email</span>
                <strong>bhavyasri@example.com</strong>
              </div>

              <div className="profile-field">
                <span>Phone</span>
                <strong>+91 XXXXX XXXXX</strong>
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
              <p>Your current attendance status for event participation.</p>
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
  }

  const renderDashboard = () => {
    return (
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

          {/* Requests */}
          <div className="card requests-card">

            <div className="card-header">
              <div>
                <h2>My Event Requests</h2>
                <p>
                  Track the status of your event participation requests.
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={openBlankRequest}
              >
                + Submit Request
              </button>
            </div>

            <div className="request-list">

              {requests.map((request) => (
                <div className="request" key={request.id}>

                  <div className="request-main">

                    <div>
                      <span className="request-id">
                        {request.id}
                      </span>

                      <h3>{request.event}</h3>

                      <p>
                        {request.organizer} · {request.category}
                      </p>

                      <p>
                        {request.venue}, {request.city}
                      </p>
                    </div>

                    <span
                      className={`status ${
                        request.status === 'Approved'
                          ? 'approved'
                          : 'pending'
                      }`}
                    >
                      {request.status}
                    </span>

                  </div>

                  <div className="request-date">
                    {request.startDate} → {request.endDate}
                  </div>

                </div>
              ))}

            </div>
          </div>

          {/* Upcoming Events */}
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
      </>
    )
  }

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <h2>Event Gate</h2>
          <p>Event Participation Portal</p>
        </div>

        <nav>

          <a
            className={activePage === 'Dashboard' ? 'active' : ''}
            onClick={() => setActivePage('Dashboard')}
          >
            Dashboard
          </a>

          <a
            className={activePage === 'My Requests' ? 'active' : ''}
            onClick={() => setActivePage('My Requests')}
          >
            My Requests
          </a>

          <a
            className={activePage === 'Upcoming Events' ? 'active' : ''}
            onClick={() => setActivePage('Upcoming Events')}
          >
            Upcoming Events
          </a>

          <a
            className={activePage === 'Profile' ? 'active' : ''}
            onClick={() => setActivePage('Profile')}
          >
            Profile
          </a>

        </nav>

        <div className="sidebar-bottom">
          <p>Student Portal</p>
          <span>Academic Year 2026</span>
        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* Header */}
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

            <div className="avatar">
              BS
            </div>

            <div>
              <strong>Bhavyasri</strong>
              <span>Student</span>
            </div>

          </div>

        </header>

        {/* Page Content */}

        {activePage === 'Dashboard' && renderDashboard()}

        {activePage === 'My Requests' && renderRequestList()}

        {activePage === 'Upcoming Events' && renderUpcomingEvents()}

        {activePage === 'Profile' && renderProfile()}

        {/* Submit Request Modal */}
        {showRequest && (
          <div
            className="modal-overlay"
            onClick={closeRequest}
          >

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
                >
                  ×
                </button>

              </div>

              <form onSubmit={handleSubmit}>

                {/* Event Details */}
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
                        type="text"
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
                        type="text"
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
                        <option value="Hackathon">Hackathon</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Conference">Conference</option>
                        <option value="Technical Competition">
                          Technical Competition
                        </option>
                        <option value="Industrial Visit">
                          Industrial Visit
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Venue *</label>

                      <input
                        type="text"
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
                        type="text"
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

                {/* Participation Details */}
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

                {/* Supporting Document */}
                <div className="form-section">

                  <h3>Supporting Document</h3>

                  <div className="form-group">

                    <label>
                      Upload Supporting Document
                    </label>

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

                {/* Information */}
                <div className="form-info">

                  <strong>Before submitting</strong>

                  <p>
                    Your request will first be reviewed by your
                    assigned Proctor. If the Proctor recommends you
                    for participation, the request will move to the
                    HOD and then to the Technical Event In-Charge
                    for final approval.
                  </p>

                </div>

                {/* Buttons */}
                <div className="modal-actions">

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeRequest}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                  >
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
