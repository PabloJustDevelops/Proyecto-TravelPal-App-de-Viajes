import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}