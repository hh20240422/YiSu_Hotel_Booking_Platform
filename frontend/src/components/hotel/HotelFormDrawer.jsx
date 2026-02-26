import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createHotel, updateHotel, submitHotel } from '../../store/hotelsSlice'
import { addToast } from '../../store/uiSlice'
import { StarSelector } from '../common/StarDisplay'

const DEFAULT_ROOM = { name: '', price: '', discount_price: '', discount_desc: '', capacity: 2, area: '', bed_type: '大床', facilities: '' }
const BED_TYPES = ['大床', '双床', '豪华大床', '双人间']

export default function HotelFormDrawer({ hotel, onClose, onSave }) {
  const dispatch = useDispatch()
  const isEdit = !!hotel?.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name_cn: '', name_en: '', address: '', star_level: 3,
    open_date: '', phone: '', description: '',
    facilities: '', nearby_attractions: '',
    ...(hotel || {}),
    room_types: hotel?.room_types?.length
      ? hotel.room_types
      : [{ ...DEFAULT_ROOM, name: '标准间', price: '' }],
  })

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const updRoom = (i, k, v) => setForm(p => {
    const r = [...p.room_types]; r[i] = { ...r[i], [k]: v }; return { ...p, room_types: r }
  })
  const addRoom = () => setForm(p => ({ ...p, room_types: [...p.room_types, { ...DEFAULT_ROOM }] }))
  const removeRoom = i => setForm(p => ({ ...p, room_types: p.room_types.filter((_, idx) => idx !== i) }))

  async function handleSave(andSubmit = false) {
    if (!form.name_cn || !form.address) {
      dispatch(addToast({ msg: '请填写酒店名称和地址', type: 'error' })); return
    }
    if (form.room_types.some(r => !r.name || !r.price)) {
      dispatch(addToast({ msg: '请完整填写所有房型信息', type: 'error' })); return
    }
    setSaving(true)
    try {
      let id = hotel?.id
      if (isEdit) {
        await dispatch(updateHotel({ id, data: form })).unwrap()
      } else {
        const res = await dispatch(createHotel(form)).unwrap()
        id = res.id
      }
      if (andSubmit) {
        await dispatch(submitHotel(id)).unwrap()
        dispatch(addToast({ msg: '已提交审核', type: 'success' }))
      } else {
        dispatch(addToast({ msg: '保存成功', type: 'success' }))
      }
      onSave()
    } catch (err) {
      dispatch(addToast({ msg: err.message || '保存失败', type: 'error' }))
    }
    setSaving(false)
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{isEdit ? '编辑酒店信息' : '录入新酒店'}</div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <SectionLabel>基础信息</SectionLabel>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <Field label="酒店名称（中文）" required>
              <input value={form.name_cn} onChange={upd('name_cn')} placeholder="如：北京丽思卡尔顿酒店" />
            </Field>
            <Field label="酒店名称（英文）">
              <input value={form.name_en} onChange={upd('name_en')} placeholder="如：The Ritz-Carlton Beijing" />
            </Field>
            <Field label="酒店地址" required className="full">
              <input value={form.address} onChange={upd('address')} placeholder="请输入完整地址" />
            </Field>
            <Field label="酒店星级">
              <StarSelector value={form.star_level} onChange={v => setForm(p => ({ ...p, star_level: v }))} />
            </Field>
            <Field label="开业时间">
              <input type="date" value={form.open_date} onChange={upd('open_date')} />
            </Field>
            <Field label="联系电话">
              <input value={form.phone} onChange={upd('phone')} placeholder="前台电话" />
            </Field>
            <Field label="酒店简介" className="full">
              <textarea value={form.description} onChange={upd('description')} placeholder="酒店特色、服务介绍..." rows={3} />
            </Field>
            <Field label="配套设施">
              <input value={form.facilities} onChange={upd('facilities')} placeholder="如：游泳池、健身中心、停车场" />
            </Field>
            <Field label="周边景点/交通">
              <input value={form.nearby_attractions} onChange={upd('nearby_attractions')} placeholder="如：故宫(1km)、地铁1号线" />
            </Field>
          </div>

          <div className="section-divider" />
          <SectionLabel extra={<button className="btn btn-ghost btn-sm" type="button" onClick={addRoom}>+ 添加房型</button>}>
            房型价格
          </SectionLabel>

          {form.room_types.map((room, i) => (
            <div className="room-row" key={i}>
              <div className="room-row-header">
                <div className="room-row-title">房型 #{i + 1}</div>
                {form.room_types.length > 1 && (
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removeRoom(i)}>删除</button>
                )}
              </div>
              <div className="form-grid three">
                <Field label="房型名称" required>
                  <input value={room.name} onChange={e => updRoom(i, 'name', e.target.value)} placeholder="如：豪华大床房" />
                </Field>
                <Field label="原价(元/晚)" required>
                  <input type="number" value={room.price} onChange={e => updRoom(i, 'price', e.target.value)} placeholder="如：888" />
                </Field>
                <Field label="优惠价(元/晚)">
                  <input type="number" value={room.discount_price} onChange={e => updRoom(i, 'discount_price', e.target.value)} placeholder="如：699" />
                </Field>
                <Field label="床型">
                  <select value={room.bed_type} onChange={e => updRoom(i, 'bed_type', e.target.value)}>
                    {BED_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="入住人数">
                  <select value={room.capacity} onChange={e => updRoom(i, 'capacity', Number(e.target.value))}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}人</option>)}
                  </select>
                </Field>
                <Field label="面积(m²)">
                  <input type="number" value={room.area} onChange={e => updRoom(i, 'area', e.target.value)} placeholder="如：38" />
                </Field>
                <Field label="优惠说明" className="full">
                  <input value={room.discount_desc} onChange={e => updRoom(i, 'discount_desc', e.target.value)} placeholder="如：节日特惠8折 / 机票+酒店套餐减200元" />
                </Field>
                <Field label="房型设施" className="full">
                  <input value={room.facilities} onChange={e => updRoom(i, 'facilities', e.target.value)} placeholder="如：免费WiFi、空调、电视、浴缸" />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving}>保存草稿</button>
          <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? '提交中...' : '保存并提交审核'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Local helper components ───────────────────────────────────────────────────
function SectionLabel({ children, extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>{children}</div>
      {extra}
    </div>
  )
}

function Field({ label, required, className, children }) {
  return (
    <div className={`form-group${className ? ` ${className}` : ''}`}>
      <label>{label}{required && <span className="req"> *</span>}</label>
      {children}
    </div>
  )
}
