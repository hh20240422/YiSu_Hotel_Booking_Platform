import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'

const MERCHANT_NAV = [
  { to: '/dashboard', icon: '📊', label: '控制台' },
  { to: '/hotels',    icon: '🏨', label: '我的酒店' },
]
const ADMIN_NAV = [
  { to: '/dashboard', icon: '📊', label: '控制台' },
  { to: '/hotels',    icon: '🔍', label: '审核管理' },
]

export default function MainLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const navItems = user?.role === 'admin' ? ADMIN_NAV : MERCHANT_NAV

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">易宿</div>
          <div className="sidebar-logo-sub">HOTEL MANAGEMENT</div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0) || user?.username?.charAt(0)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || user?.username}</div>
            <div className="sidebar-user-role">
              {user?.role === 'admin' ? '管理员' : '商户'}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>退出登录</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {/* Outlet renders the matched child route */}
        <div className="page-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
