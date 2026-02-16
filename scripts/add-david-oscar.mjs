import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: node scripts/add-david-oscar.mjs your@email.com your-password')
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

// Check for duplicates first
const { data: existing } = await supabase
  .from('people')
  .select('name, club_code')
  .eq('tournament_id', 'abu-dhabi-2026')

const existingKeys = new Set((existing || []).map((p) => `${p.name}::${p.club_code}`))

const people = [
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'David Hein',
    role: 'staff_media',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    phone: '+4917622807199',
    email: 'heinnews@gmx.de',
    whatsapp: '+4917622807199',
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
    dietary_needs: 'Vegan',
    medical_notes: '',
    shirt_size: '',
    notes: 'EL Staff (Ext) - Media/Editor',
  },
  {
    tournament_id: 'abu-dhabi-2026',
    team_id: 'STAFF',
    club_code: 'STAFF',
    name: 'Oscar Argemí',
    role: 'staff_commercial',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    phone: '+34661905224',
    email: 'oscar.argemi@euroleague.net',
    whatsapp: '+34661905224',
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
    notes: 'EL Staff - Accounts Manager, Commercial Partnerships · ADIDAS liaison',
  },
]

// Filter out duplicates
const toInsert = people.filter((p) => {
  const key = `${p.name}::${p.club_code}`
  if (existingKeys.has(key)) {
    console.log(`⏭ Skipping ${p.name} (already exists)`)
    return false
  }
  return true
})

if (toInsert.length === 0) {
  console.log('✓ Both people already exist, nothing to insert.')
  process.exit(0)
}

const { data, error } = await supabase.from('people').insert(toInsert).select()

if (error) {
  console.error('Insert failed:', error.message)
  process.exit(1)
}

console.log(`✓ Inserted ${data.length} people:`)
for (const p of data) {
  console.log(`  - ${p.name} (${p.role}) ${p.notes}`)
}

process.exit(0)
