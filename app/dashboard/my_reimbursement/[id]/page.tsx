import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ResubmitPanel from '@/components/ResubmitPanel'
import type { ExpenseCategory } from '@/lib/types'

export default async function MyReimbursementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: report }, { data: cats }] = await Promise.all([
    supabase
      .from('expense_reports')
      .select('*, items:expense_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('expense_categories')
      .select('id, name, max_amount, created_at')
      .order('name'),
  ])

  if (!report) notFound()

  const categories: ExpenseCategory[] = cats ?? []
  const catMap = new Map(categories.map(c => [c.name, c.max_amount]))

  const items = report.items ?? []

  // Compute totals
  const totalRequested = items.reduce((sum: number, item: { amount: number }) => sum + Number(item.amount), 0)

  // For each item: covered = min(amount, max_amount ?? amount)
  const totalCovered = items.reduce((sum: number, item: { amount: number; category: string }) => {
    const max = catMap.get(item.category)
    const covered = max != null ? Math.min(Number(item.amount), max) : Number(item.amount)
    return sum + covered
  }, 0)

  const totalCharge = totalRequested - totalCovered
  const hasExcess = totalCharge > 0.005

  return (
    <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
        <Link href="/dashboard/my_reimbursement" style={{ color: '#0d6efd', textDecoration: 'none' }}>
          ← Torna ai miei rimborsi
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0 }}>{report.event_name}</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: 4 }}>{report.report_number}</code>
              {' · '}{new Date(report.created_at).toLocaleDateString('it-IT')}
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3 style={{ margin: 0 }}>Voci di Spesa</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Titolo</th><th>Categoria</th><th>Nota</th>
                <th style={{ textAlign: 'right' }}>Importo</th>
                <th style={{ textAlign: 'right' }}>Coperto</th>
                <th style={{ textAlign: 'center' }}>Ricevuta</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => {
                const max = catMap.get(item.category)
                const covered = max != null ? Math.min(Number(item.amount), max) : Number(item.amount)
                const excess = Number(item.amount) - covered
                return (
                  <tr key={item.id}>
                    <td style={{ color: '#6c757d' }}>{idx + 1}</td>
                    <td><strong>{item.title}</strong></td>
                    <td>
                      <span style={{ background: '#e9ecef', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{item.category}</span>
                      {max != null && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#6c757d', marginTop: 2 }}>max €{Number(max).toFixed(2)}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#495057' }}>
                      {item.note || <span style={{ color: '#aaa' }}>—</span>}
                      {item.board_note && (
                        <div style={{ marginTop: '0.25rem', background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 6, padding: '3px 8px', fontSize: '0.8rem', color: '#5a3000' }}>
                          <strong>Revisore:</strong> {item.board_note}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      €{Number(item.amount).toFixed(2)}
                      {excess > 0.005 && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#fd7e14', fontWeight: 400 }}>+€{excess.toFixed(2)} a carico tuo</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: covered < Number(item.amount) ? '#fd7e14' : '#198754', fontWeight: 600 }}>
                      €{covered.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.receipt_url
                        ? <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0d6efd', textDecoration: 'none' }}>📎 Apri</a>
                        : <span style={{ color: '#aaa' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', fontWeight: 700 }}>
                <td colSpan={4} style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>Totale richiesto</td>
                <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '1.05rem', color: '#0d6efd' }}>€{totalRequested.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '1.05rem', color: '#198754' }}>€{totalCovered.toFixed(2)}</td>
                <td />
              </tr>
              {hasExcess && (
                <>
                  <tr style={{ background: '#fff8f0' }}>
                    <td colSpan={4} style={{ textAlign: 'right', padding: '0.4rem 1rem', fontSize: '0.9rem', color: '#a04000' }}>
                      💰 Rimborso coperto dall’organizzazione
                    </td>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '0.4rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#198754' }}>
                      €{totalCovered.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                  <tr style={{ background: '#fff3e0', borderTop: '2px solid #fd7e14' }}>
                    <td colSpan={4} style={{ textAlign: 'right', padding: '0.4rem 1rem', fontSize: '0.9rem', color: '#a04000' }}>
                      ⚠️ Differenza a carico del richiedente
                    </td>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '0.4rem 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#fd7e14' }}>
                      €{totalCharge.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {report.status !== 'needs_info' && report.board_note && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
          <strong>Nota dal board:</strong> {report.board_note}
        </div>
      )}

      {report.status === 'needs_info' && (
        <ResubmitPanel
          reportId={report.id}
          integrationNote={report.integration_note ?? ''}
          items={items}
        />
      )}
    </div>
  )
}
