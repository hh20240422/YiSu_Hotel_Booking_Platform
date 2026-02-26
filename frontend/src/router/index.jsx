import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import MainLayout from '../layouts/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import HotelsPage from '../pages/hotels/HotelsPage'

// 只保留登录后的路由守卫，登录/注册页不需要包装
function RequireAuth({ children }) {
  const user = useSelector(state => state.auth.user)
  return user ? children : <Navigate to="/login" replace />
}

function ProtectedLayout() {
  return (
    <RequireAuth>
      <MainLayout />
    </RequireAuth>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,      // 直接挂载，不包任何 wrapper
  },
  {
    path: '/register',
    element: <RegisterPage />,   // 直接挂载，不包任何 wrapper
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'hotels', element: <HotelsPage /> },
    ],
  },
])
