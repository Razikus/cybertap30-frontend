// src/app/page.tsx
'use client'

import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-center">
              Przekierowywanie...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-center">
              Ładowanie...
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}