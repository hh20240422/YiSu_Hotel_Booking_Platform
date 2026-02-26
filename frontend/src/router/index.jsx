import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import MainLayout from '../layouts/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import HotelsPage from '../pages/hotels/HotelsPage'

// Guard: redirect to /login if not authenticated
function RequireAuth({ children }) {
  const user = useSelector(state => state.auth.user)
  return user ? children : <Navigate to="/login" replace />
}

// Guard: redirect to /dashboard if already logged in
function RequireGuest({ children }) {
  const user = useSelector(state => state.auth.user)
  return user ? <Navigate to="/dashboard" replace /> : children
}

// Wrapper to use hooks inside createBrowserRouter
import React from 'react'
function ProtectedLayout() {
  return (
    <RequireAuth>
      <MainLayout />
    </RequireAuth>
  )
}
function GuestLogin() {
  return <RequireGuest><LoginPage /></RequireGuest>
}
function GuestRegister() {
  return <RequireGuest><RegisterPage /></RequireGuest>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestLogin />,
  },
  {
    path: '/register',
    element: <GuestRegister />,
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
