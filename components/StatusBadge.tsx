import { Status, STATUS_LABELS } from '@/lib/types'

const BADGE_CLASS: Record<Status, string> = {
  pending:  'bg-pending',
  approved: 'bg-approved',
  rejected: 'bg-rejected',
}

const BADGE_ICON: Record<Status, string> = {
  pending:  '⏳',
  approved: '✅',
  rejected: '❌',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge ${BADGE_CLASS[status]}`}>
      {BADGE_ICON[status]} {STATUS_LABELS[status]}
    </span>
  )
}
