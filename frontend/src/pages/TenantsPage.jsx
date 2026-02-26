import { useState, useEffect } from 'react'
import { tenantsAPI, housesAPI } from '../api'
import Modal from '../components/Modal'
import { Input, Select, Textarea } from '../components/FormField'
import { Plus, Eye, UserX, Phone, Mail, Calendar, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = {
  full_name: '', id_number: '', phone: '', email: '',
  house_id: '', move_in_date: '', occupation: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  private_notes: '', deposit_paid: '',
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [viewTenant, setViewTenant] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, hRes] = await Promise.all([tenantsAPI.list(), housesAPI.listWithTenants()])
      setTenants(tRes.data)
      setHouses(hRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const vacantHouses = houses.filter(h => !h.is_occupied)
  const houseOptions = vacantHouses.map(h => ({ value: h.id, label: `${h.name} — KES ${h.rent_amount?.toLocaleString()}` }))

  const handleAdd = async () => {
    if (!form.full_name || !form.phone) return toast.error('Name and phone are required')
    setSaving(true)
    try {
      await tenantsAPI.create({
        ...form,
        house_id:     form.house_id     ? parseInt(form.house_id)     : null,
        deposit_paid: form.deposit_paid ? parseFloat(form.deposit_paid) : 0,
      })
      toast.success('Tenant added successfully')
      setShowAdd(false)
      setForm(defaultForm)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add tenant')
    } finally { setSaving(false) }
  }

  const handleRemove = async (tenant) => {
    if (!confirm(`Remove tenant "${tenant.full_name}"? They will be marked as inactive.`)) return
    try {
      await tenantsAPI.remove(tenant.id)
      toast.success('Tenant removed')
      setViewTenant(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error removing tenant')
    }
  }

  // Get payment status — check if tenant is in the view modal's detail
  const getPaymentStatus = (tenant) => {
    // Just show based on recent data availability; real check is in payments
    return tenant.is_active ? 'active' : 'inactive'
  }

  const filtered = tenants.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.phone.includes(search) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gold-300 font-light">Tenants</h1>
          <p className="text-gray-600 text-sm mt-1">{tenants.length} active tenants</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm(defaultForm) }} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base max-w-md"
        />
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
                  <th className="table-th">Phone</th>
                  <th className="table-th">Move-in</th>
                  <th className="table-th">Deposit</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-600 py-12 text-sm">No tenants found</td></tr>
                )}
                {filtered.map(t => (
                  <tr key={t.id} className="table-row cursor-pointer" onClick={() => setViewTenant(t)}>
                    <td className="table-td">
                      <p className="font-semibold text-gray-200">{t.full_name}</p>
                      <p className="text-xs text-gray-600">{t.email || '—'}</p>
                    </td>
                    <td className="table-td text-gray-400">
                      {t.house?.name || <span className="text-gray-700 italic">Unassigned</span>}
                    </td>
                    <td className="table-td text-gray-400 font-mono text-xs">{t.phone}</td>
                    <td className="table-td text-gray-500 text-xs">{t.move_in_date || '—'}</td>
                    <td className="table-td text-gray-400 text-xs font-mono">
                      {t.deposit_paid > 0 ? `KES ${t.deposit_paid?.toLocaleString()}` : '—'}
                    </td>
                    <td className="table-td">
                      <span className={t.is_active ? 'badge-paid' : 'badge-overdue'}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td">
                      <button
                        onClick={e => { e.stopPropagation(); setViewTenant(t) }}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gold-400 transition-colors border border-estate-700 hover:border-gold-500/30 rounded-lg px-3 py-1.5"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAdd && (
        <Modal title="Add New Tenant" onClose={() => setShowAdd(false)} size="lg">
          <div className="grid grid-cols-2 gap-x-4">
            <div className="col-span-2"><Input label="Full Name *"   value={form.full_name} onChange={set('full_name')} placeholder="Jane Achieng" /></div>
            <Input label="National ID"      value={form.id_number}  onChange={set('id_number')}  placeholder="12345678" />
            <Input label="Phone *"          value={form.phone}      onChange={set('phone')}       placeholder="0712345678" />
            <div className="col-span-2"><Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="jane@email.com" /></div>
            <div className="col-span-2">
              <Select label="Assign House" value={form.house_id} onChange={set('house_id')}
                options={houseOptions} placeholder="Select vacant house…" />
              {vacantHouses.length === 0 && <p className="text-xs text-amber-400 -mt-2 mb-3">⚠ All houses are currently occupied</p>}
            </div>
            <Input label="Move-in Date" type="date" value={form.move_in_date} onChange={set('move_in_date')} />
            <Input label="Deposit Paid (KES)" type="number" value={form.deposit_paid} onChange={set('deposit_paid')} placeholder="0" />
            <Input label="Occupation"    value={form.occupation}    onChange={set('occupation')}    placeholder="e.g. Teacher" />
            <Input label="Emergency Contact Name"  value={form.emergency_contact_name}  onChange={set('emergency_contact_name')}  placeholder="John Kamau" />
            <div className="col-span-2">
              <Input label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} placeholder="0798765432" />
            </div>
            <div className="col-span-2">
              <Textarea label="🔒 Private Notes (secure — admin only)" value={form.private_notes} onChange={set('private_notes')}
                placeholder="Any private notes about this tenant…" />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={handleAdd} disabled={saving} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <span className="animate-spin border-2 border-estate-950 border-t-transparent rounded-full w-4 h-4" />}
              {saving ? 'Saving…' : 'Add Tenant'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-outline px-5">Cancel</button>
          </div>
        </Modal>
      )}

      {/* View Tenant Modal */}
      {viewTenant && (
        <Modal title="Tenant Record" onClose={() => setViewTenant(null)}>
          {/* Header card */}
          <div className="card p-4 mb-5" style={{ background: 'linear-gradient(135deg, rgba(197,160,40,0.08), transparent)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-estate-950 font-black text-lg flex-shrink-0">
                {viewTenant.full_name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-serif text-gold-300 text-xl">{viewTenant.full_name}</p>
                <p className="text-gray-500 text-sm">{viewTenant.house?.name || 'No house assigned'}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          {[
            ['National ID', viewTenant.id_number, null],
            ['Phone',       viewTenant.phone,      <Phone size={12} />],
            ['Email',       viewTenant.email,       <Mail size={12} />],
            ['Move-in',     viewTenant.move_in_date, <Calendar size={12} />],
            ['Occupation',  viewTenant.occupation,   null],
            ['Deposit Paid', viewTenant.deposit_paid > 0 ? `KES ${viewTenant.deposit_paid?.toLocaleString()}` : '—', null],
            ['Emergency Contact', viewTenant.emergency_contact_name ? `${viewTenant.emergency_contact_name} · ${viewTenant.emergency_contact_phone || ''}` : '—', null],
          ].filter(([, v]) => v).map(([label, value, icon]) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-estate-700 last:border-0">
              <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">{icon}{label}</span>
              <span className="text-sm text-gray-300 text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}

          {/* Private Notes */}
          {viewTenant.private_notes && (
            <div className="mt-4 bg-estate-900 border border-gold-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={12} className="text-gold-500" />
                <p className="text-xs text-gold-500 uppercase tracking-wider font-semibold">Private Notes</p>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{viewTenant.private_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button onClick={() => { setViewTenant(null); setShowAdd(false) }} className="btn-outline flex-1 py-2.5">
              Close
            </button>
            <button onClick={() => handleRemove(viewTenant)} className="btn-danger flex items-center gap-2 py-2.5">
              <UserX size={14} /> Remove Tenant
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
