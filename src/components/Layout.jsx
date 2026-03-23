import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, GitBranch, Users, FileText,
  AlertTriangle, Mail, BarChart2, Globe, Settings, LogOut, Leaf, FolderOpen, TrendingDown
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/affaires', icon: FileText, label: 'Affaires' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/charges', icon: TrendingDown, label: 'Charges' },
  { to: '/reclamations', icon: AlertTriangle, label: 'Réclamations' },
  { to: '/emails', icon: Mail, label: 'Emails' },
  { to: '/social', icon: BarChart2, label: 'Réseaux sociaux' },
  { to: '/wix', icon: Globe, label: 'Site Wix' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-gray-700">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Novogarden</p>
            <p className="text-gray-400 text-xs">CRM</p>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors mb-1 ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Settings size={16} /> Paramètres
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-400 hover:text-white w-full transition-colors"
          >
            <LogOut size={16} /> Déconnexion
          </button>
          <p className="text-gray-500 text-xs mt-2 px-2">{user?.name}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
