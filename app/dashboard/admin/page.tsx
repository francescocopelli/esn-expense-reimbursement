import { createClient } from '@/lib/supabase/server'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [{ count: totalUsers }, { count: totalReports }, { count: pending }, { count: sections }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('expense_reports').select('*', { count: 'exact', head: true }),
      supabase.from('expense_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('esn_sections').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { label: 'Utenti registrati',   value: totalUsers  ?? 0, color: 'esn-cyan' },
    { label: 'Rimborsi totali',     value: totalReports ?? 0, color: 'esn-dark-blue' },
    { label: 'In attesa revisione', value: pending      ?? 0, color: 'esn-orange' },
    { label: 'Sezioni ESN',         value: sections     ?? 0, color: 'esn-purple' },
  ]

  return (
    <>
      <h1 className="page-title">Pannello Admin</h1>
      <div className="grid md:grid-cols-4" style={{ marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-card-label">{s.label}</span>
            <span className={`stat-card-value ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2">
        <a href="/dashboard/admin/users" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-body">
            <h3 style={{ margin: '0 0 0.5rem', color: '#6f42c1' }}>👥 Gestione Utenti</h3>
            <p className="text-muted" style={{ margin: 0 }}>Modifica ruoli, cerca per nome o sezione.</p>
          </div>
        </a>
        <a href="/dashboard/admin/sections" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-body">
            <h3 style={{ margin: '0 0 0.5rem', color: '#6f42c1' }}>🌍 Sezioni ESN</h3>
            <p className="text-muted" style={{ margin: 0 }}>Aggiungi o rimuovi sezioni disponibili al momento della registrazione.</p>
          </div>
        </a>
        <a href="/dashboard/admin/categories" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-body">
            <h3 style={{ margin: '0 0 0.5rem', color: '#6f42c1' }}>🏷️ Categorie di Spesa</h3>
            <p className="text-muted" style={{ margin: 0 }}>Aggiungi categorie e imposta importi massimi rimborsabili.</p>
          </div>
        </a>
        <a href="/dashboard/admin/reports" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-body">
            <h3 style={{ margin: '0 0 0.5rem', color: '#6f42c1' }}>📄 Report Globale</h3>
            <p className="text-muted" style={{ margin: 0 }}>Visualizza tutti i rimborsi di tutte le sezioni ed esporta CSV.</p>
          </div>
        </a>
      </div>
    </>
  )
}
