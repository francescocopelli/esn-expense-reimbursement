import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectExpenseFormClient from '@/components/ProjectExpenseFormClient'
import type { ExpenseCategory, Project } from '@/lib/types'

export default async function ProjectReimbursementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*, supervisors:project_supervisors(user_id, profiles(id, full_name)), allowed_categories:project_allowed_categories(category_name, max_amount)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!project) notFound()

  const p = project as Project

  // Build categories: if project has specific allowed_categories use those, else all global
  let categories: ExpenseCategory[] = []
  if (p.allowed_categories && p.allowed_categories.length > 0) {
    categories = p.allowed_categories.map((c: any, idx: number) => ({
      id: String(idx),
      name: c.category_name,
      max_amount: c.max_amount,
      created_at: '',
    }))
  } else {
    const { data: cats } = await supabase.from('expense_categories').select('id, name, max_amount, created_at').order('name')
    categories = cats ?? []
  }

  return (
    <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
        <Link href="/dashboard/projects" style={{ color: '#0d6efd', textDecoration: 'none' }}>
          ← Torna ai Progetti
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 style={{ margin: 0 }}>{p.name}</h2>
          {p.description && <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>{p.description}</p>}
          {p.supervisors && p.supervisors.length > 0 && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
              👤 Supervisori: {p.supervisors.map((s: any) => s.profiles?.full_name).filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ margin: 0 }}>Nuova Richiesta di Rimborso</h3></div>
        <div className="card-body">
          <ProjectExpenseFormClient projectId={p.id} projectName={p.name} categories={categories} />
        </div>
      </div>
    </div>
  )
}
