import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export function toDb(project) {
  return {
    proj_num: project.projNum,
    proj_name: project.projName,
    client: project.client,
    address: project.address,
    region: project.region,
    crane_type: project.craneType,
    scope: project.scope,
    contacts: project.contacts,
    mobs: project.mobs,
    prep: project.prep,
    access_notes: project.accessNotes,
    hs_notes: project.hsNotes,
    gen_notes: project.genNotes,
    colour: project.colour,
    updated_at: new Date().toISOString(),
  }
}

export function fromDb(row) {
  return {
    projNum: row.proj_num,
    projName: row.proj_name,
    client: row.client,
    address: row.address,
    region: row.region,
    craneType: row.crane_type,
    scope: row.scope,
    contacts: row.contacts ?? [],
    mobs: row.mobs ?? {},
    prep: row.prep ?? 0,
    accessNotes: row.access_notes,
    hsNotes: row.hs_notes,
    genNotes: row.gen_notes,
    colour: row.colour,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
