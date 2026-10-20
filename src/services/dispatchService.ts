import supabase from './supabaseClient';
import type { DispatchEntry, Party, Quality, Vehicle } from '../types';

export interface DispatchRow {
  id: string;
  trip_id: string | null;
  dispatch_date: string;
  quality_grade_id: string;
  lorry_no: string;
  bill_wt_mt: number;
  party_id: string;
  purchase_bill_no: string;
  transporter_id: string | null;
  outward_bill_no: string;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  parties?: {
    id: string;
    name: string;
    code: string;
    city?: string | null;
  } | null;
  transporter?: {
    id: string;
    name: string;
    code: string;
  } | null;
  quality_grades?: {
    id: string;
    name: string;
    hsn_code?: string | null;
  } | null;
}

export interface CreateDispatchInput {
  outward_bill_no?: string;
  outwardBillNo?: string;
  dispatch_bill_number?: string;
  dispatch_date?: string;
  dispatchDate?: string;
  quality_grade_id?: string;
  qualityGradeId?: string;
  quality_id?: string;
  party_id?: string;
  partyId?: string;
  transporter_id?: string | null;
  transporterId?: string | null;
  transporter?: string;
  lorry_no?: string;
  lorryNo?: string;
  lorry_number?: string;
  bill_wt_mt?: number | string;
  billWtMt?: number | string;
  bill_weight?: number | string;
  purchase_bill_no?: string;
  purchaseBillNo?: string;
  bill_number?: string;
  status?: string;
  remarks?: string;
  created_by?: string;
}

export function mapRowToDispatchEntry(row: DispatchRow): DispatchEntry {
  const party: Party | undefined = row.parties
    ? {
        id: row.parties.id,
        party_code: row.parties.code,
        party_name: row.parties.name,
        city: row.parties.city || undefined,
        is_active: true,
        created_at: row.created_at || '',
      }
    : undefined;

  const quality: Quality | undefined = row.quality_grades
    ? {
        id: row.quality_grades.id,
        quality_code: row.quality_grades.hsn_code || 'HSN',
        quality_name: row.quality_grades.name,
        unit_of_measure: 'MT',
        hsn_code: row.quality_grades.hsn_code || undefined,
        is_active: true,
        created_at: row.created_at || '',
      }
    : undefined;

  const vehicle: Vehicle | undefined = row.lorry_no
    ? {
        id: row.lorry_no,
        lorry_number: row.lorry_no,
        vehicle_type: 'Truck',
        is_active: true,
        created_at: row.created_at || '',
      }
    : undefined;

  const statusStr = (row.status || '').toLowerCase();
  const normalizedStatus =
    statusStr === 'dispatched' ? 'dispatched' : statusStr === 'cancelled' ? 'cancelled' : 'draft';

  return {
    id: row.id,
    dispatch_date: row.dispatch_date,
    quality_id: row.quality_grade_id,
    lorry_number: row.lorry_no,
    bill_weight: Number(row.bill_wt_mt) || 0,
    party_id: row.party_id,
    bill_number: row.purchase_bill_no || '',
    transporter: row.transporter?.name || '',
    dispatch_bill_number: row.outward_bill_no,
    remarks: '',
    status: normalizedStatus as 'draft' | 'dispatched' | 'cancelled',
    created_by: 'System',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    parties: party,
    qualities: quality,
    vehicles: vehicle,
  };
}

/** Fetch live dispatch records joined with parties & quality_grades */
export async function fetchDispatchRecords(): Promise<DispatchEntry[]> {
  const { data, error } = await supabase
    .from('dispatch_records')
    .select(
      '*, parties!party_id(id, name, code, city), transporter:parties!transporter_id(id, name, code), quality_grades(id, name, hsn_code)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching dispatch records:', error);
    throw error;
  }

  return ((data as unknown as DispatchRow[]) || []).map(mapRowToDispatchEntry);
}

/** Insert a live dispatch record into Supabase */
export async function createDispatchRecord(formData: CreateDispatchInput): Promise<DispatchEntry> {
  const outward_bill_no = formData.outwardBillNo || formData.outward_bill_no || formData.dispatch_bill_number || '';
  const dispatch_date =
    formData.dispatchDate ||
    formData.dispatch_date ||
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const quality_grade_id = formData.qualityGradeId || formData.quality_grade_id || formData.quality_id || '';
  const party_id = formData.partyId || formData.party_id || '';
  const transporter_id = formData.transporterId || formData.transporter_id || null;
  const lorry_no = (formData.lorryNo || formData.lorry_no || formData.lorry_number || '').toUpperCase().trim();
  const bill_wt_mt = Number(formData.billWtMt || formData.bill_wt_mt || formData.bill_weight || 0);
  const purchase_bill_no = formData.purchaseBillNo || formData.purchase_bill_no || formData.bill_number || '';
  const status = formData.status || 'dispatched';

  if (!outward_bill_no) throw new Error('Outward Bill Number is required');
  if (!quality_grade_id) throw new Error('Quality Grade is required');
  if (!party_id) throw new Error('Party is required');
  if (!lorry_no) throw new Error('Lorry Number is required');

  const { data, error } = await supabase
    .from('dispatch_records')
    .insert({
      outward_bill_no,
      dispatch_date,
      quality_grade_id,
      party_id,
      transporter_id,
      lorry_no,
      bill_wt_mt,
      purchase_bill_no,
      status,
    })
    .select(
      '*, parties!party_id(id, name, code, city), transporter:parties!transporter_id(id, name, code), quality_grades(id, name, hsn_code)'
    )
    .single();

  if (error) {
    console.error('Error inserting dispatch record:', error);
    throw error;
  }

  return mapRowToDispatchEntry(data as unknown as DispatchRow);
}

/** Update dispatch record */
export async function updateDispatchRecord(
  id: string,
  formData: Partial<CreateDispatchInput>
): Promise<DispatchEntry> {
  const updateData: Record<string, any> = {};

  if (formData.outwardBillNo || formData.outward_bill_no || formData.dispatch_bill_number) {
    updateData.outward_bill_no = formData.outwardBillNo || formData.outward_bill_no || formData.dispatch_bill_number;
  }
  if (formData.dispatchDate || formData.dispatch_date) {
    updateData.dispatch_date = formData.dispatchDate || formData.dispatch_date;
  }
  if (formData.qualityGradeId || formData.quality_grade_id || formData.quality_id) {
    updateData.quality_grade_id = formData.qualityGradeId || formData.quality_grade_id || formData.quality_id;
  }
  if (formData.partyId || formData.party_id) {
    updateData.party_id = formData.partyId || formData.party_id;
  }
  if (formData.transporterId !== undefined || formData.transporter_id !== undefined) {
    updateData.transporter_id = formData.transporterId ?? formData.transporter_id;
  }
  if (formData.lorryNo || formData.lorry_no || formData.lorry_number) {
    updateData.lorry_no = (formData.lorryNo || formData.lorry_no || formData.lorry_number || '').toUpperCase().trim();
  }
  if (formData.billWtMt !== undefined || formData.bill_wt_mt !== undefined || formData.bill_weight !== undefined) {
    updateData.bill_wt_mt = Number(formData.billWtMt ?? formData.bill_wt_mt ?? formData.bill_weight);
  }
  if (formData.purchaseBillNo !== undefined || formData.purchase_bill_no !== undefined || formData.bill_number !== undefined) {
    updateData.purchase_bill_no = formData.purchaseBillNo ?? formData.purchase_bill_no ?? formData.bill_number;
  }
  if (formData.status) {
    updateData.status = formData.status;
  }

  const { data, error } = await supabase
    .from('dispatch_records')
    .update(updateData as any)
    .eq('id', id)
    .select(
      '*, parties!party_id(id, name, code, city), transporter:parties!transporter_id(id, name, code), quality_grades(id, name, hsn_code)'
    )
    .single();

  if (error) {
    console.error('Error updating dispatch record:', error);
    throw error;
  }

  return mapRowToDispatchEntry(data as unknown as DispatchRow);
}

/** Delete dispatch record */
export async function deleteDispatchRecord(id: string): Promise<void> {
  const { error } = await supabase.from('dispatch_records').delete().eq('id', id);
  if (error) {
    console.error('Error deleting dispatch record:', error);
    throw error;
  }
}
