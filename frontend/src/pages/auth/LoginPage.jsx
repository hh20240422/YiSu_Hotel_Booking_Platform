import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, clearError } from '../../store/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(state => state.auth)
  const [form, setForm] = useState({ username: '', password: '' })

  useEffect(() => { dispatch(clearError()) }, [])

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const result = await dispatch(loginThunk(form))
    if (loginThunk.fulfilled.match(result)) navigate('/dashboard')
  }

  return (
    <div className="auth-bg">
      <div className="auth-decoration">易宿</div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">易宿</div>
          <div className="auth-tagline">酒店管理平台 · Hotel Management Platform</div>
        </div>
        <div className="auth-tabs">
          <button className="auth-tab active">登录</button>
          <Link to="/register" className="auth-tab" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>注册</Link>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>用户名</label>
              <input value={form.username} onChange={upd('username')} placeholder="请输入用户名" required />
            </div>
            <div className="auth-form-group">
              <label>密码</label>
              <input type="password" value={form.password} onChange={upd('password')} placeholder="请输入密码" required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }} disabled={loading}>
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
