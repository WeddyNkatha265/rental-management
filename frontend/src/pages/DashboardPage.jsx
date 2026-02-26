import { useState, useEffect } from 'react'
import { paymentsAPI } from '../api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import {
  Building2, Users, TrendingUp, AlertCircle,
  Home, CheckCircle2, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

function StatCard({ label, value, sub, accent, icon: Icon, trend }) {
  return (
    <div className={`card p-6 relative overflow-hidden ${accent ? 'border-gold-500/30' : ''}`}
      style={accent ? { background: 'linear-gradient(135deg, rgba(197,160,40,0.12) 0%, rgba(139,105,20,0.06) 100%)' } : {}}>
      {/* Background circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-5"
        style={{ background: accent ? '#C5A028' : '#ffffff' }} />

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${accent ? 'gold-gradient' : 'bg-estate-700'}`}>
          <Icon size={16} className={accent ? 'text-estate-950' : 'text-gold-500'} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-serif text-2xl font-bold ${accent ? 'text-gold-400' : 'text-gold-300'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-estate-800 border border-estate-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-gold-400 font-bold">KES {payload[0].value?.toLocaleString()}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await paymentsAPI.dashboard()
      setStats(res.data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin border-2 border-gold-500 border-t-transparent rounded-full w-10 h-10" />
    </div>
  )

  if (!stats) return null

  const today = new Date()
  const monthName = today.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gold-300 font-light">Estate Overview</h1>
          <p className="text-gray-600 text-sm mt-1">{monthName} · Kisumu, Kenya</p>
        </div>
        <button onClick={load} className="btn-outline flex items-center gap-2 text-xs py-2 px-4">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Units"     value={stats.total_units}                          sub={`${stats.vacant_units} vacant`}      icon={Building2} />
        <StatCard label="Occupied"        value={`${stats.occupied_units}/${stats.total_units}`} sub={`${stats.occupancy_rate}% occupancy`} icon={Home} />
        <StatCard label="Expected Rent"   value={`KES ${stats.total_expected_rent?.toLocaleString()}`} sub="This month" icon={TrendingUp} accent />
        <StatCard label="Received"        value={`KES ${stats.total_received_rent?.toLocaleString()}`} sub={`${stats.recent_payments?.length || 0} payments`} icon={CheckCircle2} />
        <StatCard label="Outstanding"     value={`KES ${stats.outstanding_rent?.toLocaleString()}`} sub={`${stats.overdue_tenants} overdue`} icon={AlertCircle} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Revenue Chart - 2/3 width */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-gold-300 text-lg font-light">Revenue Trend</h3>
              <p className="text-xs text-gray-600">Last 7 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.monthly_revenue} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C5A028" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C5A028" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#555570', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="amount"
                stroke="#C5A028" strokeWidth={2}
                fill="url(#goldGrad)"
                dot={{ fill: '#C5A028', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#E8D9A0', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy */}
        <div className="card p-6">
          <h3 className="font-serif text-gold-300 text-lg font-light mb-6">Collection Rate</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#22222F" strokeWidth="12" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#C5A028" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 38 * (stats.total_received_rent / (stats.total_expected_rent || 1))} 999`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold font-serif text-gold-400">
                  {stats.total_expected_rent > 0
                    ? Math.round(stats.total_received_rent / stats.total_expected_rent * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-600">collected</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expected</span>
              <span className="text-gold-300 font-mono">KES {stats.total_expected_rent?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Received</span>
              <span className="text-green-400 font-mono">KES {stats.total_received_rent?.toLocaleString()}</span>
            </div>
            <div className="h-px bg-estate-700" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gap</span>
              <span className="text-red-400 font-mono">KES {stats.outstanding_rent?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Payments */}
        <div className="card">
          <div className="px-6 py-4 border-b border-estate-700">
            <h3 className="font-serif text-gold-300 text-base font-light">Recent Payments</h3>
          </div>
          <div className="divide-y divide-estate-700">
            {stats.recent_payments?.length === 0 && (
              <p className="text-gray-600 text-sm px-6 py-8 text-center">No payments recorded yet</p>
            )}
            {stats.recent_payments?.map((p, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-estate-800/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-200">{p.tenant_name}</p>
                  <p className="text-xs text-gray-600">{p.house_name} · {p.method}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold-500 font-bold font-mono">+{p.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-700">{p.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Houses */}
        <div className="card">
          <div className="px-6 py-4 border-b border-estate-700">
            <h3 className="font-serif text-gold-300 text-base font-light">House Performance</h3>
          </div>
          <div className="divide-y divide-estate-700">
            {stats.top_houses?.length === 0 && (
              <p className="text-gray-600 text-sm px-6 py-8 text-center">No data yet</p>
            )}
            {stats.top_houses?.map((h, i) => {
              const pct = h.expected > 0 ? Math.round(h.received / h.expected * 100) : 0
              return (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-200">{h.name}</p>
                    <p className="text-xs text-gray-500">{pct}%</p>
                  </div>
                  <div className="h-1.5 bg-estate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? '#4CAF50' : pct > 50 ? '#C5A028' : '#ef4444'
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-700">KES {h.received?.toLocaleString()}</span>
                    <span className="text-xs text-gray-700">/ {h.expected?.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
