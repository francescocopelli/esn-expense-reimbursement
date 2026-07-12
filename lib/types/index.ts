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
  // joined fields
  profiles?: Profile
}

export interface ExpenseRequestWithProfile extends ExpenseRequest {
  profiles: Profile
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
