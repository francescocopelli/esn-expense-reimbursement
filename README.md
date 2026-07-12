# ESN Expense Reimbursement System

> Sistema di gestione rimborsi spese per le sezioni ESN Italy — deployabile in un click su Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrancescocopelli%2Fesn-expense-reimbursement&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Supabase%20project%20credentials&project-name=esn-expense-reimbursement)

## Il Problema che Risolve

Nelle sezioni ESN, i membri organizzano eventi e anticipano spese (trasporti, materiali, catering, ecc.) che poi devono essere rimborsate dal board. Senza uno strumento dedicato, questo processo è caotico: scontrini inviati in chat, approvazioni verbali, nessuna tracciabilità.

Questo progetto fornisce un flusso strutturato e tracciabile per la gestione dei rimborsi.

## Funzionalità

### 👤 Membro
- Invio richiesta di rimborso con allegato della ricevuta
- Monitoraggio stato: `In Attesa`, `Approvata`, `Rifiutata`
- Visualizzazione note del board

### 🏛️ Board
- Vista centralizzata di tutte le richieste
- Approvazione/rifiuto con nota opzionale
- Report aggregato per evento e categoria
- Gestione utenti e ruoli

## Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| UI | Tailwind CSS + shadcn/ui |
| Deploy | Vercel |

## Setup in 3 Passi

### 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Nel **SQL Editor**, esegui il file `supabase/migrations/001_initial_schema.sql`
3. In **Storage**, crea un bucket pubblico chiamato `receipts`
4. Copia le credenziali da **Project Settings > API**

### 2. Variabili d'Ambiente

Crea un file `.env.local` nella root del progetto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Avvia in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Deploy su Vercel

Clicca il bottone **Deploy with Vercel** in cima a questo README, inserisci le 3 variabili d'ambiente e il sistema è operativo.

## Struttura del Progetto

```
/app
  /auth/           → login & registrazione
  /dashboard/
    /member/       → vista membro (invio richieste, storico)
    /board/        → vista board (tutte le richieste, report)
  /api/requests/   → API routes
/components
  /ui/             → shadcn/ui components
  /forms/          → form rimborso e auth
  /tables/         → tabelle con badge di stato
/lib
  /supabase/       → client, server helper, middleware
  /types/          → TypeScript types
/supabase
  /migrations/     → SQL schema
```

## Categorie Spese

- 🚌 Trasporti
- 🍽️ Catering
- 📦 Materiali
- 🏨 Alloggio
- 📋 Altro

## Licenza

MIT — Progetto open source per le sezioni ESN Italy.
