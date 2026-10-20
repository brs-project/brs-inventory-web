import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

export type PartyRow = Database['public']['Tables']['parties']['Row']
export type PartyInsert = Database['public']['Tables']['parties']['Insert']
export type PartyUpdate = Database['public']['Tables']['parties']['Update']

export interface PartyModel {
  id: string
  code: string
  name: string
  types: ('BUYER' | 'SELLER' | 'TRANSPORTER')[]
  gstin: string | null
  contact_person: string
  phone: string
  city: string
  state: string
  credit_terms_days: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Frontend & legacy compatibility aliases
  party_code: string
  party_name: string
  partyCode: string
  partyName: string
  contactPerson: string
  gst_number?: string
  gstNumber?: string
  creditTermsDays: number
  isActive: boolean
  address?: string
}

export interface FrontendPartyInput {
  id?: string
  code?: string
  name?: string
  party_code?: string
  partyCode?: string
  party_name?: string
  partyName?: string
  types?: ('BUYER' | 'SELLER' | 'TRANSPORTER')[]
  gstin?: string | null
  gst_number?: string | null
  gstNumber?: string | null
  contact_person?: string
  contactPerson?: string
  phone?: string
  phoneNumber?: string
  city?: string
  state?: string
  address?: string
  credit_terms_days?: number
  creditTermsDays?: number
  is_active?: boolean
  isActive?: boolean
}

/**
 * Maps raw database party row to frontend model with camelCase and snake_case compatibility.
 */
export function mapPartyRowToModel(row: PartyRow): PartyModel {
  const state = row.state || 'Maharashtra'
  const created_at = row.created_at || new Date().toISOString()
  const updated_at = row.updated_at || new Date().toISOString()

  return {
    ...row,
    state,
    created_at,
    updated_at,
    types: (row.types || []) as ('BUYER' | 'SELLER' | 'TRANSPORTER')[],
    party_code: row.code,
    party_name: row.name,
    partyCode: row.code,
    partyName: row.name,
    contactPerson: row.contact_person,
    gst_number: row.gstin || undefined,
    gstNumber: row.gstin || undefined,
    creditTermsDays: row.credit_terms_days,
    isActive: row.is_active,
    address: `${row.city}, ${state}`.trim(),
  }
}

/**
 * Maps frontend party inputs (camelCase or snake_case) to database schema columns.
 */
export function mapFrontendToPartyInsert(input: FrontendPartyInput): PartyInsert {
  const code = (input.code || input.party_code || input.partyCode)?.trim()
  const name = (input.name || input.party_name || input.partyName)?.trim()

  if (!code) throw new Error('Party code is required')
  if (!name) throw new Error('Party name is required')

  const gstinRaw = input.gstin ?? input.gst_number ?? input.gstNumber
  const gstin = gstinRaw ? gstinRaw.trim().toUpperCase() : null

  return {
    code,
    name,
    types: input.types && input.types.length > 0 ? input.types : ['BUYER'],
    gstin: gstin || null,
    contact_person: (input.contact_person || input.contactPerson || 'N/A').trim(),
    phone: (input.phone || input.phoneNumber || '9999999999').trim(),
    city: (input.city || 'N/A').trim(),
    state: (input.state || 'Maharashtra').trim(),
    credit_terms_days: input.credit_terms_days ?? input.creditTermsDays ?? 0,
    is_active: input.is_active ?? input.isActive ?? true,
  }
}

/**
 * Maps frontend updates to database schema columns.
 */
export function mapFrontendToPartyUpdate(input: Partial<FrontendPartyInput>): PartyUpdate {
  const update: PartyUpdate = {}

  if (input.code !== undefined || input.party_code !== undefined || input.partyCode !== undefined) {
    update.code = (input.code || input.party_code || input.partyCode)!.trim()
  }
  if (input.name !== undefined || input.party_name !== undefined || input.partyName !== undefined) {
    update.name = (input.name || input.party_name || input.partyName)!.trim()
  }
  if (input.types !== undefined) {
    update.types = input.types
  }
  if (input.gstin !== undefined || input.gst_number !== undefined || input.gstNumber !== undefined) {
    const raw = input.gstin ?? input.gst_number ?? input.gstNumber
    update.gstin = raw ? raw.trim().toUpperCase() : null
  }
  if (input.contact_person !== undefined || input.contactPerson !== undefined) {
    update.contact_person = (input.contact_person || input.contactPerson || '').trim()
  }
  if (input.phone !== undefined || input.phoneNumber !== undefined) {
    update.phone = (input.phone || input.phoneNumber || '').trim()
  }
  if (input.city !== undefined) {
    update.city = input.city.trim()
  }
  if (input.state !== undefined) {
    update.state = input.state.trim()
  }
  if (input.credit_terms_days !== undefined || input.creditTermsDays !== undefined) {
    update.credit_terms_days = input.credit_terms_days ?? input.creditTermsDays
  }
  if (input.is_active !== undefined || input.isActive !== undefined) {
    update.is_active = input.is_active ?? input.isActive
  }

  return update
}

/**
 * Verifies tax ID (GSTIN) uniqueness against live database.
 */
export async function checkDuplicateGstin(gstin: string, excludeId?: string): Promise<boolean> {
  const cleanedGstin = gstin.trim().toUpperCase()
  if (!cleanedGstin) return false

  let query = supabase.from('parties').select('id').eq('gstin', cleanedGstin)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[partiesService.checkDuplicateGstin] error:', error)
    throw error
  }

  return Boolean(data && data.length > 0)
}

/**
 * Retrieves parties ordered by created_at DESC.
 */
export async function fetchParties(): Promise<PartyModel[]> {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[partiesService.fetchParties] error:', error)
    throw error
  }

  return (data || []).map(mapPartyRowToModel)
}

/**
 * Creates a new party record.
 */
export async function createParty(party: FrontendPartyInput): Promise<PartyModel> {
  const insertPayload = mapFrontendToPartyInsert(party)

  if (insertPayload.gstin) {
    const isDuplicate = await checkDuplicateGstin(insertPayload.gstin)
    if (isDuplicate) {
      throw new Error(`A party with GSTIN '${insertPayload.gstin}' already exists.`)
    }
  }

  const { data, error } = await supabase
    .from('parties')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    console.error('[partiesService.createParty] error:', error)
    throw error
  }

  return mapPartyRowToModel(data)
}

/**
 * Updates an existing party record.
 */
export async function updateParty(id: string, party: Partial<FrontendPartyInput>): Promise<PartyModel> {
  const updatePayload = mapFrontendToPartyUpdate(party)

  if (updatePayload.gstin) {
    const isDuplicate = await checkDuplicateGstin(updatePayload.gstin, id)
    if (isDuplicate) {
      throw new Error(`A party with GSTIN '${updatePayload.gstin}' already exists.`)
    }
  }

  const { data, error } = await supabase
    .from('parties')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[partiesService.updateParty] error:', error)
    throw error
  }

  return mapPartyRowToModel(data)
}

/**
 * Deletes a party by ID.
 */
export async function deleteParty(id: string): Promise<boolean> {
  const { error } = await supabase.from('parties').delete().eq('id', id)

  if (error) {
    console.error('[partiesService.deleteParty] error:', error)
    throw error
  }

  return true
}

/**
 * Toggles party active status.
 */
export async function togglePartyStatus(id: string, isActive: boolean): Promise<PartyModel> {
  return updateParty(id, { is_active: isActive })
}