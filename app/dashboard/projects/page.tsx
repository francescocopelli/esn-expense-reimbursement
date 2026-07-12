import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Project } from '@/lib/types'
import { formatDateIT } from '@/lib/types'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, supervisors:project_supervisors(user_id, profiles(id, full_name)), allowed_categories:project_allowed_categories(category_name, max_amount)')
    .eq('is_active', true)
    .order('name')

  const rows = (projects ?? []) as Project[]

  return (
    <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Progetti</h1>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: '#6c757d', padding: '3rem' }}>
            Nessun progetto attivo al momento.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {rows.map(p => (
            <div key={p.id} className="card">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem', fontSize: '0.8rem', color: '#6c757d' }}>
                  {p.start_date && (
                    <span>📅 {formatDateIT(p.start_date)}{p.end_date ? ` → ${formatDateIT(p.end_date)}` : ''}</span>
                  )}
                  {p.budget != null && (
                    <span>Budget: €{Number(p.budget).toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="card-body">
                {p.description && (
                  <p style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{p.description}</p>
                )}
                {p.supervisors && p.supervisors.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                    👤 Supervisori: {p.supervisors.map((s: any) => s.profiles?.full_name).filter(Boolean).join(', ')}
                  </p>
                )}
                {p.allowed_categories && p.allowed_categories.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: '0 0 0.25rem' }}>Categorie rimborsabili:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {p.allowed_categories.map((c: any) => (
                        <span key={c.category_name} style={{ background: '#e9ecef', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem' }}>
                          {c.category_name}{c.max_amount != null ? ` (max €${Number(c.max_amount).toFixed(0)})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Link href={`/dashboard/projects/${p.id}`} className="btn btn-esn-cyan" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  📤 Chiedi Rimborso
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
