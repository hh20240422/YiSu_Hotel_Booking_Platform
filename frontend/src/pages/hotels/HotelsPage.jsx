import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchHotels, approveHotel, rejectHotel, offlineHotel, onlineHotel, submitHotel } from '../../store/hotelsSlice'
import { addToast } from '../../store/uiSlice'
import StatusBadge from '../../components/common/StatusBadge'
import StarDisplay from '../../components/common/StarDisplay'
import HotelFormDrawer from '../../components/hotel/HotelFormDrawer'
import HotelDetailDrawer from '../../components/hotel/HotelDetailDrawer'

const MERCHANT_FILTERS = [['all','全部'],['draft','草稿'],['pending','待审核'],['approved','已发布'],['rejected','已拒绝']]
const ADMIN_FILTERS    = [['all','全部'],['pending','待审核'],['approved','已发布'],['rejected','已拒绝'],['offline','已下线'],['draft','草稿']]

export default function HotelsPage() {
  const dispatch = useDispatch()
  const { list: hotels, loading, actionLoading } = useSelector(state => state.hotels)
  const user = useSelector(state => state.auth.user)

  const [filter, setFilter]       = useState('all')
  const [showForm, setShowForm]   = useState(false)
  const [editHotel, setEditHotel] = useState(null)
  const [viewHotel, setViewHotel] = useState(null)

  useEffect(() => { dispatch(fetchHotels()) }, [dispatch])

  const filters = user?.role === 'admin' ? ADMIN_FILTERS : MERCHANT_FILTERS
  const counts  = hotels.reduce((acc, h) => { acc[h.status] = (acc[h.status] || 0) + 1; return acc }, {})
  const filtered = filter === 'all' ? hotels : hotels.filter(h => h.status === filter)

  async function handleAction(thunk, ...args) {
    const result = await dispatch(thunk(...args))
    if (thunk.fulfilled?.match?.(result) || result.meta?.requestStatus === 'fulfilled') {
      dispatch(addToast({ msg: '操作成功', type: 'success' }))
      dispatch(fetchHotels())
      setViewHotel(null)
    } else {
      dispatch(addToast({ msg: result.payload || '操作失败', type: 'error' }))
    }
  }

  function openEdit(hotel) { setEditHotel(hotel); setShowForm(true) }
  function openNew()       { setEditHotel(null);  setShowForm(true) }
  function closeForm()     { setShowForm(false); setEditHotel(null) }
  function afterSave()     { closeForm(); dispatch(fetchHotels()) }

  return (
    <div>
      {/* Stat strip */}
      <div className="stat-grid">
        {[['gold','全部',hotels.length,'🏨'],['blue','待审核',counts.pending||0,'⏳'],['green','已发布',counts.approved||0,'✅'],['orange','已拒绝',counts.rejected||0,'❌']].map(([c,l,v,i])=>(
          <div key={l} className={`stat-card ${c}`}><div className="stat-label">{l}</div><div className="stat-value">{v}</div><div className="stat-icon">{i}</div></div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">{user?.role === 'admin' ? '酒店审核管理' : '我的酒店'}</div>
          {user?.role === 'merchant' && (
            <button className="btn btn-primary btn-sm" onClick={openNew}>+ 录入新酒店</button>
          )}
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="filter-bar">
            {filters.map(([v, l]) => (
              <button key={v} className={`filter-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>
                {l}{v !== 'all' && counts[v] ? ` (${counts[v]})` : ''}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏨</div>
              <div className="empty-state-text">{filter === 'all' ? '暂无酒店数据' : '暂无该状态的酒店'}</div>
              {user?.role === 'merchant' && filter === 'all' && (
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>录入第一家酒店</button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>酒店名称</th><th>星级</th><th>地址</th>
                    {user?.role === 'admin' && <th>商户</th>}
                    <th>状态</th><th>最低价</th><th>更新时间</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => {
                    const rooms = h.room_types || []
                    const minP = rooms.length ? Math.min(...rooms.map(r => r.discount_price || r.price)) : null
                    return (
                      <tr key={h.id}>
                        <td>
                          <div className="hotel-name-cell">{h.name_cn}</div>
                          {h.name_en && <div className="hotel-name-en">{h.name_en}</div>}
                        </td>
                        <td><StarDisplay count={h.star_level} /></td>
                        <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.address}</td>
                        {user?.role === 'admin' && <td>{h.merchant_name}</td>}
                        <td>
                          <StatusBadge status={h.status} />
                          {h.status === 'rejected' && h.reject_reason && (
                            <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.reject_reason}</div>
                          )}
                        </td>
                        <td>{minP ? <span style={{ fontWeight: 600, color: 'var(--gold-dim)' }}>¥{minP}</span> : '—'}</td>
                        <td className="text-muted">{h.updated_at?.substring(0, 10)}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-ghost btn-sm" onClick={() => setViewHotel(h)}>查看</button>
                            {user?.role === 'merchant' && ['draft', 'rejected', 'offline'].includes(h.status) && (
                              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(h)}>编辑</button>
                            )}
                            {/* Inline admin quick actions */}
                            {user?.role === 'admin' && h.status === 'pending' && (
                              <>
                                <button className="btn btn-success btn-sm" disabled={actionLoading} onClick={() => handleAction(approveHotel, h.id)}>通过</button>
                                <button className="btn btn-danger btn-sm" onClick={() => setViewHotel(h)}>拒绝</button>
                              </>
                            )}
                            {user?.role === 'admin' && h.status === 'approved' && (
                              <button className="btn btn-ghost btn-sm" disabled={actionLoading} onClick={() => handleAction(offlineHotel, h.id)}>下线</button>
                            )}
                            {user?.role === 'admin' && h.status === 'offline' && (
                              <button className="btn btn-success btn-sm" disabled={actionLoading} onClick={() => handleAction(onlineHotel, h.id)}>恢复</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && <HotelFormDrawer hotel={editHotel} onClose={closeForm} onSave={afterSave} />}
      {viewHotel && (
        <HotelDetailDrawer
          hotel={viewHotel}
          user={user}
          onClose={() => setViewHotel(null)}
          onAction={(thunk, ...args) => handleAction(thunk, ...args)}
        />
      )}
    </div>
  )
}
