export const event = {
  host: 'Sean',
  level: 37,
  date: '2026-09-26',
  startsAt: '2026-09-26T21:30:00-07:00',
  endsAt: '2026-09-27T01:00:00-07:00',
  timeZone: 'America/Los_Angeles',
  venue: 'Barcade Los Angeles',
  address: '5684 York Boulevard, Los Angeles, CA 90042',
  phone: '+13232744798',
  venueUrl: 'https://barcade.com/location/los-angeles',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=5684%20York%20Boulevard%2C%20Los%20Angeles%2C%20CA%2090042',
  backupUrl: 'https://letshang.co/events/d42da050-aca4-11f1-ac07-277190b21f9f',
  driveUrl:
    'https://drive.google.com/drive/folders/1o-mrP1tr9o0NX9e6EIWeH6noDUp0s9LL',
  instagramUrl: 'https://www.instagram.com/sean_allan_/',
  twitchUrl: 'https://www.twitch.tv/inquisitor_sean',
  publishedUrl: '',
  communityEndpoint: '',
  additionalLink: '',
}

export function invitationUrl() {
  return event.publishedUrl || new URL('./', window.location.href).href
}

export function publicAsset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
