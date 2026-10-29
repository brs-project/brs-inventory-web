import { useState, useEffect } from 'react'
import { Building2, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchAppSettings,
  updateAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettingsData,
} from '@/services/appSettingsService'

export function AppSettings() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Card: Scrap Yard & Company Profile fields
  const [companyName, setCompanyName] = useState('')
  const [gstin, setGstin] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [yardAddress, setYardAddress] = useState('')
  const [weighbridgeToleranceKg, setWeighbridgeToleranceKg] = useState<number | string>(50)

  // Populate state from Supabase
  const populateForm = (data: AppSettingsData) => {
    setCompanyName(data.company_name || DEFAULT_APP_SETTINGS.company_name)
    setGstin(data.gstin || DEFAULT_APP_SETTINGS.gstin)
    setContactPhone(data.contact_phone || DEFAULT_APP_SETTINGS.contact_phone)
    setContactEmail(data.contact_email || DEFAULT_APP_SETTINGS.contact_email)
    setYardAddress(data.yard_address || DEFAULT_APP_SETTINGS.yard_address)
    setWeighbridgeToleranceKg(data.weighbridge_tolerance_kg ?? 50)
  }

  // Load settings on mount
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
      company_name: companyName.trim(),
      gstin: gstin.trim().toUpperCase(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim().toLowerCase(),
      yard_address: yardAddress.trim(),
      weighbridge_tolerance_kg: Number(weighbridgeToleranceKg) || 50,
    }

    try {
      const updated = await updateAppSettings(payload)
      populateForm(updated)
      toast.success('App settings saved successfully')
    } catch (err: any) {
      toast.error('Failed to update app settings', {
        description: err.message || 'Check network connection and Supabase permissions',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Fetching application settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          App Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage company identity, tax registration, and weighbridge tolerance rules
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Card: Scrap Yard & Company Profile */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-800/20">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Scrap Yard & Company Profile
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Official entity details, contact information, and scale calibration tolerance
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. BRS Scrap Yard & Steel Mart"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>

            {/* GSTIN / Tax Number */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                GSTIN / Tax Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 27AABCB1234F1Z6"
                maxLength={15}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono uppercase tracking-wider"
              />
            </div>

            {/* Weighbridge Scale Tolerance (kg) */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Weighbridge Scale Tolerance (kg) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={weighbridgeToleranceKg}
                  onChange={(e) => setWeighbridgeToleranceKg(e.target.value)}
                  placeholder="50"
                  className="w-full pl-3.5 pr-12 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                  KG
                </span>
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +91 98220 12345"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Contact Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. accounts@brs-steel.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Registered Yard Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Registered Yard Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={yardAddress}
                onChange={(e) => setYardAddress(e.target.value)}
                placeholder="e.g. Plot No. 12, MIDC Phase II, Jalna, Maharashtra 431203"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AppSettings
