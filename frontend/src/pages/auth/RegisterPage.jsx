import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerThunk, clearError } from '../../store/authSlice'
import { addToast } from '../../store/uiSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)

  const [form, setForm] = useState({ username: '', password: '', confirm: '', name: '', role: 'merchant' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 已登录则直接跳走，只在挂载时检查一次
  useEffect(() => {
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

    if (form.password.length < 6) {
      setError('密码至少需要6位')
      return
    }
    if (form.password !== form.confirm) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const result = await dispatch(registerThunk(form))
    setLoading(false)

    if (registerThunk.fulfilled.match(result)) {
      dispatch(addToast({ msg: '注册成功，请登录', type: 'success' }))
      navigate('/login')
    } else {
      setError(result.payload || '注册失败，请重试')
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
          <Link
            to="/login"
            className="auth-tab"
            style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}
          >
            登录
          </Link>
          <button className="auth-tab active" type="button">注册</button>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>选择角色</label>
              <div className="role-select-group">
                {[['merchant', '🏨', '商户'], ['admin', '🛡', '管理员']].map(([val, icon, label]) => (
                  <div
                    key={val}
                    className={`role-option ${form.role === val ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, role: val }))}
                  >
                    <span className="role-icon">{icon}</span>{label}
                  </div>
                ))}
              </div>
            </div>
            <div className="auth-form-group">
              <label>用户名 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                value={form.username}
                onChange={upd('username')}
                placeholder="请输入用户名"
                autoComplete="username"
                required
              />
            </div>
            <div className="auth-form-group">
              <label>显示名称</label>
              <input
                value={form.name}
                onChange={upd('name')}
                placeholder="可选，如：北京希尔顿酒店"
              />
            </div>
            <div className="auth-form-group">
              <label>密码 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={upd('password')}
                placeholder="至少6位"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="auth-form-group">
              <label>确认密码 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                type="password"
                value={form.confirm}
                onChange={upd('confirm')}
                placeholder="再次输入密码"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? '注册中...' : '注册账号'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
