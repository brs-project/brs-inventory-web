import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Building2,
  Bell,
  Database,
  Save,
  Download,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Plus,
  Loader2,
  Palette,
  Sliders,
  ShieldAlert,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'
import { useSettings } from '@hooks/useSettings'
import { cn } from '@lib/utils'
import type { CompanySettings, AppPreferences, NotificationSettings } from '@types'

const COLOR_SWATCHES = [
  { label: 'Royal Blue', hex: '#2563EB', bg: 'bg-blue-600' },
  { label: 'Emerald Green', hex: '#16A34A', bg: 'bg-green-600' },
  { label: 'Amethyst Purple', hex: '#9333EA', bg: 'bg-purple-600' },
  { label: 'Amber Orange', hex: '#EA580C', bg: 'bg-orange-600' },
  { label: 'Crimson Red', hex: '#DC2626', bg: 'bg-red-600' },
]

export function AppSettings() {
  const {
    settings,
    isSaving,
    saveCompanySettings,
    savePreferences,
    saveNotificationSettings,
    downloadBackup,
    downloadExcelTemplate,
    clearAllTransactions,
    resetToFactoryDefaults,
  } = useSettings()

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data'>('general')

  // Tab 1: General Form State
  const [companyForm, setCompanyForm] = useState<CompanySettings>({ ...settings.company })
  const [prefForm, setPrefForm] = useState<AppPreferences>({ ...settings.preferences })

  // Tab 2: Notifications State
  const [notifForm, setNotifForm] = useState<NotificationSettings>({ ...settings.notifications })
  const [newRecipientEmail, setNewRecipientEmail] = useState('')

  // Tab 3: Danger Zone Modals State
  const [clearTxnModalOpen, setClearTxnModalOpen] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [isClearing, setIsClearing] = useState(false)

  const [resetFactoryModalOpen, setResetFactoryModalOpen] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // Handlers for Tab 1
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveCompanySettings(companyForm)
    await savePreferences(prefForm)
  }

  // Handlers for Tab 2
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveNotificationSettings(notifForm)
  }

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault()
    const email = newRecipientEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    if (notifForm.recipient_emails.includes(email)) {
      toast.warning('This email is already on the recipient list')
      return
    }
    setNotifForm({
      ...notifForm,
      recipient_emails: [...notifForm.recipient_emails, email],
    })
    setNewRecipientEmail('')
  }

  const handleRemoveRecipient = (emailToRemove: string) => {
    setNotifForm({
      ...notifForm,
      recipient_emails: notifForm.recipient_emails.filter((e) => e !== emailToRemove),
    })
  }

  const handleThresholdChange = (qualityId: string, value: number) => {
    setNotifForm({
      ...notifForm,
      stock_thresholds: notifForm.stock_thresholds.map((t) =>
        t.quality_id === qualityId ? { ...t, min_stock_mt: value } : t
      ),
    })
  }

  // Handlers for Danger Zone
  const handleExecuteClearTransactions = async () => {
    if (clearConfirmText.trim() !== 'DELETE') {
      toast.error('Type DELETE in all caps to confirm')
      return
    }
    setIsClearing(true)
    try {
      await clearAllTransactions()
      setClearTxnModalOpen(false)
      setClearConfirmText('')
    } finally {
      setIsClearing(false)
    }
  }

  const handleExecuteResetFactory = async () => {
    if (resetConfirmText.trim() !== 'RESET') {
      toast.error('Type RESET in all caps to confirm')
      return
    }
    setIsResetting(true)
    try {
      await resetToFactoryDefaults()
      setResetFactoryModalOpen(false)
      setResetConfirmText('')
      setCompanyForm(settings.company)
      setPrefForm(settings.preferences)
      setNotifForm(settings.notifications)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Application Settings"
        subtitle="Manage company profile, user preferences, notification thresholds, automated backups, and data imports."
      />

      {/* Tabs Navigation Strip */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer shrink-0',
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>General Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer shrink-0',
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications &amp; Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer shrink-0',
            activeTab === 'data'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Database className="h-4 w-4" />
          <span>Data Management &amp; Backup</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Section 1: Company Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Company Information</h3>
                <p className="text-[11px] text-slate-500">
                  Business name and address printed on report headers and weighment slips
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GST / Tax Number</label>
                <input
                  type="text"
                  value={companyForm.gst_number || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, gst_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Registered Address</label>
                <textarea
                  rows={2}
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Application Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Application Preferences</h3>
                <p className="text-[11px] text-slate-500">
                  Global units of measurement, timestamp formats, and pagination defaults
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date Format</label>
                <select
                  value={prefForm.date_format}
                  onChange={(e) => setPrefForm({ ...prefForm, date_format: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Standard UK/India)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">System Time Zone</label>
                <select
                  value={prefForm.time_zone}
                  onChange={(e) => setPrefForm({ ...prefForm, time_zone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Kolkata (IST - UTC+05:30)">Asia/Kolkata (IST - UTC+05:30)</option>
                  <option value="Asia/Dubai (GST - UTC+04:00)">Asia/Dubai (GST - UTC+04:00)</option>
                  <option value="Europe/London (GMT/BST)">Europe/London (GMT/BST)</option>
                  <option value="America/New_York (EST/EDT)">America/New_York (EST/EDT)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Table Items Per Page</label>
                <select
                  value={prefForm.items_per_page}
                  onChange={(e) => setPrefForm({ ...prefForm, items_per_page: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 rows per page</option>
                  <option value={25}>25 rows per page (Default)</option>
                  <option value={50}>50 rows per page</option>
                  <option value={100}>100 rows per page</option>
                </select>
              </div>

              {/* Weight Unit Radio */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Weight Unit</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="weightUnit"
                      value="MT"
                      checked={prefForm.weight_unit === 'MT'}
                      onChange={() => setPrefForm({ ...prefForm, weight_unit: 'MT' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Metric Tonnes (MT)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="weightUnit"
                      value="KG"
                      checked={prefForm.weight_unit === 'KG'}
                      onChange={() => setPrefForm({ ...prefForm, weight_unit: 'KG' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Kilograms (KG)</span>
                  </label>
                </div>
              </div>

              {/* Decimal Precision */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Decimal Precision</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="decimalPlaces"
                      value={3}
                      checked={prefForm.decimal_places === 3}
                      onChange={() => setPrefForm({ ...prefForm, decimal_places: 3 })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>3 Decimals (0.001 MT)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="decimalPlaces"
                      value={2}
                      checked={prefForm.decimal_places === 2}
                      onChange={() => setPrefForm({ ...prefForm, decimal_places: 2 })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>2 Decimals (0.01 MT)</span>
                  </label>
                </div>
              </div>

              {/* Sidebar Style */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Sidebar Style</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="sidebarStyle"
                      value="expanded"
                      checked={prefForm.sidebar_style === 'expanded'}
                      onChange={() => setPrefForm({ ...prefForm, sidebar_style: 'expanded' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Expanded (256px)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Appearance & Theme */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Appearance &amp; Theme</h3>
                <p className="text-[11px] text-slate-500">
                  Select brand accent palette and interface mode
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Accent Primary Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  {COLOR_SWATCHES.map((swatch) => {
                    const isSelected = prefForm.primary_color === swatch.hex
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setPrefForm({ ...prefForm, primary_color: swatch.hex })}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer',
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <span className={cn('h-3.5 w-3.5 rounded-full shrink-0 shadow-xs', swatch.bg)} />
                        <span>{swatch.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save General Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NOTIFICATIONS & ALERTS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Master Toggle & Event Subscriptions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Email Notification Master Switch</h3>
                  <p className="text-[11px] text-slate-500">Enable or disable automated dispatch of alert emails</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifForm.email_notifications_enabled}
                  onChange={(e) => setNotifForm({ ...notifForm, email_notifications_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Event Checkboxes */}
            <div className="space-y-3 pt-2 text-xs">
              <span className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Automated Trigger Subscriptions
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifForm.notify_new_transaction}
                    onChange={(e) => setNotifForm({ ...notifForm, notify_new_transaction: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">New Transaction Recorded</span>
                    <span className="text-[11px] text-slate-500">Dispatch slip summary when an operator submits a weighment</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifForm.notify_low_stock}
                    onChange={(e) => setNotifForm({ ...notifForm, notify_low_stock: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Low Stock Alert</span>
                    <span className="text-[11px] text-slate-500">Trigger alert when physical holding drops below minimum MT</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifForm.notify_daily_summary}
                    onChange={(e) => setNotifForm({ ...notifForm, notify_daily_summary: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Daily Evening Summary</span>
                    <span className="text-[11px] text-slate-500">Send end-of-day weighbridge reconciliation at 20:00 IST</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifForm.notify_weekly_report}
                    onChange={(e) => setNotifForm({ ...notifForm, notify_weekly_report: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Weekly Operations Digest</span>
                    <span className="text-[11px] text-slate-500">Weekly PDF report attached every Monday morning</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Low Stock Thresholds Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Quality Minimum Stock Thresholds</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              When physical stock drops below these thresholds, automatic warning emails will be sent to the recipients below.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Commodity Quality Grade</th>
                    <th className="px-4 py-2.5 text-right w-48">Minimum Holding Threshold (MT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notifForm.stock_thresholds.map((th) => (
                    <tr key={th.quality_id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        {th.quality_name}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={th.min_stock_mt}
                            onChange={(e) => handleThresholdChange(th.quality_id, Number(e.target.value) || 0)}
                            className="w-24 px-2.5 py-1 text-right rounded-lg border border-slate-300 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-slate-500 font-bold text-[11px]">MT</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Recipients Chip Manager */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Notification Email Recipients</h3>
              <span className="text-[11px] text-slate-400 font-semibold">
                {notifForm.recipient_emails.length} active recipients
              </span>
            </div>

            {/* Chip List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {notifForm.recipient_emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 font-mono text-xs font-semibold border border-blue-200"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email)}
                    className="p-0.5 rounded-full hover:bg-blue-200/70 text-blue-600 transition cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add recipient form input */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Add new notification email (e.g. director@company.com)"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Recipient</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Notification Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATA MANAGEMENT & BACKUP */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Section 1: System Data Backup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">System Database Snapshot Backup</h3>
                  <p className="text-[11px] text-slate-500">
                    Export a full JSON snapshot of all inventory weighments, masters, user accounts, and configurations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadBackup}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition cursor-pointer shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Download Backup (.json)</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 pt-1">
              <div>
                <span>Last automated backup timestamp: </span>
                <strong className="font-mono text-slate-900">
                  {settings.last_backup_at
                    ? format(new Date(settings.last_backup_at), 'dd/MM/yyyy HH:mm')
                    : 'Never'}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Auto-Backup:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Daily Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Import Data from Excel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Batch Import Data</h3>
                  <p className="text-[11px] text-slate-500">
                    Upload formatted spreadsheet files to bulk insert transactions or supplier directories
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Drag and drop upload zone */}
            <div
              onClick={() => toast.info('File upload interface ready for spreadsheet parsing.')}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 transition cursor-pointer space-y-2"
            >
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-sm border border-slate-200">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag and drop spreadsheet (.xlsx, .csv)
              </p>
              <p className="text-[10px] text-slate-400">
                Ensure columns match the standard template format before uploading.
              </p>
            </div>

            {/* Past Imports Table */}
            <div className="pt-2">
              <span className="block text-xs font-bold text-slate-800 mb-2">Past Import History</span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Import Batch ID</th>
                      <th className="px-3 py-2">Filename</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-center">Records</th>
                      <th className="px-3 py-2">Imported By</th>
                      <th className="px-3 py-2 text-right">Date</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settings.past_imports.map((imp) => (
                      <tr key={imp.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{imp.id}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{imp.filename}</td>
                        <td className="px-3 py-2 text-slate-600">{imp.import_type}</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-blue-600">
                          {imp.records_count}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{imp.imported_by}</td>
                        <td className="px-3 py-2 text-right text-slate-500 font-mono text-[11px]">
                          {format(new Date(imp.imported_at), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                            {imp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: Danger Zone */}
          <div className="bg-white rounded-2xl border-2 border-rose-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">Danger Zone (Admin Only)</h3>
                <p className="text-[11px] text-rose-600">
                  Irreversible administrative operations. These actions permanently purge records.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Clear Transactions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-100 bg-rose-50/40">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Clear All Inventory Transactions</span>
                  <span className="text-[11px] text-slate-500">
                    Purge all recorded inward/outward weighbridge weighments while keeping master data intact.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClearConfirmText('')
                    setClearTxnModalOpen(true)
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All Transactions</span>
                </button>
              </div>

              {/* Reset to Factory Defaults Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-100 bg-rose-50/40">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Reset to Factory Defaults</span>
                  <span className="text-[11px] text-slate-500">
                    Wipe local customizations, company parameters, and revert application state to default demo dataset.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetConfirmText('')
                    setResetFactoryModalOpen(true)
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DANGER ZONE CONFIRMATION MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Clear Transactions Modal */}
      {clearTxnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs"
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Clear All Inventory Transactions?
              </h3>
              <p className="text-slate-500 leading-relaxed">
                This action will permanently delete all recorded weighbridge entries, weighment slips, and scale variance logs. Master parties, qualities, and godowns will remain unaffected.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block font-bold text-slate-700">
                Type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/30 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClearTxnModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClearTransactions}
                disabled={clearConfirmText.trim() !== 'DELETE' || isClearing}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold transition shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-40"
              >
                {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Permanently Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reset to Factory Defaults Modal */}
      {resetFactoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs"
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <RotateCcw className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Reset System to Factory Defaults?
              </h3>
              <p className="text-slate-500 leading-relaxed">
                This will erase all custom configurations, local session caches, user edits, and reload the initial demo state.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block font-bold text-slate-700">
                Type <span className="font-mono text-rose-600 font-extrabold">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/30 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResetFactoryModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResetFactory}
                disabled={resetConfirmText.trim() !== 'RESET' || isResetting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold transition shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-40"
              >
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                <span>Confirm Full Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppSettings
