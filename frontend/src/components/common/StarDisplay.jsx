import { useState } from 'react'

export default function StarDisplay({ count }) {
  return (
    <span style={{ color: '#C9A84C', fontSize: 14 }}>
      {'★'.repeat(count || 0)}{'☆'.repeat(5 - (count || 0))}
    </span>
  )
}

export function StarSelector({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-selector">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" className="star-btn"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ color: n <= (hover || value) ? '#C9A84C' : '#DDD' }}
        >★</button>
      ))}
    </div>
  )
}
