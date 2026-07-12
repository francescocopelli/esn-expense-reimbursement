export type Role   = 'member' | 'board' | 'admin'
export type Status = 'pending' | 'approved' | 'rejected' | 'needs_info'
export type Category = string  // dynamic from expense_categories table

export interface Profile {
  id: string
  full_name: string
  section: string
  role: Role
  created_at: string
  updated_at: string
}

export interface EsnSection {
  id: string
  name: string
  created_at: string
}

export interface ExpenseCategory {
  id: string
  name: string
  max_amount: number | null
  created_at: string
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
  project_id: string | null
  status: Status
  board_note: string | null
  integration_note: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  items?: ExpenseItem[]
  profiles?: Pick<Profile, 'id' | 'full_name' | 'section'>
}

export interface Project {
  id: string
  name: string
  description: string | null
  budget: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  supervisors?: ProjectSupervisor[]
  allowed_categories?: ProjectAllowedCategory[]
}

export interface ProjectSupervisor {
  project_id: string
  user_id: string
  assigned_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'section'>
}

export interface ProjectAllowedCategory {
  id: string
  project_id: string
  category_name: string
  max_amount: number | null
}

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
