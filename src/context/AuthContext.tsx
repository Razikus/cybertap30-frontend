// context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth, authHelpers } from '@/lib/auth'
import { User, Session } from '@supabase/auth-js'
import { apiClient, UserInfo } from '@/lib/apiClient'

interface AuthContextType {
  user: User | null
  session: Session | null
  userInfo: UserInfo[] | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
  refreshUserInfo: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasInitialRedirect, setHasInitialRedirect] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const updatePassword = async (newPassword: string) => {
    return await authHelpers.updatePassword(newPassword)
  }

  const fetchUserInfo = async (currentSession: Session, shouldRedirect: boolean = false) => {
    try {
      const info = await apiClient.getMe(currentSession)
      setUserInfo(info)
      
      // Only redirect if:
      // 1. shouldRedirect is true (initial login)
      // 2. User is not already on an organization page
      // 3. We haven't done initial redirect yet
      if (shouldRedirect && info && info.length > 0 && !hasInitialRedirect) {
        const isOnOrgPage = pathname.match(/^\/\d+/)
        if (!isOnOrgPage) {
          const firstOrgId = info[0].org_id
          router.push(`/${firstOrgId}`)
          setHasInitialRedirect(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      setUserInfo(null)
    }
  }

  const refreshUserInfo = async () => {
    if (session) {
      await fetchUserInfo(session, false) // Never redirect on manual refresh
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { session } = await authHelpers.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Check if user is already on organization page
        const isOnOrgPage = pathname.match(/^\/\d+/)
        await fetchUserInfo(session, !isOnOrgPage) // Only redirect if not on org page
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = authHelpers.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // On auth state change, only redirect if it's a new login
          const shouldRedirect = event === 'SIGNED_IN' && !hasInitialRedirect
          await fetchUserInfo(session, shouldRedirect)
        } else {
          setUserInfo(null)
          setHasInitialRedirect(false) // Reset redirect flag on logout
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [pathname]) // Add pathname as dependency

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    const result = await authHelpers.signUp({ email, password })
    setLoading(false)
    return result
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const result = await authHelpers.signIn({ email, password })
    
    // Reset redirect flag so new login can redirect
    setHasInitialRedirect(false)
    
    setLoading(false)
    return result
  }

  const signOut = async () => {
    setLoading(true)
    const result = await authHelpers.signOut()
    setUserInfo(null)
    setHasInitialRedirect(false) // Reset redirect flag on sign out
    setLoading(false)
    return result
  }

  const resetPassword = async (email: string) => {
    return await authHelpers.resetPassword({ email })
  }

  const value = {
    user,
    session,
    userInfo,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshUserInfo,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}