import { createClient } from '@/lib/supabase/server'
import SectionsClient from '@/components/admin/SectionsClient'

export default async function AdminSectionsPage() {
  const supabase = await createClient()
  const { data: sections } = await supabase
    .from('esn_sections').select('*').order('name')

  return <SectionsClient initialSections={sections ?? []} />
}
