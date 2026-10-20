import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import supabase from '@/services/supabaseClient'
import type {
  AppSettingsState,
  CompanySettings,
  AppPreferences,
  NotificationSettings,
} from '@types'

const LOCAL_STORAGE_SETTINGS_KEY = 'app_settings_v1'

const DEFAULT_SETTINGS: AppSettingsState = {
  company: {
    company_name: 'BRS Metals Enterprise',
    address: 'Plot 42, Steel Industrial Corridor, Phase II, Mumbai - 400001, Maharashtra',
    phone: '+91 (22) 2890-4400',
    email: 'contact@brsmetals.com',
    gst_number: '27AABCU9603R1ZX',
    logo_url: undefined,
  },
  preferences: {
    date_format: 'DD/MM/YYYY',
    time_zone: 'Asia/Kolkata (IST - UTC+05:30)',
    weight_unit: 'MT',
    decimal_places: 3,
    items_per_page: 25,
    theme: 'light',
    primary_color: '#2563EB',
    sidebar_style: 'expanded',
  },
  notifications: {
    email_notifications_enabled: true,
    notify_low_stock: true,
    notify_new_transaction: true,
    notify_daily_summary: true,
    notify_weekly_report: false,
    recipient_emails: [
      'director@brsmetals.com',
      'operations@brsmetals.com',
      'accounts@brsmetals.com',
    ],
    stock_thresholds: [
      { quality_id: 'q1', quality_name: 'HMS 1&2', min_stock_mt: 50 },
      { quality_id: 'q2', quality_name: 'Turning & Boring', min_stock_mt: 40 },
      { quality_id: 'q3', quality_name: 'CRC Scrap', min_stock_mt: 30 },
    ],
  },
  last_backup_at: '2026-10-14T03:00:00Z',
  auto_backup_enabled: true,
  auto_backup_frequency: 'Daily',
  past_imports: [
    {
      id: 'IMP-2026-0920',
      filename: 'Q3_Historical_Weighments.xlsx',
      import_type: 'Transactions',
      records_count: 420,
      imported_by: 'Anand Kumar (Admin)',
      imported_at: '2026-09-20T11:45:00Z',
      status: 'success',
    },
  ],
}

function getStoredSettings(): AppSettingsState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        company: { ...DEFAULT_SETTINGS.company, ...parsed.company },
        preferences: { ...DEFAULT_SETTINGS.preferences, ...parsed.preferences },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
        last_backup_at: parsed.last_backup_at || DEFAULT_SETTINGS.last_backup_at,
        auto_backup_enabled: parsed.auto_backup_enabled ?? DEFAULT_SETTINGS.auto_backup_enabled,
        auto_backup_frequency: parsed.auto_backup_frequency || DEFAULT_SETTINGS.auto_backup_frequency,
        past_imports: parsed.past_imports || DEFAULT_SETTINGS.past_imports,
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettingsState>(getStoredSettings)
  const [isSaving, setIsSaving] = useState(false)

  const persist = useCallback((nextState: AppSettingsState) => {
    setSettings(nextState)
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(nextState))
    } catch {
      // ignore
    }
  }, [])

  const saveCompanySettings = useCallback(
    async (company: CompanySettings) => {
      setIsSaving(true)
      try {
        const next = { ...settings, company }
        persist(next)
        toast.success('Company profile updated successfully')
      } finally {
        setIsSaving(false)
      }
    },
    [settings, persist]
  )

  const savePreferences = useCallback(
    async (preferences: AppPreferences) => {
      setIsSaving(true)
      try {
        const next = { ...settings, preferences }
        persist(next)
        toast.success('Application preferences updated')
      } finally {
        setIsSaving(false)
      }
    },
    [settings, persist]
  )

  const saveNotificationSettings = useCallback(
    async (notifications: NotificationSettings) => {
      setIsSaving(true)
      try {
        const next = { ...settings, notifications }
        persist(next)
        toast.success('Notification settings saved')
      } finally {
        setIsSaving(false)
      }
    },
    [settings, persist]
  )

  const downloadBackup = useCallback(async () => {
    try {
      const { data: parties } = await supabase.from('parties').select('*')
      const { data: qualities } = await supabase.from('quality_grades').select('*')
      const { data: transactions } = await supabase.from('inventory_transactions').select('*')
      const { data: dispatches } = await supabase.from('dispatch_records').select('*')
      const { data: bills } = await supabase.from('bill_settlements').select('*')

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0-live',
        system_settings: settings,
        master_parties: parties || [],
        master_qualities: qualities || [],
        inventory_transactions: transactions || [],
        dispatch_records: dispatches || [],
        bill_settlements: bills || [],
      }

      const jsonStr = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = format(new Date(), 'yyyyMMdd_HHmm')
      a.href = url
      a.download = `BRS_Database_Backup_${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      persist({ ...settings, last_backup_at: new Date().toISOString() })
      toast.success('Full system backup downloaded successfully!')
    } catch {
      toast.error('Failed to generate database backup')
    }
  }, [settings, persist])

  const downloadExcelTemplate = useCallback(() => {
    const csvContent =
      'Transaction Date,Bill Number,Party Code,Quality Code,Inward Weight (MT),Godown Weight (MT),Outward Weight (MT),Status\n' +
      '2026-10-15,INV-2026-0001,P001,Q001,15.500,0.000,0.000,Completed\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Inventory_Import_Template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Sample import template downloaded!')
  }, [])

  const clearAllTransactions = useCallback(async () => {
    try {
      localStorage.removeItem('inventory_transactions_v1')
      toast.success('All local transactions have been purged.')
    } catch {
      // ignore
    }
  }, [])

  const resetToFactoryDefaults = useCallback(async () => {
    try {
      localStorage.clear()
      setSettings(DEFAULT_SETTINGS)
      toast.success('System restored to factory state.')
    } catch {
      // ignore
    }
  }, [])

  return {
    settings,
    isSaving,
    saveCompanySettings,
    savePreferences,
    saveNotificationSettings,
    downloadBackup,
    downloadExcelTemplate,
    clearAllTransactions,
    resetToFactoryDefaults,
  }
}

export default useSettings
