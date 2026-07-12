# Supabase Setup — ESN Expense Reimbursement

## Disabilitare la conferma email (sviluppo / test)

Il piano gratuito di Supabase limita l'invio di email a **3-4/ora**.
Per evitare errori `email rate limit exceeded` durante lo sviluppo:

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Apri il tuo progetto
3. Vai su **Authentication** → **Providers** → **Email**
4. **Disattiva** l'opzione **"Confirm email"**
5. Salva

Dopo questa modifica, la registrazione crea immediatamente la sessione e
l'utente viene reindirizzato alla dashboard senza dover cliccare alcun link.

---

## SMTP personalizzato (produzione)

Per la produzione configura un provider SMTP esterno con limiti elevati:

1. Vai su **Project Settings** → **Authentication** → **SMTP Settings**
2. Abilita **Custom SMTP**
3. Inserisci le credenziali del tuo provider (es. [Resend](https://resend.com), SendGrid, Brevo)

### Esempio con Resend
| Campo | Valore |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` |
| User | `resend` |
| Password | `re_xxxxxxxxxxxx` (API key Resend) |
| Sender email | `noreply@tuo-dominio.it` |

---

## Variabili d'ambiente richieste

Crea un file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
