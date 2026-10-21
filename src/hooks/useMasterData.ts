import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  fetchParties,
  createParty as apiCreateParty,
  updateParty as apiUpdateParty,
  deleteParty as apiDeleteParty,
  togglePartyStatus as apiTogglePartyStatus,
  type PartyModel,
  type FrontendPartyInput,
} from '@/services/partiesService'
import {
  fetchQualityGrades,
  createQualityGrade as apiCreateQualityGrade,
  updateQualityGrade as apiUpdateQualityGrade,
  deleteQualityGrade as apiDeleteQualityGrade,
  toggleGradeStatus as apiToggleGradeStatus,
  type QualityGradeWithStock,
  type FrontendGradeInput,
} from '@/services/gradesService'
import {
  mockGodowns as initialMockGodowns,
  mockVehicles as initialMockVehicles,
} from '@lib/mockData'
import {
  fetchTransporters as apiFetchTransporters,
  createTransporter as apiCreateTransporter,
  updateTransporter as apiUpdateTransporter,
  deleteTransporter as apiDeleteTransporter,
  type CreateTransporterInput,
  type UpdateTransporterInput,
} from '@/services/transporterService'
import type { Party, Quality, Godown, Vehicle, Transporter } from '@types'

let persistentGodowns: Godown[] = [...initialMockGodowns]
let persistentVehicles: Vehicle[] = [...initialMockVehicles]

// ============================================================================
// 1. PARTIES HOOK (LIVE SUPABASE INTEGRATION)
// ============================================================================
export interface PartyFilters {
  search?: string
  isActive?: boolean | 'all'
}

export function useParties() {
  const [parties, setParties] = useState<PartyModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadParties = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchParties()
      setParties(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch parties from database'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadParties()
  }, [loadParties])

  const getNextPartyCode = useCallback((): string => {
    let maxNum = 0
    parties.forEach((p) => {
      const match = (p.party_code || p.code || '').match(/^P(\d+)$/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    return `P${String(nextNum).padStart(3, '0')}`
  }, [parties])

  const createParty = async (data: FrontendPartyInput | Omit<Party, 'id' | 'created_at'>): Promise<PartyModel> => {
    setIsLoading(true)
    setError(null)
    try {
      const newParty = await apiCreateParty({
        ...data,
        party_code: data.party_code || getNextPartyCode(),
      })
      setParties((prev) => [newParty, ...prev])
      toast.success(`Party '${newParty.party_name || newParty.name}' registered successfully`)
      return newParty
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create party'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateParty = async (id: string, data: Partial<FrontendPartyInput> | Partial<Party>): Promise<PartyModel> => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await apiUpdateParty(id, data)
      setParties((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.success(`Party '${updated.party_name || updated.name}' updated successfully`)
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update party'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteParty = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const target = parties.find((p) => p.id === id)
      await apiDeleteParty(id)
      setParties((prev) => prev.filter((p) => p.id !== id))
      toast.success(target ? `Party '${target.party_name || target.name}' deleted` : 'Party deleted successfully')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete party'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const togglePartyStatus = async (id: string): Promise<PartyModel> => {
    const party = parties.find((p) => p.id === id)
    if (!party) throw new Error('Party not found')

    const newStatus = !party.is_active
    try {
      const updated = await apiTogglePartyStatus(id, newStatus)
      setParties((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.info(`Party '${updated.party_name || updated.name}' marked as ${newStatus ? 'Active' : 'Inactive'}`)
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status'
      toast.error(msg)
      throw err
    }
  }

  const stats = useMemo(() => {
    const total = parties.length
    const active = parties.filter((p) => p.is_active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [parties])

  return {
    parties,
    stats,
    isLoading,
    error,
    refetch: loadParties,
    getNextPartyCode,
    createParty,
    updateParty,
    deleteParty,
    togglePartyStatus,
  }
}

// ============================================================================
// 2. QUALITIES / COMMODITY GRADES HOOK (LIVE SUPABASE INTEGRATION)
// ============================================================================
export function useQualities() {
  const [qualities, setQualities] = useState<QualityGradeWithStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQualities = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchQualityGrades()
      setQualities(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch commodity grades'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQualities()
  }, [loadQualities])

  const getNextQualityCode = useCallback((): string => {
    let maxNum = 0
    qualities.forEach((q) => {
      const match = (q.quality_code || q.name || '').match(/^Q(\d+)$/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    return `Q${String(nextNum).padStart(3, '0')}`
  }, [qualities])

  const createQuality = async (data: FrontendGradeInput | Omit<Quality, 'id' | 'created_at'>): Promise<QualityGradeWithStock> => {
    setIsLoading(true)
    setError(null)
    try {
      const newGrade = await apiCreateQualityGrade(data)
      setQualities((prev) => [newGrade, ...prev])
      toast.success(`Commodity grade '${newGrade.name}' added successfully`)
      return newGrade
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create commodity grade'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuality = async (id: string, data: Partial<FrontendGradeInput> | Partial<Quality>): Promise<QualityGradeWithStock> => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await apiUpdateQualityGrade(id, data)
      setQualities((prev) => prev.map((q) => (q.id === id ? updated : q)))
      toast.success(`Commodity grade '${updated.name}' updated successfully`)
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update commodity grade'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteQuality = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const target = qualities.find((q) => q.id === id)
      await apiDeleteQualityGrade(id)
      setQualities((prev) => prev.filter((q) => q.id !== id))
      toast.success(target ? `Commodity grade '${target.name}' deleted` : 'Commodity grade deleted')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete commodity grade'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleQualityStatus = async (id: string): Promise<QualityGradeWithStock> => {
    const item = qualities.find((q) => q.id === id)
    if (!item) throw new Error('Commodity grade not found')

    const newStatus = !item.is_active
    try {
      const updated = await apiToggleGradeStatus(id, newStatus)
      setQualities((prev) => prev.map((q) => (q.id === id ? updated : q)))
      toast.info(`Commodity grade '${updated.name}' marked as ${newStatus ? 'Active' : 'Inactive'}`)
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status'
      toast.error(msg)
      throw err
    }
  }

  const stats = useMemo(() => {
    const total = qualities.length
    const active = qualities.filter((q) => q.is_active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [qualities])

  return {
    qualities: qualities || [],
    qualityGrades: qualities || [],
    stats,
    isLoading,
    error,
    refetch: loadQualities,
    getNextQualityCode,
    createQuality,
    updateQuality,
    deleteQuality,
    toggleQualityStatus,
  }
}

// ============================================================================
// 3. GODOWNS HOOK
// ============================================================================
export function useGodowns() {
  const [godowns, setGodowns] = useState<Godown[]>(persistentGodowns)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getNextGodownCode = useCallback((): string => {
    let maxNum = 0
    persistentGodowns.forEach((g) => {
      const match = g.godown_code.match(/^G(\d+)$/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    return `G${String(nextNum).padStart(3, '0')}`
  }, [])

  const createGodown = async (data: Omit<Godown, 'id' | 'created_at'>): Promise<Godown> => {
    setIsLoading(true)
    setError(null)
    const newGodown: Godown = {
      ...data,
      id: String(Date.now()),
      godown_code: data.godown_code || getNextGodownCode(),
      created_at: new Date().toISOString(),
    }
    persistentGodowns = [newGodown, ...persistentGodowns]
    setGodowns(persistentGodowns)
    setIsLoading(false)
    toast.success(`Godown '${newGodown.godown_name}' added successfully`)
    return newGodown
  }

  const updateGodown = async (id: string, data: Partial<Godown>): Promise<Godown> => {
    setIsLoading(true)
    setError(null)
    const index = persistentGodowns.findIndex((g) => g.id === id)
    if (index === -1) throw new Error(`Godown with ID '${id}' not found`)
    const updatedGodown: Godown = { ...persistentGodowns[index], ...data }
    persistentGodowns = [...persistentGodowns.slice(0, index), updatedGodown, ...persistentGodowns.slice(index + 1)]
    setGodowns(persistentGodowns)
    setIsLoading(false)
    toast.success('Godown details updated successfully')
    return updatedGodown
  }

  const deleteGodown = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    const godownToDelete = persistentGodowns.find((g) => g.id === id)
    persistentGodowns = persistentGodowns.filter((g) => g.id !== id)
    setGodowns(persistentGodowns)
    setIsLoading(false)
    toast.success(godownToDelete ? `Godown '${godownToDelete.godown_name}' deleted` : 'Godown deleted')
    return true
  }

  const toggleGodownStatus = async (id: string): Promise<Godown> => {
    const godown = persistentGodowns.find((g) => g.id === id)
    if (!godown) throw new Error('Godown not found')
    const newStatus = !godown.is_active
    const updated = await updateGodown(id, { is_active: newStatus })
    toast.info(`Godown '${godown.godown_name}' marked as ${newStatus ? 'Active' : 'Inactive'}`)
    return updated
  }

  const stats = useMemo(() => {
    const total = godowns.length
    const active = godowns.filter((g) => g.is_active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [godowns])

  return {
    godowns,
    stats,
    isLoading,
    error,
    getNextGodownCode,
    createGodown,
    updateGodown,
    deleteGodown,
    toggleGodownStatus,
  }
}

// ============================================================================
// 4. VEHICLES HOOK
// ============================================================================
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(persistentVehicles)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createVehicle = async (data: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> => {
    setIsLoading(true)
    setError(null)
    const newVehicle: Vehicle = {
      ...data,
      id: String(Date.now()),
      created_at: new Date().toISOString(),
    }
    persistentVehicles = [newVehicle, ...persistentVehicles]
    setVehicles(persistentVehicles)
    setIsLoading(false)
    toast.success(`Vehicle '${newVehicle.lorry_number}' registered successfully`)
    return newVehicle
  }

  const updateVehicle = async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    setIsLoading(true)
    setError(null)
    const index = persistentVehicles.findIndex((v) => v.id === id)
    if (index === -1) throw new Error(`Vehicle with ID '${id}' not found`)
    const updatedVehicle: Vehicle = { ...persistentVehicles[index], ...data }
    persistentVehicles = [...persistentVehicles.slice(0, index), updatedVehicle, ...persistentVehicles.slice(index + 1)]
    setVehicles(persistentVehicles)
    setIsLoading(false)
    toast.success('Vehicle records updated successfully')
    return updatedVehicle
  }

  const deleteVehicle = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    const vehicleToDelete = persistentVehicles.find((v) => v.id === id)
    persistentVehicles = persistentVehicles.filter((v) => v.id !== id)
    setVehicles(persistentVehicles)
    setIsLoading(false)
    toast.success(vehicleToDelete ? `Vehicle '${vehicleToDelete.lorry_number}' deleted` : 'Vehicle deleted')
    return true
  }

  const toggleVehicleStatus = async (id: string): Promise<Vehicle> => {
    const vehicle = persistentVehicles.find((v) => v.id === id)
    if (!vehicle) throw new Error('Vehicle not found')
    const newStatus = !vehicle.is_active
    const updated = await updateVehicle(id, { is_active: newStatus })
    toast.info(`Vehicle '${vehicle.lorry_number}' marked as ${newStatus ? 'Active' : 'Inactive'}`)
    return updated
  }

  const stats = useMemo(() => {
    const total = vehicles.length
    const active = vehicles.filter((v) => v.is_active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [vehicles])

  return {
    vehicles,
    stats,
    isLoading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
  }
}

// ============================================================================
// 5. TRANSPORTERS HOOK (LIVE SUPABASE INTEGRATION)
// ============================================================================
export function useTransporters() {
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTransporters = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetchTransporters()
      setTransporters(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transporters from database'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransporters()
  }, [loadTransporters])

  const createTransporter = async (data: CreateTransporterInput): Promise<Transporter> => {
    setIsLoading(true)
    setError(null)
    try {
      const created = await apiCreateTransporter(data)
      setTransporters((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success(`Transporter "${created.name}" created successfully`)
      return created
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transporter'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTransporter = async (id: string, data: UpdateTransporterInput): Promise<Transporter> => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await apiUpdateTransporter(id, data)
      setTransporters((prev) => prev.map((t) => (t.id === id ? updated : t)))
      toast.success(`Transporter "${updated.name}" updated successfully`)
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update transporter'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTransporter = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await apiDeleteTransporter(id)
      setTransporters((prev) => prev.filter((t) => t.id !== id))
      toast.success('Transporter removed successfully')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete transporter'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTransporterStatus = async (id: string): Promise<Transporter> => {
    const target = transporters.find((t) => t.id === id)
    if (!target) throw new Error('Transporter not found')
    return updateTransporter(id, { is_active: !target.is_active })
  }

  const stats = useMemo(() => {
    const total = transporters.length
    const active = transporters.filter((t) => t.is_active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [transporters])

  return {
    transporters,
    stats,
    isLoading,
    error,
    refresh: loadTransporters,
    createTransporter,
    updateTransporter,
    deleteTransporter,
    toggleTransporterStatus,
  }
}
