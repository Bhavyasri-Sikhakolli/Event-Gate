import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAttendanceCsv } from '../src/attendanceCsv.js'

test('parses a valid attendance CSV row', () => {
const csv = `Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of
22CS001,100,85,85%,12-10-2026`

const result = parseAttendanceCsv(csv)

assert.deepEqual(result, [
{
roll_no: '22CS001',
classes_conducted: 100,
classes_attended: 85,
attendance_pct: 85,
data_as_of: '2026-10-12',
},
])
})

test('rejects attendance percentages above 100', () => {
const csv = `Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of
22CS001,100,85,105%,12-10-2026`

assert.throws(
() => parseAttendanceCsv(csv),
/attendance percentage must be 0–100/,
)
})

test('rejects percentages that do not match class counts', () => {
const csv = `Roll Number,Classes Conducted,Classes Attended,Attendance Percentage,Data As Of
22CS001,100,85,70%,12-10-2026`

assert.throws(
() => parseAttendanceCsv(csv),
/percentage does not match class counts/,
)
})
