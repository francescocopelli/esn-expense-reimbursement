import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Member uploads new receipts for specific items and resubmits the report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { id } = await params

  // Verify the report belongs to this user and is needs_info
  const { data: report } = await supabase
    .from('expense_reports')
    .select('id, user_id, status')
    .eq('id', id)
    .single()

  if (!report || report.user_id !== user.id)
    return NextResponse.json({ error: 'Rimborso non trovato' }, { status: 404 })

  if (report.status !== 'needs_info')
    return NextResponse.json({ error: 'Il rimborso non è in stato da integrare' }, { status: 400 })

  const formData = await request.formData()
  const itemCount = parseInt(formData.get('item_count')?.toString() ?? '0', 10)
  const warnings: string[] = []

  for (let i = 0; i < itemCount; i++) {
    const itemId = formData.get(`items[${i}][id]`)?.toString()
    const note   = formData.get(`items[${i}][note]`)?.toString().trim() || null
    const file   = formData.get(`items[${i}][receipt]`) as File | null

    if (!itemId) continue

    const updates: Record<string, unknown> = {}
    if (note !== null) updates.note = note

    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        warnings.push(`Voce ${i + 1}: file troppo grande`)
        continue
      }
      const ext  = file.name.split('.').pop() ?? 'bin'
      const path = `${user.id}/${id}/${itemId}_resubmit.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('receipts').upload(path, file, { contentType: file.type, upsert: true })
      if (uploadErr) {
        warnings.push(`Voce ${i + 1}: upload fallito — ${uploadErr.message}`)
        continue
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      updates.receipt_url = urlData.publicUrl
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('expense_items').update(updates).eq('id', itemId).eq('report_id', id)
    }
  }

  // Set report back to pending and clear integration_note
  const { error: updateErr } = await supabase
    .from('expense_reports')
    .update({ status: 'pending', integration_note: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  if (warnings.length > 0)
    return NextResponse.json({ ok: true, warnings }, { status: 207 })

  return NextResponse.json({ ok: true })
}
