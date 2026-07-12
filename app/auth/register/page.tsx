import RegisterForm from '@/components/forms/RegisterForm'

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">ESN Rimborsi</h1>
          <p className="text-gray-500 mt-2">Crea il tuo account</p>
        </div>
        <RegisterForm />
      </div>
    </main>
  )
}
