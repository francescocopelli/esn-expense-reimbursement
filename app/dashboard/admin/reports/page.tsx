import { createClient } from '@/lib/supabase/server'
import AdminReportsClient from '@/components/admin/AdminReportsClient'
import type { Status } from '@/lib/types'

interface AdminReport {
  id: string
  report_number: string
  event_name: string
  status: Status
  created_at: string
  updated_at: string
  board_note: string | null
  profiles: { full_name: string; section: string } | null
}

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('expense_reports')
    .select('id, report_number, event_name, status, created_at, updated_at, board_note, profiles(full_name, section)')
    .order('created_at', { ascending: false })

  // PostgREST restituisce il join FK come array; normalizziamo a oggetto | null
  const reports: AdminReport[] = (raw ?? []).map((r: any) => ({
    ...r,
    profiles: Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : r.profiles,
  }))

  const { data: sections } = await supabase
    .from('esn_sections').select('name').order('name')

  return (
    <AdminReportsClient
      initialReports={reports}
      sections={(sections ?? []).map((s: any) => s.name)}
    />
  )
}
