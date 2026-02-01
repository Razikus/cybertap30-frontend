// src/lib/auth.tsx - Poprawiona wersja z lepszą obsługą błędów
import { AuthClient } from '@supabase/auth-js'

const GOTRUE_URL = 'https://cybertap.razniewski.eu/auth'

export const auth = new AuthClient({ 
  url: GOTRUE_URL,
  autoRefreshToken: true,
  persistSession: true
})

// Typy dla lepszego TypeScript support
export interface SignUpData {
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
}

// Funkcja do tłumaczenia błędów na język polski
const translateAuthError = (error: any): string => {
  if (!error) return 'Nieznany błąd'

  const message = error.message || error.error_description || error.error || ''

  // Najpopularniejsze błędy autoryzacji
  switch (message) {
    case 'Invalid login credentials':
    case 'Invalid email or password':
      return 'Nieprawidłowy email lub hasło'
    
    case 'Email not confirmed':
      return 'Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.'
    
    case 'User not found':
      return 'Użytkownik nie istnieje'
    
    case 'Password should be at least 6 characters':
      return 'Hasło musi mieć co najmniej 6 znaków'
    
    case 'User already registered':
      return 'Użytkownik o tym adresie email już istnieje'
    
    case 'Email address is invalid':
      return 'Nieprawidłowy adres email'
    
    case 'Signup is disabled':
      return 'Rejestracja jest obecnie wyłączona'
    
    case 'Too many requests':
      return 'Za dużo prób. Spróbuj ponownie za chwilę.'
    
    case 'Network error':
      return 'Błąd połączenia. Sprawdź połączenie internetowe.'

    case 'Failed to fetch':
      return 'Nie można połączyć się z serwerem autoryzacji. Sprawdź czy serwer działa.'
    
    default:
      // Jeśli błąd zawiera znane fragmenty
      if (message.includes('password')) {
        return 'Problem z hasłem. Sprawdź czy hasło jest prawidłowe.'
      }
      if (message.includes('email')) {
        return 'Problem z adresem email. Sprawdź czy email jest prawidłowy.'
      }
      if (message.includes('network') || message.includes('fetch')) {
        return 'Błąd połączenia z serwerem'
      }
      
      // W ostateczności zwróć oryginalny błąd
      return message || 'Wystąpił nieoczekiwany błąd'
  }
}

// Helper functions z lepszą obsługą błędów
export const authHelpers = {
  // Rejestracja
  async signUp({ email, password }: SignUpData) {
    try {
      const { data, error } = await auth.signUp({
        email,
        password,
      })
      
      if (error) {
        return { 
          data, 
          error: { 
            ...error, 
            message: translateAuthError(error) 
          } 
        }
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('SignUp error:', err)
      return { 
        data: null, 
        error: { 
          message: translateAuthError(err) 
        } 
      }
    }
  },

  // Logowanie
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { 
          data, 
          error: { 
            ...error, 
            message: translateAuthError(error) 
          } 
        }
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('SignIn error:', err)
      return { 
        data: null, 
        error: { 
          message: translateAuthError(err) 
        } 
      }
    }
  },

  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return {
          data,
          error: {
            ...error,
            message: translateAuthError(error)
          }
        }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Update password error:', err)
      return {
        data: null,
        error: {
          message: translateAuthError(err)
        }
      }
    }
  },

  // Wylogowanie
  async signOut() {
    try {
      const { error } = await auth.signOut({ scope: 'local' })
      
      if (error) {
        return { 
          error: { 
            ...error, 
            message: translateAuthError(error) 
          } 
        }
      }
      
      return { error: null }
    } catch (err) {
      console.error('SignOut error:', err)
      return { 
        error: { 
          message: translateAuthError(err) 
        } 
      }
    }
  },

  // Reset hasła
  async resetPassword({ email }: ResetPasswordData) {
    try {
      const { data, error } = await auth.resetPasswordForEmail(email)
      
      if (error) {
        return { 
          data, 
          error: { 
            ...error, 
            message: translateAuthError(error) 
          } 
        }
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('Reset password error:', err)
      return { 
        data: null, 
        error: { 
          message: translateAuthError(err) 
        } 
      }
    }
  },

  // Pobierz aktualnego użytkownika
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await auth.getUser()
      
      if (error) {
        return { 
          user: null, 
          error: { 
            ...error, 
            message: translateAuthError(error) 
          } 
        }
      }
      
      return { user, error: null }
    } catch (err) {
      console.error('Get current user error:', err)
      return { 
        user: null, 
        error: { 
          message: translateAuthError(err) 
        } 
      }
    }
  },

  // Pobierz sesję
  async getSession() {
    try {
      const { data: { session }, error } = await auth.getSession()
      
      if (error) {
        return { 
          session: null, 
          error: { 
            ...error, 
            message: translateAuthError(error) 
          } 
        }
      }
      
      return { session, error: null }
    } catch (err) {
      console.error('Get session error:', err)
      return { 
        session: null, 
        error: { 
          message: translateAuthError(err) 
        } 
      }
    }
  },

  // Nasłuchiwanie zmian autoryzacji
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return auth.onAuthStateChange(callback)
  }
}