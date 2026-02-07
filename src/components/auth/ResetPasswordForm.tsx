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
import { CheckCircle, AlertCircle, ArrowLeft, Mail, KeyRound } from 'lucide-react'

// Schema dla kroku 1 - email
const emailSchema = z.object({
  email: z.string().email('Wprowadź prawidłowy adres email'),
})

// Schema dla kroku 2 - kod OTP + nowe hasło
const otpSchema = z.object({
  token: z.string().min(6, 'Kod musi mieć co najmniej 6 znaków'),
  newPassword: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(6, 'Potwierdź hasło'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
})

interface ResetPasswordFormProps {
  onSwitchToLogin?: () => void
}

export default function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { sendPasswordResetOtp, verifyOtpAndChangePassword } = useAuth()

  // Formularz dla kroku 1
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  // Formularz dla kroku 2
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  })

  // Krok 1: Wyślij OTP
  const onSendOtp = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await sendPasswordResetOtp(values.email)
      if (error) {
        setError(error.message)
      } else {
        setEmail(values.email)
        setStep('otp')
      }
    } catch (err) {
      setError('Wystąpił błąd podczas wysyłania kodu')
    } finally {
      setIsLoading(false)
    }
  }

  // Krok 2: Weryfikuj OTP i zmień hasło
  const onVerifyAndChange = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await verifyOtpAndChangePassword({
        email,
        token: values.token,
        newPassword: values.newPassword,
      })
      if (error) {
        setError(error.message)
      } else {
        setStep('success')
      }
    } catch (err) {
      setError('Wystąpił błąd podczas zmiany hasła')
    } finally {
      setIsLoading(false)
    }
  }

  // Wyślij kod ponownie
  const onResendCode = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await sendPasswordResetOtp(email)
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Wystąpił błąd podczas wysyłania kodu')
    } finally {
      setIsLoading(false)
    }
  }

  // Wróć do kroku 1
  const onBackToEmail = () => {
    setStep('email')
    setError('')
    otpForm.reset()
  }

  return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
          <CardDescription>
            {step === 'email' && 'Wprowadź swój email, a wyślemy Ci kod weryfikacyjny'}
            {step === 'otp' && 'Wprowadź kod z emaila i ustaw nowe hasło'}
            {step === 'success' && 'Hasło zostało zmienione'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Krok 1: Email */}
          {step === 'email' && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="space-y-4">
                  <FormField
                      control={emailForm.control}
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Wysyłanie...' : 'Wyślij kod'}
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

          {/* Krok 2: OTP + nowe hasło */}
          {step === 'otp' && (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onVerifyAndChange)} className="space-y-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span>Kod został wysłany na <strong>{email}</strong></span>
                  </div>

                  <FormField
                      control={otpForm.control}
                      name="token"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kod weryfikacyjny</FormLabel>
                            <FormControl>
                              <Input
                                  type="text"
                                  placeholder="123456"
                                  disabled={isLoading}
                                  autoComplete="one-time-code"
                                  {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                  />

                  <FormField
                      control={otpForm.control}
                      name="newPassword"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nowe hasło</FormLabel>
                            <FormControl>
                              <Input
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                  />

                  <FormField
                      control={otpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potwierdź hasło</FormLabel>
                            <FormControl>
                              <Input
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {isLoading ? 'Zmienianie...' : 'Zmień hasło'}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBackToEmail}
                        className="flex-1"
                        disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Wróć
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onResendCode}
                        className="flex-1"
                        disabled={isLoading}
                    >
                      Wyślij ponownie
                    </Button>
                  </div>
                </form>
              </Form>
          )}

          {/* Sukces */}
          {step === 'success' && (
              <div className="text-center space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Hasło zostało zmienione! Możesz się teraz zalogować nowym hasłem.
                  </AlertDescription>
                </Alert>

                {onSwitchToLogin && (
                    <Button onClick={onSwitchToLogin} className="w-full">
                      Przejdź do logowania
                    </Button>
                )}
              </div>
          )}
        </CardContent>
      </Card>
  )
}