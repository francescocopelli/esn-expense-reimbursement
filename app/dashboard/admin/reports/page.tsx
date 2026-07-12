import { createClient } from '@/lib/supabase/server'
import AdminReportsClient from '@/components/admin/AdminReportsClient'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('expense_reports')
    .select('id, report_number, event_name, status, created_at, updated_at, board_note, profiles(full_name, section)')
    .order('created_at', { ascending: false })

  const { data: sections } = await supabase
    .from('esn_sections').select('name').order('name')

  return (
    <AdminReportsClient
      initialReports={reports ?? []}
      sections={(sections ?? []).map(s => s.name)}
    />
  )
}
