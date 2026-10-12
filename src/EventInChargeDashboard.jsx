
import { useMemo, useState } from 'react'
import './EventInChargeDashboard.css'

const sampleRequests = [
  {
    id: 'EG-2026-010',
    student: 'Ananya Rao',
    roll: 'AI2024-018',
    department: 'Artificial Intelligence',
    event: 'Pixel to Product',
    organizer: 'Innovation Club',
    startDate: '2026-10-24',
    endDate: '2026-10-24',
    purpose: 'Present a prototype and participate in the product showcase.',
    proctor: 'Suitable',
    hod: 'Approved',
    status: 'Pending Final Decision',
    reason: '',
  },
  {
    id: 'EG-2026-011',
    student: 'Rahul Varma',
    roll: 'AI2024-026',
    department: 'Artificial Intelligence',
    event: 'AI Buildathon',
    organizer: 'Department of AI',
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    purpose: 'Participate in the AI solution challenge.',
    proctor: 'Suitable',
    hod: 'Approved',
    status: 'Pending Final Decision',
    reason: '',
  },
  {
    id: 'EG-2026-012',
    student: 'Meera Nair',
    roll: 'CSE2024-031',
    department: 'Computer Science',
    event: 'Cloud Connect 2026',
    organizer: 'Tech Forum',
    startDate: '2026-10-29',
    endDate: '2026-10-29',
    purpose: 'Attend technical sessions and represent the college.',
    proctor: 'Suitable',
    hod: 'Approved',
    status: 'Approved',
    reason: '',
  },
  {
    id: 'EG-2026-013',
    student: 'Arjun Kumar',
    roll: 'ECE2024-014',
    department: 'Electronics and Communication',
    event: 'RoboSprint',
    organizer: 'Robotics Club',
    startDate: '2026-11-08',
    endDate: '2026-11-08',
    purpose: 'Compete in the robotics challenge.',
    proctor: 'Suitable',
    hod: 'Approved',
    status: 'Rejected',
    reason: 'The event conflicts with a mandatory department assessment.',
  },
]

const initialAttendanceLists = [
  {
    id: 'AL-001',
    event: 'Cloud Connect 2026',
    eventDate: '2026-10-29',
    students: ['Meera Nair'],
    status: 'Awaiting HOD Sign-Off',
    submittedAt: '2026-10-12 10:30',
    signedBy: '',
    signedAt: '',
  },
]

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\r\n')

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function printReport(title, headers, rows) {
  const escapeHTML = (value) =>
    String(value ?? '').replace(/[&<>"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    })[char])

  const tableHeaders = headers
    .map((header) => `<th>${escapeHTML(header)}</th>`)
    .join('')

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHTML(cell)}</td>`)
          .join('')}</tr>`
    )
    .join('')

  const popup = window.open('', '_blank', 'width=1000,height=700')

  if (!popup) {
    alert('Please allow pop-ups to print or save the report as PDF.')
    return
  }

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHTML(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #172033; }
          h1 { font-size: 23px; }
          p { color: #64748b; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px; text-align: left; font-size: 11px; }
          th { background: #f1f5f9; }
          button { margin-top: 20px; padding: 10px 16px; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHTML(title)}</h1>
        <p>Event Gate · Generated ${escapeHTML(new Date().toLocaleString())}</p>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <button onclick="window.print()">Print / Save as PDF</button>
      </body>
    </html>
  `)

  popup.document.close()
}

export default function EventInChargeDashboard({
  onBackToStudent,
  onSignOut,
}) {
  const [activePage, setActivePage] = useState('Overview')
  const [requests, setRequests] = useState(sampleRequests)
  const [attendanceLists, setAttendanceLists] = useState(
    initialAttendanceLists
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const pending = requests.filter(
    (request) => request.status === 'Pending Final Decision'
  )

  const approved = requests.filter(
    (request) => request.status === 'Approved'
  )

  const rejected = requests.filter(
    (request) => request.status === 'Rejected'
  )

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const query = search.toLowerCase()

      const matchesSearch = [
        request.id,
        request.student,
        request.roll,
        request.event,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)

      const matchesStatus =
        statusFilter === 'All' || request.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [requests, search, statusFilter])

  function notify(message) {
    setNotice(message)
  }

  function decideRequest(decision) {
    if (!selectedRequest) return

    if (decision === 'Rejected' && !rejectionReason.trim()) {
      setError('Please enter a reason before rejecting this request.')
      return
    }

    const reason =
      decision === 'Rejected' ? rejectionReason.trim() : ''

    setRequests((current) =>
      current.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              status: decision,
              reason,
              decisionDateTime: new Date().toLocaleString(),
            }
          : request
      )
    )

    setSelectedRequest(null)
    setRejectionReason('')
    setError('')

    notify(
      decision === 'Approved'
        ? 'Final approval recorded successfully.'
        : 'Request rejected and the reason recorded.'
    )
  }

  function prepareAttendanceLists() {
    const grouped = {}

    approved.forEach((request) => {
      if (!grouped[request.event]) {
        grouped[request.event] = {
          event: request.event,
          eventDate: request.startDate,
          students: [],
        }
      }

      grouped[request.event].students.push(request.student)
    })

    const groups = Object.values(grouped)

    if (groups.length === 0) {
      notify('There are no finally approved students to add to a list.')
      return
    }

    const newLists = groups.map((group, index) => ({
      id: `AL-${Date.now().toString().slice(-5)}-${index + 1}`,
      ...group,
      status: 'Awaiting HOD Sign-Off',
      submittedAt: new Date().toLocaleString(),
      signedBy: '',
      signedAt: '',
    }))

    setAttendanceLists((current) => [...newLists, ...current])
    setActivePage('Attendance Lists')
    notify('Attendance list prepared for HOD sign-off.')
  }

  const requestHeaders = [
    'Request ID',
    'Student',
    'Roll Number',
    'Department',
    'Event',
    'Start Date',
    'End Date',
    'Proctor Review',
    'HOD Review',
    'Final Status',
    'Rejection Reason',
  ]

  function exportRequests(list = filteredRequests) {
    downloadCSV(
      'event-gate-final-approval-report.csv',
      [
        requestHeaders,
        ...list.map((r) => [
          r.id,
          r.student,
          r.roll,
          r.department,
          r.event,
          r.startDate,
          r.endDate,
          r.proctor,
          r.hod,
          r.status,
          r.reason,
        ]),
      ]
    )
  }

  function exportApproved() {
    downloadCSV(
      'event-gate-approved-students.csv',
      [
        ['Student', 'Roll Number', 'Department', 'Event', 'Start Date', 'End Date'],
        ...approved.map((r) => [
          r.student,
          r.roll,
          r.department,
          r.event,
          r.startDate,
          r.endDate,
        ]),
      ]
    )
  }

  function exportAttendanceList(list) {
    downloadCSV(
      `attendance-${list.id}.csv`,
      [
        ['List ID', list.id],
        ['Event', list.event],
        ['Event Date', list.eventDate],
        ['Status', list.status],
        ['Submitted At', list.submittedAt],
        ['HOD Signed By', list.signedBy || 'Pending'],
        ['HOD Signed At', list.signedAt || 'Pending'],
        [],
        ['S. No.', 'Student Name'],
        ...list.students.map((student, index) => [index + 1, student]),
      ]
    )
  }

  function exportAttendanceSummary() {
    downloadCSV(
      'event-gate-attendance-lists.csv',
      [
        ['List ID', 'Event', 'Event Date', 'Students', 'Status', 'Submitted At', 'Signed By', 'Signed At'],
        ...attendanceLists.map((list) => [
          list.id,
          list.event,
          list.eventDate,
          list.students.join('; '),
          list.status,
          list.submittedAt,
          list.signedBy,
          list.signedAt,
        ]),
      ]
    )
  }

  const pageItems = [
    'Overview',
    'Final Approvals',
    'Approved Students',
    'Attendance Lists',
    'Reports & Exports',
    'Decision History',
  ]

  return (
    <div className="eic-app">
      <aside className="eic-sidebar">
        <div className="eic-brand">
          <div className="eic-logo">EG</div>
          <div>
            <strong>Event Gate</strong>
            <span>Event Participation Portal</span>
          </div>
        </div>

        <div className="eic-role">TECHNICAL EVENT IN-CHARGE</div>

        <nav className="eic-nav">
          {pageItems.map((page) => (
            <button
              key={page}
              className={`eic-nav-item ${
                activePage === page ? 'active' : ''
              }`}
              onClick={() => {
                setActivePage(page)
                setNotice('')
              }}
            >
              {page}
              {page === 'Final Approvals' && pending.length > 0 && (
                <span className="eic-count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="eic-sidebar-bottom">
          <div className="eic-profile">
            <div className="eic-avatar">TI</div>
            <div>
              <strong>Event In-Charge</strong>
              <span>Final Approval Authority</span>
            </div>
          </div>

          <button
            className="eic-side-button"
            onClick={onBackToStudent}
          >
            ← Student Demo
          </button>

          <button className="eic-side-button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="eic-main">
        <header className="eic-header">
          <div>
            <span className="eic-eyebrow">
              EVENT GATE / ADMINISTRATION
            </span>
            <h1>{activePage}</h1>
            <p>Manage final participation decisions and reports.</p>
          </div>

          <button
            className="eic-button secondary"
            onClick={() => exportRequests()}
          >
            Export report ↓
          </button>
        </header>

        {notice && (
          <div className="eic-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')}>×</button>
          </div>
        )}

        {activePage === 'Overview' && (
          <>
            <section className="eic-welcome">
              <span>FINAL APPROVAL AUTHORITY</span>
              <h2>Welcome to your workspace.</h2>
              <p>
                Review HOD-approved requests, make the final decision,
                and prepare official attendance lists.
              </p>
            </section>

            <section className="eic-stats">
              <StatCard label="Awaiting Decision" value={pending.length} />
              <StatCard label="Finally Approved" value={approved.length} />
              <StatCard label="Rejected" value={rejected.length} />
              <StatCard
                label="HOD Sign-Off Pending"
                value={
                  attendanceLists.filter(
                    (list) => list.status !== 'Signed Off'
                  ).length
                }
              />
            </section>

            <section className="eic-card">
              <div className="eic-section-heading">
                <div>
                  <h2>Requests requiring your decision</h2>
                  <p>
                    Only requests that have passed Proctor and HOD review
                    should reach this queue.
                  </p>
                </div>
                <button
                  className="eic-link-button"
                  onClick={() => setActivePage('Final Approvals')}
                >
                  View all →
                </button>
              </div>

              <RequestTable
                requests={pending}
                onReview={setSelectedRequest}
              />
            </section>

            <section className="eic-workflow">
              <strong>Approval workflow</strong>
              <p>
                Student → Proctor → HOD →{' '}
                <b>Technical Event In-Charge</b> → Student
              </p>
            </section>
          </>
        )}

        {activePage === 'Final Approvals' && (
          <section className="eic-card">
            <div className="eic-section-heading">
              <div>
                <h2>Final approval queue</h2>
                <p>Approve or reject requests with a recorded reason.</p>
              </div>
            </div>

            <div className="eic-toolbar">
              <input
                placeholder="Search student, event or request ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All</option>
                <option>Pending Final Decision</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>

            <RequestTable
              requests={filteredRequests}
              onReview={setSelectedRequest}
            />
          </section>
        )}

        {activePage === 'Approved Students' && (
          <section className="eic-card">
            <div className="eic-section-heading">
              <div>
                <h2>Finally approved students</h2>
                <p>
                  Only students with final approval are included here.
                </p>
              </div>
              <button
                className="eic-button primary"
                onClick={prepareAttendanceLists}
              >
                Prepare Attendance List +
              </button>
            </div>

            <div className="eic-toolbar">
              <input
                placeholder="Search approved students..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <RequestTable
              requests={approved.filter((r) =>
                `${r.student} ${r.event} ${r.roll}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )}
              onReview={setSelectedRequest}
            />
          </section>
        )}

        {activePage === 'Attendance Lists' && (
          <section className="eic-card">
            <div className="eic-section-heading">
              <div>
                <h2>Attendance Lists & HOD Sign-Off</h2>
                <p>
                  Prepare lists from finally approved students and send
                  them for HOD approval.
                </p>
              </div>
              <button
                className="eic-button primary"
                onClick={prepareAttendanceLists}
              >
                Prepare New List +
              </button>
            </div>

            {attendanceLists.length === 0 ? (
              <p className="eic-empty">
                No attendance lists yet. Prepare one after final approvals.
              </p>
            ) : (
              <div className="eic-list-grid">
                {attendanceLists.map((list) => (
                  <article className="eic-list-card" key={list.id}>
                    <div className="eic-list-top">
                      <span className="eic-document-icon">▤</span>
                      <span
                        className={`eic-status ${
                          list.status === 'Signed Off'
                            ? 'approved'
                            : 'pending'
                        }`}
                      >
                        {list.status}
                      </span>
                    </div>

                    <h3>{list.event}</h3>
                    <p>
                      {list.eventDate} · {list.students.length} student(s)
                    </p>

                    <div className="eic-list-details">
                      <span>List ID</span>
                      <strong>{list.id}</strong>
                      <span>Submitted</span>
                      <strong>{list.submittedAt}</strong>
                      <span>Signed by HOD</span>
                      <strong>{list.signedBy || 'Pending'}</strong>
                      <span>Sign-off time</span>
                      <strong>{list.signedAt || 'Pending'}</strong>
                    </div>

                    <div className="eic-chips">
                      {list.students.map((student) => (
                        <span key={student}>{student}</span>
                      ))}
                    </div>

                    <div className="eic-actions">
                      <button
                        className="eic-button secondary"
                        onClick={() => exportAttendanceList(list)}
                      >
                        Download CSV
                      </button>
                      <button
                        className="eic-button secondary"
                        onClick={() =>
                          printReport(
                            `Attendance List - ${list.event}`,
                            ['S. No.', 'Student Name'],
                            list.students.map((student, index) => [
                              index + 1,
                              student,
                            ])
                          )
                        }
                      >
                        Print / Save PDF
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="eic-help">
              The HOD must perform the actual sign-off from the HOD
              dashboard. This demo stores lists locally in React state;
              shared sign-off will require database integration.
            </p>
          </section>
        )}

        {activePage === 'Reports & Exports' && (
          <section className="eic-card">
            <div className="eic-section-heading">
              <div>
                <h2>Reports & Exports</h2>
                <p>
                  Download CSV files that open in Excel, or print reports
                  and save them as PDF.
                </p>
              </div>
            </div>

            <div className="eic-report-grid">
              <ReportCard
                title="Final Approval Report"
                description="All requests, review statuses and rejection reasons."
                onCSV={() => exportRequests(requests)}
                onPDF={() =>
                  printReport(
                    'Event Gate - Final Approval Report',
                    requestHeaders,
                    requests.map((r) => [
                      r.id,
                      r.student,
                      r.roll,
                      r.department,
                      r.event,
                      r.startDate,
                      r.endDate,
                      r.proctor,
                      r.hod,
                      r.status,
                      r.reason,
                    ])
                  )
                }
              />

              <ReportCard
                title="Approved Students"
                description="Students authorized to participate."
                onCSV={exportApproved}
                onPDF={() =>
                  printReport(
                    'Event Gate - Approved Students',
                    ['Student', 'Roll Number', 'Department', 'Event', 'Start Date', 'End Date'],
                    approved.map((r) => [
                      r.student,
                      r.roll,
                      r.department,
                      r.event,
                      r.startDate,
                      r.endDate,
                    ])
                  )
                }
              />

              <ReportCard
                title="Attendance Lists"
                description="Attendance lists and HOD sign-off status."
                onCSV={exportAttendanceSummary}
                onPDF={() =>
                  printReport(
                    'Event Gate - Attendance Lists',
                    ['List ID', 'Event', 'Event Date', 'Students', 'Status', 'Signed By', 'Signed At'],
                    attendanceLists.map((list) => [
                      list.id,
                      list.event,
                      list.eventDate,
                      list.students.join(', '),
                      list.status,
                      list.signedBy || 'Pending',
                      list.signedAt || 'Pending',
                    ])
                  )
                }
              />
            </div>

            <p className="eic-help">
              CSV files are Excel-compatible. Use Print / Save PDF and
              choose “Save as PDF” in the browser print dialog.
            </p>
          </section>
        )}

        {activePage === 'Decision History' && (
          <section className="eic-card">
            <div className="eic-section-heading">
              <div>
                <h2>Decision History</h2>
                <p>Review final decisions recorded in this demo session.</p>
              </div>
            </div>

            <RequestTable
              requests={requests.filter(
                (r) => r.status !== 'Pending Final Decision'
              )}
              onReview={setSelectedRequest}
            />
          </section>
        )}

        <footer className="eic-footer">
          Event Gate · Technical Event In-Charge Portal
          <span>Frontend demo · Sample data</span>
        </footer>
      </main>

      {selectedRequest && (
        <div
          className="eic-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null)
              setError('')
              setRejectionReason('')
            }
          }}
        >
          <section
            className="eic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="eic-modal-title"
          >
            <div className="eic-modal-heading">
              <div>
                <span className="eic-eyebrow">
                  REQUEST · {selectedRequest.id}
                </span>
                <h2 id="eic-modal-title">{selectedRequest.student}</h2>
                <p>{selectedRequest.event}</p>
              </div>
              <button
                className="eic-close"
                onClick={() => {
                  setSelectedRequest(null)
                  setError('')
                  setRejectionReason('')
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="eic-detail-grid">
              <div><span>Roll number</span><strong>{selectedRequest.roll}</strong></div>
              <div><span>Department</span><strong>{selectedRequest.department}</strong></div>
              <div><span>Proctor review</span><strong>{selectedRequest.proctor}</strong></div>
              <div><span>HOD review</span><strong>{selectedRequest.hod}</strong></div>
              <div><span>Event dates</span><strong>{selectedRequest.startDate} – {selectedRequest.endDate}</strong></div>
              <div><span>Current status</span><strong>{selectedRequest.status}</strong></div>
            </div>

            <div className="eic-purpose">
              <strong>Participation purpose</strong>
              <p>{selectedRequest.purpose}</p>
            </div>

            {selectedRequest.status === 'Pending Final Decision' ? (
              <>
                <label className="eic-label" htmlFor="eic-rejection-reason">
                  Rejection reason
                  <span> (required only if rejecting)</span>
                </label>

                <textarea
                  id="eic-rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(event.target.value)
                    setError('')
                  }}
                  rows={3}
                  placeholder="Explain why this request cannot be approved..."
                />

                {error && <p className="eic-error">{error}</p>}

                <div className="eic-modal-actions">
                  <button
                    className="eic-button secondary"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="eic-button danger"
                    onClick={() => decideRequest('Rejected')}
                  >
                    Reject Request
                  </button>
                  <button
                    className="eic-button primary"
                    onClick={() => decideRequest('Approved')}
                  >
                    ✓ Final Approve
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="eic-decision-record">
                  <strong>Recorded decision</strong>
                  <p>{selectedRequest.status}</p>
                  {selectedRequest.reason && (
                    <p>Reason: {selectedRequest.reason}</p>
                  )}
                  {selectedRequest.decisionDateTime && (
                    <p>Decision time: {selectedRequest.decisionDateTime}</p>
                  )}
                </div>
                <div className="eic-modal-actions">
                  <button
                    className="eic-button primary"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="eic-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ReportCard({ title, description, onCSV, onPDF }) {
  return (
    <article className="eic-report-card">
      <div className="eic-document-icon">▤</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="eic-button primary" onClick={onCSV}>
        Export Excel-compatible CSV
      </button>
      <button className="eic-button secondary" onClick={onPDF}>
        Print / Save PDF
      </button>
    </article>
  )
}

function RequestTable({ requests, onReview }) {
  if (!requests.length) {
    return <div className="eic-empty">No requests found for this view.</div>
  }

  return (
    <div className="eic-table-wrap">
      <table className="eic-table">
        <thead>
          <tr>
            <th>Student / Request</th>
            <th>Event</th>
            <th>Event Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <strong>{request.student}</strong>
                <span className="eic-subtext">
                  {request.roll} · {request.id}
                </span>
              </td>
              <td>
                <strong>{request.event}</strong>
                <span className="eic-subtext">{request.department}</span>
              </td>
              <td>{request.startDate}</td>
              <td>
                <span
                  className={`eic-status ${
                    request.status === 'Approved'
                      ? 'approved'
                      : request.status === 'Rejected'
                        ? 'rejected'
                        : 'pending'
                  }`}
                >
                  {request.status}
                </span>
              </td>
              <td>
                <button
                  className="eic-row-button"
                  onClick={() => onReview(request)}
                >
                  {request.status === 'Pending Final Decision'
                    ? 'Review →'
                    : 'Details →'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}