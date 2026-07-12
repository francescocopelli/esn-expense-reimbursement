export type Role = 'member' | 'board'
export type Status = 'pending' | 'approved' | 'rejected'
export type Category = 'Trasporti' | 'Catering' | 'Materiali' | 'Alloggio' | 'Altro'

export interface Profile {
  id: string
  full_name: string
  section: string
  role: Role
  created_at: string
  updated_at: string
}

/** Legacy — mantenuto per backward compat con expense_requests */
export interface ExpenseRequest {
  id: string
  user_id: string
  event_name: string
  category: Category
  amount: number
  description: string | null
  receipt_url: string | null
  status: Status
  board_note: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface ExpenseRequestWithProfile extends ExpenseRequest {
  profiles: Profile
}

// ============================================================
// NEW: Expense Reports + Items
// ============================================================

export interface ExpenseItem {
  id: string
  report_id: string
  title: string
  category: Category
  amount: number
  receipt_url: string | null
  created_at: string
}

export interface ExpenseReport {
  id: string
  report_number: string   // ESN-YYYY-NNNN
  user_id: string
  event_name: string
  status: Status
  board_note: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  // joined
  items?: ExpenseItem[]
  profiles?: Pick<Profile, 'id' | 'full_name' | 'section'>
}

export const CATEGORIES: Category[] = [
  'Trasporti',
  'Catering',
  'Materiali',
  'Alloggio',
  'Altro',
]

export const STATUS_LABELS: Record<Status, string> = {
  pending: 'In Attesa',
  approved: 'Approvata',
  rejected: 'Rifiutata',
}

export const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}
