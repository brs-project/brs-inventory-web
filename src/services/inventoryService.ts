const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import supabase from './supabaseClient';

import type { InventoryTransaction, Party, Quality } from '../types';

export interface InventoryTransactionRow {
  id: string;
  transaction_date: string;
  invoice_no: string | null;
  party_id: string;
  quality_grade_id: string;
  lorry_number: string | null;
  weight_mt: number;
  weight_kg: number | null;
  transaction_type: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  parties?: {
    id: string;
    name: string;
    code: string;
    city?: string | null;
  } | null;
  quality_grades?: {
    id: string;
    name: string;
    hsn_code?: string | null;
  } | null;
}

export interface TransactionFilters {
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  partyIds?: string[];
  qualityIds?: string[];
  godownIds?: string[];
  status?: string[];
  billNumber?: string;
  lorryNumber?: string;
  minWeight?: number;
  maxWeight?: number;
}

export interface CreateInventoryTransactionInput {
  transaction_date?: string | Date;
  transactionDate?: string;
  invoice_no?: string;
  invoiceNo?: string;
  bill_number?: string;
  billNo?: string;
  party_id?: string;
  partyId?: string;
  quality_grade_id?: string;
  qualityGradeId?: string;
  quality_id?: string;
  lorry_number?: string;
  lorryNumber?: string;
  inwardLorryNumber?: string;
  vehicle_in_id?: string;
  weight_mt?: number;
  weightMt?: number;
  inward_weight?: number;
  inwardWeight?: number;
  transaction_type?: string;
  transactionType?: string;
  status?: string;
  remarks?: string;
}

export function mapRowToTransaction(row: InventoryTransactionRow): InventoryTransaction {
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

  const weightMt = Number(row.weight_mt) || 0;
  const statusStr = (row.status || '').toLowerCase();
  const normalizedStatus =
    statusStr === 'completed' ? 'completed' : statusStr === 'cancelled' ? 'cancelled' : 'draft';

  return {
    id: row.id,
    transaction_date: row.transaction_date,
    party_id: row.party_id,
    quality_id: row.quality_grade_id,
    bill_number: row.invoice_no || '',
    inward_weight: weightMt,
    godown_weight: 0,
    outward_weight: 0,
    total_weight: weightMt,
    weight_variance: 0,
    dispatch_variance: 0,
    net_stock: weightMt,
    remarks: '',
    status: normalizedStatus as 'draft' | 'completed' | 'cancelled',
    created_by: 'System',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    lorry_number: row.lorry_number || undefined,
    vehicle_in_id: row.lorry_number || undefined,
    vehicle_out_id: row.lorry_number || undefined,
    parties: party,
    qualities: quality,
  };
}

/** Fetch live transactions directly from Supabase */
export async function fetchInventoryTransactions(
  filters?: TransactionFilters
): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*, parties(id, name, code, city), quality_grades(id, name, hsn_code)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory transactions:', error);
    throw error;
  }

  let records = ((data as unknown as InventoryTransactionRow[]) || []).map(mapRowToTransaction);

  if (!filters) return records;

  if (filters.partyIds?.length) {
    records = records.filter((r) => filters.partyIds?.includes(r.party_id));
  }
  if (filters.qualityIds?.length) {
    records = records.filter((r) => filters.qualityIds?.includes(r.quality_id));
  }
  if (filters.status?.length) {
    records = records.filter((r) => filters.status?.includes(r.status));
  }
  if (filters.billNumber) {
    const q = filters.billNumber.toLowerCase();
    records = records.filter((r) => (r.bill_number || '').toLowerCase().includes(q));
  }
  if (filters.lorryNumber) {
    const q = filters.lorryNumber.toLowerCase();
    records = records.filter(
      (r) =>
        (r.vehicle_in_id && r.vehicle_in_id.toLowerCase().includes(q)) ||
        (r.lorry_number && r.lorry_number.toLowerCase().includes(q))
    );
  }
  if (filters.minWeight !== undefined) {
    records = records.filter((r) => r.inward_weight >= filters.minWeight!);
  }
  if (filters.maxWeight !== undefined) {
    records = records.filter((r) => r.inward_weight <= filters.maxWeight!);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    records = records.filter((r) => new Date(r.transaction_date) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    records = records.filter((r) => new Date(r.transaction_date) <= to);
  }
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    records = records.filter((r) => {
      const bill = (r.bill_number || '').toLowerCase();
      const party = (r.parties?.party_name || '').toLowerCase();
      const partyCode = (r.parties?.party_code || '').toLowerCase();
      const quality = (r.qualities?.quality_name || '').toLowerCase();
      const lorry = (r.vehicle_in_id || r.lorry_number || '').toLowerCase();
      return (
        bill.includes(q) ||
        party.includes(q) ||
        partyCode.includes(q) ||
        quality.includes(q) ||
        lorry.includes(q)
      );
    });
  }

  return records;
}

/** Create a live inventory transaction in Supabase */
export async function createInventoryTransaction(
  payload: CreateInventoryTransactionInput
): Promise<InventoryTransaction> {
  const transaction_date =
    payload.transactionDate ||
    (payload.transaction_date instanceof Date
      ? payload.transaction_date.toISOString().split('T')[0]
      : payload.transaction_date) ||
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const invoice_no = payload.invoiceNo || payload.billNo || payload.bill_number || payload.invoice_no || null;
  const party_id = (payload.partyId || payload.party_id || '').trim();
  const quality_grade_id = (payload.qualityGradeId || payload.quality_id || payload.quality_grade_id || '').trim();
  const lorry_number = payload.lorryNumber || payload.inwardLorryNumber || payload.lorry_number || payload.vehicle_in_id || null;
  const weight_mt = Number(payload.weightMt ?? payload.inwardWeight ?? payload.weight_mt ?? payload.inward_weight ?? 0);

  // Validate UUIDs strictly - Do NOT pass names or codes
  if (!party_id) {
    throw new Error('party_id is required.');
  }
  if (!UUID_REGEX.test(party_id)) {
    throw new Error(`Invalid party_id: '${party_id}'. Must be a valid UUID string.`);
  }

  if (!quality_grade_id) {
    throw new Error('quality_grade_id is required.');
  }
  if (!UUID_REGEX.test(quality_grade_id)) {
    throw new Error(`Invalid quality_grade_id: '${quality_grade_id}'. Must be a valid UUID string.`);
  }

  if (isNaN(weight_mt) || weight_mt <= 0) {
    throw new Error('weight_mt must be a positive number greater than 0.');
  }

  // Allowed transaction types: 'INWARD' | 'OUTWARD' | 'GODOWN_TRANSFER' | 'ADJUSTMENT'
  const ALLOWED_TYPES = ['INWARD', 'OUTWARD', 'GODOWN_TRANSFER', 'ADJUSTMENT'] as const;
  type AllowedType = typeof ALLOWED_TYPES[number];
  let transaction_type: AllowedType = 'INWARD';
  const rawType = (payload.transactionType || payload.transaction_type || 'INWARD').toUpperCase();
  if (ALLOWED_TYPES.includes(rawType as AllowedType)) {
    transaction_type = rawType as AllowedType;
  }

  // Allowed status: 'Completed' | 'Draft'
  let status: 'Completed' | 'Draft' = 'Completed';
  const rawStatus = (payload.status || 'Completed').toLowerCase();
  if (rawStatus === 'draft') {
    status = 'Draft';
  } else {
    status = 'Completed';
  }

  // Payload sent to inventory_transactions: EXCLUDE weight_kg (generated column)
  const insertPayload: Record<string, any> = {
    transaction_date,
    invoice_no,
    party_id,
    quality_grade_id,
    lorry_number,
    weight_mt,
    transaction_type,
    status,
  };
  delete insertPayload.weight_kg;

  console.log('[inventoryService.createInventoryTransaction] Insert Payload:', insertPayload);

  // Clean .select().single() without nested relational selectors
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating inventory transaction:', error);
    const detail = error.details ? ` (${error.details})` : '';
    const hint = error.hint ? ` [Hint: ${error.hint}]` : '';
    throw new Error(`${error.message}${detail}${hint}`);
  }

  // Retrieve joined party and quality metadata for returned model
  let partyObj: Party | undefined;
  let qualityObj: Quality | undefined;
  try {
    const [partyRes, qualityRes] = await Promise.all([
      supabase.from('parties').select('id, name, code, city, created_at').eq('id', party_id).maybeSingle(),
      supabase.from('quality_grades').select('id, name, hsn_code, created_at').eq('id', quality_grade_id).maybeSingle(),
    ]);

    if (partyRes.data) {
      partyObj = {
        id: partyRes.data.id,
        party_code: partyRes.data.code,
        party_name: partyRes.data.name,
        city: partyRes.data.city || undefined,
        is_active: true,
        created_at: partyRes.data.created_at || '',
      };
    }

    if (qualityRes.data) {
      qualityObj = {
        id: qualityRes.data.id,
        quality_code: qualityRes.data.hsn_code || 'HSN',
        quality_name: qualityRes.data.name,
        unit_of_measure: 'MT',
        hsn_code: qualityRes.data.hsn_code || undefined,
        category: 'Scrap',
        is_active: true,
        created_at: qualityRes.data.created_at || '',
      };
    }
  } catch {
    // Non-critical metadata lookup
  }

  const row = data as unknown as InventoryTransactionRow;
  return {
    id: row.id,
    transaction_date: row.transaction_date,
    party_id: row.party_id,
    quality_id: row.quality_grade_id,
    bill_number: row.invoice_no || '',
    inward_weight: Number(row.weight_mt) || 0,
    godown_weight: 0,
    outward_weight: 0,
    total_weight: Number(row.weight_mt) || 0,
    weight_variance: 0,
    dispatch_variance: 0,
    net_stock: Number(row.weight_mt) || 0,
    remarks: payload.remarks || '',
    status: row.status?.toLowerCase() === 'completed' ? 'completed' : 'draft',
    created_by: 'System',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    lorry_number: row.lorry_number || undefined,
    vehicle_in_id: row.lorry_number || undefined,
    vehicle_out_id: row.lorry_number || undefined,
    parties: partyObj,
    qualities: qualityObj,
  };
}

/** Update an existing transaction */
export async function updateInventoryTransaction(
  id: string,
  payload: Partial<CreateInventoryTransactionInput>
): Promise<InventoryTransaction> {
  const updateData: Record<string, any> = {};

  if (payload.transactionDate || payload.transaction_date) {
    updateData.transaction_date =
      payload.transactionDate ||
      (payload.transaction_date instanceof Date
        ? payload.transaction_date.toISOString().split('T')[0]
        : payload.transaction_date);
  }
  if (payload.invoiceNo || payload.bill_number || payload.invoice_no) {
    updateData.invoice_no = payload.invoiceNo || payload.bill_number || payload.invoice_no;
  }
  if (payload.partyId || payload.party_id) {
    updateData.party_id = payload.partyId || payload.party_id;
  }
  if (payload.qualityGradeId || payload.quality_id || payload.quality_grade_id) {
    updateData.quality_grade_id = payload.qualityGradeId || payload.quality_id || payload.quality_grade_id;
  }
  if (payload.lorryNumber || payload.inwardLorryNumber || payload.lorry_number || payload.vehicle_in_id) {
    updateData.lorry_number = payload.lorryNumber || payload.inwardLorryNumber || payload.lorry_number || payload.vehicle_in_id;
  }
  if (payload.weightMt !== undefined || payload.inward_weight !== undefined || payload.weight_mt !== undefined) {
    updateData.weight_mt = Number(payload.weightMt ?? payload.inward_weight ?? payload.weight_mt);
  }
  if (payload.status) {
    updateData.status = payload.status;
  }

  const { data, error } = await supabase
    .from('inventory_transactions')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating inventory transaction:', error);
    throw error;
  }

  return mapRowToTransaction(data as unknown as InventoryTransactionRow);
}

/** Delete transaction by ID */
export async function deleteInventoryTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_transactions').delete().eq('id', id);
  if (error) {
    console.error('Error deleting inventory transaction:', error);
    throw error;
  }
}
