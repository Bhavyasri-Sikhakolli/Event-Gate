
import { parse } from 'csv-parse/sync'

function normalizeDate(value, line) {
  let year, month, day

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    [year, month, day] = value.split('-')
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    [day, month, year] = value.split('-')
  } else {
    throw new Error(
      `Row ${line}: Data As Of must use YYYY-MM-DD or DD-MM-YYYY`,
    )
  }

  const normalized = `${year}-${month}-${day}`
  const date = new Date(`${normalized}T00:00:00Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(`Row ${line}: invalid Data As Of date`)
  }

  return normalized
}

export function parseAttendanceCsv(csvText) {
  const requiredHeaders = [
    'Roll Number',
    'Classes Conducted',
    'Classes Attended',
    'Attendance Percentage',
    'Data As Of',
  ]

  const records = parse(csvText, {
    bom: true,
    columns: (headers) => {
      const normalized = headers.map((header) => header.trim())
      const missing = requiredHeaders.filter(
        (header) => !normalized.includes(header),
      )

      if (missing.length) {
        throw new Error(`Missing CSV headers: ${missing.join(', ')}`)
      }

      return normalized
    },
    skip_empty_lines: true,
    trim: true,
  })

  return records.map((row, index) => {
    const line = index + 2
    const roll_no = row['Roll Number']
    const classes_conducted = Number(row['Classes Conducted'])
    const classes_attended = Number(row['Classes Attended'])
    const pctText = row['Attendance Percentage'].replace(/%$/, '').trim()
    const attendance_pct = Number(pctText)
    const data_as_of = normalizeDate(row['Data As Of'], line)

    if (!roll_no) throw new Error(`Row ${line}: Roll Number is required`)

    if (
      !/^\d+$/.test(row['Classes Conducted']) ||
      !/^\d+$/.test(row['Classes Attended'])
    ) {
      throw new Error(`Row ${line}: class counts must be whole numbers`)
    }

    if (
      classes_conducted < 0 ||
      classes_attended < 0 ||
      classes_attended > classes_conducted
    ) {
      throw new Error(`Row ${line}: invalid class counts`)
    }

    if (
      !Number.isFinite(attendance_pct) ||
      attendance_pct < 0 ||
      attendance_pct > 100
    ) {
      throw new Error(`Row ${line}: attendance percentage must be 0–100`)
    }

    if (classes_conducted === 0 && attendance_pct !== 0) {
      throw new Error(
        `Row ${line}: percentage must be 0 when no classes were conducted`,
      )
    }

    if (
      classes_conducted > 0 &&
      Math.abs(
        attendance_pct - (classes_attended / classes_conducted) * 100,
      ) > 1
    ) {
      throw new Error(
        `Row ${line}: percentage does not match class counts`,
      )
    }

    return {
      roll_no,
      classes_conducted,
      classes_attended,
      attendance_pct,
      data_as_of,
    }
  })
}