// === EuroLeague API types ===

export interface ApiGame {
  id: string
  identifier: string
  gameCode: number
  season: {
    name: string
    code: string
    alias: string
    competitionCode: string
    year: number
  }
  group: {
    id: string
    order: number
    name: string
    rawName: string
  }
  phaseType: {
    code: string
    alias: string
    name: string
    isGroupPhase: boolean
  }
  round: number
  roundAlias: string
  roundName: string
  played: boolean
  date: string
  confirmedDate: boolean
  confirmedHour: boolean
  localTimeZone: number
  localDate: string
  utcDate: string
  local: ApiTeamInGame
  road: ApiTeamInGame
  audience: number
  venue: {
    name: string
    code: string
    capacity: number
    address: string
  }
  gameStatus: string
  winner: string | null
}

export interface ApiTeamInGame {
  club: {
    code: string
    name: string
    abbreviatedName: string
    editorialName: string
    tvCode: string
    isVirtual: boolean
    images: { crest: string }
  }
  score: number
  standingsScore: number
  partials: {
    partials1: number
    partials2: number
    partials3: number
    partials4: number
  }
}

export interface ApiClub {
  code: string
  name: string
  abbreviatedName: string
  editorialName: string
  tvCode: string
  isVirtual: boolean
  images: { crest: string }
  country: { code: string; name: string }
  city: string | null
}

// === App domain types ===

export interface Tournament {
  id: string
  name: string
  city: string
  country: string
  seasonCode: string
  venue: string
  startDate: string
  endDate: string
  timezone: number
  status: 'upcoming' | 'active' | 'completed'
}

export interface Contact {
  id: string
  tournamentId: string | null
  name: string
  role: ContactRole
  organization: string
  phone: string
  email: string
  whatsapp: string
  telegram: string
  notes: string
}

export type ContactRole =
  | 'staff'
  | 'organization'
  | 'hotel'
  | 'transport'
  | 'team'
  | 'venue'
  | 'catering'
  | 'other'

export interface TeamInfo {
  id: string
  tournamentId: string
  clubCode: string // API club code, or 'STAFF' for EuroLeague staff
  teamName: string
  group: string
  arrivalDate: string
  departureDate: string
  hotel: string
  flightInfo: string
  dietaryNotes: string
  notes: string
}

export type PersonRole =
  | 'team_manager'
  | 'delegate'
  | 'head_coach'
  | 'assistant_coach'
  | 'player'
  | 'physio'
  | 'doctor'
  | 'other'
  // Staff-specific roles
  | 'staff_director'
  | 'staff_logistics'
  | 'staff_operations'
  | 'staff_referee'
  | 'staff_competition'
  | 'staff_officiating'
  | 'staff_media'
  | 'staff_it'
  | 'staff_other'

export interface Person {
  id: string
  tournamentId: string
  teamId: string // links to TeamInfo.id or 'STAFF'
  clubCode: string // API club code or 'STAFF'
  name: string
  role: PersonRole
  nationality: string
  passportNumber: string
  passportExpiry: string
  dateOfBirth: string
  phone: string
  email: string
  whatsapp: string
  // Travel
  arrivalDate: string
  arrivalTime: string
  arrivalFlight: string
  departureDate: string
  departureTime: string
  departureFlight: string
  // Accommodation
  hotel: string
  roomNumber: string
  roomType: string // single, double, twin, etc.
  // Health & dietary
  allergies: string
  dietaryNeeds: string
  medicalNotes: string
  // Other
  shirtSize: string
  notes: string
}

// Helper to check if a person is a "key contact" Andrea might need to reach
export function isKeyContact(role: PersonRole): boolean {
  return ['team_manager', 'delegate', 'head_coach', 'physio', 'doctor'].includes(role)
}

export interface Transfer {
  id: string
  tournamentId: string
  date: string
  time: string
  fromLocation: string
  toLocation: string
  teamId: string | null
  teamName: string
  driverName: string
  driverPhone: string
  vehicleInfo: string
  pax: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes: string
}

export interface Task {
  id: string
  tournamentId: string
  category: 'pre_tournament' | 'daily' | 'game_day' | 'post_tournament'
  title: string
  description: string
  dueDate: string
  dueTime: string
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes: string
}

export interface DailyEvent {
  id: string
  tournamentId: string
  date: string
  time: string
  endTime: string
  type: 'game' | 'meal' | 'transfer' | 'meeting' | 'arrival' | 'departure' | 'practice' | 'other'
  title: string
  description: string
  teamId: string | null
  teamName: string
  location: string
  notes: string
}
