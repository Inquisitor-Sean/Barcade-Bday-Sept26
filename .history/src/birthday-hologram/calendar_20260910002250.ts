import { event, invitationUrl } from '../event'
export function calendarReady() {
  return (
    event.startsAt.startsWith(`${event.date}T`) &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d-07:00$/.test(
      event.startsAt,
    ) &&
    Number.isFinite(Date.parse(event.startsAt)) &&
    Date.parse(event.endsAt) > Date.parse(event.startsAt)
  )
}
const stamp = (date: string | Date) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
const escape = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
export function calendarLinks(description: string) {
  if (!calendarReady()) return { google: '', outlook: '' }
  const common = {
    text: 'Sean’s birthday at Barcade',
    dates: `${stamp(event.startsAt)}/${stamp(event.endsAt)}`,
    details: description,
    location: event.address,
    ctz: event.timeZone,
  }
  return {
    google: `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', ...common })}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: common.text, startdt: event.startsAt, enddt: event.endsAt, body: description, location: event.address })}`,
  }
}
export function makeCalendar(description: string) {
  if (!calendarReady()) throw new Error('Start time is not confirmed')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sean//After Hours//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:sean-birthday-20260926@afterhours.local',
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    'SUMMARY:Sean’s birthday at Barcade',
    `LOCATION:${escape(event.address)}`,
    `DESCRIPTION:${escape(description)}`,
    `URL:${invitationUrl()}`,
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Sean’s birthday at Barcade in three days',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return (
    lines
      .map((line) => {
        let size = 0,
          result = ''
        for (const char of line) {
          const bytes = new TextEncoder().encode(char).length
          if (size + bytes > 75) {
            result += '\r\n '
            size = 1
          }
          result += char
          size += bytes
        }
        return result
      })
      .join('\r\n') + '\r\n'
  )
}
export function downloadCalendar(description: string) {
  const url = URL.createObjectURL(
    new Blob([makeCalendar(description)], {
      type: 'text/calendar;charset=utf-8',
    }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'Sean-Barcade-September-26.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
