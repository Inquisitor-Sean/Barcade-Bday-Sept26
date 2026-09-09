import type { InviteEvent } from './event'

function validDate(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/.exec(value)

  if (!match) return false

  const [, year, month, day, hour, minute, second = '0'] = match
  const date = new Date(Date.UTC(+year, +month - 1, +day))

  return (
    date.getUTCFullYear() === +year &&
    date.getUTCMonth() === +month - 1 &&
    date.getUTCDate() === +day &&
    +hour < 24 &&
    +minute < 60 &&
    +second < 60 &&
    Number.isFinite(Date.parse(value))
  )
}

export function eventReady(event: InviteEvent) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: event.timeZone })

    return (
      validDate(event.startsAt) &&
      validDate(event.endsAt) &&
      Date.parse(event.endsAt) > Date.parse(event.startsAt) &&
      Boolean(event.title.trim() && event.venue.trim() && event.address.trim())
    )
  } catch {
    return false
  }
}

export function eventDate(event: InviteEvent, language: string) {
  if (!validDate(event.startsAt)) return ''

  try {
    return new Intl.DateTimeFormat(language, {
      timeZone: event.timeZone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(event.startsAt))
  } catch {
    return ''
  }
}

function stamp(value: string) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

export function googleCalendarUrl(
  event: InviteEvent,
  description: string,
) {
  if (!eventReady(event)) return ''

  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(event.startsAt)}/${stamp(event.endsAt)}`,
    details: description,
    location: `${event.venue}, ${event.address}`,
    ctz: event.timeZone,
  })

  return `https://calendar.google.com/calendar/render?${query}`
}