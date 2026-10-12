import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAttendanceCsv } from '../src/attendanceCsv.js'

test('parses a valid attendance CSV row and normalizes its date', () => {
  const csv = `Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of
22CS001,100,85,85%,12-10-2026`

  const result = parseAttendanceCsv(csv)

  assert.deepEqual(result.rows, [
    {
      row: 2,
      roll_no: '22CS001',
      classes_conducted: 100,
      classes_attended: 85,
      attendance_pct: 85,
      data_as_of: '2026-10-12',
    },
  ])
  assert.deepEqual(result.errors, [])
})

test('reports out-of-range percentages as row errors', () => {
  const csv = `Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of
22CS001,100,85,105%,12-10-2026`

  const result = parseAttendanceCsv(csv)

  assert.deepEqual(result.errors, [
    {
      row: 2,
      roll_no: '22CS001',
      field: 'attendance_pct',
      code: 'range',
      error: 'Attendance Percentage must be between 0 and 100',
    },
  ])
})

test('reports percentages inconsistent with class counts', () => {
  const csv = `Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of
22CS001,100,85,70%,12-10-2026`

  const result = parseAttendanceCsv(csv)

  assert.equal(result.errors[0].code, 'inconsistent')
  assert.match(result.errors[0].error, /does not match class counts/)
})

test('allows an omitted percentage and reports duplicate rolls by row', () => {
  const csv = `Roll Number,Classes Conducted,Classes Attended,Data As Of
22CS001,100,85,2026-10-12
22cs001,100,80,2026-10-12`

  const result = parseAttendanceCsv(csv)

  assert.equal(result.rows[0].attendance_pct, null)
  assert.deepEqual(result.errors, [
    {
      row: 3,
      roll_no: '22CS001',
      field: 'roll_no',
      code: 'duplicate',
      error: 'Duplicate roll number in file',
    },
  ])
})

test('rejects files with missing required headers or no data rows', () => {
  assert.throws(
    () => parseAttendanceCsv('Roll Number,Classes Attended\n22CS001,85'),
    /Missing CSV headers: Classes Conducted, Data As Of/,
  )
  assert.throws(
    () =>
      parseAttendanceCsv(
        'Roll Number,Classes Conducted,Classes Attended,Data As Of\n',
      ),
    /no data rows/,
  )
})
