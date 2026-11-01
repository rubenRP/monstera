#!/usr/bin/env node
/**
 * Reassigns the data of an existing Supabase Auth user to a Clerk user id.
 *
 * Run it AFTER applying supabase/migrations/20261101120000_clerk_auth.sql and AFTER you
 * have signed in once with Clerk (to know your Clerk user id: Clerk dashboard → Users).
 *
 *   node --env-file=.env scripts/migrate-user-to-clerk.mjs --clerk-id user_2abc          # dry run
 *   node --env-file=.env scripts/migrate-user-to-clerk.mjs --clerk-id user_2abc --apply  # do it
 *
 * Options:
 *   --old-id <uuid>   Supabase user id. Optional when exactly one Supabase Auth user exists.
 *
 * Needs SUPABASE_URL (or NUXT_PUBLIC_SUPABASE_URL) and NUXT_SUPABASE_SECRET_KEY (service role).
 * Safe to re-run: photos already moved are skipped.
 */
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'plant-photos'
const TABLES = ['plants', 'care_tasks', 'diagnoses', 'push_subscriptions', 'sites', 'plant_check_ins', 'watering_recalc_events']

const { values } = parseArgs({
  options: {
    'clerk-id': { type: 'string' },
    'old-id': { type: 'string' },
    'apply': { type: 'boolean', default: false }
  }
})

const url = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
const key = process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !key) fail('Set SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY (use --env-file=.env).')

const clerkId = values['clerk-id']
if (!clerkId || !/^user_\w+$/.test(clerkId)) fail('Pass --clerk-id user_xxx (Clerk dashboard → Users).')

const supabase = createClient(url, key, { auth: { persistSession: false } })

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

async function resolveOldUser() {
  if (values['old-id']) return { id: values['old-id'], email: '(given)' }
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 })
  if (error) fail(`Could not list Supabase users: ${error.message}`)
  if (data.users.length !== 1) {
    fail(`Found ${data.users.length} Supabase users; pass --old-id <uuid>:\n`
      + data.users.map(u => `  ${u.id}  ${u.email}`).join('\n'))
  }
  return data.users[0]
}

async function count(table, userId) {
  const { count: n, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (error) fail(`${table}: ${error.message}`)
  return n ?? 0
}

const oldUser = await resolveOldUser()
const oldId = oldUser.id
if (oldId === clerkId) fail('Old and new ids are the same.')

console.log(`${values.apply ? 'APPLYING' : 'DRY RUN'}: ${oldUser.email} (${oldId}) → ${clerkId}\n`)

for (const table of ['user_settings', ...TABLES]) {
  console.log(`  ${table.padEnd(24)} ${await count(table, oldId)} row(s) to move`)
}

// Photos referenced by plants / check-ins that still live under the old user folder
const photos = []
for (const table of ['plants', 'plant_check_ins']) {
  const { data, error } = await supabase.from(table).select('id, photo_path').eq('user_id', oldId).not('photo_path', 'is', null)
  if (error) fail(`${table}: ${error.message}`)
  for (const row of data) {
    if (row.photo_path.startsWith(`${oldId}/`)) photos.push({ table, id: row.id, from: row.photo_path, to: `${clerkId}${row.photo_path.slice(oldId.length)}` })
  }
}
console.log(`  ${'photos'.padEnd(24)} ${photos.length} file(s) to move\n`)

if (!values.apply) {
  console.log('Dry run only. Re-run with --apply to migrate.')
  process.exit(0)
}

// 1. Photos first (Storage `move` keeps the physical file reachable; renaming rows in SQL would not)
for (const p of photos) {
  const { error } = await supabase.storage.from(BUCKET).move(p.from, p.to)
  if (error) fail(`Moving ${p.from}: ${error.message}`)
  const { error: updateError } = await supabase.from(p.table).update({ photo_path: p.to }).eq('id', p.id)
  if (updateError) fail(`${p.table} ${p.id}: ${updateError.message}`)
}

// 2. user_settings has user_id as primary key: drop the row the app may have created at first Clerk login
const { count: oldSettings } = await supabase.from('user_settings').select('*', { count: 'exact', head: true }).eq('user_id', oldId)
if (oldSettings) {
  const { error } = await supabase.from('user_settings').delete().eq('user_id', clerkId)
  if (error) fail(`user_settings cleanup: ${error.message}`)
}

// 3. Reassign rows
for (const table of ['user_settings', ...TABLES]) {
  const { error } = await supabase.from(table).update({ user_id: clerkId }).eq('user_id', oldId)
  if (error) fail(`${table}: ${error.message}`)
  console.log(`  ✔ ${table}`)
}

console.log('\nDone. Sign in with Clerk and check your plants.')
