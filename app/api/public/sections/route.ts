import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Public endpoint — needed at registration time (no auth yet)
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('esn_sections')
    .select('id, name')
    .order('name')
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}
