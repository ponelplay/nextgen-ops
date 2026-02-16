import type { Tournament } from '../types'

// === Key Places per tournament ===
export interface Place {
  name: string
  type: 'venue' | 'hotel' | 'hospital' | 'transport' | 'restaurant' | 'airport' | 'other'
  address: string
  phone: string
  mapsUrl: string // Google Maps link
  notes: string
}

export const PLACES: Record<string, Place[]> = {
  'abu-dhabi-2026': [
    {
      name: 'SPACE42 Arena',
      type: 'venue',
      address: 'Yas Island, Abu Dhabi, UAE',
      phone: '',
      mapsUrl: 'https://maps.google.com/?q=SPACE42+Arena+Yas+Island+Abu+Dhabi',
      notes: 'Main venue for all games',
    },
    {
      name: 'W Abu Dhabi - Yas Island',
      type: 'hotel',
      address: 'Yas Island, Abu Dhabi, UAE',
      phone: '+971-2-656-0000',
      mapsUrl: 'https://maps.google.com/?q=W+Abu+Dhabi+Yas+Island',
      notes: 'Teams hotel (TBC)',
    },
    {
      name: 'Hilton Abu Dhabi Yas Island',
      type: 'hotel',
      address: 'Yas Island, Abu Dhabi, UAE',
      phone: '+971-2-208-6000',
      mapsUrl: 'https://maps.google.com/?q=Hilton+Abu+Dhabi+Yas+Island',
      notes: 'Staff hotel (TBC)',
    },
    {
      name: 'Abu Dhabi International Airport (AUH)',
      type: 'airport',
      address: 'Abu Dhabi, UAE',
      phone: '+971-2-505-5555',
      mapsUrl: 'https://maps.google.com/?q=Abu+Dhabi+International+Airport',
      notes: 'Main airport · Terminal A (new)',
    },
    {
      name: 'Cleveland Clinic Abu Dhabi',
      type: 'hospital',
      address: 'Al Maryah Island, Abu Dhabi, UAE',
      phone: '+971-2-501-9000',
      mapsUrl: 'https://maps.google.com/?q=Cleveland+Clinic+Abu+Dhabi',
      notes: 'Nearest major hospital',
    },
    {
      name: 'Abu Dhabi Taxi (TransAD)',
      type: 'transport',
      address: '',
      phone: '+971-600-535353',
      mapsUrl: '',
      notes: 'Official taxi service · Also use Careem/Uber apps',
    },
  ],
  'bologna-2026': [],
  'belgrade-2026': [],
}

export const TOURNAMENTS: Tournament[] = [
  {
    id: 'abu-dhabi-2026',
    name: 'NextGen Abu Dhabi',
    city: 'Abu Dhabi',
    country: 'UAE',
    seasonCode: 'JTA25',
    venue: 'SPACE42',
    startDate: '2026-02-27',
    endDate: '2026-03-01',
    timezone: 4,
    status: 'upcoming',
  },
  {
    id: 'bologna-2026',
    name: 'NextGen Bologna',
    city: 'Bologna',
    country: 'Italy',
    seasonCode: 'JTB25',
    venue: 'TBC',
    startDate: '2026-04-01', // placeholder
    endDate: '2026-04-03',
    timezone: 2,
    status: 'upcoming',
  },
  {
    id: 'belgrade-2026',
    name: 'NextGen Belgrade',
    city: 'Belgrade',
    country: 'Serbia',
    seasonCode: 'JTO25',
    venue: 'TBC',
    startDate: '2026-05-01', // placeholder
    endDate: '2026-05-03',
    timezone: 2,
    status: 'upcoming',
  },
]

// === Practice schedule per tournament ===
// Thursday practice day — one slot per team, times TBD until Andrea confirms
export interface PracticeSlot {
  date: string
  localTime: string // empty = TBD
  endTime: string   // empty = TBD
  teamName: string
  clubCode: string
  venue: string
}

export const PRACTICE_SCHEDULES: Record<string, PracticeSlot[]> = {
  'abu-dhabi-2026': [
    // Thursday Feb 26 — practice day (times TBD)
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
    { date: '2026-02-26', localTime: '', endTime: '', teamName: 'TBD', clubCode: '', venue: 'SPACE42' },
  ],
  'bologna-2026': [],
  'belgrade-2026': [],
}

// === Standard route templates for auto-generating transfers ===
export function getLocationNames(tournamentId: string) {
  const places = PLACES[tournamentId] || []
  const venue = places.find((p) => p.type === 'venue')?.name || 'Venue'
  const airport = places.find((p) => p.type === 'airport')?.name || 'Airport'
  const teamHotel = places.find((p) => p.type === 'hotel' && p.notes?.toLowerCase().includes('team'))?.name
    || places.find((p) => p.type === 'hotel')?.name || 'Hotel'
  const staffHotel = places.find((p) => p.type === 'hotel' && p.notes?.toLowerCase().includes('staff'))?.name
    || teamHotel
  return { venue, airport, teamHotel, staffHotel }
}

// Sunday knockout schedule — known times, matchups TBD based on group results
// These are shown in the app alongside API games
export interface KnockoutSlot {
  date: string
  localTime: string // local time in tournament timezone
  label: string
  venue: string
}

export const ABU_DHABI_KNOCKOUTS: KnockoutSlot[] = [
  {
    date: '2026-03-01',
    localTime: '10:00',
    label: '7th Place Game',
    venue: 'SPACE42',
  },
  {
    date: '2026-03-01',
    localTime: '12:15',
    label: '5th Place Game',
    venue: 'SPACE42',
  },
  {
    date: '2026-03-01',
    localTime: '14:30',
    label: '3rd Place Game',
    venue: 'SPACE42',
  },
  {
    date: '2026-03-01',
    localTime: '17:00',
    label: 'Final · F4 Ticket',
    venue: 'SPACE42',
  },
]
