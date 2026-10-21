import { supabase } from './supabaseClient'

export interface ItemWiseSaudaSummaryRow {
  quality_grade_id?: string | null
  scrap_grade_name: string | null
  hsn_code: string | null
  total_deals: number
  total_quantity_mt: number
  total_sauda_value_inr: number
  weighted_avg_sauda_rate: number
  min_sauda_rate: number
  max_sauda_rate: number
  weighted_avg_bill_rate?: number | null
  total_rtgs_difference_inr: number
}

export interface DailyScrapMovementRow {
  date: string | null
  scrap_grade_name: string | null
  inward_receipt_mt: number
  outward_dispatch_mt: number
  net_day_balance_mt: number
}

/**
 * Fetches commercial Sauda rate analytics aggregated by scrap quality grade.
 * Directly queries analytical view: public.view_item_wise_sauda_summary
 */
export async function fetchItemWiseSaudaSummary(): Promise<ItemWiseSaudaSummaryRow[]> {
  const { data, error } = await supabase
    .from('view_item_wise_sauda_summary')
    .select(
      'scrap_grade_name, hsn_code, total_deals, total_quantity_mt, weighted_avg_sauda_rate, min_sauda_rate, max_sauda_rate, total_sauda_value_inr, total_rtgs_difference_inr'
    )

  if (error) {
    console.error('Error fetching view_item_wise_sauda_summary:', error)
    throw new Error(error.message || 'Failed to fetch item-wise sauda summary')
  }

  return (data || []).map((row) => ({
    scrap_grade_name: row.scrap_grade_name,
    hsn_code: row.hsn_code,
    total_deals: Number(row.total_deals || 0),
    total_quantity_mt: Number(row.total_quantity_mt || 0),
    weighted_avg_sauda_rate: Number(row.weighted_avg_sauda_rate || 0),
    min_sauda_rate: Number(row.min_sauda_rate || 0),
    max_sauda_rate: Number(row.max_sauda_rate || 0),
    total_sauda_value_inr: Number(row.total_sauda_value_inr || 0),
    total_rtgs_difference_inr: Number(row.total_rtgs_difference_inr || 0),
  }))
}

/**
 * Fetches daily scrap movement (inward receipts vs outward dispatches).
 * Directly queries analytical view: public.view_daily_scrap_movement ordered by date DESC.
 */
export async function fetchDailyScrapMovement(): Promise<DailyScrapMovementRow[]> {
  const { data, error } = await supabase
    .from('view_daily_scrap_movement')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching view_daily_scrap_movement:', error)
    throw new Error(error.message || 'Failed to fetch daily scrap movement')
  }

  return (data || []).map((row) => ({
    date: row.date,
    scrap_grade_name: row.scrap_grade_name,
    inward_receipt_mt: Number(row.inward_receipt_mt || 0),
    outward_dispatch_mt: Number(row.outward_dispatch_mt || 0),
    net_day_balance_mt: Number(row.net_day_balance_mt || 0),
  }))
}

export default {
  fetchItemWiseSaudaSummary,
  fetchDailyScrapMovement,
}
