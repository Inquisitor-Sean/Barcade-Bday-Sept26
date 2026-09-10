// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { event } from './event'
import { calendarLinks, calendarReady, makeCalendar } from './calendar'
const originalStart = event.startsAt
const originalEnd = event.endsAt
afterEach(() => {
  event.startsAt = originalStart
  event.endsAt = originalEnd
})
it('never creates a calendar event from a placeholder or a previous date', () => {
  for (const value of [
    '',
    '2026-09-19T19:00:00-07:00',
    '2026-09-26T24:00:00-07:00',
    '2026-09-26T19:00:00-08:00',
  ]) {
    event.startsAt = value
    expect(calendarReady()).toBe(false)
    expect(calendarLinks('')).toEqual({ google: '', outlook: '' })
    expect(() => makeCalendar('')).toThrow()
  }
})
it('keeps the September 26 LA evening and following-day 1am finish across calendar providers', () => {
  // This start time is a test fixture, not the event's configured arrival time.
  event.startsAt = '2026-09-26T19:00:00-07:00'
  const links = calendarLinks('Bring friends & your ID.')
  expect(new URL(links.google).searchParams.get('dates')).toBe(
    '20260927T020000Z/20260927T080000Z',
  )
  expect(new URL(links.google).searchParams.get('ctz')).toBe(
    'America/Los_Angeles',
  )
  expect(new URL(links.outlook).searchParams.get('enddt')).toBe(
    '2026-09-27T01:00:00-07:00',
  )
  const ics = makeCalendar(
    'Bring friends, no gifts; café.\n' + 'Español '.repeat(40),
  )
  expect(ics).toContain('DTSTART:20260927T020000Z\r\n')
  expect(ics).toContain('DTEND:20260927T080000Z\r\n')
  expect(ics).toContain('TRIGGER:-P3D')
  expect(ics).toContain('Bring friends\\, no gifts\\; café.\\n')
  expect(
    ics
      .split('\r\n')
      .every((line) => new TextEncoder().encode(line).length <= 75),
  ).toBe(true)
  event.endsAt = event.startsAt
  expect(calendarReady()).toBe(false)
})
