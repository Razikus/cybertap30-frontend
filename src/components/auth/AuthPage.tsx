// components/auth/AuthPage.tsx
'use client'

import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ResetPasswordForm from './ResetPasswordForm'

type AuthMode = 'login' | 'register' | 'resetPassword'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onSwitchToResetPassword={() => setMode('resetPassword')}
          />
        )
      case 'register':
        return (
          <RegisterForm
            onSwitchToLogin={() => setMode('login')}
          />
        )
      case 'resetPassword':
        return (
          <ResetPasswordForm
            onSwitchToLogin={() => setMode('login')}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {renderAuthForm()}
      </div>
    </div>
  )
}