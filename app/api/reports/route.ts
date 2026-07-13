import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { captureDbError } from '@/lib/sentry'

const RECEIPT_SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  Sentry.setUser({ id: user.id })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'POST /api/reports', step: 'formData_parse' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }

  const event_name = formData.get('event_name')?.toString().trim()
  const project_id  = formData.get('project_id')?.toString().trim() || null

  if (!event_name) return NextResponse.json({ error: 'Nome evento obbligatorio' }, { status: 400 })

  const itemCount = parseInt(formData.get('item_count')?.toString() ?? '0', 10)
  if (itemCount < 1) return NextResponse.json({ error: 'Inserisci almeno una voce di spesa' }, { status: 400 })

  if (project_id) {
    const { data: proj } = await supabase
      .from('projects').select('id, is_active').eq('id', project_id).single()
    if (!proj || !proj.is_active)
      return NextResponse.json({ error: 'Progetto non trovato o non attivo' }, { status: 400 })
  }

  let catMap = new Map<string, number | null>()
  if (project_id) {
    const { data: pac } = await supabase
      .from('project_allowed_categories').select('category_name, max_amount').eq('project_id', project_id)
    if (pac && pac.length > 0) {
      catMap = new Map(pac.map(c => [c.category_name, c.max_amount]))
    } else {
      const { data: validCats } = await supabase.from('expense_categories').select('name, max_amount')
      catMap = new Map((validCats ?? []).map(c => [c.name, c.max_amount]))
    }
  } else {
    const { data: validCats } = await supabase.from('expense_categories').select('name, max_amount')
    catMap = new Map((validCats ?? []).map(c => [c.name, c.max_amount]))
  }

  const { data: report, error: reportError } = await supabase
    .from('expense_reports')
    .insert({ user_id: user.id, event_name, report_number: '', project_id })
    .select().single()

  if (reportError || !report) {
    captureDbError('POST /api/reports insert expense_report', reportError, { userId: user.id, event_name })
    return NextResponse.json({ error: reportError?.message ?? 'Errore creazione rimborso' }, { status: 500 })
  }

  Sentry.addBreadcrumb({
    category: 'reports',
    message: `Report ${report.id} created`,
    level: 'info',
    data: { reportId: report.id, event_name, project_id, itemCount },
  })

  const itemErrors: string[] = []
  for (let i = 0; i < itemCount; i++) {
    const title    = formData.get(`items[${i}][title]`)?.toString().trim()
    const category = formData.get(`items[${i}][category]`)?.toString()
    const amount   = parseFloat(formData.get(`items[${i}][amount]`)?.toString() ?? '0')
    const note     = formData.get(`items[${i}][note]`)?.toString().trim() || null
    const file     = formData.get(`items[${i}][receipt]`) as File | null

    if (!title || !category || isNaN(amount) || amount <= 0) {
      itemErrors.push(`Voce ${i + 1}: campi obbligatori mancanti`); continue
    }
    if (!catMap.has(category)) {
      itemErrors.push(`Voce ${i + 1}: categoria "${category}" non valida per questo progetto`); continue
    }
    const maxAmt = catMap.get(category)
    if (maxAmt != null && amount > maxAmt) {
      itemErrors.push(`Voce ${i + 1}: importo €${amount.toFixed(2)} supera il limite di €${maxAmt.toFixed(2)} per "${category}"`); continue
    }

    let receipt_url: string | null = null
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) { itemErrors.push(`Voce ${i + 1}: file troppo grande (max 10 MB)`); continue }
      const ext  = file.name.split('.').pop() ?? 'bin'
      const path = `${user.id}/${report.id}/${i}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('receipts').upload(path, file, { contentType: file.type })
      if (uploadErr) {
        captureDbError(`POST /api/reports upload item ${i}`, uploadErr, { userId: user.id, reportId: report.id, path })
        itemErrors.push(`Voce ${i + 1}: upload fallito — ${uploadErr.message}`); continue
      }
      const { data: signedData, error: signErr } = await supabase.storage
        .from('receipts').createSignedUrl(path, RECEIPT_SIGNED_URL_EXPIRY)
      if (signErr || !signedData) {
        captureDbError(`POST /api/reports signedUrl item ${i}`, signErr, { path })
        itemErrors.push(`Voce ${i + 1}: impossibile generare URL ricevuta`); continue
      }
      receipt_url = signedData.signedUrl
    }

    const { error: itemErr } = await supabase
      .from('expense_items')
      .insert({ report_id: report.id, title, category, amount, note, receipt_url })
    if (itemErr) {
      captureDbError(`POST /api/reports insert item ${i}`, itemErr, { reportId: report.id })
      itemErrors.push(`Voce ${i + 1}: ${itemErr.message}`)
    }
  }

  if (itemErrors.length > 0)
    return NextResponse.json({ report, warnings: itemErrors }, { status: 207 })

  return NextResponse.json(report, { status: 201 })
}
