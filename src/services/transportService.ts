import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'
import type { Transport } from '@types'

export type TransportRow = Database['public']['Tables']['transports']['Row']
export type TransportInsert = Database['public']['Tables']['transports']['Insert']
export type TransportUpdate = Database['public']['Tables']['transports']['Update']

export interface TransportParty {
  id?: string
  name: string | null
  code: string | null
  phone: string | null
}

export interface TransportWithParty extends Transport {
  lorry_number?: string
  transporter?: string
}

export interface CreateTransportInput {
  vehicle_number: string
  transporter_id?: string | null
  transporter_name?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  default_tare_weight_mt?: number | string | null
  default_freight_rate_per_mt?: number | string | null
  fixed_trip_charge?: number | string | null
  default_route?: string | null
  material_type?: string | null
  is_active?: boolean
}

export interface UpdateTransportInput extends Partial<CreateTransportInput> {}

export interface TransporterPartyOption {
  id: string
  name: string
  code: string
  phone?: string | null
}

/**
 * Normalizes a raw transports database row joined with parties to the frontend Transport model.
 */
export function mapTransportRow(row: any): TransportWithParty {
  const party = Array.isArray(row.parties) ? row.parties[0] : row.parties
  const vehicleNumber = (row.vehicle_number || '').trim().toUpperCase()
  const tareWeight = Number(row.default_tare_weight_mt ?? 0)
  const freightRate = Number(row.default_freight_rate_per_mt ?? 0)
  const fixedCharge = Number(row.fixed_trip_charge ?? 0)

  return {
    id: row.id,
    vehicle_number: vehicleNumber,
    transporter_id: row.transporter_id ?? null,
    transporter_name: row.transporter_name || party?.name || null,
    driver_name: row.driver_name || null,
    driver_phone: row.driver_phone || null,
    default_tare_weight_mt: tareWeight,
    default_freight_rate_per_mt: freightRate,
    fixed_trip_charge: fixedCharge,
    default_route: row.default_route || null,
    material_type: row.material_type || null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    parties: party
      ? {
          name: party.name ?? null,
          code: party.code ?? null,
          phone: party.phone ?? null,
        }
      : null,
    lorry_number: vehicleNumber,
    transporter: row.transporter_name || party?.name || undefined,
  }
}

/**
 * Fetches all registered transports joined with transporter party details,
 * ordered alphabetically by vehicle_number.
 */
export async function fetchTransports(): Promise<TransportWithParty[]> {
  const { data, error } = await supabase
    .from('transports')
    .select('*, parties:transporter_id(name, code, phone)')
    .order('vehicle_number', { ascending: true })

  if (error) {
    console.error('[transportService.fetchTransports] error:', error)
    throw error
  }

  return (data || []).map(mapTransportRow)
}

/**
 * Creates a new transport record in public.transports.
 */
export async function createTransport(
  payload: CreateTransportInput
): Promise<TransportWithParty> {
  const vehicleNumber = (payload.vehicle_number || '').trim().toUpperCase()
  if (!vehicleNumber) {
    throw new Error('Vehicle number is required')
  }

  const insertData: TransportInsert = {
    vehicle_number: vehicleNumber,
    transporter_id: payload.transporter_id || null,
    transporter_name: payload.transporter_name?.trim() || null,
    driver_name: payload.driver_name?.trim() || null,
    driver_phone: payload.driver_phone?.trim() || null,
    default_tare_weight_mt:
      payload.default_tare_weight_mt !== undefined && payload.default_tare_weight_mt !== null
        ? Number(payload.default_tare_weight_mt)
        : 0,
    default_freight_rate_per_mt:
      payload.default_freight_rate_per_mt !== undefined && payload.default_freight_rate_per_mt !== null
        ? Number(payload.default_freight_rate_per_mt)
        : 0,
    fixed_trip_charge:
      payload.fixed_trip_charge !== undefined && payload.fixed_trip_charge !== null
        ? Number(payload.fixed_trip_charge)
        : 0,
    default_route: payload.default_route?.trim() || null,
    material_type: payload.material_type?.trim() || null,
    is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
  }

  const { data, error } = await supabase
    .from('transports')
    .insert(insertData)
    .select('*, parties:transporter_id(name, code, phone)')
    .single()

  if (error) {
    console.error('[transportService.createTransport] error:', error)
    throw error
  }

  return mapTransportRow(data)
}

/**
 * Updates an existing transport record by ID.
 */
export async function updateTransport(
  id: string,
  payload: UpdateTransportInput
): Promise<TransportWithParty> {
  if (!id) throw new Error('Transport ID is required for update')

  const updateData: TransportUpdate = {}

  if (payload.vehicle_number !== undefined) {
    const vNum = payload.vehicle_number.trim().toUpperCase()
    if (!vNum) throw new Error('Vehicle number cannot be empty')
    updateData.vehicle_number = vNum
  }
  if (payload.transporter_id !== undefined) {
    updateData.transporter_id = payload.transporter_id || null
  }
  if (payload.transporter_name !== undefined) {
    updateData.transporter_name = payload.transporter_name?.trim() || null
  }
  if (payload.driver_name !== undefined) {
    updateData.driver_name = payload.driver_name?.trim() || null
  }
  if (payload.driver_phone !== undefined) {
    updateData.driver_phone = payload.driver_phone?.trim() || null
  }
  if (payload.default_tare_weight_mt !== undefined) {
    updateData.default_tare_weight_mt =
      payload.default_tare_weight_mt !== null
        ? Number(payload.default_tare_weight_mt)
        : 0
  }
  if (payload.default_freight_rate_per_mt !== undefined) {
    updateData.default_freight_rate_per_mt =
      payload.default_freight_rate_per_mt !== null
        ? Number(payload.default_freight_rate_per_mt)
        : 0
  }
  if (payload.fixed_trip_charge !== undefined) {
    updateData.fixed_trip_charge =
      payload.fixed_trip_charge !== null
        ? Number(payload.fixed_trip_charge)
        : 0
  }
  if (payload.default_route !== undefined) {
    updateData.default_route = payload.default_route?.trim() || null
  }
  if (payload.material_type !== undefined) {
    updateData.material_type = payload.material_type?.trim() || null
  }
  if (payload.is_active !== undefined) {
    updateData.is_active = Boolean(payload.is_active)
  }

  const { data, error } = await supabase
    .from('transports')
    .update(updateData)
    .eq('id', id)
    .select('*, parties:transporter_id(name, code, phone)')
    .single()

  if (error) {
    console.error('[transportService.updateTransport] error:', error)
    throw error
  }

  return mapTransportRow(data)
}

/**
 * Toggles active status of a transport record.
 */
export async function toggleTransportStatus(
  id: string,
  isActive: boolean
): Promise<TransportWithParty> {
  return updateTransport(id, { is_active: isActive })
}

/**
 * Deletes a transport record by ID.
 */
export async function deleteTransport(id: string): Promise<boolean> {
  if (!id) throw new Error('Transport ID is required for delete')

  const { error } = await supabase
    .from('transports')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[transportService.deleteTransport] error:', error)
    throw error
  }

  return true
}

/**
 * Fetches transporter parties from public.parties to populate dropdown selectors.
 */
export async function fetchTransporterOptions(): Promise<TransporterPartyOption[]> {
  const { data, error } = await supabase
    .from('parties')
    .select('id, name, code, phone')
    .order('name', { ascending: true })

  if (error) {
    console.error('[transportService.fetchTransporterOptions] error:', error)
    throw error
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name || 'Unnamed Party',
    code: p.code || '',
    phone: p.phone || null,
  }))
}
