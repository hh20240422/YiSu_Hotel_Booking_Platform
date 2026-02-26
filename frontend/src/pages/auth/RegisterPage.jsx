import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerThunk, clearError } from '../../store/authSlice'
import { addToast } from '../../store/uiSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(state => state.auth)
  const [form, setForm] = useState({ username: '', password: '', confirm: '', name: '', role: 'merchant' })

  useEffect(() => { dispatch(clearError()) }, [])

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      dispatch(addToast({ msg: '两次密码不一致', type: 'error' }))
      return
    }
    if (form.password.length < 6) {
      dispatch(addToast({ msg: '密码至少6位', type: 'error' }))
      return
    }
    const result = await dispatch(registerThunk(form))
    if (registerThunk.fulfilled.match(result)) {
      dispatch(addToast({ msg: '注册成功，请登录', type: 'success' }))
      navigate('/login')
    }
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
          <Link to="/login" className="auth-tab" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>登录</Link>
          <button className="auth-tab active">注册</button>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>选择角色</label>
              <div className="role-select-group">
                {[['merchant', '🏨', '商户'], ['admin', '🛡', '管理员']].map(([val, icon, label]) => (
                  <div key={val} className={`role-option ${form.role === val ? 'selected' : ''}`} onClick={() => setForm(p => ({ ...p, role: val }))}>
                    <span className="role-icon">{icon}</span>{label}
                  </div>
                ))}
              </div>
            </div>
            <div className="auth-form-group">
              <label>用户名 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input value={form.username} onChange={upd('username')} placeholder="请输入用户名" required />
            </div>
            <div className="auth-form-group">
              <label>显示名称</label>
              <input value={form.name} onChange={upd('name')} placeholder="可选，如：北京希尔顿酒店" />
            </div>
            <div className="auth-form-group">
              <label>密码 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="password" value={form.password} onChange={upd('password')} placeholder="至少6位" required />
            </div>
            <div className="auth-form-group">
              <label>确认密码 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="password" value={form.confirm} onChange={upd('confirm')} placeholder="再次输入密码" required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }} disabled={loading}>
              {loading ? '注册中...' : '注册账号'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
