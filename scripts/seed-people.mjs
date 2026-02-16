import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: node scripts/seed-people.mjs your@email.com your-password')
  process.exit(1)
}

const supabase = createClient(
  'https://hmrokmzgrspfcxxsvnpo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtcm9rbXpncnNwZmN4eHN2bnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzU5MDMsImV4cCI6MjA4NjgxMTkwM30.B4LipCKDDzJJ1ogmW1JpsdB2Yq5RF00VVhfG_1Ev8tM'
)

const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
if (authError) {
  console.error('Auth failed:', authError.message)
  process.exit(1)
}
console.log('✓ Authenticated as', email)

const people = [
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'Andrea Seara',
    role: 'staff_operations',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    phone: '+34661688041',
    email: 'Andrea.seara@eroleage.net',
    whatsapp: '+34661688041',
    arrival_date: '',
    arrival_time: '',
    arrival_flight: '',
    departure_date: '',
    departure_time: '',
    departure_flight: '',
    hotel: '',
    room_number: '',
    room_type: '',
    allergies: '',
    dietary_needs: '',
    medical_notes: '',
    shirt_size: '',
    notes: 'Legal Adviser, Business & Commercial Affairs (Events) · Producer for this event',
  },
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'Marc Ventura',
    role: 'staff_competition',
    nationality: 'ESP',
    passport_number: 'PAw415277',
    passport_expiry: '',
    date_of_birth: '',
    phone: '+34678562861',
    email: 'Marc.ventua@ext.eroleague.net',
    whatsapp: '+34678562861',
    arrival_date: '2026-02-26',
    arrival_time: '07:05',
    arrival_flight: 'EY114 · BCN 22:00 Feb 25 → AUH 07:05 Feb 26',
    departure_date: '2026-03-01',
    departure_time: '23:40',
    departure_flight: 'QR1055 · AUH 23:40 Mar 1',
    hotel: '',
    room_number: '',
    room_type: '',
    allergies: '',
    dietary_needs: '',
    medical_notes: '',
    shirt_size: '',
    notes: 'EL Staff (Ext) - Stats/Competition',
  },
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'Kostas Rigas',
    role: 'staff_officiating',
    nationality: 'GRE',
    passport_number: 'BB0013128',
    passport_expiry: '',
    date_of_birth: '',
    phone: '',
    email: '',
    whatsapp: '',
    arrival_date: '2026-02-26',
    arrival_time: '21:15',
    arrival_flight: 'A3 956 · Feb 26 14:35 → 21:15',
    departure_date: '2026-03-01',
    departure_time: '22:45',
    departure_flight: 'A3 956 · AUH 22:45 Mar 1',
    hotel: '',
    room_number: '',
    room_type: '',
    allergies: '',
    dietary_needs: '',
    medical_notes: '',
    shirt_size: '',
    notes: 'EL Staff (Ext) - Officiating Supervisor',
  },
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'Leo Mavris',
    role: 'staff_media',
    nationality: '',
    passport_number: 'N/A',
    passport_expiry: '',
    date_of_birth: '',
    phone: '+34607697387',
    email: 'leo.mavris@erolegue.net',
    whatsapp: '+34607697387',
    arrival_date: '2026-02-26',
    arrival_time: '19:15',
    arrival_flight: 'EY112 · BCN 10:00 Feb 26 → AUH 19:15 Feb 26',
    departure_date: '2026-03-02',
    departure_time: '02:40',
    departure_flight: 'EY11 · AUH 02:40 Mar 2',
    hotel: '',
    room_number: '',
    room_type: '',
    allergies: '',
    dietary_needs: '',
    medical_notes: '',
    shirt_size: '',
    notes: 'EL Staff - Social Media',
  },
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'Rok Bizjak',
    role: 'staff_director',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    phone: '+34607698193',
    email: 'rok.bizjak@euroleague.net',
    whatsapp: '+34607698193',
    arrival_date: '',
    arrival_time: '',
    arrival_flight: '',
    departure_date: '',
    departure_time: '',
    departure_flight: '',
    hotel: '',
    room_number: '',
    room_type: '',
    allergies: '',
    dietary_needs: '',
    medical_notes: '',
    shirt_size: '',
    notes: 'EL Tournament Director · Also EL Staff (Ext) Competition',
  },
]

const { data, error } = await supabase.from('people').insert(people).select()

if (error) {
  console.error('Insert failed:', error.message)
  process.exit(1)
}

console.log(`✓ Inserted ${data.length} people:`)
for (const p of data) {
  console.log(`  - ${p.name} (${p.role}) ${p.notes}`)
}

process.exit(0)
