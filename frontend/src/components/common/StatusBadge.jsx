const STATUS_MAP = {
  draft:    { label: '草稿',   cls: 'badge-draft' },
  pending:  { label: '待审核', cls: 'badge-pending' },
  approved: { label: '已发布', cls: 'badge-approved' },
  rejected: { label: '已拒绝', cls: 'badge-rejected' },
  offline:  { label: '已下线', cls: 'badge-offline' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft
  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge-dot" />
      {s.label}
    </span>
  )
}
