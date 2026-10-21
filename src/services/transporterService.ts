import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'
import type { Transporter } from '@types'

export type TransporterRow = Database['public']['Tables']['transporters']['Row']
export type TransporterInsert = Database['public']['Tables']['transporters']['Insert']
export type TransporterUpdate = Database['public']['Tables']['transporters']['Update']

export interface CreateTransporterInput {
  name: string
  contact_person?: string | null
  phone?: string | null
  city?: string | null
  is_active?: boolean
}

export interface UpdateTransporterInput extends Partial<CreateTransporterInput> {}

export function mapTransporterRow(row: TransporterRow): Transporter {
  return {
    id: row.id,
    name: row.name,
    contact_person: row.contact_person,
    phone: row.phone,
    city: row.city,
    is_active: Boolean(row.is_active),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  }
}

/**
 * Queries public.transporters ordered by name ASC.
 */
export async function fetchTransporters(): Promise<Transporter[]> {
  const { data, error } = await supabase
    .from('transporters')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[transporterService.fetchTransporters] error:', error)
    throw error
  }

  return (data || []).map(mapTransporterRow)
}

/**
 * Inserts a new transporter agency into public.transporters.
 */
export async function createTransporter(data: CreateTransporterInput): Promise<Transporter> {
  const name = (data.name || '').trim()
  if (!name) {
    throw new Error('Transporter name is required')
  }

  const payload: TransporterInsert = {
    name,
    contact_person: data.contact_person?.trim() || null,
    phone: data.phone?.trim() || null,
    city: data.city?.trim() || null,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
  }

  const { data: created, error } = await supabase
    .from('transporters')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[transporterService.createTransporter] error:', error)
    throw error
  }

  return mapTransporterRow(created)
}

/**
 * Updates an existing transporter record in public.transporters.
 */
export async function updateTransporter(
  id: string,
  data: UpdateTransporterInput
): Promise<Transporter> {
  if (!id) throw new Error('Transporter ID is required for update')

  const payload: TransporterUpdate = {}
  if (data.name !== undefined) {
    const trimmed = data.name.trim()
    if (!trimmed) throw new Error('Transporter name cannot be empty')
    payload.name = trimmed
  }
  if (data.contact_person !== undefined) {
    payload.contact_person = data.contact_person?.trim() || null
  }
  if (data.phone !== undefined) {
    payload.phone = data.phone?.trim() || null
  }
  if (data.city !== undefined) {
    payload.city = data.city?.trim() || null
  }
  if (data.is_active !== undefined) {
    payload.is_active = Boolean(data.is_active)
  }

  const { data: updated, error } = await supabase
    .from('transporters')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[transporterService.updateTransporter] error:', error)
    throw error
  }

  return mapTransporterRow(updated)
}

/**
 * Toggles transporter active status.
 */
export async function toggleTransporterStatus(
  id: string,
  isActive: boolean
): Promise<Transporter> {
  return updateTransporter(id, { is_active: isActive })
}

/**
 * Deletes a transporter record by ID.
 */
export async function deleteTransporter(id: string): Promise<boolean> {
  if (!id) throw new Error('Transporter ID is required for delete')

  const { error } = await supabase.from('transporters').delete().eq('id', id)

  if (error) {
    console.error('[transporterService.deleteTransporter] error:', error)
    throw error
  }

  return true
}
