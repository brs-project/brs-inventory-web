import supabase from './supabaseClient';
import type { BillEntry, Party } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BillSettlementRow {
  id: string;
  dispatch_id: string | null;
  party_id: string;
  quality_grade_id?: string | null;
  lorry_no?: string | null;
  bill_date: string;
  quantity_mt: number;
  quantity_kg: number | null;
  actual_rate: number;
  bill_rate: number;
  rate_diff: number | null;
  rtgs_amount: number | null;
  billing_type: string | null;
  payment_status: string | null;
  payment_mode: string | null;
  bank_utr: string | null;
  notes: string | null;
  settled_at: string | null;
  settled_by: string | null;
  created_at: string | null;
  parties?: {
    id: string;
    name: string;
    code: string;
    gstin?: string | null;
    city?: string | null;
  } | null;
  dispatch_records?: {
    id: string;
    outward_bill_no: string;
    lorry_no: string;
    quality_grade_id?: string;
  } | null;
}

export interface CreateBillSettlementInput {
  dispatch_id?: string | null;
  dispatchId?: string | null;
  party_id?: string;
  partyId?: string;
  party_code?: string;
  quality_grade_id?: string;
  quality_id?: string;
  qualityGradeId?: string;
  bill_date?: string;
  billDate?: string;
  bill_number?: string;
  quantity_mt?: number;
  quantityMt?: number;
  actual_rate?: number;
  actualRate?: number;
  bill_rate?: number;
  billRate?: number;
  lorry_no?: string;
  lorry_number?: string;
  lorryNo?: string;
  payment_status?: string;
  paymentStatus?: string;
  bank_utr?: string | null;
  bankUtr?: string | null;
  rtgs_reference?: string | null;
  payment_mode?: string | null;
  paymentMode?: string | null;
  notes?: string | null;
  remarks?: string | null;
}

export function mapRowToBillEntry(row: BillSettlementRow): BillEntry {
  const party: Party | undefined = row.parties
    ? {
        id: row.parties.id,
        party_code: row.parties.code,
        party_name: row.parties.name,
        gst_number: row.parties.gstin || undefined,
        city: row.parties.city || undefined,
        is_active: true,
        created_at: row.created_at || '',
      }
    : undefined;

  const actualRate = Number(row.actual_rate) || 0;
  const billRate = Number(row.bill_rate) || 0;
  const quantityMt = Number(row.quantity_mt) || 0;
  const quantityKg = Number(row.quantity_kg || quantityMt * 1000);
  const rateDiff = row.rate_diff !== null && row.rate_diff !== undefined ? Number(row.rate_diff) : actualRate - billRate;
  const rtgsAmount = row.rtgs_amount !== null && row.rtgs_amount !== undefined ? Number(row.rtgs_amount) : Math.round(rateDiff * quantityKg);

  const billingType: 'under' | 'over' | 'exact' =
    actualRate > billRate ? 'under' : actualRate < billRate ? 'over' : 'exact';

  const statusRaw = (row.payment_status || 'pending').toLowerCase();
  const paymentStatus: 'pending' | 'paid' | 'partial' | 'na' =
    statusRaw === 'paid' ? 'paid' : statusRaw === 'partial' ? 'partial' : statusRaw === 'na' ? 'na' : 'pending';

  return {
    id: row.id,
    bill_date: row.bill_date,
    bill_number: row.dispatch_records?.outward_bill_no || `BILL-${row.id.substring(0, 8).toUpperCase()}`,
    party_id: row.party_id,
    party_code: row.parties?.code || '',
    quality_id: row.quality_grade_id || row.dispatch_records?.quality_grade_id || '',
    quality_grade_id: row.quality_grade_id || row.dispatch_records?.quality_grade_id || undefined,
    lorry_number: row.lorry_no || row.dispatch_records?.lorry_no || '',
    lorry_no: row.lorry_no || row.dispatch_records?.lorry_no || undefined,
    quantity_mt: quantityMt,
    quantity_kg: quantityKg,
    bill_rate: billRate,
    actual_rate: actualRate,
    rate_difference: rateDiff,
    rtgs_amount: rtgsAmount,
    billing_type: billingType,
    payment_status: paymentStatus,
    rtgs_reference: row.bank_utr || undefined,
    created_by: 'System',
    remarks: row.notes || undefined,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.settled_at || row.created_at || new Date().toISOString(),
    parties: party,
  };
}

/** Fetch live bill settlements joined with parties and dispatch_records */
export async function fetchBillSettlements(): Promise<BillEntry[]> {
  const { data, error } = await supabase
    .from('bill_settlements')
    .select('*, parties(id, name, code, gstin, city), dispatch_records(id, outward_bill_no, lorry_no, quality_grade_id)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bill settlements:', error);
    throw error;
  }

  return ((data as unknown as BillSettlementRow[]) || []).map(mapRowToBillEntry);
}

/** Insert a live bill settlement into Supabase */
export async function createBillSettlement(formData: CreateBillSettlementInput): Promise<BillEntry> {
  let party_id = (formData.partyId || formData.party_id || '').trim();
  let quality_grade_id = (formData.quality_grade_id || formData.quality_id || formData.qualityGradeId || '').trim();
  const bill_date = formData.billDate || formData.bill_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const quantity_mt = Number(formData.quantityMt ?? formData.quantity_mt ?? 0);
  const actual_rate = Number(formData.actualRate ?? formData.actual_rate ?? 0);
  const bill_rate = Number(formData.billRate ?? formData.bill_rate ?? 0);
  const lorry_no = (formData.lorry_no || formData.lorry_number || formData.lorryNo || '').toUpperCase().trim();
  const payment_status = formData.paymentStatus || formData.payment_status || 'pending';
  const bank_utr = formData.bankUtr || formData.bank_utr || formData.rtgs_reference || null;
  const payment_mode = formData.paymentMode || formData.payment_mode || 'RTGS';
  const notes = formData.notes || formData.remarks || null;

  if (!party_id) throw new Error('Party is required');
  if (!quality_grade_id) throw new Error('Quality Grade is required');
  if (isNaN(quantity_mt) || quantity_mt <= 0) throw new Error('Quantity (MT) must be greater than 0');
  if (isNaN(actual_rate) || actual_rate < 0) throw new Error('Actual rate cannot be negative');
  if (isNaN(bill_rate) || bill_rate < 0) throw new Error('Bill rate cannot be negative');
  if (!lorry_no) throw new Error('Lorry number is required');

  // Verify party_id UUID format; fallback to lookup by code or name if needed
  if (!UUID_REGEX.test(party_id)) {
    const { data: pMatch } = await supabase
      .from('parties')
      .select('id')
      .or(`code.eq.${party_id},name.eq.${party_id}`)
      .limit(1)
      .maybeSingle();

    if (pMatch?.id && UUID_REGEX.test(pMatch.id)) {
      party_id = pMatch.id;
    } else {
      throw new Error(`Invalid Party ID format: '${party_id}'. Must be a valid UUID.`);
    }
  }

  // Verify quality_grade_id UUID format; fallback to lookup by name if needed
  if (!UUID_REGEX.test(quality_grade_id)) {
    const { data: qMatch } = await supabase
      .from('quality_grades')
      .select('id')
      .eq('name', quality_grade_id)
      .limit(1)
      .maybeSingle();

    if (qMatch?.id && UUID_REGEX.test(qMatch.id)) {
      quality_grade_id = qMatch.id;
    } else {
      throw new Error(`Invalid Quality Grade ID format: '${quality_grade_id}'. Must be a valid UUID.`);
    }
  }

  // Build requested insert payload
  const insertPayload: Record<string, any> = {
    party_id,
    quality_grade_id,
    bill_date,
    quantity_mt,
    actual_rate,
    bill_rate,
    lorry_no,
    payment_status,
  };
  if (bank_utr) insertPayload.bank_utr = bank_utr;
  if (payment_mode) insertPayload.payment_mode = payment_mode;
  if (notes) insertPayload.notes = notes;

  let resultData: any = null;

  // Primary execution: Direct insert into bill_settlements
  const { data, error } = await supabase
    .from('bill_settlements')
    .insert(insertPayload as any)
    .select('*, parties(id, name, code, gstin, city), dispatch_records(id, outward_bill_no, lorry_no, quality_grade_id)')
    .single();

  if (error) {
    // If the live database schema cache reports missing quality_grade_id or lorry_no columns on bill_settlements (PGRST204),
    // gracefully route lorry_no & quality_grade_id to dispatch_records as per BRS architecture:
    if (error.code === 'PGRST204' && (error.message.includes('lorry_no') || error.message.includes('quality_grade_id'))) {
      console.warn('Columns quality_grade_id/lorry_no not directly on bill_settlements; linking via dispatch_records...');

      const outward_bill_no = formData.bill_number?.trim() || `OB-${Date.now().toString().slice(-6)}`;
      const { data: dispData, error: dispErr } = await supabase
        .from('dispatch_records')
        .insert({
          outward_bill_no,
          dispatch_date: bill_date,
          quality_grade_id,
          party_id,
          lorry_no,
          bill_wt_mt: quantity_mt,
          purchase_bill_no: formData.bill_number?.trim() || '',
          status: 'dispatched',
        })
        .select()
        .single();

      if (dispErr) {
        console.error('Error creating linked dispatch record:', dispErr);
      }

      const fallbackPayload: Record<string, any> = {
        party_id,
        bill_date,
        quantity_mt,
        actual_rate,
        bill_rate,
        payment_status,
        dispatch_id: dispData ? dispData.id : null,
        notes: notes ? `${notes} (Lorry: ${lorry_no})` : `Lorry: ${lorry_no}`,
      };
      if (bank_utr) fallbackPayload.bank_utr = bank_utr;
      if (payment_mode) fallbackPayload.payment_mode = payment_mode;

      const { data: fbData, error: fbErr } = await supabase
        .from('bill_settlements')
        .insert(fallbackPayload as any)
        .select('*, parties(id, name, code, gstin, city), dispatch_records(id, outward_bill_no, lorry_no, quality_grade_id)')
        .single();

      if (fbErr) {
        console.error('Error inserting fallback bill settlement:', fbErr);
        throw fbErr;
      }
      resultData = fbData;
    } else {
      console.error('Error inserting bill settlement:', error);
      throw error;
    }
  } else {
    resultData = data;
  }

  return mapRowToBillEntry(resultData as unknown as BillSettlementRow);
}

/** Update bill settlement */
export async function updateBillSettlement(
  id: string,
  formData: Partial<CreateBillSettlementInput>
): Promise<BillEntry> {
  const updateData: Record<string, any> = {};

  if (formData.dispatchId !== undefined || formData.dispatch_id !== undefined) {
    updateData.dispatch_id = formData.dispatchId ?? formData.dispatch_id;
  }
  if (formData.partyId || formData.party_id) {
    updateData.party_id = formData.partyId || formData.party_id;
  }
  if (formData.billDate || formData.bill_date) {
    updateData.bill_date = formData.billDate || formData.bill_date;
  }
  if (formData.quantityMt !== undefined || formData.quantity_mt !== undefined) {
    updateData.quantity_mt = Number(formData.quantityMt ?? formData.quantity_mt);
  }
  if (formData.actualRate !== undefined || formData.actual_rate !== undefined) {
    updateData.actual_rate = Number(formData.actualRate ?? formData.actual_rate);
  }
  if (formData.billRate !== undefined || formData.bill_rate !== undefined) {
    updateData.bill_rate = Number(formData.billRate ?? formData.bill_rate);
  }
  if (formData.paymentStatus || formData.payment_status) {
    updateData.payment_status = formData.paymentStatus || formData.payment_status;
  }
  if (formData.bankUtr !== undefined || formData.bank_utr !== undefined || formData.rtgs_reference !== undefined) {
    updateData.bank_utr = formData.bankUtr ?? formData.bank_utr ?? formData.rtgs_reference;
  }
  if (formData.paymentMode !== undefined || formData.payment_mode !== undefined) {
    updateData.payment_mode = formData.paymentMode ?? formData.payment_mode;
  }
  if (formData.notes !== undefined || formData.remarks !== undefined) {
    updateData.notes = formData.notes ?? formData.remarks;
  }

  const { data, error } = await supabase
    .from('bill_settlements')
    .update(updateData as any)
    .eq('id', id)
    .select('*, parties(id, name, code, gstin, city), dispatch_records(id, outward_bill_no, lorry_no, quality_grade_id)')
    .single();

  if (error) {
    console.error('Error updating bill settlement:', error);
    throw error;
  }

  return mapRowToBillEntry(data as unknown as BillSettlementRow);
}

/** Settle a bill with bank UTR and set status to paid */
export async function settleBillPayment(id: string, utrNumber: string): Promise<BillEntry> {
  const { data, error } = await supabase
    .from('bill_settlements')
    .update({
      payment_status: 'paid',
      settled_at: new Date().toISOString(),
      bank_utr: utrNumber || null,
    })
    .eq('id', id)
    .select('*, parties(id, name, code, gstin, city), dispatch_records(id, outward_bill_no, lorry_no, quality_grade_id)')
    .single();

  if (error) {
    console.error('Error settling bill payment:', error);
    throw error;
  }

  return mapRowToBillEntry(data as unknown as BillSettlementRow);
}

/** Delete bill settlement */
export async function deleteBillSettlement(id: string): Promise<void> {
  const { error } = await supabase.from('bill_settlements').delete().eq('id', id);
  if (error) {
    console.error('Error deleting bill settlement:', error);
    throw error;
  }
}
