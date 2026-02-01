// components/auth/RegisterForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/context/AuthContext'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Wprowadź prawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie pasują do siebie",
  path: ["confirmPassword"],
})

interface RegisterFormProps {
  onSwitchToLogin?: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const { signUp } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await signUp(values.email, values.password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Konto zostało utworzone! Sprawdź email w celu potwierdzenia.')
        form.reset()
      }
    } catch (err) {
      setError('Wystąpił błąd podczas rejestracji')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Zarejestruj się w CyberTap</CardTitle>
        <CardDescription>
          Stwórz konto i zacznij zarządzać pubem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="twoj@email.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimum 6 znaków"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Wpisz hasło ponownie"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Rejestracja...' : 'Zarejestruj się'}
            </Button>

            {onSwitchToLogin && (
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Masz już konto? </span>
                <Button
                  type="button"
                  variant="link"
                  onClick={onSwitchToLogin}
                  className="p-0 h-auto font-medium"
                >
                  Zaloguj się
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}