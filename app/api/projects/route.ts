import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { captureDbError } from '@/lib/sentry'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  Sentry.setUser({ id: user.id })

  const { data, error } = await supabase
    .from('projects')
    .select('*, supervisors:project_supervisors(user_id, profiles(id, full_name, section)), allowed_categories:project_allowed_categories(*)')
    .eq('is_active', true)
    .order('name')

  if (error) {
    captureDbError('GET /api/projects select', error, { userId: user.id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { data: profile } = await createAdminClient()
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  Sentry.setUser({ id: user.id })

  let body: unknown
  try { body = await request.json() } catch (err) {
    Sentry.captureException(err, { tags: { route: 'POST /api/projects', step: 'json_parse' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }

  const { name, description, supervisor_ids, allowed_categories } = body as any
  if (!name) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })

  const admin = createAdminClient()
  const { data: project, error: projErr } = await admin
    .from('projects').insert({ name, description }).select().single()

  if (projErr || !project) {
    captureDbError('POST /api/projects insert', projErr, { userId: user.id, name })
    return NextResponse.json({ error: projErr?.message ?? 'Errore creazione progetto' }, { status: 500 })
  }

  Sentry.addBreadcrumb({
    category: 'projects',
    message: `Project ${project.id} created: ${name}`,
    level: 'info',
    data: { projectId: project.id, name },
  })

  if (supervisor_ids?.length) {
    const { error: supErr } = await admin.from('project_supervisors')
      .insert(supervisor_ids.map((uid: string) => ({ project_id: project.id, user_id: uid })))
    if (supErr) captureDbError('POST /api/projects insert supervisors', supErr, { projectId: project.id })
  }

  if (allowed_categories?.length) {
    const { error: catErr } = await admin.from('project_allowed_categories')
      .insert(allowed_categories.map((c: any) => ({ project_id: project.id, ...c })))
    if (catErr) captureDbError('POST /api/projects insert allowed_categories', catErr, { projectId: project.id })
  }

  return NextResponse.json(project, { status: 201 })
}
