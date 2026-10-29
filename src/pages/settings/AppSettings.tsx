import { useState, useEffect } from 'react'
import {
  Scale,
  TrendingUp,
  Sliders,
  Calendar,
  Save,
  Loader2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchAppSettings,
  updateAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettingsData,
} from '@/services/appSettingsService'
import { cn } from '@lib/utils'

export function AppSettings() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Section 1: Weighbridge & Gate Validation Rules
  const [weighbridgeToleranceKg, setWeighbridgeToleranceKg] = useState<number | string>(50)
  const [requireSupervisorTareOverride, setRequireSupervisorTareOverride] = useState<boolean>(true)

  // Section 2: Commercial Sauda & Rate Difference Rules
  const [highRateDiffThreshold, setHighRateDiffThreshold] = useState<number | string>(1000)
  const [defaultGstRate, setDefaultGstRate] = useState<number | string>(18)
  const [lockSettledBills, setLockSettledBills] = useState<boolean>(true)

  // Section 3: Reporting & View Defaults
  const [defaultDatePreset, setDefaultDatePreset] = useState<string>('CURRENT_MONTH')

  // Populate form with loaded data
  const populateForm = (data: AppSettingsData) => {
    setWeighbridgeToleranceKg(data.weighbridge_tolerance_kg ?? DEFAULT_APP_SETTINGS.weighbridge_tolerance_kg)
    setRequireSupervisorTareOverride(data.require_supervisor_tare_override ?? DEFAULT_APP_SETTINGS.require_supervisor_tare_override)
    setHighRateDiffThreshold(data.high_rate_diff_threshold ?? DEFAULT_APP_SETTINGS.high_rate_diff_threshold)
    setDefaultGstRate(data.default_gst_rate ?? DEFAULT_APP_SETTINGS.default_gst_rate)
    setLockSettledBills(data.lock_settled_bills ?? DEFAULT_APP_SETTINGS.lock_settled_bills)
    setDefaultDatePreset(data.default_date_preset || DEFAULT_APP_SETTINGS.default_date_preset)
  }

  // Load settings from Supabase on mount
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await fetchAppSettings()
        populateForm(data)
      } catch (err: any) {
        toast.error('Failed to load settings from Supabase', {
          description: err.message || 'Using fallback defaults',
        })
        populateForm(DEFAULT_APP_SETTINGS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Save changes directly to Supabase public.app_settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      weighbridge_tolerance_kg: Number(weighbridgeToleranceKg) || 50,
      require_supervisor_tare_override: Boolean(requireSupervisorTareOverride),
      high_rate_diff_threshold: Number(highRateDiffThreshold) || 1000,
      default_gst_rate: Number(defaultGstRate) || 18,
      lock_settled_bills: Boolean(lockSettledBills),
      default_date_preset: defaultDatePreset,
    }

    try {
      const updated = await updateAppSettings(payload)
      populateForm(updated)
      toast.success('Operational rules saved successfully')
    } catch (err: any) {
      console.error('Error saving app settings:', err)
      toast.error('Failed to save operational rules', {
        description: err.message || 'Check network connection and Supabase permissions',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-semibold">Loading operational rules...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Operational & Weighbridge Rules
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Scrap yard gate tolerances, commercial rate alert thresholds, and reporting presets
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* =====================================================================
            SECTION 1: WEIGHBRIDGE & GATE VALIDATION RULES
        ===================================================================== */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
            <Scale className="h-4 w-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                1. Weighbridge & Gate Validation Rules
              </h2>
              <p className="text-[11px] text-zinc-400">
                Vehicle calibration limits and automated tare weight protection
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Field 1: Scale Tolerance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Weighbridge Scale Tolerance (KG)
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Maximum allowable variance between gross and tare calibration before flagging deviation.
                </p>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={weighbridgeToleranceKg}
                    onChange={(e) => setWeighbridgeToleranceKg(e.target.value)}
                    placeholder="50.00"
                    className="w-full pl-3.5 pr-12 py-2 text-xs font-mono font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                    KG
                  </span>
                </div>
              </div>
            </div>

            {/* Field 2: Supervisor Tare Override (Toggle) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Supervisor Tare Override
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Require supervisor authorization when vehicle tare weight exceeds scale tolerance.
                </p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={requireSupervisorTareOverride}
                  onClick={() => setRequireSupervisorTareOverride(!requireSupervisorTareOverride)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500',
                    requireSupervisorTareOverride ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                      requireSupervisorTareOverride ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
                <span className="ml-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {requireSupervisorTareOverride ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Field 3: Weight Unit Display Badge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Weight Unit Display Format
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  System standard unit calibration across receipts, godowns, and billing sheets.
                </p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold border border-zinc-200 dark:border-zinc-700">
                  <Check className="h-3.5 w-3.5 text-blue-600" />
                  <span>Metric Tonnes (MT) • 3 Decimal Precision (0.000 MT)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 2: COMMERCIAL SAUDA & RATE DIFFERENCE RULES
        ===================================================================== */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                2. Commercial Sauda & Rate Difference Rules
              </h2>
              <p className="text-[11px] text-zinc-400">
                Discrepancy thresholds, tax calculation presets, and deal locking
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Field 1: High Rate Discrepancy Alert */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  High Rate Discrepancy Alert (₹/MT)
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Highlight transactions in red with <span className="font-bold text-rose-600">⚠️ High Diff</span> when difference between Sauda Rate and Bill Rate exceeds this value.
                </p>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={highRateDiffThreshold}
                    onChange={(e) => setHighRateDiffThreshold(e.target.value)}
                    placeholder="1000.00"
                    className="w-full pl-8 pr-3.5 py-2 text-xs font-mono font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Field 2: Default Scrap GST Rate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Default Scrap GST Rate (%)
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Standard tax rate preset applied to scrap metal bill entries.
                </p>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={defaultGstRate}
                    onChange={(e) => setDefaultGstRate(e.target.value)}
                    placeholder="18.00"
                    className="w-full pl-3.5 pr-8 py-2 text-xs font-mono font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Field 3: Lock Settled Deals (Toggle) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Lock Settled Deals
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Freeze inward and dispatch weighment records once payment settlement is finalized.
                </p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={lockSettledBills}
                  onClick={() => setLockSettledBills(!lockSettledBills)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500',
                    lockSettledBills ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                      lockSettledBills ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
                <span className="ml-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {lockSettledBills ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 3: REPORTING & VIEW DEFAULTS
        ===================================================================== */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
            <Calendar className="h-4 w-4 text-purple-600" />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                3. Reporting & View Defaults
              </h2>
              <p className="text-[11px] text-zinc-400">
                Default time horizons applied on analytical statement opening
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Default Statement Range
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Initial date period selected when opening rate difference and sauda rate reports.
                </p>
              </div>
              <div>
                <select
                  value={defaultDatePreset}
                  onChange={(e) => setDefaultDatePreset(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="CURRENT_MONTH">Current Month (Default)</option>
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="TODAY">Today's Transactions</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Operational Rules...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Operational Rules</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AppSettings
