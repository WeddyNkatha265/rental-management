import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Home, Users, CreditCard,
  LogOut, Building2, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/houses',   label: 'Houses',    icon: Home },
  { to: '/tenants',  label: 'Tenants',   icon: Users },
  { to: '/payments', label: 'Payments',  icon: CreditCard },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-estate-950 overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-estate-900 border-r border-estate-700 flex flex-col">

        {/* Logo */}
        <div className="px-6 py-7 border-b border-estate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-estate-950" />
            </div>
            <div>
              <p className="text-[10px] text-gold-500 tracking-[0.2em] uppercase leading-none mb-0.5">Estate</p>
              <p className="text-gold-300 font-serif text-base font-bold leading-tight">Murithi Rentals</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-gold-500/40 to-transparent mt-5" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={13} className="opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-5 border-t border-estate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-estate-950 font-black text-sm">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-gray-600">Property Manager</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-estate-950">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
