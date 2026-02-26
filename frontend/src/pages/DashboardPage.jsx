import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchHotels } from '../store/hotelsSlice'
import StatusBadge from '../components/common/StatusBadge'

export default function DashboardPage() {
  const dispatch = useDispatch()
  const { list: hotels } = useSelector(state => state.hotels)
  const user = useSelector(state => state.auth.user)

  useEffect(() => { dispatch(fetchHotels()) }, [dispatch])

  const counts = hotels.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1
    return acc
  }, {})

  const recent = [...hotels]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        {[
          ['gold', '总酒店数', hotels.length, '🏨'],
          ['blue', '待审核',   counts.pending || 0, '⏳'],
          ['green','已发布',  counts.approved || 0, '✅'],
          ['orange','已下线', counts.offline || 0, '📴'],
        ].map(([color, label, val, icon]) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{val}</div>
            <div className="stat-icon">{icon}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="card mb-24">
        <div className="card-header"><div className="card-title">最近更新</div></div>
        <div className="card-body">
          {recent.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">暂无数据</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>酒店名称</th><th>状态</th><th>更新时间</th></tr></thead>
                <tbody>
                  {recent.map(h => (
                    <tr key={h.id}>
                      <td><strong>{h.name_cn}</strong></td>
                      <td><StatusBadge status={h.status} /></td>
                      <td className="text-muted">{h.updated_at?.substring(0, 16).replace('T', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Welcome banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #2A2018 100%)', borderColor: 'var(--gold-dim)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>{user?.role === 'admin' ? '🛡' : '🏨'}</div>
            <div>
              <div style={{ fontFamily: 'Noto Serif SC, serif', fontSize: 16, fontWeight: 600, color: 'var(--gold-light)', marginBottom: 4 }}>
                欢迎回来，{user?.name}
              </div>
              <div style={{ fontSize: 13, color: '#9A8E80' }}>
                {user?.role === 'admin'
                  ? `当前有 ${counts.pending || 0} 家酒店等待审核，请及时处理。`
                  : `您共有 ${hotels.length} 家酒店，其中 ${counts.approved || 0} 家已发布。`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
