import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  ShoppingBag, 
  Package, 
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const menuItems = [
  { path: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { path: '/produtos', label: 'Produtos', icon: Package },
  { path: '/clientes', label: 'Clientes', icon: Users },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation()
  const { logout, user } = useAuthStore()

  return (
    <aside 
      className={`
        bg-slate-800 text-white min-h-screen flex flex-col transition-all duration-300 relative
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Botão de Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600 transition-colors shadow-md border-2 border-slate-800 z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 border-b border-slate-700 ${collapsed ? 'px-4' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-lg font-bold">M</span>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">Multi Delivery</h1>
            <p className="text-sm text-slate-400 mt-1">Dashboard</p>
          </>
        )}
      </div>

      <nav className={`flex-1 p-4 ${collapsed ? 'px-2' : ''}`}>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${collapsed ? 'justify-center px-0' : ''}
                    ${
                      isActive
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={`p-4 border-t border-slate-700 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && (
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-white">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-slate-400">{user?.email || ''}</p>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors
            ${collapsed ? 'justify-center px-0' : ''}
          `}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  )
}
