import { useState, useEffect } from 'react'
import { housesAPI } from '../api'
import Modal from '../components/Modal'
import { Input, Select, Textarea } from '../components/FormField'
import { Plus, Pencil, Trash2, Home, User } from 'lucide-react'
import toast from 'react-hot-toast'

const HOUSE_TYPES = [
  { value: 'bedsitter',    label: 'Bedsitter' },
  { value: 'single_room',  label: 'Single Room' },
]

const defaultForm = { name: '', house_type: '', rent_amount: '', floor: '', description: '' }

export default function HousesPage() {
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await housesAPI.listWithTenants()
      setHouses(res.data)
    } catch { toast.error('Failed to load houses') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd  = ()      => { setEditing(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (house) => {
    setEditing(house)
    setForm({
      name: house.name, house_type: house.house_type,
      rent_amount: house.rent_amount, floor: house.floor || '', description: house.description || ''
    })
    setShowModal(true)
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.house_type || !form.rent_amount) {
      return toast.error('Name, type and rent are required')
    }
    setSaving(true)
    try {
      const payload = { ...form, rent_amount: parseFloat(form.rent_amount) }
      if (editing) {
        await housesAPI.update(editing.id, payload)
        toast.success('House updated')
      } else {
        await housesAPI.create(payload)
        toast.success('House created')
      }
      setShowModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error saving house')
    } finally { setSaving(false) }
  }

  const handleDelete = async (house) => {
    if (!confirm(`Delete "${house.name}"? This cannot be undone.`)) return
    try {
      await housesAPI.delete(house.id)
      toast.success(`"${house.name}" deleted`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Cannot delete house')
    }
  }

  const bedsitters   = houses.filter(h => h.house_type === 'bedsitter')
  const singleRooms  = houses.filter(h => h.house_type === 'single_room')
  const occupied     = houses.filter(h => h.is_occupied).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gold-300 font-light">Houses</h1>
          <p className="text-gray-600 text-sm mt-1">
            {houses.length} units · {occupied} occupied · {houses.length - occupied} vacant
          </p>
        </div>
        <button onClick={openAdd} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> Add House
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-8">
        {[
          { label: 'All Units',    count: houses.length,                      color: 'bg-estate-700 text-gray-300' },
          { label: 'Bedsitters',   count: bedsitters.length,                  color: 'bg-amber-900/30 text-amber-400' },
          { label: 'Single Rooms', count: singleRooms.length,                 color: 'bg-blue-900/30 text-blue-400' },
          { label: 'Occupied',     count: occupied,                           color: 'bg-green-900/30 text-green-400' },
          { label: 'Vacant',       count: houses.length - occupied,           color: 'bg-purple-900/30 text-purple-400' },
        ].map(p => (
          <span key={p.label} className={`${p.color} text-xs font-bold px-3 py-1.5 rounded-full`}>
            {p.label}: {p.count}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin border-2 border-gold-500 border-t-transparent rounded-full w-10 h-10" />
        </div>
      ) : (
        <>
          {/* Bedsitters Section */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-gold-500/40" /> Bedsitters ({bedsitters.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bedsitters.map(h => <HouseCard key={h.id} house={h} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          </section>

          {/* Single Rooms Section */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-gold-500/40" /> Single Rooms ({singleRooms.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {singleRooms.map(h => <HouseCard key={h.id} house={h} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          </section>
        </>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal title={editing ? `Edit — ${editing.name}` : 'Add New House'} onClose={() => setShowModal(false)}>
          <Input label="Unit Name *"        value={form.name}        onChange={set('name')}        placeholder="e.g. Bedsitter B1" />
          <Select label="Type *"            value={form.house_type}  onChange={set('house_type')}  options={HOUSE_TYPES} placeholder="Select type…" />
          <Input label="Monthly Rent (KES)*" value={form.rent_amount} onChange={set('rent_amount')} type="number" placeholder="e.g. 8000" />
          <Input label="Floor"              value={form.floor}       onChange={set('floor')}       placeholder="e.g. Ground, First" />
          <Textarea label="Description"     value={form.description} onChange={set('description')} placeholder="Optional notes about the unit…" />

          <div className="flex gap-3 mt-2">
            <button onClick={handleSave} disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-60">
              {saving ? <span className="animate-spin border-2 border-estate-950 border-t-transparent rounded-full w-4 h-4" /> : null}
              {saving ? 'Saving…' : editing ? 'Update House' : 'Create House'}
            </button>
            <button onClick={() => setShowModal(false)} className="btn-outline px-4">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function HouseCard({ house, onEdit, onDelete }) {
  return (
    <div className={`card p-5 hover:border-gold-500/30 transition-all duration-200 group ${house.is_occupied ? '' : 'border-green-900/30'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${house.is_occupied ? 'bg-amber-900/20' : 'bg-green-900/20'}`}>
          <Home size={15} className={house.is_occupied ? 'text-amber-500' : 'text-green-500'} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(house)} className="p-1.5 rounded-lg hover:bg-estate-700 text-gray-500 hover:text-gold-400 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(house)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
        {house.house_type === 'bedsitter' ? 'Bedsitter' : 'Single Room'}
        {house.floor && <span> · {house.floor} floor</span>}
      </p>
      <p className="font-serif text-gold-300 text-lg mb-2">{house.name}</p>
      <p className="text-gold-500 font-bold font-mono text-lg">
        KES {house.rent_amount?.toLocaleString()}
        <span className="text-gray-600 font-normal text-xs">/mo</span>
      </p>

      <div className="mt-3 pt-3 border-t border-estate-700 flex items-center gap-2">
        {house.is_occupied ? (
          <>
            <User size={12} className="text-gray-600 flex-shrink-0" />
            <p className="text-xs text-gray-400 truncate">{house.current_tenant}</p>
          </>
        ) : (
          <span className="badge-vacant">Vacant</span>
        )}
      </div>
    </div>
  )
}
