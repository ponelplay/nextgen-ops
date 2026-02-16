import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: node fix-tournament-id.mjs your@email.com your-password')
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
console.log('✓ Authenticated')

// Fix tournament_id from 'JTA25' to 'abu-dhabi-2026'
const { data, error } = await supabase
  .from('people')
  .update({ tournament_id: 'abu-dhabi-2026' })
  .eq('tournament_id', 'JTA25')
  .select('name')

if (error) {
  console.error('Update failed:', error.message)
  process.exit(1)
}

console.log(`✓ Updated ${data.length} people:`)
for (const p of data) {
  console.log(`  - ${p.name}`)
}

process.exit(0)
