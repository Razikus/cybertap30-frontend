// components/auth/ResetPasswordForm.tsx
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
import { CheckCircle, AlertCircle, ArrowLeft, Mail } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Wprowadź prawidłowy adres email'),
})

interface ResetPasswordFormProps {
  onSwitchToLogin?: () => void
}

export default function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const { resetPassword } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await resetPassword(values.email)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Link do resetowania hasła został wysłany na Twój email!')
      }
    } catch (err) {
      setError('Wystąpił błąd podczas wysyłania emaila')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
        <CardDescription>
          Wprowadź swój email, a wyślemy Ci link do resetowania hasła
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
            
            <div className="text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              Sprawdź swoją skrzynkę pocztową i kliknij w link, aby zresetować hasło.
            </div>

            {onSwitchToLogin && (
              <Button
                variant="outline"
                onClick={onSwitchToLogin}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wróć do logowania
              </Button>
            )}
          </div>
        ) : (
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
              </Button>

              {onSwitchToLogin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSwitchToLogin}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wróć do logowania
                </Button>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}