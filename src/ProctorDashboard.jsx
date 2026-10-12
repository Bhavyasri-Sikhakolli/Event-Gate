import './ProctorDashboard.css'
import { useMemo, useState } from 'react'

const initialReviews = [
  {
    id: 'EG-2026-005',
    student: 'Aarav Sharma',
    rollNo: 'AI2026XXX',
    department: 'Artificial Intelligence (AI)',
    section: 'AI&ML-B',
    event: 'AI Innovation Hackathon',
    organizer: 'AI Student Community',
    category: 'Hackathon',
    venue: 'Innovation Lab, Hyderabad',
    startDate: '2026-10-20',
    endDate: '2026-10-21',
    attendance: 86,
    threshold: 75,
    dataAsOf: '2026-10-10',
    purpose: 'Build an AI prototype and gain practical experience with a student team.',
    overlap: false,
    status: 'Under Proctor Review',
    proctorRemark: '',
  },
  {
    id: 'EG-2026-006',
    student: 'Diya Reddy',
    rollNo: 'AI2026XXY',
    department: 'Artificial Intelligence (AI)',
    section: 'AI&ML-A',
    event: 'National Robotics Workshop',
    organizer: 'Robotics Club',
    category: 'Workshop',
    venue: 'Engineering Block, Hyderabad',
    startDate: '2026-10-24',
    endDate: '2026-10-24',
    attendance: 71,
    threshold: 75,
    dataAsOf: '2026-10-10',
    purpose: 'Learn the basics of robotics and embedded systems.',
    overlap: false,
    status: 'Under Proctor Review',
    proctorRemark: '',
  },
  {
    id: 'EG-2026-007',
    student: 'Ishaan Verma',
    rollNo: 'AI2026XXZ',
    department: 'Artificial Intelligence (AI)',
    section: 'AI&ML-B',
    event: 'Tech for Good Conference',
    organizer: 'Innovation Hub',
    category: 'Conference',
    venue: 'Main Auditorium, Hyderabad',
    startDate: '2026-10-28',
    endDate: '2026-10-28',
    attendance: 92,
    threshold: 75,
    dataAsOf: '2026-10-10',
    purpose: '',
    overlap: true,
    status: 'Under Proctor Review',
    proctorRemark: '',
  },
  {
    id: 'EG-2026-008',
    student: 'Meera Nair',
    rollNo: 'AI2026XYA',
    department: 'Artificial Intelligence (AI)',
    section: 'AI&ML-A',
    event: 'Data Science Bootcamp',
    organizer: 'Data Science Club',
    category: 'Workshop',
    venue: 'Computer Lab 2, Hyderabad',
    startDate: '2026-11-04',
    endDate: '2026-11-05',
    attendance: 81,
    threshold: 75,
    dataAsOf: '2026-10-10',
    purpose: 'Improve data analysis and model-building skills.',
    overlap: false,
    status: 'Recommended for Approval',
    proctorRemark: 'Attendance and request details reviewed.',
  },
]

const formatDate = (date) => {
  if (!date) return 'Not provided'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function ProctorDashboard({ onBackToStudent }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [activePage, setActivePage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedReview, setSelectedReview] = useState(null)
  const [decision, setDecision] = useState('')
  const [remark, setRemark] = useState('')
  const [notice, setNotice] = useState('')

  const pendingCount = reviews.filter(
    (review) => review.status === 'Under Proctor Review'
  ).length

  const eligibleCount = reviews.filter(
    (review) => review.attendance >= review.threshold
  ).length

  const reviewedCount = reviews.length - pendingCount

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const searchMatch = [
        review.student,
        review.rollNo,
        review.event,
        review.id,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())

      const statusMatch =
        statusFilter === 'All' || review.status === statusFilter

      const pageMatch =
        activePage !== 'Review History' ||
        review.status !== 'Under Proctor Review'

      return searchMatch && statusMatch && pageMatch
    })
  }, [reviews, search, statusFilter, activePage])

  const openReview = (review) => {
    setSelectedReview(review)
    setDecision('')
    setRemark('')
    setNotice('')
  }

  const closeReview = () => {
    setSelectedReview(null)
    setDecision('')
    setRemark('')
  }

  const submitDecision = (event) => {
    event.preventDefault()

    if (!selectedReview || !decision) {
      setNotice('Please choose an action before submitting.')
      return
    }

    if (
      (decision === 'Not Suitable' || decision === 'Return for Correction') &&
      !remark.trim()
    ) {
      setNotice(
        decision === 'Not Suitable'
          ? 'Please enter a reason for rejection.'
          : 'Please enter the details that need correction.'
      )
      return
    }

    const nextStatus =
      decision === 'Suitable to Attend'
        ? 'Recommended for Approval'
        : decision === 'Not Suitable'
          ? 'Recommended for Rejection'
          : 'Returned for Correction'

    setReviews((current) =>
      current.map((review) =>
        review.id === selectedReview.id
          ? { ...review, status: nextStatus, proctorRemark: remark.trim() }
          : review
      )
    )

    setNotice(
      decision === 'Suitable to Attend'
        ? 'Recommendation recorded. This request can now move to HOD review.'
        : decision === 'Not Suitable'
          ? 'Rejection recommendation recorded with the reason.'
          : 'Request returned to the student with correction remarks.'
    )

    closeReview()
    setActivePage('Pending Reviews')
  }

  const getStatusClass = (status) => {
    if (status === 'Recommended for Approval') return 'proctor-status-approved'
    if (status === 'Recommended for Rejection') return 'proctor-status-rejected'
    if (status === 'Returned for Correction') return 'proctor-status-correction'
    return 'proctor-status-pending'
  }

  const renderReviewList = () => (
    <section className="proctor-panel">
      <div className="proctor-panel-heading">
        <div>
          <h2>{activePage === 'Review History' ? 'Review History' : 'Requests for Review'}</h2>
          <p>
            {activePage === 'Review History'
              ? 'Previously reviewed requests and recorded remarks.'
              : 'Check attendance, eligibility, event details, and supporting information.'}
          </p>
        </div>
        <span className="proctor-count">{filteredReviews.length} records</span>
      </div>

      {notice && <div className="proctor-notice">{notice}</div>}

      <div className="proctor-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search student, roll number, event or request ID..."
          aria-label="Search requests"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="Under Proctor Review">Under Proctor Review</option>
          <option value="Recommended for Approval">Recommended for Approval</option>
          <option value="Recommended for Rejection">Recommended for Rejection</option>
          <option value="Returned for Correction">Returned for Correction</option>
        </select>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="proctor-empty">
          <span>✓</span>
          <h3>No requests found</h3>
          <p>Try another search term or status filter.</p>
        </div>
      ) : (
        <div className="proctor-review-list">
          {filteredReviews.map((review) => (
            <article className="proctor-review-card" key={review.id}>
              <div className="proctor-review-top">
                <div>
                  <span className="proctor-request-id">{review.id}</span>
                  <h3>{review.event}</h3>
                  <p>{review.organizer} · {review.category}</p>
                </div>
                <span className={`proctor-status ${getStatusClass(review.status)}`}>
                  {review.status}
                </span>
              </div>

              <div className="proctor-review-details">
                <div>
                  <span>Student</span>
                  <strong>{review.student}</strong>
                  <small>{review.rollNo} · {review.section}</small>
                </div>
                <div>
                  <span>Attendance</span>
                  <strong className={review.attendance >= review.threshold ? 'proctor-good' : 'proctor-bad'}>
                    {review.attendance}%
                  </strong>
                  <small>Required: {review.threshold}%</small>
                </div>
                <div>
                  <span>Event dates</span>
                  <strong>{formatDate(review.startDate)}</strong>
                  <small>to {formatDate(review.endDate)}</small>
                </div>
              </div>

              {(review.attendance < review.threshold || review.overlap || !review.purpose.trim()) && (
                <div className="proctor-flags">
                  {review.attendance < review.threshold && <span>Attendance below threshold</span>}
                  {review.overlap && <span>Possible event date overlap</span>}
                  {!review.purpose.trim() && <span>Purpose not provided</span>}
                </div>
              )}

              {review.proctorRemark && (
                <div className="proctor-previous-remark">
                  <strong>Recorded remark:</strong> {review.proctorRemark}
                </div>
              )}

              <div className="proctor-review-actions">
                <button
                  className="proctor-secondary-btn"
                  onClick={() => openReview(review)}
                >
                  {review.status === 'Under Proctor Review' ? 'Review Request' : 'View Details'}
                </button>
                {review.status === 'Under Proctor Review' && (
                  <button
                    className="proctor-primary-btn"
                    onClick={() => openReview(review)}
                  >
                    Take Action →
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="proctor-app">
      <aside className="proctor-sidebar">
        <div className="proctor-brand">
          <div className="proctor-brand-mark">EG</div>
          <div>
            <h2>Event Gate</h2>
            <p>Proctor Portal</p>
          </div>
        </div>

        <div className="proctor-role-label">REVIEW WORKSPACE</div>
        <nav className="proctor-nav">
          <button
            className={activePage === 'Dashboard' ? 'active' : ''}
            onClick={() => setActivePage('Dashboard')}
          >
            <span>⌂</span> Overview
          </button>
          <button
            className={activePage === 'Pending Reviews' ? 'active' : ''}
            onClick={() => setActivePage('Pending Reviews')}
          >
            <span>▤</span> Pending Reviews
            <b>{pendingCount}</b>
          </button>
          <button
            className={activePage === 'Assigned Students' ? 'active' : ''}
            onClick={() => setActivePage('Assigned Students')}
          >
            <span>♙</span> Assigned Students
          </button>
          <button
            className={activePage === 'Review History' ? 'active' : ''}
            onClick={() => setActivePage('Review History')}
          >
            <span>◷</span> Review History
          </button>
        </nav>

        <div className="proctor-sidebar-bottom">
          <div className="proctor-mini-avatar">PR</div>
          <div>
            <strong>Proctor Account</strong>
            <span>Review & recommendation</span>
          </div>
        </div>
      </aside>

      <main className="proctor-main">
        <header className="proctor-topbar">
          <div>
            <p className="proctor-eyebrow">EVENT GATE / PROCTOR</p>
            <h1>{activePage === 'Dashboard' ? 'Proctor Dashboard' : activePage}</h1>
            <p className="proctor-subtitle">
              Review assigned student requests and record recommendations.
            </p>
          </div>
          <div className="proctor-topbar-actions">
            <span className="proctor-demo-label">DEMO DATA</span>
            {onBackToStudent && (
              <button className="proctor-secondary-btn" onClick={onBackToStudent}>
                ← Student View
              </button>
            )}
          </div>
        </header>

        {activePage === 'Dashboard' && (
          <>
            <div className="proctor-welcome">
              <div>
                <span className="proctor-welcome-tag">REVIEW CENTRE</span>
                <h2>Good day, Proctor.</h2>
                <p>Review each request carefully before recommending it to the HOD.</p>
              </div>
              <div className="proctor-welcome-icon">✓</div>
            </div>

            <div className="proctor-stats-grid">
              <article className="proctor-stat-card">
                <span className="proctor-stat-icon">♙</span>
                <p>Assigned Students</p>
                <strong>48</strong>
                <small>Example assigned roster</small>
              </article>
              <article className="proctor-stat-card">
                <span className="proctor-stat-icon gold">◷</span>
                <p>Pending Reviews</p>
                <strong>{pendingCount}</strong>
                <small>Awaiting your review</small>
              </article>
              <article className="proctor-stat-card">
                <span className="proctor-stat-icon">✓</span>
                <p>Eligible in Queue</p>
                <strong>{eligibleCount}</strong>
                <small>Attendance meets threshold</small>
              </article>
              <article className="proctor-stat-card">
                <span className="proctor-stat-icon">↗</span>
                <p>Reviewed Requests</p>
                <strong>{reviewedCount}</strong>
                <small>Recommendations recorded</small>
              </article>
            </div>

            <div className="proctor-dashboard-section">
              <div className="proctor-section-title">
                <div>
                  <h2>Requests needing attention</h2>
                  <p>Start with pending requests and check any eligibility flags.</p>
                </div>
                <button
                  className="proctor-text-btn"
                  onClick={() => setActivePage('Pending Reviews')}
                >
                  View all reviews →
                </button>
              </div>
              {renderReviewList()}
            </div>

            <div className="proctor-guidance">
              <span>i</span>
              <div>
                <strong>Your role is to recommend, not to give final approval.</strong>
                <p>
                  Suitable requests proceed to the HOD. The HOD-approved request then
                  goes to the Technical Event In-Charge for the final decision.
                </p>
              </div>
            </div>
          </>
        )}

        {activePage === 'Pending Reviews' && renderReviewList()}

        {activePage === 'Review History' && renderReviewList()}

        {activePage === 'Assigned Students' && (
          <section className="proctor-panel">
            <div className="proctor-panel-heading">
              <div>
                <h2>Assigned Students</h2>
                <p>Illustrative student roster for the Proctor portal.</p>
              </div>
              <span className="proctor-count">48 assigned</span>
            </div>
            <div className="proctor-roster-note">
              <strong>Sample roster</strong>
              <p>
                Actual assigned students will be loaded from the project database
                after the team connects the frontend to Supabase.
              </p>
            </div>
            <div className="proctor-roster-list">
              {reviews.map((review) => (
                <div className="proctor-roster-row" key={review.rollNo}>
                  <div className="proctor-roster-avatar">
                    {review.student.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <strong>{review.student}</strong>
                    <span>{review.rollNo} · {review.section}</span>
                  </div>
                  <span className={review.attendance >= review.threshold ? 'proctor-roster-eligible' : 'proctor-roster-ineligible'}>
                    {review.attendance >= review.threshold ? 'Eligible' : 'Below threshold'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {selectedReview && (
        <div className="proctor-modal-overlay" onClick={closeReview}>
          <section className="proctor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="proctor-modal-header">
              <div>
                <span className="proctor-request-id">{selectedReview.id}</span>
                <h2>Review Participation Request</h2>
                <p>Check the details and record your recommendation.</p>
              </div>
              <button className="proctor-modal-close" onClick={closeReview} aria-label="Close review">
                ×
              </button>
            </div>

            <div className="proctor-modal-body">
              <div className="proctor-modal-student">
                <div className="proctor-modal-avatar">
                  {selectedReview.student.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3>{selectedReview.student}</h3>
                  <p>{selectedReview.rollNo} · {selectedReview.department} · {selectedReview.section}</p>
                </div>
              </div>

              <div className="proctor-modal-grid">
                <div><span>Event</span><strong>{selectedReview.event}</strong></div>
                <div><span>Category</span><strong>{selectedReview.category}</strong></div>
                <div><span>Organizer</span><strong>{selectedReview.organizer}</strong></div>
                <div><span>Venue</span><strong>{selectedReview.venue}</strong></div>
                <div><span>Start date</span><strong>{formatDate(selectedReview.startDate)}</strong></div>
                <div><span>End date</span><strong>{formatDate(selectedReview.endDate)}</strong></div>
              </div>

              <div className="proctor-attendance-box">
                <div>
                  <span>Attendance percentage</span>
                  <strong className={selectedReview.attendance >= selectedReview.threshold ? 'proctor-good' : 'proctor-bad'}>
                    {selectedReview.attendance}%
                  </strong>
                </div>
                <div>
                  <span>Required threshold</span>
                  <strong>{selectedReview.threshold}%</strong>
                </div>
                <div>
                  <span>Attendance data as of</span>
                  <strong>{formatDate(selectedReview.dataAsOf)}</strong>
                </div>
              </div>

              <div className="proctor-purpose-box">
                <span>Student's purpose / academic benefit</span>
                <p>{selectedReview.purpose || 'No purpose provided.'}</p>
              </div>

              <div className="proctor-warning-list">
                {selectedReview.attendance < selectedReview.threshold && (
                  <p className="proctor-warning">⚠ Attendance is below the required threshold. Verify eligibility before recommending.</p>
                )}
                {selectedReview.overlap && (
                  <p className="proctor-warning">⚠ Possible overlap with another event request. Check before recommending.</p>
                )}
                {!selectedReview.purpose.trim() && (
                  <p className="proctor-warning">⚠ The student has not provided a purpose. Consider returning the request for correction.</p>
                )}
                {selectedReview.attendance >= selectedReview.threshold && !selectedReview.overlap && selectedReview.purpose.trim() && (
                  <p className="proctor-success">✓ Attendance meets the threshold and the required purpose is provided.</p>
                )}
              </div>

              {selectedReview.status === 'Under Proctor Review' ? (
                <form onSubmit={submitDecision} className="proctor-decision-form">
                  <h3>Your recommendation</h3>
                  <div className="proctor-decision-options">
                    <label className={decision === 'Suitable to Attend' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="proctorDecision"
                        value="Suitable to Attend"
                        checked={decision === 'Suitable to Attend'}
                        onChange={(event) => setDecision(event.target.value)}
                      />
                      <span>
                        <strong>Suitable to Attend</strong>
                        <small>Recommend to HOD for review</small>
                      </span>
                    </label>
                    <label className={decision === 'Not Suitable' ? 'selected reject' : ''}>
                      <input
                        type="radio"
                        name="proctorDecision"
                        value="Not Suitable"
                        checked={decision === 'Not Suitable'}
                        onChange={(event) => setDecision(event.target.value)}
                      />
                      <span>
                        <strong>Not Suitable</strong>
                        <small>Record a reason for rejection</small>
                      </span>
                    </label>
                    <label className={decision === 'Return for Correction' ? 'selected correction' : ''}>
                      <input
                        type="radio"
                        name="proctorDecision"
                        value="Return for Correction"
                        checked={decision === 'Return for Correction'}
                        onChange={(event) => setDecision(event.target.value)}
                      />
                      <span>
                        <strong>Return for Correction</strong>
                        <small>Send details back to the student</small>
                      </span>
                    </label>
                  </div>

                  {decision && decision !== 'Suitable to Attend' && (
                    <div className="proctor-form-field">
                      <label htmlFor="proctorRemark">
                        {decision === 'Not Suitable' ? 'Reason for rejection *' : 'Correction remarks *'}
                      </label>
                      <textarea
                        id="proctorRemark"
                        value={remark}
                        onChange={(event) => setRemark(event.target.value)}
                        placeholder={
                          decision === 'Not Suitable'
                            ? 'Explain why the request is not suitable...'
                            : 'Specify which information the student needs to correct...'
                        }
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  {notice && <p className="proctor-form-error">{notice}</p>}

                  <div className="proctor-modal-actions">
                    <button type="button" className="proctor-secondary-btn" onClick={closeReview}>
                      Cancel
                    </button>
                    <button type="submit" className="proctor-primary-btn">
                      Submit Recommendation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="proctor-readonly-decision">
                  <strong>Recorded recommendation</strong>
                  <p>{selectedReview.status}</p>
                  <span>{selectedReview.proctorRemark || 'No remark recorded.'}</span>
                  <button type="button" className="proctor-secondary-btn" onClick={closeReview}>
                    Close
                  </button>
                </div>
              )}
              <p className="proctor-final-authority-note">
                Final approval is not available in the Proctor portal. The HOD and
                Technical Event In-Charge handle the next approval stages.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default ProctorDashboard