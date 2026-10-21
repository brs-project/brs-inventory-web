import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ddsmjjkjsvwvvpgyoblc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TS1OG2yYUHdJct3f-4QY3A_U5NJUr9p'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          after_json: Json | null
          before_json: Json | null
          client_ip: string | null
          created_at: string | null
          entity: string
          entity_id: string
          id: number
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          after_json?: Json | null
          before_json?: Json | null
          client_ip?: string | null
          created_at?: string | null
          entity: string
          entity_id: string
          id?: number
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          after_json?: Json | null
          before_json?: Json | null
          client_ip?: string | null
          created_at?: string | null
          entity?: string
          entity_id?: string
          id?: number
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bill_settlements: {
        Row: {
          actual_rate: number
          bank_utr: string | null
          bill_date: string
          bill_rate: number
          billing_type: string | null
          created_at: string | null
          dispatch_id: string | null
          id: string
          lorry_no: string | null
          notes: string | null
          party_id: string
          payment_mode: string | null
          payment_status: string | null
          quality_grade_id: string | null
          quantity_kg: number | null
          quantity_mt: number
          rate_diff: number | null
          rtgs_amount: number | null
          settled_at: string | null
          settled_by: string | null
        }
        Insert: {
          actual_rate: number
          bank_utr?: string | null
          bill_date?: string
          bill_rate: number
          billing_type?: string | null
          created_at?: string | null
          dispatch_id?: string | null
          id?: string
          lorry_no?: string | null
          notes?: string | null
          party_id: string
          payment_mode?: string | null
          payment_status?: string | null
          quality_grade_id?: string | null
          quantity_kg?: number | null
          quantity_mt: number
          rate_diff?: number | null
          rtgs_amount?: number | null
          settled_at?: string | null
          settled_by?: string | null
        }
        Update: {
          actual_rate?: number
          bank_utr?: string | null
          bill_date?: string
          bill_rate?: number
          billing_type?: string | null
          created_at?: string | null
          dispatch_id?: string | null
          id?: string
          lorry_no?: string | null
          notes?: string | null
          party_id?: string
          payment_mode?: string | null
          payment_status?: string | null
          quality_grade_id?: string | null
          quantity_kg?: number | null
          quantity_mt?: number
          rate_diff?: number | null
          rtgs_amount?: number | null
          settled_at?: string | null
          settled_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_settlements_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatch_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_settlements_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_settlements_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "bill_settlements_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_settlements_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "view_item_wise_sauda_summary"
            referencedColumns: ["quality_grade_id"]
          },
        ]
      }
      dispatch_records: {
        Row: {
          bill_wt_mt: number
          created_at: string | null
          dispatch_date: string
          id: string
          lorry_no: string
          outward_bill_no: string
          party_id: string
          purchase_bill_no: string
          quality_grade_id: string
          status: string | null
          transporter_id: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          bill_wt_mt: number
          created_at?: string | null
          dispatch_date?: string
          id?: string
          lorry_no: string
          outward_bill_no: string
          party_id: string
          purchase_bill_no: string
          quality_grade_id: string
          status?: string | null
          transporter_id?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bill_wt_mt?: number
          created_at?: string | null
          dispatch_date?: string
          id?: string
          lorry_no?: string
          outward_bill_no?: string
          party_id?: string
          purchase_bill_no?: string
          quality_grade_id?: string
          status?: string | null
          transporter_id?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_records_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_records_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "dispatch_records_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_records_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "view_item_wise_sauda_summary"
            referencedColumns: ["quality_grade_id"]
          },
          {
            foreignKeyName: "dispatch_records_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_records_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "dispatch_records_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      godown_chits: {
        Row: {
          bay_location: string | null
          id: string
          is_voided: boolean
          logged_at: string | null
          logged_by: string | null
          notes: string | null
          party_id: string | null
          quality_grade_id: string
          transaction_type: string | null
          trip_id: string
          weight_kg: number
          weight_mt: number | null
        }
        Insert: {
          bay_location?: string | null
          id?: string
          is_voided?: boolean
          logged_at?: string | null
          logged_by?: string | null
          notes?: string | null
          party_id?: string | null
          quality_grade_id: string
          transaction_type?: string | null
          trip_id: string
          weight_kg: number
          weight_mt?: number | null
        }
        Update: {
          bay_location?: string | null
          id?: string
          is_voided?: boolean
          logged_at?: string | null
          logged_by?: string | null
          notes?: string | null
          party_id?: string | null
          quality_grade_id?: string
          transaction_type?: string | null
          trip_id?: string
          weight_kg?: number
          weight_mt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "godown_chits_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "godown_chits_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "godown_chits_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "godown_chits_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "view_item_wise_sauda_summary"
            referencedColumns: ["quality_grade_id"]
          },
          {
            foreignKeyName: "godown_chits_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stocks: {
        Row: {
          current_stock_kg: number
          current_stock_mt: number | null
          id: string
          quality_grade_id: string
          updated_at: string | null
        }
        Insert: {
          current_stock_kg?: number
          current_stock_mt?: number | null
          id?: string
          quality_grade_id: string
          updated_at?: string | null
        }
        Update: {
          current_stock_kg?: number
          current_stock_mt?: number | null
          id?: string
          quality_grade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stocks_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: true
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stocks_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: true
            referencedRelation: "view_item_wise_sauda_summary"
            referencedColumns: ["quality_grade_id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          id: string
          invoice_no: string | null
          lorry_number: string | null
          party_id: string | null
          quality_grade_id: string
          status: string
          transaction_date: string
          transaction_type: string
          updated_at: string | null
          weight_kg: number | null
          weight_mt: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_no?: string | null
          lorry_number?: string | null
          party_id?: string | null
          quality_grade_id: string
          status?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          weight_kg?: number | null
          weight_mt?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_no?: string | null
          lorry_number?: string | null
          party_id?: string | null
          quality_grade_id?: string
          status?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          weight_kg?: number | null
          weight_mt?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "inventory_transactions_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "view_item_wise_sauda_summary"
            referencedColumns: ["quality_grade_id"]
          },
        ]
      }
      override_logs: {
        Row: {
          approved_at: string | null
          approved_by: string
          created_at: string | null
          id: string
          notes: string | null
          reason_code: string
          trip_id: string
          variance_kg: number
        }
        Insert: {
          approved_at?: string | null
          approved_by: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason_code: string
          trip_id: string
          variance_kg: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason_code?: string
          trip_id?: string
          variance_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "override_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          city: string
          code: string
          contact_person: string
          created_at: string | null
          credit_terms_days: number
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          phone: string
          state: string | null
          types: string[]
          updated_at: string | null
        }
        Insert: {
          city: string
          code: string
          contact_person: string
          created_at?: string | null
          credit_terms_days?: number
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone: string
          state?: string | null
          types: string[]
          updated_at?: string | null
        }
        Update: {
          city?: string
          code?: string
          contact_person?: string
          created_at?: string | null
          credit_terms_days?: number
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          state?: string | null
          types?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      quality_grades: {
        Row: {
          created_at: string | null
          default_rate_per_kg: number
          hsn_code: string
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_rate_per_kg?: number
          hsn_code?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_rate_per_kg?: number
          hsn_code?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transporters: {
        Row: {
          city: string | null
          contact_person: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transports: {
        Row: {
          created_at: string | null
          default_freight_rate_per_mt: number | null
          default_route: string | null
          default_tare_weight_mt: number | null
          driver_name: string | null
          driver_phone: string | null
          fixed_trip_charge: number | null
          id: string
          is_active: boolean
          material_type: string | null
          transporter_id: string | null
          transporter_name: string | null
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          default_freight_rate_per_mt?: number | null
          default_route?: string | null
          default_tare_weight_mt?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          fixed_trip_charge?: number | null
          id?: string
          is_active?: boolean
          material_type?: string | null
          transporter_id?: string | null
          transporter_name?: string | null
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          default_freight_rate_per_mt?: number | null
          default_route?: string | null
          default_tare_weight_mt?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          fixed_trip_charge?: number | null
          id?: string
          is_active?: boolean
          material_type?: string | null
          transporter_id?: string | null
          transporter_name?: string | null
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "transports_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transports_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
        ]
      }
      trips: {
        Row: {
          closed_at: string | null
          created_at: string | null
          id: string
          scenario_type: string
          status: string
          tolerance_band_kg: number
          vehicle_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          id?: string
          scenario_type: string
          status?: string
          tolerance_band_kg?: number
          vehicle_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          id?: string
          scenario_type?: string
          status?: string
          tolerance_band_kg?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          default_freight_rate_per_mt: number | null
          default_route: string | null
          driver_name: string | null
          driver_phone: string | null
          fixed_trip_charge: number | null
          id: string
          is_active: boolean
          last_known_tare_weight: number | null
          plate_number: string
          tare_captured_at: string | null
          transporter_id: string | null
          transporter_name: string | null
          updated_at: string | null
          vehicle_capacity_mt: number | null
        }
        Insert: {
          created_at?: string | null
          default_freight_rate_per_mt?: number | null
          default_route?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          fixed_trip_charge?: number | null
          id?: string
          is_active?: boolean
          last_known_tare_weight?: number | null
          plate_number: string
          tare_captured_at?: string | null
          transporter_id?: string | null
          transporter_name?: string | null
          updated_at?: string | null
          vehicle_capacity_mt?: number | null
        }
        Update: {
          created_at?: string | null
          default_freight_rate_per_mt?: number | null
          default_route?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          fixed_trip_charge?: number | null
          id?: string
          is_active?: boolean
          last_known_tare_weight?: number | null
          plate_number?: string
          tare_captured_at?: string | null
          transporter_id?: string | null
          transporter_name?: string | null
          updated_at?: string | null
          vehicle_capacity_mt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "view_party_turnover_summary"
            referencedColumns: ["party_id"]
          },
        ]
      }
      weighments: {
        Row: {
          captured_at: string | null
          captured_by: string | null
          device_id: string | null
          id: string
          is_final: boolean
          photo_url: string | null
          trip_id: string
          weighment_type: string
          weight_kg: number
          weight_mt: number | null
        }
        Insert: {
          captured_at?: string | null
          captured_by?: string | null
          device_id?: string | null
          id?: string
          is_final?: boolean
          photo_url?: string | null
          trip_id: string
          weighment_type: string
          weight_kg: number
          weight_mt?: number | null
        }
        Update: {
          captured_at?: string | null
          captured_by?: string | null
          device_id?: string | null
          id?: string
          is_final?: boolean
          photo_url?: string | null
          trip_id?: string
          weighment_type?: string
          weight_kg?: number
          weight_mt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weighments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_daily_scrap_movement: {
        Row: {
          date: string | null
          inward_receipt_mt: number | null
          net_day_balance_mt: number | null
          outward_dispatch_mt: number | null
          scrap_grade_name: string | null
        }
        Relationships: []
      }
      view_item_wise_sauda_summary: {
        Row: {
          hsn_code: string | null
          max_sauda_rate: number | null
          min_sauda_rate: number | null
          quality_grade_id: string | null
          scrap_grade_name: string | null
          total_deals: number | null
          total_quantity_mt: number | null
          total_rtgs_difference_inr: number | null
          total_sauda_value_inr: number | null
          weighted_avg_bill_rate: number | null
          weighted_avg_sauda_rate: number | null
        }
        Relationships: []
      }
      view_party_turnover_summary: {
        Row: {
          city: string | null
          gstin: string | null
          party_code: string | null
          party_id: string | null
          party_name: string | null
          pending_rtgs_difference_inr: number | null
          total_bills: number | null
          total_sauda_turnover_inr: number | null
          total_tonnage_mt: number | null
        }
        Relationships: []
      }
      view_transporter_haulage: {
        Row: {
          city: string | null
          first_dispatch_date: string | null
          latest_dispatch_date: string | null
          total_dispatches_handled: number | null
          total_mt_hauled: number | null
          transporter_id: string | null
          transporter_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

/**
 * Initialized typed Supabase client.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export default supabase
