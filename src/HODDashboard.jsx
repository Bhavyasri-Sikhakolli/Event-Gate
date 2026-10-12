import { useMemo, useState } from 'react'
import './HODDashboard.css'

const initialParticipationRequests = [
  {
    id: 'EG-2026-021',
    student: 'Aarav Sharma',
    rollNo: 'AI2026XXX',
    department: 'Artificial Intelligence',
    year: '2nd Year',
    attendance: 86,
    event: 'AI Innovation Hackathon',
    organizer: 'Innovation Hub',
    category: 'Hackathon',
    venue: 'Innovation Centre',
    city: 'Hyderabad',
    startDate: '2026-10-20',
    endDate: '2026-10-21',
    purpose: 'Build a practical AI solution and learn from other teams.',
    proctor: 'Dr. R. Kumar',
    proctorRemark: 'Attendance verified. Student is suitable to attend.',
    status: 'Pending HOD Review',
  },
  {
    id: 'EG-2026-022',
    student: 'Meera Nair',
    rollNo: 'AI2026XYA',
    department: 'Artificial Intelligence',
    year: '2nd Year',
    attendance: 81,
    event: 'Data Science Bootcamp',
    organizer: 'AI Research Club',
    category: 'Workshop',
    venue: 'Lab Block',
    city: 'Hyderabad',
    startDate: '2026-10-25',
    endDate: '2026-10-25',
    purpose: 'Improve practical skills in data analysis and model development.',
    proctor: 'Dr. S. Reddy',
    proctorRemark: 'Attendance is above the required threshold. Recommended.',
    status: 'Pending HOD Review',
  },
  {
    id: 'EG-2026-023',
    student: 'Ishaan Verma',
    rollNo: 'AI2026XXZ',
    department: 'Artificial Intelligence',
    year: '2nd Year',
    attendance: 92,
    event: 'Tech for Good Conference',
    organizer: 'Student Innovation Forum',
    category: 'Conference',
    venue: 'Main Auditorium',
    city: 'Hyderabad',
    startDate: '2026-11-05',
    endDate: '2026-11-05',
    purpose: 'Explore technology projects with social impact.',
    proctor: 'Dr. R. Kumar',
    proctorRemark: 'Recommended for HOD review.',
    status: 'Forwarded to Event In-Charge',
  },
  {
    id: 'EG-2026-024',
    student: 'Diya Reddy',
    rollNo: 'AI2026XXY',
    department: 'Artificial Intelligence',
    year: '2nd Year',
    attendance: 71,
    event: 'National Robotics Workshop',
    organizer: 'Robotics Club',
    category: 'Workshop',
    venue: 'Engineering Block',
    city: 'Hyderabad',
    startDate: '2026-11-09',
    endDate: '2026-11-09',
    purpose: 'Learn introductory robotics concepts.',
    proctor: 'Dr. S. Reddy',
    proctorRemark: 'Not recommended: attendance is below the required threshold.',
    status: 'Rejected',
    decisionReason: 'The Proctor did not recommend this request.',
  },
]

const initialAttendanceLists = [
  {
    id: 'AL-2026-004',
    event: 'AI Innovation Hackathon',
    submittedBy: 'Technical Event In-Charge',
    submittedOn: '2026-10-10',
    eventDate: '2026-10-20 to 2026-10-21',
    studentCount: 12,
    documentName: 'AI_Innovation_Hackathon_Attendance_List.pdf',
    status: 'Pending HOD Approval',
    note: 'Official list of students selected to attend the event.',
  },
  {
    id: 'AL-2026-003',
    event: 'Data Science Bootcamp',
    submittedBy: 'Technical Event In-Charge',
    submittedOn: '2026-10-08',
    eventDate: '2026-10-25',
    studentCount: 8,
    documentName: 'Data_Science_Bootcamp_Student_List.pdf',
    status: 'Pending HOD Approval',
    note: 'Please verify the final participant list before authorization.',
  },
  {
    id: 'AL-2026-002',
    event: 'Tech for Good Conference',
    submittedBy: 'Technical Event In-Charge',
    submittedOn: '2026-10-02',
    eventDate: '2026-11-05',
    studentCount: 15,
    documentName: 'Tech_for_Good_Conference_List.pdf',
    status: 'Approved & Signed Off',
    note: 'List reviewed and approved for official processing.',
    decisionAt: '2026-10-03 11:20 AM',
  },
]

const statusTone = (status) => {
  if (['Approved & Signed Off', 'Forwarded to Event In-Charge', 'Approved'].includes(status)) return 'success'
  if (['Rejected'].includes(status)) return 'danger'
  if (['Returned for Correction'].includes(status)) return 'warning'
  return 'pending'
}

const prettyDate = (value) => {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function HODDashboard({ onBackToStudent }) {
  const [activeSection, setActiveSection] = useState('Overview')
  const [requests, setRequests] = useState(initialParticipationRequests)
  const [attendanceLists, setAttendanceLists] = useState(initialAttendanceLists)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedItem, setSelectedItem] = useState(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [toast, setToast] = useState('')

  const pendingRequests = requests.filter((item) => item.status === 'Pending HOD Review')
  const pendingLists = attendanceLists.filter((item) => item.status === 'Pending HOD Approval')
  const requestHistory = requests.filter((item) => item.status !== 'Pending HOD Review')
  const listHistory = attendanceLists.filter((item) => item.status !== 'Pending HOD Approval')

  const filteredRequests = useMemo(() => requests.filter((item) => {
    const matchesSearch = `${item.id} ${item.student} ${item.event} ${item.rollNo}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (statusFilter === 'All' || item.status === statusFilter)
  }), [requests, search, statusFilter])

  const filteredLists = useMemo(() => attendanceLists.filter((item) => {
    const matchesSearch = `${item.id} ${item.event} ${item.documentName}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (statusFilter === 'All' || item.status === statusFilter)
  }), [attendanceLists, search, statusFilter])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  const openItem = (type, item) => {
    setSelectedItem({ type, item })
    setDecisionReason('')
    setActionError('')
  }

  const closeModal = () => {
    setSelectedItem(null)
    setDecisionReason('')
    setActionError('')
  }

  const makeRequestDecision = (decision) => {
    if (!selectedItem || selectedItem.type !== 'request') return
    if (decision === 'Rejected' && !decisionReason.trim()) {
      setActionError('Please provide a reason before rejecting this request.')
      return
    }
    const now = new Date().toLocaleString('en-IN')
    setRequests((current) => current.map((item) => item.id === selectedItem.item.id
      ? { ...item, status: decision === 'Forwarded to Event In-Charge' ? decision : 'Rejected', decisionReason: decision === 'Rejected' ? decisionReason.trim() : '', hodDecisionAt: now }
      : item))
    notify(decision === 'Rejected' ? 'Request rejected.' : 'Request approved and forwarded to the Event In-Charge.')
    closeModal()
  }

  const makeAttendanceDecision = (decision) => {
    if (!selectedItem || selectedItem.type !== 'attendance') return
    if (decision === 'Returned for Correction' && !decisionReason.trim()) {
      setActionError('Please add correction remarks before returning this list.')
      return
    }
    const now = new Date().toLocaleString('en-IN')
    setAttendanceLists((current) => current.map((item) => item.id === selectedItem.item.id
      ? { ...item, status: decision, decisionAt: now, decisionNote: decision === 'Returned for Correction' ? decisionReason.trim() : 'Approved by HOD and recorded for official processing.' }
      : item))
    notify(decision === 'Approved & Signed Off' ? 'Attendance list approved and sign-off recorded.' : 'Attendance list returned for correction.')
    closeModal()
  }

  const downloadLetter = (item) => {
    const content = [
      'EVENT GATE — ATTENDANCE LIST SUBMISSION',
      '',
      `Reference: ${item.id}`,
      `Event: ${item.event}`,
      `Event date: ${item.eventDate}`,
      `Number of students: ${item.studentCount}`,
      `Submitted by: ${item.submittedBy}`,
      `Submitted on: ${item.submittedOn}`,
      `Document on record: ${item.documentName}`,
      '',
      'Note: This is a demo summary generated by the frontend. It is not the original uploaded official letter.',
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${item.id}_attendance-list-summary.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const navItems = [
    { label: 'Overview', icon: '◫' },
    { label: 'Participation Requests', icon: '▤', count: pendingRequests.length },
    { label: 'Attendance List Approvals', icon: '▣', count: pendingLists.length },
    { label: 'Approval History', icon: '↻' },
  ]

  const renderRequestRows = (items) => (
    <div className="hod-table-wrap">
      <table className="hod-table">
        <thead><tr><th>Student / Request</th><th>Event</th><th>Attendance</th><th>Proctor</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td><div className="hod-cell-primary">{item.student}</div><div className="hod-cell-secondary">{item.id} · {item.rollNo}</div></td>
              <td><div className="hod-cell-primary">{item.event}</div><div className="hod-cell-secondary">{prettyDate(item.startDate)} · {item.category}</div></td>
              <td><span className={`hod-attendance ${item.attendance < 75 ? 'low' : ''}`}>{item.attendance}%</span></td>
              <td>{item.proctor}</td>
              <td><span className={`hod-status ${statusTone(item.status)}`}>{item.status}</span></td>
              <td><button className="hod-btn hod-btn-outline hod-btn-small" onClick={() => openItem('request', item)}>Review</button></td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan="6"><div className="hod-empty">No participation requests match this view.</div></td></tr>}
        </tbody>
      </table>
    </div>
  )

  const renderAttendanceRows = (items) => (
    <div className="hod-table-wrap">
      <table className="hod-table">
        <thead><tr><th>Event / Reference</th><th>Event Date</th><th>Students</th><th>Submitted On</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td><div className="hod-cell-primary">{item.event}</div><div className="hod-cell-secondary">{item.id} · {item.documentName}</div></td>
              <td>{item.eventDate}</td>
              <td><span className="hod-student-count">{item.studentCount} students</span></td>
              <td>{prettyDate(item.submittedOn)}</td>
              <td><span className={`hod-status ${statusTone(item.status)}`}>{item.status}</span></td>
              <td><button className="hod-btn hod-btn-outline hod-btn-small" onClick={() => openItem('attendance', item)}>Review list</button></td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan="6"><div className="hod-empty">No attendance lists match this view.</div></td></tr>}
        </tbody>
      </table>
    </div>
  )

  const renderOverview = () => (
    <>
      <section className="hod-stats-grid">
        <div className="hod-stat-card"><div className="hod-stat-icon teal">▤</div><span>Pending Requests</span><strong>{pendingRequests.length}</strong><small>Awaiting HOD review</small></div>
        <div className="hod-stat-card"><div className="hod-stat-icon gold">▣</div><span>Attendance Lists</span><strong>{pendingLists.length}</strong><small>Awaiting sign-off</small></div>
        <div className="hod-stat-card"><div className="hod-stat-icon green">↗</div><span>Forwarded</span><strong>{requests.filter((item) => item.status === 'Forwarded to Event In-Charge').length}</strong><small>Sent for final decision</small></div>
        <div className="hod-stat-card"><div className="hod-stat-icon navy">✓</div><span>Lists Signed Off</span><strong>{attendanceLists.filter((item) => item.status === 'Approved & Signed Off').length}</strong><small>Approval recorded</small></div>
      </section>
      <section className="hod-overview-grid">
        <div className="hod-panel">
          <div className="hod-panel-heading"><div><h2>Participation Requests</h2><p>Proctor recommendations waiting for your decision.</p></div><button className="hod-text-btn" onClick={() => setActiveSection('Participation Requests')}>View all →</button></div>
          {renderRequestRows(pendingRequests.slice(0, 3))}
        </div>
        <div className="hod-panel hod-quick-panel">
          <div className="hod-panel-heading"><div><h2>Needs Your Attention</h2><p>Items awaiting HOD action.</p></div></div>
          <button className="hod-quick-item" onClick={() => setActiveSection('Participation Requests')}><span className="hod-quick-icon teal">▤</span><span><strong>Participation requests</strong><small>{pendingRequests.length} pending review</small></span><b>→</b></button>
          <button className="hod-quick-item" onClick={() => setActiveSection('Attendance List Approvals')}><span className="hod-quick-icon gold">▣</span><span><strong>Attendance list approvals</strong><small>{pendingLists.length} waiting for sign-off</small></span><b>→</b></button>
          <div className="hod-note"><strong>Approval workflow</strong><p>Proctor recommendation → HOD review → Technical Event In-Charge final decision.</p></div>
        </div>
      </section>
      <section className="hod-panel">
        <div className="hod-panel-heading"><div><h2>Attendance Lists Awaiting Approval</h2><p>Official student lists submitted by the Technical Event In-Charge.</p></div><button className="hod-text-btn" onClick={() => setActiveSection('Attendance List Approvals')}>Review lists →</button></div>
        {renderAttendanceRows(pendingLists.slice(0, 3))}
      </section>
    </>
  )

  const renderSection = () => {
    if (activeSection === 'Overview') return renderOverview()
    if (activeSection === 'Participation Requests') {
      return <section className="hod-panel"><div className="hod-panel-heading"><div><h2>Participation Requests</h2><p>Review requests that have reached the HOD stage.</p></div></div><div className="hod-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, event, or request ID..." /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{[...new Set(requests.map((item) => item.status))].map((status) => <option key={status}>{status}</option>)}</select></div>{renderRequestRows(filteredRequests)}</section>
    }
    if (activeSection === 'Attendance List Approvals') {
      return <section className="hod-panel"><div className="hod-panel-heading"><div><h2>Attendance List Approvals</h2><p>Review official participant lists sent by the Technical Event In-Charge.</p></div></div><div className="hod-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search event, document, or reference..." /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{[...new Set(attendanceLists.map((item) => item.status))].map((status) => <option key={status}>{status}</option>)}</select></div>{renderAttendanceRows(filteredLists)}</section>
    }
    return <section className="hod-panel"><div className="hod-panel-heading"><div><h2>Approval History</h2><p>Previously reviewed participation requests and attendance lists.</p></div></div><h3 className="hod-history-heading">Participation decisions</h3>{renderRequestRows(requestHistory)}<h3 className="hod-history-heading">Attendance list decisions</h3>{renderAttendanceRows(listHistory)}</section>
  }

  return (
    <div className="hod-app">
      <aside className="hod-sidebar">
        <div className="hod-brand"><div className="hod-brand-mark">EG</div><div><h2>Event Gate</h2><p>Event Participation Portal</p></div></div>
        <div className="hod-role-label">HOD WORKSPACE</div>
        <nav className="hod-nav">
          {navItems.map((item) => <button key={item.label} className={activeSection === item.label ? 'active' : ''} onClick={() => { setActiveSection(item.label); setSearch(''); setStatusFilter('All') }}><span className="hod-nav-icon">{item.icon}</span><span>{item.label}</span>{item.count > 0 && <b>{item.count}</b>}</button>)}
        </nav>
        <div className="hod-sidebar-bottom"><div className="hod-sidebar-avatar">HD</div><div><strong>Department HOD</strong><span>Approver workspace</span></div><button onClick={onBackToStudent} title="Return to student demo">↩</button></div>
      </aside>

      <main className="hod-main">
        <header className="hod-topbar">
          <div><p className="hod-eyebrow">DEPARTMENT ADMINISTRATION</p><h1>{activeSection}</h1><p className="hod-subtitle">Review participation requests and authorize official attendance lists.</p></div>
          <div className="hod-topbar-right"><span className="hod-date-chip">Academic Year 2026–27</span><div className="hod-profile-chip"><div className="hod-profile-avatar">HD</div><div><strong>Department HOD</strong><span>Head of Department</span></div></div></div>
        </header>
        {toast && <div className="hod-toast" role="status">✓ {toast}</div>}
        {renderSection()}
        <footer className="hod-footer">Event Gate <span>•</span> HOD Review Workspace <span>•</span> Demo data</footer>
      </main>

      {selectedItem && <div className="hod-modal-overlay" onClick={closeModal}><section className="hod-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className="hod-modal-header"><div><span className="hod-modal-kicker">{selectedItem.type === 'request' ? 'PARTICIPATION REQUEST' : 'ATTENDANCE LIST APPROVAL'}</span><h2>{selectedItem.type === 'request' ? selectedItem.item.event : selectedItem.item.event}</h2><p>Reference: {selectedItem.item.id}</p></div><button className="hod-modal-close" onClick={closeModal} aria-label="Close dialog">×</button></header>
        {selectedItem.type === 'request' ? <div className="hod-modal-body">
          <div className="hod-detail-grid">
            <div><span>Student</span><strong>{selectedItem.item.student}</strong></div><div><span>Roll number</span><strong>{selectedItem.item.rollNo}</strong></div>
            <div><span>Department / Year</span><strong>{selectedItem.item.department} · {selectedItem.item.year}</strong></div><div><span>Attendance</span><strong className={selectedItem.item.attendance < 75 ? 'hod-danger-text' : 'hod-good-text'}>{selectedItem.item.attendance}%</strong></div>
            <div><span>Event date</span><strong>{prettyDate(selectedItem.item.startDate)} – {prettyDate(selectedItem.item.endDate)}</strong></div><div><span>Venue</span><strong>{selectedItem.item.venue}, {selectedItem.item.city}</strong></div>
            <div><span>Reviewed by Proctor</span><strong>{selectedItem.item.proctor}</strong></div><div><span>Current status</span><strong>{selectedItem.item.status}</strong></div>
          </div>
          <div className="hod-detail-note"><strong>Student's purpose</strong><p>{selectedItem.item.purpose}</p></div>
          <div className="hod-detail-note"><strong>Proctor recommendation / remarks</strong><p>{selectedItem.item.proctorRemark}</p></div>
          {selectedItem.item.status === 'Pending HOD Review' ? <><div className="hod-form-field"><label htmlFor="hod-request-reason">Rejection reason <span>(required only if rejecting)</span></label><textarea id="hod-request-reason" value={decisionReason} onChange={(event) => { setDecisionReason(event.target.value); setActionError('') }} placeholder="Explain why this request should be rejected..." rows="3" /></div>{actionError && <p className="hod-action-error">{actionError}</p>}<div className="hod-modal-actions"><button className="hod-btn hod-btn-danger" onClick={() => makeRequestDecision('Rejected')}>Reject Request</button><button className="hod-btn hod-btn-primary" onClick={() => makeRequestDecision('Forwarded to Event In-Charge')}>Approve & Forward →</button></div></> : <div className="hod-readonly-status"><strong>Decision recorded</strong><p>{selectedItem.item.decisionReason || 'This request has already been reviewed by the HOD.'}</p>{selectedItem.item.hodDecisionAt && <small>{selectedItem.item.hodDecisionAt}</small>}</div>}
        </div> : <div className="hod-modal-body">
          <div className="hod-detail-grid">
            <div><span>Event</span><strong>{selectedItem.item.event}</strong></div><div><span>Event date</span><strong>{selectedItem.item.eventDate}</strong></div>
            <div><span>Students on list</span><strong>{selectedItem.item.studentCount} students</strong></div><div><span>Submitted by</span><strong>{selectedItem.item.submittedBy}</strong></div>
            <div><span>Submitted on</span><strong>{prettyDate(selectedItem.item.submittedOn)}</strong></div><div><span>Reference</span><strong>{selectedItem.item.id}</strong></div>
          </div>
          <div className="hod-document-card"><div className="hod-document-icon">PDF</div><div className="hod-document-info"><strong>{selectedItem.item.documentName}</strong><span>Document listed in this demo record</span></div><button className="hod-btn hod-btn-outline" onClick={() => downloadLetter(selectedItem.item)}>Download summary</button></div>
          <div className="hod-detail-note"><strong>Submission note</strong><p>{selectedItem.item.note}</p></div>
          <div className="hod-signoff-note"><span>✓</span><div><strong>Approve & Sign Off</strong><p>Records the HOD decision, date, and time. This demo records an approval; it does not create a legally certified digital signature.</p></div></div>
          {selectedItem.item.status === 'Pending HOD Approval' ? <><div className="hod-form-field"><label htmlFor="hod-list-reason">Correction remarks <span>(required if returning)</span></label><textarea id="hod-list-reason" value={decisionReason} onChange={(event) => { setDecisionReason(event.target.value); setActionError('') }} placeholder="Describe the correction needed in the attendance list..." rows="3" /></div>{actionError && <p className="hod-action-error">{actionError}</p>}<div className="hod-modal-actions"><button className="hod-btn hod-btn-danger-outline" onClick={() => makeAttendanceDecision('Returned for Correction')}>Return for Correction</button><button className="hod-btn hod-btn-primary" onClick={() => makeAttendanceDecision('Approved & Signed Off')}>Approve & Sign Off ✓</button></div></> : <div className="hod-readonly-status"><strong>{selectedItem.item.status}</strong><p>{selectedItem.item.decisionNote || 'Decision recorded.'}</p><small>{selectedItem.item.decisionAt || ''}</small></div>}
        </div>}
      </section></div>}
    </div>
  )
}

export default HODDashboard