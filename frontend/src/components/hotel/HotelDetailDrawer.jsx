import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { approveHotel, rejectHotel, offlineHotel, onlineHotel, submitHotel } from '../../store/hotelsSlice'
import StatusBadge from '../common/StatusBadge'
import StarDisplay from '../common/StarDisplay'

export default function HotelDetailDrawer({ hotel, user, onClose, onAction }) {
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const rooms = [...(hotel.room_types || [])].sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price))
  const minPrice = rooms.length ? Math.min(...rooms.map(r => r.discount_price || r.price)) : null

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{hotel.name_cn}</div>
            {hotel.name_en && <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>{hotel.name_en}</div>}
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <StatusBadge status={hotel.status} />
            <StarDisplay count={hotel.star_level} />
            {minPrice && (
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-dim)' }}>
                ¥{minPrice}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-light)' }}>/晚起</span>
              </span>
            )}
          </div>

          {hotel.status === 'rejected' && hotel.reject_reason && (
            <div className="reject-reason-box"><strong>拒绝原因：</strong>{hotel.reject_reason}</div>
          )}

          <div className="form-grid" style={{ marginBottom: 8 }}>
            {[
              ['地址', hotel.address],
              ['联系电话', hotel.phone || '—'],
              ['开业时间', hotel.open_date || '—'],
              ['所属商户', hotel.merchant_name],
            ].map(([label, val]) => (
              <div key={label} className="hotel-detail-section">
                <div className="detail-label">{label}</div>
                <div className="detail-value">{val}</div>
              </div>
            ))}
            <div className="hotel-detail-section" style={{ gridColumn: '1/-1' }}>
              <div className="detail-label">酒店简介</div>
              <div className="detail-value">{hotel.description || '—'}</div>
            </div>
            <div className="hotel-detail-section">
              <div className="detail-label">配套设施</div>
              <div className="detail-value">{hotel.facilities || '—'}</div>
            </div>
            <div className="hotel-detail-section">
              <div className="detail-label">周边景点/交通</div>
              <div className="detail-value">{hotel.nearby_attractions || '—'}</div>
            </div>
          </div>

          {rooms.length > 0 && (
            <>
              <div className="section-divider" />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>房型价格</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>房型</th><th>床型</th><th>人数</th><th>面积</th><th>价格</th><th>优惠说明</th></tr></thead>
                  <tbody>
                    {rooms.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.bed_type}</td>
                        <td>{r.capacity}人</td>
                        <td>{r.area ? `${r.area}㎡` : '—'}</td>
                        <td>
                          {r.discount_price
                            ? <><span style={{ fontWeight: 700, color: 'var(--red)' }}>¥{r.discount_price}</span>{' '}<span style={{ textDecoration: 'line-through', color: 'var(--ink-light)', fontSize: 11 }}>¥{r.price}</span></>
                            : <span style={{ fontWeight: 700 }}>¥{r.price}</span>}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--ink-light)' }}>{r.discount_desc || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
          {user.role === 'merchant' && ['draft', 'rejected', 'offline'].includes(hotel.status) && (
            <button className="btn btn-primary" onClick={() => onAction(submitHotel, hotel.id)}>
              {hotel.status === 'rejected' ? '重新提交' : hotel.status === 'offline' ? '修改后提交审核' : '提交审核'}
            </button>
          )}
          {user.role === 'admin' && hotel.status === 'pending' && (
            <>
              <button className="btn btn-danger" onClick={() => setRejectModal(true)}>拒绝</button>
              <button className="btn btn-success" onClick={() => onAction(approveHotel, hotel.id)}>审核通过</button>
            </>
          )}
          {user.role === 'admin' && hotel.status === 'approved' && (
            <button className="btn btn-ghost" onClick={() => onAction(offlineHotel, hotel.id)}>下线</button>
          )}
          {user.role === 'admin' && hotel.status === 'offline' && (
            <button className="btn btn-success" onClick={() => onAction(onlineHotel, hotel.id)}>恢复上线</button>
          )}
        </div>
      </div>

      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">填写拒绝原因</div>
            <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="请说明拒绝原因，帮助商户改进..." style={{ width: '100%' }} />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRejectModal(false)}>取消</button>
              <button className="btn btn-danger" disabled={!rejectReason.trim()}
                onClick={() => { onAction(rejectHotel, { id: hotel.id, reason: rejectReason }); setRejectModal(false) }}>
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
