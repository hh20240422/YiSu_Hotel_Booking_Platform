import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeToast } from '../../store/uiSlice'

export default function Toast() {
  const dispatch = useDispatch()
  const toasts = useSelector(state => state.ui.toasts)

  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => dispatch(removeToast(toasts[0].id)), 3000)
    return () => clearTimeout(timer)
  }, [toasts, dispatch])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}
