import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Truck,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Building2,
  Scale,
  Plus,
  Send,
  List,
} from 'lucide-react'
import { toast } from 'sonner'
import supabase from '@/services/supabaseClient'

interface FormDataState {
  outwardBillNo: string
  dispatchDate: string
  qualityGradeId: string
  partyId: string
  transporterId: string
  lorryNo: string
  billWtMt: string
  purchaseBillNo: string
}

export function AddDispatch() {
  const navigate = useNavigate()

  // Guarded state initialization
  const [parties, setParties] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form input state
  const [formData, setFormData] = useState<FormDataState>({
    outwardBillNo: `DB-${Date.now().toString().slice(-4)}`,
    dispatchDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    qualityGradeId: '',
    partyId: '',
    transporterId: '',
    lorryNo: '',
    billWtMt: '',
    purchaseBillNo: `PB-${Date.now().toString().slice(-4)}`,
  })

  // Error banner and confirmation state
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [savedRecord, setSavedRecord] = useState<any | null>(null)

  // Bulletproof party filtering
  const buyers = useMemo(() => {
    return (parties || []).filter(p => Array.isArray(p?.types) ? p.types.includes('BUYER') : p?.types === 'BUYER');
  }, [parties])

  const transporters = useMemo(() => {
    return (parties || []).filter(p => Array.isArray(p?.types) ? p.types.includes('TRANSPORTER') : p?.types === 'TRANSPORTER');
  }, [parties])

  // Fallback if no party has explicit BUYER tag
  const availableBuyers = useMemo(() => {
    return buyers.length > 0 ? buyers : (parties || [])
  }, [buyers, parties])

  // Fetch active parties and quality_grades directly from Supabase
  useEffect(() => {
    async function loadFormData() {
      try {
        setLoading(true);
        const [pRes, gRes] = await Promise.all([
          supabase.from('parties').select('id, code, name, types, gstin, city').eq('is_active', true),
          supabase.from('quality_grades').select('id, name, hsn_code, default_rate_per_kg').eq('is_active', true)
        ]);
        if (pRes.data) setParties(pRes.data);
        if (gRes.data) setGrades(gRes.data);
      } catch (err) {
        console.error('Failed to load dispatch form dependencies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFormData();
  }, []);

  const handleChange = (field: keyof FormDataState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errorBanner) setErrorBanner(null)
  }

  const handleReset = useCallback(() => {
    setFormData({
      outwardBillNo: `DB-${Date.now().toString().slice(-4)}`,
      dispatchDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      qualityGradeId: '',
      partyId: '',
      transporterId: '',
      lorryNo: '',
      billWtMt: '',
      purchaseBillNo: `PB-${Date.now().toString().slice(-4)}`,
    })
    setSavedRecord(null)
    setErrorBanner(null)
  }, [])

  // Selected item summaries for live feedback
  const selectedGrade = useMemo(() => {
    return (grades || []).find((g) => g.id === formData.qualityGradeId)
  }, [grades, formData.qualityGradeId])

  const selectedParty = useMemo(() => {
    return (parties || []).find((p) => p.id === formData.partyId)
  }, [parties, formData.partyId])

  const selectedTransporter = useMemo(() => {
    return (parties || []).find((p) => p.id === formData.transporterId)
  }, [parties, formData.transporterId])

  const numericWeight = Number(formData.billWtMt) || 0
  const weightInKg = Math.round(numericWeight * 1000)

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)

    // Validation
    if (!formData.qualityGradeId) {
      const msg = 'Please select a quality grade'
      toast.error(msg)
      setErrorBanner(msg)
      return
    }
    if (!formData.partyId) {
      const msg = 'Please select a buyer / destination party'
      toast.error(msg)
      setErrorBanner(msg)
      return
    }
    if (!formData.lorryNo.trim()) {
      const msg = 'Please enter a vehicle / lorry number'
      toast.error(msg)
      setErrorBanner(msg)
      return
    }
    if (!formData.billWtMt || isNaN(Number(formData.billWtMt)) || Number(formData.billWtMt) <= 0) {
      const msg = 'Bill weight must be a valid number greater than 0 MT'
      toast.error(msg)
      setErrorBanner(msg)
      return
    }

    try {
      setSubmitting(true)
      const { data, error } = await supabase
        .from('dispatch_records')
        .insert({
          outward_bill_no: formData.outwardBillNo || `DB-${Date.now().toString().slice(-4)}`,
          dispatch_date: formData.dispatchDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
          quality_grade_id: formData.qualityGradeId,
          party_id: formData.partyId,
          transporter_id: formData.transporterId || null,
          lorry_no: (formData.lorryNo || '').toUpperCase().trim(),
          bill_wt_mt: Number(formData.billWtMt),
          purchase_bill_no: formData.purchaseBillNo || `PB-${Date.now().toString().slice(-4)}`,
          status: 'dispatched'
        })
        .select('*, parties!party_id(id, name, code, city), transporter:parties!transporter_id(id, name, code), quality_grades(id, name, hsn_code)')
        .single();

      if (error) {
        console.error('Failed to insert dispatch record:', error)
        toast.error(error.message || 'Failed to save dispatch entry')
        setErrorBanner(error.message)
        return
      }

      toast.success('Dispatch record saved successfully!')
      setSavedRecord(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during submission'
      toast.error(msg)
      setErrorBanner(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: COMPACT HEADER & NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <div>
        <Link
          to="/dispatch/list"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-indigo-600 transition cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispatch Sheet</span>
        </Link>

        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-600" />
              <span>Add Dispatch Entry</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Record outward dispatch consignment directly to live database
            </p>
          </div>

          <Link
            to="/dispatch/list"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
          >
            <List className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">View Dispatch Sheet</span>
            <span className="sm:hidden">Sheet</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: LOADING SKELETON STATE
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">
            Loading Dispatch Form Dependencies...
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fetching active parties and quality grades from Supabase
          </p>
        </div>
      ) : savedRecord ? (
        /* ─────────────────────────────────────────────────────────────
            SECTION 3: SUCCESS CONFIRMATION VIEW
            ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dispatch Saved Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              The outward consignment was recorded into the dispatch register.
            </p>
          </div>

          {/* Breakdown Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/90 p-5 text-left text-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span className="font-mono font-bold text-base text-indigo-950">
                  {savedRecord.outward_bill_no}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 font-medium">
                  {savedRecord.dispatch_date}
                </span>
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                  ✓ {savedRecord.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Quality:
                </span>
                <span className="font-semibold text-slate-800">
                  {savedRecord.quality_grades?.name || 'Selected Grade'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Party:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {savedRecord.parties?.name || 'Selected Party'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Lorry No:
                </span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-800">
                  {savedRecord.lorry_no}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Transporter:
                </span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {savedRecord.transporter?.name || 'Self / Direct'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  Bill Wt:
                </span>
                <span className="font-mono font-bold text-sm text-indigo-700">
                  {Number(savedRecord.bill_wt_mt).toFixed(3)} MT ({Math.round(Number(savedRecord.bill_wt_mt) * 1000).toLocaleString()} KG)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 sm:border-none">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Ref Bill No:
                </span>
                <span className="font-mono text-slate-700">
                  {savedRecord.purchase_bill_no || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dispatch/list')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <List className="w-4 h-4 text-slate-500" />
              <span>View Dispatch Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Dispatch</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SECTION 4: MAIN FORM & LIVE PREVIEW
            ───────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {errorBanner ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Submission Error</p>
                  <p className="mt-0.5">{errorBanner}</p>
                </div>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6"
            >
              {/* Row 1: Outward Bill No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="outwardBillNo"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Outward Bill No *
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="outwardBillNo"
                      type="text"
                      required
                      value={formData.outwardBillNo}
                      onChange={(e) => handleChange('outwardBillNo', e.target.value)}
                      placeholder="e.g. DB-2345"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="dispatchDate"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Dispatch Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="dispatchDate"
                      type="date"
                      required
                      value={formData.dispatchDate}
                      onChange={(e) => handleChange('dispatchDate', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Quality Grade & Destination Party */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="qualityGradeId"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Quality Grade *
                  </label>
                  <select
                    id="qualityGradeId"
                    required
                    value={formData.qualityGradeId}
                    onChange={(e) => handleChange('qualityGradeId', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition bg-white"
                  >
                    <option value="">Select Quality Grade...</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.hsn_code ? `(HSN: ${g.hsn_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="partyId"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Party / Buyer *
                  </label>
                  <div className="relative">
                    <select
                      id="partyId"
                      required
                      value={formData.partyId}
                      onChange={(e) => handleChange('partyId', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition bg-white"
                    >
                      <option value="">Select Buyer / Destination...</option>
                      {availableBuyers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}){p.city ? ` — ${p.city}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Transporter & Vehicle Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="transporterId"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Transporter (Optional)
                  </label>
                  <select
                    id="transporterId"
                    value={formData.transporterId}
                    onChange={(e) => handleChange('transporterId', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition bg-white"
                  >
                    <option value="">Self / Direct Transport</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}){t.city ? ` — ${t.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lorryNo"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Lorry Number *
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="lorryNo"
                      type="text"
                      required
                      value={formData.lorryNo}
                      onChange={(e) => handleChange('lorryNo', e.target.value.toUpperCase())}
                      placeholder="e.g. MH 12 AB 1234"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Bill Weight & Purchase Bill No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="billWtMt"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Bill Weight (MT) *
                  </label>
                  <div className="relative">
                    <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="billWtMt"
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={formData.billWtMt}
                      onChange={(e) => handleChange('billWtMt', e.target.value)}
                      placeholder="0.000"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                  {numericWeight > 0 ? (
                    <p className="text-[11px] font-mono text-indigo-600 font-semibold mt-1">
                      = {weightInKg.toLocaleString()} KG
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="purchaseBillNo"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Purchase / Internal Ref Bill No
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="purchaseBillNo"
                      type="text"
                      value={formData.purchaseBillNo}
                      onChange={(e) => handleChange('purchaseBillNo', e.target.value)}
                      placeholder="e.g. PB-1001"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Link
                  to="/dispatch/list"
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Dispatch Entry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-indigo-600 px-5 py-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-white/80" />
                  <h3 className="text-xs font-bold tracking-wider uppercase">
                    Live Dispatch Summary
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-100 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready</span>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs divide-y divide-slate-100">
                {/* Outward Bill & Date */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Bill Number:</span>
                    <span className="font-mono font-bold text-indigo-950">
                      {formData.outwardBillNo || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Dispatch Date:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.dispatchDate || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Status:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dispatched</span>
                    </span>
                  </div>
                </div>

                {/* Prominent Weight Display */}
                <div className="pt-3">
                  <div className="bg-indigo-50/70 rounded-xl p-3.5 text-center border border-indigo-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      NET BILL WEIGHT
                    </span>
                    <p className="text-2xl font-mono font-bold tracking-tight text-indigo-600">
                      {numericWeight > 0 ? numericWeight.toFixed(3) : '0.000'}{' '}
                      <span className="text-xs font-semibold uppercase text-indigo-400">MT</span>
                    </p>
                    <p className="text-xs text-indigo-500 font-mono font-medium">
                      = {weightInKg.toLocaleString()} KG
                    </p>
                  </div>
                </div>

                {/* Material & Vehicle */}
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Quality Grade:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate">
                      {selectedGrade?.name || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Buyer / Party:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate">
                      {selectedParty?.name || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Lorry No:</span>
                    {formData.lorryNo ? (
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {formData.lorryNo}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Transporter:</span>
                    <span className="font-medium text-slate-700 text-right max-w-[150px] truncate">
                      {selectedTransporter?.name || 'Self / Direct'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddDispatch;
