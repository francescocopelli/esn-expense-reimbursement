import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const event_name = formData.get('event_name') as string
  const category = formData.get('category') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const receipt = formData.get('receipt') as File | null

  let receipt_url: string | null = null

  if (receipt && receipt.size > 0) {
    const ext = receipt.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, receipt)

    if (!uploadError) {
      const { data } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_url = data.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('expense_requests')
    .insert({ user_id: user.id, event_name, category, amount, description, receipt_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
