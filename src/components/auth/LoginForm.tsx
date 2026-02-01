// components/auth/LoginForm.tsx
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
import { toast } from 'sonner'

const formSchema = z.object({
  email: z.string().email('Wprowadź prawidłowy adres email'),
  password: z.string().min(1, 'Wprowadź hasło'),
})

interface LoginFormProps {
  onSwitchToRegister?: () => void
  onSwitchToResetPassword?: () => void
}

export default function LoginForm({ onSwitchToRegister, onSwitchToResetPassword }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const { error } = await signIn(values.email, values.password)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Logowanie pomyślne!')
      }
    } catch (err) {
      toast.error('Wystąpił nieoczekiwany błąd podczas logowania')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">CyberTap</CardTitle>
      </CardHeader>
      <CardContent>
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
                      placeholder="Wpisz hasło"
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
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>

            <div className="text-center space-y-2">
              {onSwitchToResetPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={onSwitchToResetPassword}
                  className="text-sm"
                >
                  Zapomniałeś hasła?
                </Button>
              )}
              
              {onSwitchToRegister && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Nie masz konta? </span>
                  <Button
                    type="button"
                    variant="link"
                    onClick={onSwitchToRegister}
                    className="p-0 h-auto font-medium"
                  >
                    Zarejestruj się
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}