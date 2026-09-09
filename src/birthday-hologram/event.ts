export interface InviteEvent {
  host: string
  title: string
  startsAt: string
  endsAt: string
  timeZone: string
  venue: string
  address: string
}

export const inviteEvent: InviteEvent = {
  host: '[YOUR NAME]',
  title: 'Birthday night at the arcade bar',
  startsAt: '',
  endsAt: '',
  timeZone: 'America/Los_Angeles',
  venue: '',
  address: '',
}

export const birthday = { level: 37, daysSurvived: '13,505' }

export const thingsToKnow =
  'Bring ID. No gifts. My real birthday was September 10th, so you can stop asking.'

export const forTheRecord =
  'I’ll have a couple drinks, if at all. When I do, my stomach writes to its congressmen. Weed is my chosen crutch.'
export const shareLinks = {
  invitationUrl: '',
  invitationQr: '',
  calendarUrl: '',
  calendarQr: '',
}