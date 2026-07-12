import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Public endpoint — no auth required (categories are not sensitive)
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_categories')
    .select('id, name, max_amount')
    .order('name')
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}
