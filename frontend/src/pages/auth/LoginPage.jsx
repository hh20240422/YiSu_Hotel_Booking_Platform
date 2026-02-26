import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginThunk, clearError } from '../../store/authSlice'
import { store } from '../../store'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 读取一次 store 快照做初始检查，完全不订阅 Redux，避免任何重渲染
  useEffect(() => {
    const user = store.getState().auth.user
    if (user) navigate('/dashboard', { replace: true })
    dispatch(clearError())
  }, [])

  const upd = k => e => {
    setError('')
    setForm(p => ({ ...p, [k]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await dispatch(loginThunk(form))
    setLoading(false)
    if (loginThunk.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.payload || '登录失败，请重试')
      setForm(p => ({ ...p, password: '' }))
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-decoration">易宿</div>
      <div className="auth-card">

        {loading && (
          <div className="auth-loading-overlay">
            <div className="auth-spinner" />
          </div>
        )}

        <div className="auth-header">
          <div className="auth-logo">易宿</div>
          <div className="auth-tagline">酒店管理平台 · Hotel Management Platform</div>
        </div>
        <div className="auth-tabs">
          <button className="auth-tab active" type="button">登录</button>
          <Link
            to="/register"
            className="auth-tab"
            style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}
          >
            注册
          </Link>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>用户名</label>
              <input
                value={form.username}
                onChange={upd('username')}
                placeholder="请输入用户名"
                autoComplete="username"
                required
              />
            </div>
            <div className="auth-form-group">
              <label>密码</label>
              <input
                type="password"
                value={form.password}
                onChange={upd('password')}
                placeholder="请输入密码"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--paper-warm)', borderRadius: 8, fontSize: 12, color: 'var(--ink-light)' }}>
            <strong>测试账号：</strong><br />
            管理员：admin / admin123<br />
            商户：merchant1 / merchant123
          </div>
        </div>
      </div>
    </div>
  )
}
