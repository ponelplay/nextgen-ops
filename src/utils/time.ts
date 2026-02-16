import { format, parseISO } from 'date-fns'

export function formatLocalTime(utcDate: string, timezoneOffset: number): string {
  const utc = parseISO(utcDate.replace('Z', ''))
  const local = new Date(utc.getTime() + timezoneOffset * 60 * 60 * 1000)
  return format(local, 'HH:mm')
}

export function formatLocalDate(utcDate: string, timezoneOffset: number): string {
  const utc = parseISO(utcDate.replace('Z', ''))
  const local = new Date(utc.getTime() + timezoneOffset * 60 * 60 * 1000)
  return format(local, 'yyyy-MM-dd')
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, MMM d')
}

export function formatDisplayDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, MMM d · HH:mm')
}

export function getLocalDateFromUTC(utcDate: string, tz: number): Date {
  const utc = parseISO(utcDate.replace('Z', ''))
  return new Date(utc.getTime() + tz * 60 * 60 * 1000)
}
