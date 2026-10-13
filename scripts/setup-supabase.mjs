// One-time Supabase setup for the wedding admin panel.
// Creates storage buckets and the admin login from your `.env` file.
// The `content_overrides` table still needs one click in the dashboard:
// the script detects it is missing and prints the exact instruction.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const envPath = resolve(root, '.env')
const blank = process.env

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match && !(match[1] in blank) && !match[1].startsWith('#')) blank[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

const env = name => (blank[name] ?? '').trim()
const SUPABASE_URL = env('VITE_SUPABASE_URL').replace(/\/$/, '')
const SUPABASE_ANON = env('VITE_SUPABASE_ANON_KEY')
const SERVICE_ROLE = env('SUPABASE_SERVICE_ROLE_KEY')
const ADMIN_EMAIL = env('ADMIN_EMAIL').toLowerCase()
const ADMIN_PASSWORD = env('ADMIN_PASSWORD')

const fail = message => { console.error(`\n  ✗ ${message}\n`); process.exit(1) }

try { if (!/^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL)) throw new Error('bad url') } catch { fail('VITE_SUPABASE_URL must look like https://YOUR-PROJECT.supabase.co (project URLs end in .supabase.co)') }
if (!SUPABASE_ANON) fail('VITE_SUPABASE_ANON_KEY is missing. Copy the "anon" key from Project Settings -> API.')
if (!SERVICE_ROLE) fail('SUPABASE_SERVICE_ROLE_KEY is missing. Copy the "service_role" key from Project Settings -> API.')
if (!ADMIN_EMAIL.includes('@')) fail('ADMIN_EMAIL must be an email address.')
if (ADMIN_PASSWORD.length < 8) fail('ADMIN_PASSWORD must be at least 8 characters.')

const request = async (path, options = {}) => {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: options.auth === 'admin' ? SERVICE_ROLE : SUPABASE_ANON,
      Authorization: `Bearer ${options.auth === 'admin' ? SERVICE_ROLE : SUPABASE_ANON}`,
      ...(options.headers ?? {}),
    },
  })
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { status: response.status, body }
}

console.log(`\n  Supabase setup for ${new URL(SUPABASE_URL).host}\n`)

try {
  const ping = await request('/rest/v1/', { auth: 'admin', headers: { Prefer: 'return=minimal' } })
  if (ping.status >= 500) fail('Could not reach your Supabase project. Double-check the project URL.')
} catch (error) {
  fail(`Network error reaching Supabase (${error.message}). Is the project paused or the URL wrong?`)
}

const table = await request('/rest/v1/content_overrides?select=key&limit=1', { auth: 'admin', headers: { Prefer: 'return=minimal' } })
if (table.status >= 300 && table.status !== 404) {
  console.log(`  · content_overrides table returned HTTP ${table.status}; continuing (may already exist).`)
} else if (table.status === 404 || String(table.body ?? '').includes('does not exist') || String(table.body ?? '').includes('not found')) {
  console.log('  · content_overrides table is missing.')
  console.log('    → Open Supabase Dashboard → SQL Editor, paste the contents of\n      supabase/schema.sql and press Run. Then rerun this command.')
  process.exit(0)
} else {
  console.log('  ✓ content_overrides table is ready.')
}

const ensureBucket = async (name, hint) => {
  const existing = await request('/storage/v1/bucket', { auth: 'admin' })
  const ids = Array.isArray(existing.body) ? existing.body.map(bucket => bucket.id) : []
  if (ids.includes(name)) { console.log(`  ✓ storage bucket "${name}" exists.`); return }
  const created = await request('/storage/v1/bucket', { auth: 'admin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: name, name, public: true }) })
  if (created.status < 300) console.log(`  ✓ storage bucket "${name}" created.`)
  else { console.log(`  · could not create bucket "${name}" (HTTP ${created.status}); ${hint}`); console.log(`    ${String(created.body ?? '').slice(0, 200)}`) }
}

await ensureBucket('couple', 'you may want the storage policies in schema.sql.')
await ensureBucket('gallery', 'you may want the storage policies in schema.sql.')
await ensureBucket('albums', 'you may want the storage policies in supabase/migrations/0001_albums.sql.')

const albumsTable = await request('/rest/v1/albums?select=id&limit=1', { auth: 'admin', headers: { Prefer: 'return=minimal' } })
if (albumsTable.status === 404 || String(albumsTable.body ?? '').includes('does not exist') || String(albumsTable.body ?? '').includes('not found')) {
  console.log('  · albums table is missing.')
  console.log('    → Open Supabase Dashboard → SQL Editor, paste the contents of\n      supabase/migrations/0001_albums.sql and press Run. Then rerun this command.')
  process.exit(0)
} else if (albumsTable.status < 300) {
  console.log('  ✓ albums table is ready.')
} else {
  console.log(`  · albums table returned HTTP ${albumsTable.status}; continuing (may already exist).`)
}

const users = await request('/auth/v1/admin/users?per_page=200', { auth: 'admin' })
const list = users.status < 300 && Array.isArray(users.body?.users) ? users.body.users : []
const existingUser = list.find(user => user.email?.toLowerCase() === ADMIN_EMAIL)
if (existingUser) {
  console.log(`  ✓ admin login ${ADMIN_EMAIL} already exists.`)
} else {
  const created = await request('/auth/v1/admin/users', { auth: 'admin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true }) })
  if (created.status < 300) console.log(`  ✓ admin login ${ADMIN_EMAIL} created.`)
  else fail(`Could not create admin login (HTTP ${created.status}): ${String(created.body ?? '').slice(0, 300)}`)
}

console.log(`
  Done. Browse to your site and open the hash route  /#admin  to unlock the editor.
  Remember to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting
  environment (Vercel -> Project Settings -> Environment Variables) before deploy.
`)