import { supabase } from './supabaseClient'

export interface RateDifferenceDetailRow {
  bill_id: string
  bill_date: string
  party_id: string
  party_code: string | null
  party_name: string
  party_phone: string | null
  quality_grade_id: string | null
  item_name: string
  hsn_code: string | null
  lorry_no: string | null
  qty: number
  bill_rate: number
  sauda_rate: number
  difference: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  is_high_diff: boolean
  payment_status: 'pending' | 'partial' | 'paid' | string
  payment_mode: string | null
  payment_reference: string | null
  notes: string | null
}

export interface PartyPayableSummaryRow {
  party_id: string
  party_code: string | null
  party_name: string
  party_phone: string | null
  total_deals: number
  total_qty: number
  total_payable: number
  total_paid: number
  net_balance: number
  weighted_avg_diff: number
  max_discrepancy: number
}

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
  weighted_avg_diff?: number | null
  total_rtgs_difference_inr: number
}

/**
 * Fetches granular transaction-level rate difference details.
 * Directly queries view: public.view_rate_difference_details
 */
export async function fetchRateDifferenceDetails(): Promise<RateDifferenceDetailRow[]> {
  const { data, error } = await supabase
    .from('view_rate_difference_details')
    .select('*')
    .order('bill_date', { ascending: false })

  if (error) {
    console.error('Error fetching view_rate_difference_details:', error)
    throw new Error(error.message || 'Failed to fetch rate difference details')
  }

  return (data || []).map((row) => ({
    bill_id: String(row.bill_id || ''),
    bill_date: String(row.bill_date || ''),
    party_id: String(row.party_id || ''),
    party_code: row.party_code || null,
    party_name: row.party_name || 'Unknown Party',
    party_phone: row.party_phone || null,
    quality_grade_id: row.quality_grade_id || null,
    item_name: row.item_name || 'Scrap Material',
    hsn_code: row.hsn_code || '7204',
    lorry_no: row.lorry_no || (row.notes ? row.notes.match(/Lorry:\s*([^\n,]+)/i)?.[1] || null : null),
    qty: Number(row.qty || 0),
    bill_rate: Number(row.bill_rate || 0),
    sauda_rate: Number(row.sauda_rate || 0),
    difference: Number(row.difference ?? (Number(row.sauda_rate || 0) - Number(row.bill_rate || 0))),
    total_amount: Number(row.total_amount ?? (Number(row.qty || 0) * (Number(row.sauda_rate || 0) - Number(row.bill_rate || 0)))),
    paid_amount: Number(row.paid_amount || 0),
    balance_amount: Number(
      row.balance_amount ??
        (Number(row.total_amount || 0) - Number(row.paid_amount || 0))
    ),
    is_high_diff:
      row.is_high_diff ??
      Math.abs(Number(row.sauda_rate || 0) - Number(row.bill_rate || 0)) >= 1000,
    payment_status: (row.payment_status || 'pending').toLowerCase(),
    payment_mode: row.payment_mode || null,
    payment_reference: row.payment_reference || null,
    notes: row.notes || null,
  }))
}

/**
 * Fetches vendor/party-level aggregated payable & settlement summary.
 * Directly queries view: public.view_party_payable_summary
 */
export async function fetchPartyPayableSummary(): Promise<PartyPayableSummaryRow[]> {
  const { data, error } = await supabase
    .from('view_party_payable_summary')
    .select('*')
    .order('net_balance', { ascending: false })

  if (error) {
    console.error('Error fetching view_party_payable_summary:', error)
    throw new Error(error.message || 'Failed to fetch party payable summary')
  }

  return (data || []).map((row) => ({
    party_id: String(row.party_id || ''),
    party_code: row.party_code || null,
    party_name: row.party_name || 'Unknown Party',
    party_phone: row.party_phone || null,
    total_deals: Number(row.total_deals || 0),
    total_qty: Number(row.total_qty || 0),
    total_payable: Number(row.total_payable || 0),
    total_paid: Number(row.total_paid || 0),
    net_balance: Number(row.net_balance || 0),
    weighted_avg_diff: Number(row.weighted_avg_diff || 0),
    max_discrepancy: Number(row.max_discrepancy || 0),
  }))
}

/**
 * Fetches commercial Sauda rate analytics aggregated by scrap quality grade.
 * Directly queries analytical view: public.view_item_wise_sauda_summary
 */
export async function fetchItemWiseSaudaSummary(): Promise<ItemWiseSaudaSummaryRow[]> {
  const { data, error } = await supabase
    .from('view_item_wise_sauda_summary')
    .select('*')

  if (error) {
    console.error('Error fetching view_item_wise_sauda_summary:', error)
    throw new Error(error.message || 'Failed to fetch item-wise sauda summary')
  }

  return (data || []).map((row) => ({
    quality_grade_id: row.quality_grade_id || null,
    scrap_grade_name: row.scrap_grade_name,
    hsn_code: row.hsn_code,
    total_deals: Number(row.total_deals || 0),
    total_quantity_mt: Number(row.total_quantity_mt || 0),
    weighted_avg_bill_rate: Number(row.weighted_avg_bill_rate || 0),
    weighted_avg_sauda_rate: Number(row.weighted_avg_sauda_rate || 0),
    weighted_avg_diff: Number(row.weighted_avg_diff || 0),
    min_sauda_rate: Number(row.min_sauda_rate || 0),
    max_sauda_rate: Number(row.max_sauda_rate || 0),
    total_sauda_value_inr: Number(row.total_sauda_value_inr || 0),
    total_rtgs_difference_inr: Number(row.total_rtgs_difference_inr || 0),
  }))
}

export interface RecordPaymentPayload {
  amountPaidNow: number
  paymentMode: string
  paymentReference?: string
  currentPaid: number
  totalAmount: number
}

/**
 * Records payment settlement for a specific bill settlement.
 * Updates public.bill_settlements table.
 */
export async function recordBillPayment(
  billId: string,
  payload: RecordPaymentPayload
): Promise<void> {
  const newAmountPaid = (payload.currentPaid || 0) + payload.amountPaidNow
  let newStatus = 'pending'
  if (newAmountPaid >= payload.totalAmount) {
    newStatus = 'paid'
  } else if (newAmountPaid > 0) {
    newStatus = 'partial'
  }

  const { error } = await supabase
    .from('bill_settlements')
    .update({
      amount_paid: newAmountPaid,
      payment_status: newStatus,
      payment_mode: payload.paymentMode,
      payment_reference: payload.paymentReference?.trim() || null,
      bank_utr: payload.paymentReference?.trim() || null,
      settled_at: new Date().toISOString(),
    })
    .eq('id', billId)

  if (error) {
    console.error('Error updating bill settlement payment:', error)
    throw new Error(error.message || 'Failed to record payment in Supabase')
  }
}

export default {
  fetchRateDifferenceDetails,
  fetchPartyPayableSummary,
  fetchItemWiseSaudaSummary,
  recordBillPayment,
}
