import { parse } from 'csv-parse/sync'

const MAX_ROWS = 1000
const MAX_ROLL_NUMBER_LENGTH = 100
const REQUIRED_HEADERS = [
  'Roll Number',
  'Classes Conducted',
  'Classes Attended',
  'Data As Of',
]

function normalizeDate(value) {
  let year
  let month
  let day

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split('-')
    year = parts[0]
    month = parts[1]
    day = parts[2]
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const parts = value.split('-')
    day = parts[0]
    month = parts[1]
    year = parts[2]
  } else {
    return null
  }

  const normalized = `${year}-${month}-${day}`
  const date = new Date(`${normalized}T00:00:00Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    return null
  }

  return normalized
}

function addError(errors, row, roll_no, field, code, error) {
  errors.push({ row, roll_no: roll_no || null, field, code, error })
}

function validateRow(row, rowNumber, seenRollNumbers, errors) {
  const roll_no = String(row.roll_no ?? '').trim()
  const conductedText = String(row.classes_conducted ?? '').trim()
  const attendedText = String(row.classes_attended ?? '').trim()
  const sourceDate = String(row.data_as_of ?? '').trim()
  const pctText = String(row.attendance_pct ?? '').trim().replace(/%$/, '')
  const classes_conducted = /^\d+$/.test(conductedText)
    ? Number(conductedText)
    : null
  const classes_attended = /^\d+$/.test(attendedText)
    ? Number(attendedText)
    : null
  const normalizedDate = normalizeDate(sourceDate)
  const data_as_of = normalizedDate ?? sourceDate
  let attendance_pct = pctText

  if (!roll_no) {
    addError(errors, rowNumber, null, 'roll_no', 'required', 'Roll Number is required')
  } else if (roll_no.length > MAX_ROLL_NUMBER_LENGTH) {
    addError(
      errors,
      rowNumber,
      roll_no,
      'roll_no',
      'length',
      `Roll Number cannot exceed ${MAX_ROLL_NUMBER_LENGTH} characters`,
    )
  } else {
    const normalizedRoll = roll_no.toUpperCase()
    if (seenRollNumbers.has(normalizedRoll)) {
      addError(
        errors,
        rowNumber,
        normalizedRoll,
        'roll_no',
        'duplicate',
        'Duplicate roll number in file',
      )
    } else {
      seenRollNumbers.add(normalizedRoll)
    }
  }

  if (classes_conducted === null || classes_attended === null) {
    addError(
      errors,
      rowNumber,
      roll_no,
      'classes',
      'integer',
      'Class counts must be whole, non-negative numbers',
    )
  } else if (classes_attended > classes_conducted) {
    addError(
      errors,
      rowNumber,
      roll_no,
      'classes_attended',
      'exceeds_conducted',
      'Classes attended cannot exceed classes conducted',
    )
  }

  if (!normalizedDate) {
    addError(
      errors,
      rowNumber,
      roll_no,
      'data_as_of',
      'date',
      'Data As Of must be a valid YYYY-MM-DD or DD-MM-YYYY date',
    )
  } else if (normalizedDate > new Date().toISOString().slice(0, 10)) {
    addError(
      errors,
      rowNumber,
      roll_no,
      'data_as_of',
      'future_date',
      'Data As Of date cannot be in the future',
    )
  }

  if (pctText !== '') {
    const percentage = Number(pctText)
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      addError(
        errors,
        rowNumber,
        roll_no,
        'attendance_pct',
        'range',
        'Attendance Percentage must be between 0 and 100',
      )
    } else {
      attendance_pct = percentage
      if (
        classes_conducted > 0 &&
        classes_attended !== null &&
        Math.abs(
          percentage -
            Math.round(
              (classes_attended / classes_conducted) * 100 * 100,
            ) /
              100,
        ) > 1
      ) {
        addError(
          errors,
          rowNumber,
          roll_no,
          'attendance_pct',
          'inconsistent',
          'Attendance Percentage does not match class counts',
        )
      }
    }
  } else {
    attendance_pct = null
  }

  return {
    row: rowNumber,
    roll_no,
    classes_conducted: classes_conducted ?? conductedText,
    classes_attended: classes_attended ?? attendedText,
    attendance_pct,
    data_as_of,
  }
}

export function parseAttendanceCsv(csvText) {
  if (typeof csvText !== 'string') {
    throw new Error('CSV file must be UTF-8 text')
  }

  let headers = []
  const records = parse(csvText, {
    bom: true,
    columns: (rawHeaders) => {
      headers = rawHeaders.map((header) => header.trim())
      const missing = REQUIRED_HEADERS.filter(
        (header) => !headers.includes(header),
      )
      if (missing.length) {
        throw new Error(`Missing CSV headers: ${missing.join(', ')}`)
      }
      if (new Set(headers).size !== headers.length) {
        throw new Error('CSV headers must not contain duplicates')
      }
      return headers
    },
    info: true,
    skip_empty_lines: true,
    trim: true,
  })

  if (records.length === 0) {
    throw new Error('CSV file contains no data rows')
  }
  if (records.length > MAX_ROWS) {
    throw new Error(`CSV file cannot contain more than ${MAX_ROWS} data rows`)
  }

  const errors = []
  const seenRollNumbers = new Set()
  const rows = records.map(({ record, info }) =>
    validateRow(
      {
        roll_no: record['Roll Number'],
        classes_conducted: record['Classes Conducted'],
        classes_attended: record['Classes Attended'],
        attendance_pct: record['Attendance Percentage'],
        data_as_of: record['Data As Of'],
      },
      info.lines,
      seenRollNumbers,
      errors,
    ),
  )

  return { rows, errors }
}
