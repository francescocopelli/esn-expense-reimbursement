import type { Status } from '@/lib/types'

const CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  pending:    { label: 'In Attesa',  bg: '#fff3cd', color: '#856404' },
  approved:   { label: 'Approvata', bg: '#d1e7dd', color: '#0f5132' },
  rejected:   { label: 'Rifiutata', bg: '#f8d7da', color: '#842029' },
  needs_info: { label: 'Integrare', bg: '#ffe5cc', color: '#a04000' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, bg, color } = CONFIG[status] ?? CONFIG.pending
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: 12, padding: '2px 10px',
      fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
