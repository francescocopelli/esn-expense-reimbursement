export type Role = 'member' | 'board'
export type Status = 'pending' | 'approved' | 'rejected' | 'needs_info'
export type Category = 'Trasporti' | 'Catering' | 'Materiali' | 'Alloggio' | 'Altro'

export interface Profile {
  id: string
  full_name: string
  section: string
  role: Role
  created_at: string
  updated_at: string
}

/** Legacy */
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

export interface ExpenseItem {
  id: string
  report_id: string
  title: string
  category: Category
  amount: number
  note: string | null
  board_note: string | null
  receipt_url: string | null
  created_at: string
}

export interface ExpenseReport {
  id: string
  report_number: string
  user_id: string
  event_name: string
  status: Status
  board_note: string | null
  integration_note: string | null  // board message when sending back for integration
  reviewed_by: string | null
  created_at: string
  updated_at: string
  items?: ExpenseItem[]
  profiles?: Pick<Profile, 'id' | 'full_name' | 'section'>
}

export const CATEGORIES: Category[] = [
  'Trasporti', 'Catering', 'Materiali', 'Alloggio', 'Altro',
]

export const STATUS_LABELS: Record<Status, string> = {
  pending:    'In Attesa',
  approved:   'Approvata',
  rejected:   'Rifiutata',
  needs_info: 'Integrare',
}

export const STATUS_COLORS: Record<Status, string> = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:   'bg-green-100 text-green-800 border-green-200',
  rejected:   'bg-red-100 text-red-800 border-red-200',
  needs_info: 'bg-orange-100 text-orange-800 border-orange-200',
}
