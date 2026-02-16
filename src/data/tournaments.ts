import type { Tournament } from '../types'

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
