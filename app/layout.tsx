import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ESN Rimborsi | Online Reimbursement System',
  description: 'Sistema di gestione rimborsi spese ESN Italy',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <div className="esn-colorful-strip" />
        {children}
      </body>
    </html>
  )
}
