import LoginForm from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">ESN Rimborsi</h1>
          <p className="text-gray-500 mt-2">Sistema di gestione rimborsi spese</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
