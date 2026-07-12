import { Status, STATUS_COLORS, STATUS_LABELS } from '@/lib/types'

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
    >
      {status === 'pending' && '⏳'} {status === 'approved' && '✅'} {status === 'rejected' && '❌'}
      {' '}{STATUS_LABELS[status]}
    </span>
  )
}
