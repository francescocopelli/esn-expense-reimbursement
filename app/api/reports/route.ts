import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const formData = await request.formData()
  const event_name = formData.get('event_name')?.toString().trim()
  if (!event_name) {
    return NextResponse.json({ error: 'Nome evento obbligatorio' }, { status: 400 })
  }

  // Parse items count
  const itemCount = parseInt(formData.get('item_count')?.toString() ?? '0', 10)
  if (itemCount < 1) {
    return NextResponse.json({ error: 'Inserisci almeno una voce di spesa' }, { status: 400 })
  }

  // 1. Create the report
  const { data: report, error: reportError } = await supabase
    .from('expense_reports')
    .insert({ user_id: user.id, event_name, report_number: '' })
    .select()
    .single()

  if (reportError || !report) {
    return NextResponse.json(
      { error: reportError?.message ?? 'Errore creazione rimborso' },
      { status: 500 }
    )
  }

  // 2. Create each item
  const itemErrors: string[] = []
  for (let i = 0; i < itemCount; i++) {
    const title    = formData.get(`items[${i}][title]`)?.toString().trim()
    const category = formData.get(`items[${i}][category]`)?.toString()
    const amount   = parseFloat(formData.get(`items[${i}][amount]`)?.toString() ?? '0')
    const file     = formData.get(`items[${i}][receipt]`) as File | null

    if (!title || !category || isNaN(amount) || amount <= 0) {
      itemErrors.push(`Voce ${i + 1}: campi obbligatori mancanti`)
      continue
    }

    let receipt_url: string | null = null
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        itemErrors.push(`Voce ${i + 1}: file troppo grande (max 10 MB)`)
        continue
      }
      const ext  = file.name.split('.').pop() ?? 'bin'
      const path = `${user.id}/${report.id}/${i}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(path, file, { contentType: file.type })
      if (uploadErr) {
        itemErrors.push(`Voce ${i + 1}: upload fallito — ${uploadErr.message}`)
        continue
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_url = urlData.publicUrl
    }

    const { error: itemErr } = await supabase
      .from('expense_items')
      .insert({ report_id: report.id, title, category, amount, receipt_url })

    if (itemErr) itemErrors.push(`Voce ${i + 1}: ${itemErr.message}`)
  }

  if (itemErrors.length > 0) {
    // Report was created but some items failed — return partial success with warnings
    return NextResponse.json(
      { report, warnings: itemErrors },
      { status: 207 }
    )
  }

  return NextResponse.json(report, { status: 201 })
}
