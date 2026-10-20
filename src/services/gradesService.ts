import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

export type QualityGradeRow = Database['public']['Tables']['quality_grades']['Row']
export type QualityGradeInsert = Database['public']['Tables']['quality_grades']['Insert']
export type QualityGradeUpdate = Database['public']['Tables']['quality_grades']['Update']

export interface QualityGradeWithStock {
  id: string
  name: string
  hsn_code: string
  default_rate_per_kg: number
  is_active: boolean
  created_at: string
  updated_at: string
  current_stock_kg: number
  current_stock_mt: number
  // Frontend & legacy compatibility aliases
  quality_code: string
  quality_name: string
  unit_of_measure: string
  category: string
  description?: string
  hsnCode: string
  defaultRatePerKg: number
  isActive: boolean
  currentStockKg: number
  currentStockMt: number
}

export interface FrontendGradeInput {
  id?: string
  name?: string
  quality_name?: string
  qualityName?: string
  quality_code?: string
  qualityCode?: string
  hsn_code?: string
  hsnCode?: string
  default_rate_per_kg?: number
  defaultRatePerKg?: number
  default_rate?: number
  is_active?: boolean
  isActive?: boolean
  category?: string
  unit_of_measure?: string
  description?: string
}

export function mapGradeRowToModel(item: any): QualityGradeWithStock {
  const stock = Array.isArray(item.inventory_stocks)
    ? item.inventory_stocks[0]
    : item.inventory_stocks

  const current_stock_kg = Number(stock?.current_stock_kg ?? 0)
  const current_stock_mt = Number(stock?.current_stock_mt ?? 0)
  const name = item.name || item.quality_name || ''
  const hsn = item.hsn_code || '7204'
  const rate = Number(item.default_rate_per_kg ?? 0)
  const active = Boolean(item.is_active)

  return {
    id: item.id,
    name,
    hsn_code: hsn,
    default_rate_per_kg: rate,
    is_active: active,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    current_stock_kg,
    current_stock_mt,
    // Frontend compatibility
    quality_code: item.quality_code || name,
    quality_name: name,
    unit_of_measure: item.unit_of_measure || 'MT',
    category: item.category || 'Scrap',
    description:
      item.description || `HSN: ${hsn} | Rate: ₹${rate.toFixed(2)}/kg`,
    hsnCode: hsn,
    defaultRatePerKg: rate,
    isActive: active,
    currentStockKg: current_stock_kg,
    currentStockMt: current_stock_mt,
  }
}

/**
 * Retrieves quality grades joined with inventory_stocks(current_stock_kg, current_stock_mt).
 */
export async function fetchQualityGrades(): Promise<QualityGradeWithStock[]> {
  const { data, error } = await supabase
    .from('quality_grades')
    .select('*, inventory_stocks(current_stock_kg, current_stock_mt)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[gradesService.fetchQualityGrades] error:', error)
    throw error
  }

  return (data || []).map(mapGradeRowToModel)
}

/**
 * Creates a new quality grade record.
 */
export async function createQualityGrade(grade: FrontendGradeInput): Promise<QualityGradeWithStock> {
  const name = (grade.name || grade.quality_name || grade.qualityName)?.trim()
  if (!name) throw new Error('Quality grade name is required')

  const payload: QualityGradeInsert = {
    name,
    hsn_code: (grade.hsn_code || grade.hsnCode || '7204').trim(),
    default_rate_per_kg: Number(
      grade.default_rate_per_kg ?? grade.defaultRatePerKg ?? grade.default_rate ?? 0
    ),
    is_active: grade.is_active ?? grade.isActive ?? true,
  }

  const { data, error } = await supabase
    .from('quality_grades')
    .insert(payload)
    .select('*, inventory_stocks(current_stock_kg, current_stock_mt)')
    .single()

  if (error) {
    console.error('[gradesService.createQualityGrade] error:', error)
    throw error
  }

  return mapGradeRowToModel(data)
}

/**
 * Updates an existing quality grade record.
 */
export async function updateQualityGrade(
  id: string,
  grade: Partial<FrontendGradeInput>
): Promise<QualityGradeWithStock> {
  const updatePayload: QualityGradeUpdate = {}

  if (grade.name !== undefined || grade.quality_name !== undefined || grade.qualityName !== undefined) {
    updatePayload.name = (grade.name || grade.quality_name || grade.qualityName)!.trim()
  }
  if (grade.hsn_code !== undefined || grade.hsnCode !== undefined) {
    updatePayload.hsn_code = (grade.hsn_code || grade.hsnCode)!.trim()
  }
  if (
    grade.default_rate_per_kg !== undefined ||
    grade.defaultRatePerKg !== undefined ||
    grade.default_rate !== undefined
  ) {
    updatePayload.default_rate_per_kg = Number(
      grade.default_rate_per_kg ?? grade.defaultRatePerKg ?? grade.default_rate
    )
  }
  if (grade.is_active !== undefined || grade.isActive !== undefined) {
    updatePayload.is_active = grade.is_active ?? grade.isActive
  }

  const { data, error } = await supabase
    .from('quality_grades')
    .update(updatePayload)
    .eq('id', id)
    .select('*, inventory_stocks(current_stock_kg, current_stock_mt)')
    .single()

  if (error) {
    console.error('[gradesService.updateQualityGrade] error:', error)
    throw error
  }

  return mapGradeRowToModel(data)
}

/**
 * Toggles quality grade active status.
 */
export async function toggleGradeStatus(id: string, isActive: boolean): Promise<QualityGradeWithStock> {
  return updateQualityGrade(id, { is_active: isActive })
}

/**
 * Deletes a quality grade by ID.
 */
export async function deleteQualityGrade(id: string): Promise<boolean> {
  const { error } = await supabase.from('quality_grades').delete().eq('id', id)

  if (error) {
    console.error('[gradesService.deleteQualityGrade] error:', error)
    throw error
  }

  return true
}
