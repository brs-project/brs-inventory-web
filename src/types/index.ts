export interface UserProfile {
  id: string
  full_name: string
  email?: string
  phone?: string
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'auditor'
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface Party {
  id: string
  party_code: string
  party_name: string
  contact_person?: string
  phone?: string
  address?: string
  gst_number?: string
  city?: string
  state?: string
  is_active: boolean
  created_at: string
}

export interface Quality {
  id: string
  quality_code: string
  quality_name: string
  description?: string
  unit_of_measure: string
  hsn_code?: string
  category?: string
  is_active: boolean
  created_at: string
}

export interface Godown {
  id: string
  godown_code: string
  godown_name: string
  address?: string
  capacity_mt?: number
  incharge_name?: string
  phone?: string
  is_active: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  lorry_number: string
  owner_name?: string
  vehicle_type?: string
  capacity_mt?: number
  driver_name?: string
  driver_phone?: string
  is_active: boolean
  created_at: string
}

export interface InventoryTransaction {
  id: string
  transaction_date: string
  party_id: string
  quality_id: string
  godown_id?: string
  vehicle_in_id?: string
  lorry_number?: string
  bill_number?: string
  inward_weight: number
  godown_weight: number
  weight_variance: number
  total_weight?: number
  dispatch_variance?: number
  vehicle_out_id?: string
  outward_weight: number
  net_stock: number
  remarks?: string
  status: 'draft' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  parties?: Party
  qualities?: Quality
  godowns?: Godown
  vehicles_in?: Vehicle
  vehicles_out?: Vehicle
  user_profiles?: UserProfile
}

export interface DashboardKPI {
  totalInwardToday: number
  totalOutwardToday: number
  totalInwardWeek: number
  totalOutwardWeek: number
  currentStock: number
  activeLorriesToday: number
}

export interface DailySummary {
  transaction_date: string
  transaction_count: number
  total_inward: number
  total_outward: number
  net_stock: number
  total_variance: number
}

export interface CompanySettings {
  company_name: string
  address: string
  phone: string
  email: string
  gst_number?: string
  logo_url?: string
}

export interface AppPreferences {
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  time_zone: string
  weight_unit: 'MT' | 'KG'
  decimal_places: 2 | 3
  items_per_page: 10 | 25 | 50 | 100
  theme: 'light' | 'dark' | 'system'
  primary_color: string
  sidebar_style: 'expanded' | 'compact'
}

export interface QualityStockThreshold {
  quality_id: string
  quality_name: string
  min_stock_mt: number
}

export interface NotificationSettings {
  email_notifications_enabled: boolean
  notify_new_transaction: boolean
  notify_low_stock: boolean
  notify_daily_summary: boolean
  notify_weekly_report: boolean
  stock_thresholds: QualityStockThreshold[]
  recipient_emails: string[]
}

export interface PastImportRecord {
  id: string
  filename: string
  import_type: string
  records_count: number
  imported_by: string
  imported_at: string
  status: 'success' | 'failed'
}

export interface AppSettingsState {
  company: CompanySettings
  preferences: AppPreferences
  notifications: NotificationSettings
  last_backup_at?: string
  auto_backup_enabled: boolean
  auto_backup_frequency: 'Daily' | 'Weekly' | 'Monthly'
  past_imports: PastImportRecord[]
}

export interface DispatchEntry {
  id: string
  dispatch_date: string                    // DATE column
  quality_id: string                       // Quality (FK -> qualities)
  lorry_number: string                     // LORRY No (FK -> vehicles or free text)
  bill_weight: number                      // Bill Wt (in MT, 3 decimal)
  party_id: string                         // Party Name (FK -> parties)
  bill_number: string                      // Bill No (internal/purchase bill)
  transporter: string                      // Transporter name (free text or FK)
  dispatch_bill_number: string             // BILL NO (outward dispatch bill)
  remarks?: string                         // Optional notes
  status: 'draft' | 'dispatched' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  qualities?: Quality
  parties?: Party
  vehicles?: Vehicle
}

export interface DispatchFilters {
  search?: string
  dateFrom?: string
  dateTo?: string
  partyIds?: string[]
  qualityIds?: string[]
  lorryNumber?: string
  transporter?: string
  billNumber?: string
  dispatchBillNumber?: string
  status?: string[]
  minWeight?: number
  maxWeight?: number
}

export interface DispatchSummary {
  totalDispatches: number
  totalBillWeight: number
  uniqueParties: number
  uniqueLorries: number
  uniqueTransporters: number
  totalWeightKG?: number
  totalWeightMT?: number
  dispatchedCount?: number
  draftCount?: number
  cancelledCount?: number
}

export interface BillEntry {
  id: string
  bill_date: string                    // DATE
  party_id: string                     // From (party reference)
  party_code: string                   // C-248 style code (denormalized)
  quality_id: string                   // Quality
  quality_grade_id?: string            // quality_grade_id (UUID)
  lorry_number: string                 // LORRY No
  lorry_no?: string                    // LORRY No
  quantity_mt: number                  // qty in MT (3 decimal)
  bill_rate: number                    // bill rate per KG (2 decimal)
  actual_rate: number                  // Rate/kg — actual rate per KG (2 decimal)
  
  // Computed (auto-calculated, stored for reporting):
  rate_difference: number              // BILL AMT = actual_rate - bill_rate
  rtgs_amount: number                  // RTGS/AMT = rate_difference × qty × 1000
  quantity_kg: number                  // qty × 1000 (KG)
  
  // Additional fields:
  bill_number?: string                 // Reference bill number
  rtgs_reference?: string
  bank_utr?: string
  bankUtr?: string              // RTGS transaction reference
  payment_status: 'pending' | 'paid' | 'partial' | 'na'
  billing_type: 'under' | 'over' | 'exact'
  remarks?: string
  created_by: string
  created_at: string
  updated_at: string
  
  // Joined:
  parties?: Party
  qualities?: Quality
}

export interface BillFilters {
  party_id?: string
  party_code?: string
  billing_type?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  dateFrom?: string
  dateTo?: string
  partyIds?: string[]
  partyCodes?: string[]                // Search by C-248 style codes
  qualityIds?: string[]
  lorryNumber?: string
  billingType?: ('under' | 'over' | 'exact')[]
  paymentStatus?: string[]
  billNumber?: string
  minQty?: number
  maxQty?: number
  minRtgsAmount?: number
  maxRtgsAmount?: number
  search?: string
}

export interface BillSummary {
  totalEntries: number
  totalQuantityMT: number
  totalQuantityKG: number
  totalRtgsAmount: number
  underBillingCount: number
  overBillingCount: number
  exactBillingCount: number
  totalUnderBillingAmount: number
  totalOverBillingAmount: number
  netRtgsPayable: number
  avgBillRate: number
  avgActualRate: number
  totalBills?: number
  totalMT?: number
  totalPayableRTGS?: number
  totalReceivableRTGS?: number
  netRTGS?: number
  underCount?: number
  overCount?: number
  exactCount?: number
}

