import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const formData   = await request.formData()
  const event_name = formData.get('event_name')?.toString().trim()
  const category   = formData.get('category')?.toString()
  const amount     = parseFloat(formData.get('amount')?.toString() ?? '0')
  const description = formData.get('description')?.toString() || null
  const receipt    = formData.get('receipt') as File | null

  if (!event_name || !category || isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti o non validi (event_name, category, amount > 0)' },
      { status: 400 }
    )
  }

  let receipt_url: string | null = null

  if (receipt && receipt.size > 0) {
    if (receipt.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File troppo grande. Dimensione massima consentita: 10 MB.' },
        { status: 400 }
      )
    }

    const ext  = receipt.name.split('.').pop() ?? 'bin'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, receipt, { contentType: receipt.type })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload ricevuta fallito: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
    receipt_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('expense_requests')
    .insert({ user_id: user.id, event_name, category, amount, description, receipt_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
