import { supabase } from './supabaseClient'

export interface AppSettingsPayload {
  company_name?: string
  yard_address?: string
  contact_phone?: string
  contact_email?: string
  gstin?: string
  default_hsn_code?: string
  weighbridge_tolerance_kg?: number
  currency_symbol?: string
  timezone?: string
  invoice_header_note?: string
  invoice_footer_terms?: string
}

export interface AppSettingsData {
  id: string
  company_name: string
  yard_address: string
  contact_phone: string
  contact_email: string
  gstin: string
  default_hsn_code: string
  weighbridge_tolerance_kg: number
  currency_symbol: string
  timezone: string
  invoice_header_note: string
  invoice_footer_terms: string
  updated_at?: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettingsData = {
  id: 'default',
  company_name: 'BRS Scrap Yard & Steel Mart',
  yard_address: 'Plot No. 12, MIDC Phase II, Jalna, Maharashtra 431203',
  contact_phone: '+91 98220 12345',
  contact_email: 'accounts@brs-steel.com',
  gstin: '27AABCB1234F1Z6',
  default_hsn_code: '7204',
  weighbridge_tolerance_kg: 50.0,
  currency_symbol: '₹',
  timezone: 'Asia/Kolkata',
  invoice_header_note: 'Authorized Computerized Weight Slip',
  invoice_footer_terms:
    '1. Goods once dispatched will not be taken back.\n2. Weight recorded at our computerized weighbridge is final.',
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

  return data as AppSettingsData
}

/**
 * Update app settings in Supabase and return updated record
 */
export async function updateAppSettings(
  payload: AppSettingsPayload
): Promise<AppSettingsData> {
  const updatePayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('app_settings')
    .update(updatePayload)
    .eq('id', 'default')
    .select()
    .single()

  if (error) {
    console.error('Error updating app settings in Supabase:', error)
    throw error
  }

  return data as AppSettingsData
}

/**
 * Reset app settings to factory standard values
 */
export async function resetAppSettingsToDefaults(): Promise<AppSettingsData> {
  return updateAppSettings({
    company_name: DEFAULT_APP_SETTINGS.company_name,
    yard_address: DEFAULT_APP_SETTINGS.yard_address,
    contact_phone: DEFAULT_APP_SETTINGS.contact_phone,
    contact_email: DEFAULT_APP_SETTINGS.contact_email,
    gstin: DEFAULT_APP_SETTINGS.gstin,
    default_hsn_code: DEFAULT_APP_SETTINGS.default_hsn_code,
    weighbridge_tolerance_kg: DEFAULT_APP_SETTINGS.weighbridge_tolerance_kg,
    currency_symbol: DEFAULT_APP_SETTINGS.currency_symbol,
    timezone: DEFAULT_APP_SETTINGS.timezone,
    invoice_header_note: DEFAULT_APP_SETTINGS.invoice_header_note,
    invoice_footer_terms: DEFAULT_APP_SETTINGS.invoice_footer_terms,
  })
}

