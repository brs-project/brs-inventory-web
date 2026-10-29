import { supabase } from './supabaseClient'

export interface AppSettingsPayload {
  weighbridge_tolerance_kg?: number
  require_supervisor_tare_override?: boolean
  high_rate_diff_threshold?: number
  default_gst_rate?: number
  lock_settled_bills?: boolean
  default_date_preset?: string
}

export interface AppSettingsData {
  id: string
  weighbridge_tolerance_kg: number
  require_supervisor_tare_override: boolean
  high_rate_diff_threshold: number
  default_gst_rate: number
  lock_settled_bills: boolean
  default_date_preset: string
  updated_at?: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettingsData = {
  id: 'default',
  weighbridge_tolerance_kg: 50.0,
  require_supervisor_tare_override: true,
  high_rate_diff_threshold: 1000.0,
  default_gst_rate: 18.0,
  lock_settled_bills: true,
  default_date_preset: 'CURRENT_MONTH',
}

/**
 * Fetch default app settings row from Supabase
 */
export async function fetchAppSettings(): Promise<AppSettingsData> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'default')
    .single()

  if (error) {
    console.error('Error fetching app settings from Supabase:', error)
    return DEFAULT_APP_SETTINGS
  }

  return {
    id: data.id || 'default',
    weighbridge_tolerance_kg: Number(data.weighbridge_tolerance_kg ?? 50),
    require_supervisor_tare_override: Boolean(data.require_supervisor_tare_override ?? true),
    high_rate_diff_threshold: Number(data.high_rate_diff_threshold ?? 1000),
    default_gst_rate: Number(data.default_gst_rate ?? 18),
    lock_settled_bills: Boolean(data.lock_settled_bills ?? true),
    default_date_preset: data.default_date_preset || 'CURRENT_MONTH',
    updated_at: data.updated_at,
  }
}

/**
 * Update app settings row in Supabase (id = 'default')
 */
export async function updateAppSettings(payload: AppSettingsPayload): Promise<AppSettingsData> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('app_settings')
    .update({
      ...payload,
      updated_at: now,
    })
    .eq('id', 'default')
    .select()
    .single()

  if (error) {
    console.error('Error updating app settings in Supabase:', error)
    throw error
  }

  return {
    id: data.id,
    weighbridge_tolerance_kg: Number(data.weighbridge_tolerance_kg ?? 50),
    require_supervisor_tare_override: Boolean(data.require_supervisor_tare_override ?? true),
    high_rate_diff_threshold: Number(data.high_rate_diff_threshold ?? 1000),
    default_gst_rate: Number(data.default_gst_rate ?? 18),
    lock_settled_bills: Boolean(data.lock_settled_bills ?? true),
    default_date_preset: data.default_date_preset || 'CURRENT_MONTH',
    updated_at: data.updated_at,
  }
}

export default {
  fetchAppSettings,
  updateAppSettings,
  DEFAULT_APP_SETTINGS,
}
