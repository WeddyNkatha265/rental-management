import { useState, useEffect } from 'react'
import { paymentsAPI, tenantsAPI, housesAPI } from '../api'
import Modal from '../components/Modal'
import { Input, Select, Textarea } from '../components/FormField'
import { Plus, Mail, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'cash',  label: 'Cash' },
  { value: 'bank',  label: 'Bank Transfer' },
]

const METHOD_COLORS = {
  mpesa: 'bg-green-900/30 text-green-400',
  cash:  'bg-yellow-900/30 text-yellow-400',
  bank:  'bg-blue-900/30 text-blue-400',
}

function getMonthOptions() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months
}

const defaultForm = {
  tenant_id: '', house_id: '', amount_paid: '',
  payment_date: new Date().toISOString().split('T')[0],
  month_paid_for: '',
  payment_method: 'mpesa', reference_code: '', notes: '', send_email: true,
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [tenants, setTenants] = useState([])
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [sendingReminders, setSendingReminders] = useState(false)

  const monthOptions = getMonthOptions()

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, tRes, hRes] = await Promise.all([
        paymentsAPI.list(filterMonth ? { month: filterMonth } : {}),
        tenantsAPI.list(),
        housesAPI.list(),
      ])
      setPayments(pRes.data)
      setTenants(tRes.data)
      setHouses(hRes.data)
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterMonth])

  const set = (field) => (e) => {
    const val = field === 'send_email' ? e.target.checked : e.target.value
    setForm(f => {
      const updated = { ...f, [field]: val }
      // Auto-fill amount and house when tenant is selected
      if (field === 'tenant_id' && val) {
        const tenant = tenants.find(t => t.id === parseInt(val))
        if (tenant) {
          updated.house_id = tenant.house_id || ''
          const house = houses.find(h => h.id === tenant.house_id)
          if (house) updated.amount_paid = house.rent_amount
        }
      }
      return updated
    })
  }

  const handleRecord = async () => {
    if (!form.tenant_id || !form.amount_paid || !form.month_paid_for || !form.payment_method) {
      return toast.error('Tenant, amount, month and method are required')
    }
    setSaving(true)
    try {
      await paymentsAPI.create({
        ...form,
        tenant_id:    parseInt(form.tenant_id),
        house_id:     parseInt(form.house_id),
        amount_paid:  parseFloat(form.amount_paid),
        send_email:   form.send_email,
      })
      toast.success('Payment recorded' + (form.send_email ? ' · Email receipt sent' : ''))
      setShowModal(false)
      setForm(defaultForm)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error recording payment')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return
    try {
      await paymentsAPI.delete(id)
      toast.success('Payment deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const handleSendReminders = async () => {
    const month = filterMonth || monthOptions[0].value
    if (!confirm(`Send payment reminders to all unpaid tenants for ${month}?`)) return
    setSendingReminders(true)
    try {
      const res = await paymentsAPI.sendReminders(month)
      toast.success(`Reminders sent to ${res.data.sent} tenant(s)`)
    } catch { toast.error('Failed to send reminders') }
    finally { setSendingReminders(false) }
  }

  const total = payments.reduce((s, p) => s + p.amount_paid, 0)

  const tenantOptions = tenants.map(t => ({
    value: t.id,
    label: `${t.full_name} — ${t.house?.name || 'No house'}`
  }))

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gold-300 font-light">Payments</h1>
          <p className="text-gray-600 text-sm mt-1">
            {payments.length} records · KES {total.toLocaleString()} total
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="btn-outline flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <Mail size={14} />
            {sendingReminders ? 'Sending…' : 'Send Reminders'}
          </button>
          <button onClick={() => { setShowModal(true); setForm(defaultForm) }} className="btn-gold flex items-center gap-2">
            <Plus size={15} /> Record Payment
          </button>
        </div>
      </div>

      {/* Filter + Summary */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="select-base w-64"
        >
          <option value="">All months</option>
          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <p className="text-xs text-gray-600 mb-0.5">Received</p>
            <p className="text-gold-400 font-mono font-bold">KES {total.toLocaleString()}</p>
          </div>
          <div className="card px-4 py-2 text-center">
            <p className="text-xs text-gray-600 mb-0.5">Transactions</p>
            <p className="text-gold-400 font-mono font-bold">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin border-2 border-gold-500 border-t-transparent rounded-full w-10 h-10" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-estate-700">
                  <th className="table-th">Tenant</th>
                  <th className="table-th">House</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Month</th>
                  <th className="table-th">Method</th>
                  <th className="table-th">Reference</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Email</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-600 py-12 text-sm">
                      No payments found. Record the first payment →
                    </td>
                  </tr>
                )}
                {payments.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="table-td font-semibold text-gray-200">{p.tenant?.full_name || '—'}</td>
                    <td className="table-td text-gray-400">{p.house?.name || '—'}</td>
                    <td className="table-td">
                      <span className="text-gold-500 font-bold font-mono">+{p.amount_paid?.toLocaleString()}</span>
                    </td>
                    <td className="table-td text-gray-400 text-xs">{p.month_paid_for}</td>
                    <td className="table-td">
                      <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${METHOD_COLORS[p.payment_method] || 'bg-estate-700 text-gray-400'}`}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="table-td text-gray-600 text-xs font-mono">{p.reference_code || '—'}</td>
                    <td className="table-td text-gray-500 text-xs">{p.payment_date}</td>
                    <td className="table-td text-center">
                      {p.email_sent
                        ? <CheckCircle2 size={15} className="text-green-500 mx-auto" />
                        : <AlertCircle  size={15} className="text-gray-700 mx-auto" />}
                    </td>
                    <td className="table-td">
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <Modal title="Record Payment" onClose={() => setShowModal(false)}>
          <Select
            label="Tenant *"
            value={form.tenant_id}
            onChange={set('tenant_id')}
            options={tenantOptions}
            placeholder="Select tenant…"
          />
          <Input
            label="Amount (KES) *"
            type="number"
            value={form.amount_paid}
            onChange={set('amount_paid')}
            placeholder="e.g. 8000"
          />
          <Select
            label="Month Paid For *"
            value={form.month_paid_for}
            onChange={set('month_paid_for')}
            options={monthOptions}
            placeholder="Select month…"
          />
          <Select
            label="Payment Method *"
            value={form.payment_method}
            onChange={set('payment_method')}
            options={PAYMENT_METHODS}
          />
          <Input label="Reference / M-Pesa Code" value={form.reference_code} onChange={set('reference_code')} placeholder="e.g. QBZ8123AK" />
          <Input label="Payment Date *" type="date" value={form.payment_date} onChange={set('payment_date')} />
          <Textarea label="Notes (optional)" value={form.notes} onChange={set('notes')} placeholder="Any notes about this payment…" />

          {/* Email checkbox */}
          <label className="flex items-center gap-3 bg-estate-900 border border-estate-700 rounded-xl px-4 py-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={form.send_email}
              onChange={set('send_email')}
              className="w-4 h-4 accent-gold-500"
            />
            <div>
              <p className="text-sm text-gray-300 font-medium">📧 Send email receipt to tenant</p>
              <p className="text-xs text-gray-600">Automatically sends payment confirmation to tenant's email</p>
            </div>
          </label>

          <div className="flex gap-3">
            <button onClick={handleRecord} disabled={saving} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <span className="animate-spin border-2 border-estate-950 border-t-transparent rounded-full w-4 h-4" />}
              {saving ? 'Recording…' : 'Record Payment'}
            </button>
            <button onClick={() => setShowModal(false)} className="btn-outline px-5">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
