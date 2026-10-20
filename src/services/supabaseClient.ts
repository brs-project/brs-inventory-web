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
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
          quality_grade_id?: string | null
          lorry_no?: string | null
          actual_rate: number
          bank_utr: string | null
          bill_date: string
          bill_rate: number
          billing_type: string | null
          created_at: string | null
          dispatch_id: string | null
          id: string
          notes: string | null
          party_id: string
          payment_mode: string | null
          payment_status: string | null
          quantity_kg: number | null
          quantity_mt: number
          rate_diff: number | null
          rtgs_amount: number | null
          settled_at: string | null
          settled_by: string | null
        }
        Insert: {
          quality_grade_id?: string | null
          lorry_no?: string | null
          actual_rate: number
          bank_utr?: string | null
          bill_date?: string
          bill_rate: number
          billing_type?: string | null
          created_at?: string | null
          dispatch_id?: string | null
          id?: string
          notes?: string | null
          party_id: string
          payment_mode?: string | null
          payment_status?: string | null
          quantity_kg?: number | null
          quantity_mt: number
          rate_diff?: number | null
          rtgs_amount?: number | null
          settled_at?: string | null
          settled_by?: string | null
        }
        Update: {
          quality_grade_id?: string | null
          lorry_no?: string | null
          actual_rate?: number
          bank_utr?: string | null
          bill_date?: string
          bill_rate?: number
          billing_type?: string | null
          created_at?: string | null
          dispatch_id?: string | null
          id?: string
          notes?: string | null
          party_id?: string
          payment_mode?: string | null
          payment_status?: string | null
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
            foreignKeyName: "dispatch_records_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_records_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
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
          quality_grade_id: string
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
          quality_grade_id: string
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
          quality_grade_id?: string
          trip_id?: string
          weight_kg?: number
          weight_mt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "godown_chits_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
            referencedColumns: ["id"]
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
      inventory_transactions: {
        Row: {
          id: string
          transaction_date: string
          invoice_no: string | null
          party_id: string
          quality_grade_id: string
          lorry_number: string | null
          weight_mt: number
          weight_kg: number | null
          transaction_type: string
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          transaction_date?: string
          invoice_no?: string | null
          party_id: string
          quality_grade_id: string
          lorry_number?: string | null
          weight_mt?: number
          weight_kg?: number | null
          transaction_type?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          transaction_date?: string
          invoice_no?: string | null
          party_id?: string
          quality_grade_id?: string
          lorry_number?: string | null
          weight_mt?: number
          weight_kg?: number | null
          transaction_type?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
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
            foreignKeyName: "inventory_transactions_quality_grade_id_fkey"
            columns: ["quality_grade_id"]
            isOneToOne: false
            referencedRelation: "quality_grades"
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
      test_ping: {
        Row: {
          id: number
        }
        Insert: {
          id: number
        }
        Update: {
          id?: number
        }
        Relationships: []
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
          id: string
          last_known_tare_weight: number | null
          plate_number: string
          tare_captured_at: string | null
          transporter_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_known_tare_weight?: number | null
          plate_number: string
          tare_captured_at?: string | null
          transporter_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_known_tare_weight?: number | null
          plate_number?: string
          tare_captured_at?: string | null
          transporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
