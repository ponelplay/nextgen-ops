import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: node check-people.mjs email password')
  process.exit(1)
}

const supabase = createClient(
  'https://hmrokmzgrspfcxxsvnpo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtcm9rbXpncnNwZmN4eHN2bnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzU5MDMsImV4cCI6MjA4NjgxMTkwM30.B4LipCKDDzJJ1ogmW1JpsdB2Yq5RF00VVhfG_1Ev8tM'
)

const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
if (authError) { console.error('Auth failed:', authError.message); process.exit(1) }

const { data, error } = await supabase.from('people').select('name, tournament_id, role')
if (error) { console.error(error.message); process.exit(1) }

console.log(`Found ${data.length} people:`)
for (const p of data) {
  console.log(`  - ${p.name} | tournament_id: ${p.tournament_id} | role: ${p.role}`)
}
process.exit(0)
