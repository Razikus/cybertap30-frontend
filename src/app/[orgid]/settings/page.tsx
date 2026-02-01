// src/app/[orgid]/settings/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Key, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const passwordSchema = z.object({
    newPassword: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
    confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła nie pasują do siebie",
    path: ["confirmPassword"],
})

export default function SettingsPage() {
    const { user, updatePassword } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const form = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const { error } = await updatePassword(values.newPassword)
            if (error) {
                setError(error.message)
            } else {
                setSuccess('Hasło zostało zmienione pomyślnie!')
                form.reset()
            }
        } catch (err) {
            setError('Wystąpił błąd podczas zmiany hasła')
        } finally {
            setIsLoading(false)
        }
    }

    const copyUserId = async () => {
        if (user?.id) {
            await navigator.clipboard.writeText(user.id)
            setCopied(true)
            toast.success('ID skopiowane do schowka')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* User Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informacje o koncie
                    </CardTitle>
                    <CardDescription>
                        Podstawowe informacje o Twoim koncie
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm mt-1">{user?.email || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">ID użytkownika</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono flex-1 break-all">
                                {user?.id || '-'}
                            </code>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyUserId}
                                disabled={!user?.id}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Konto utworzone</label>
                        <p className="text-sm mt-1">
                            {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : '-'
                            }
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Zmiana hasła
                    </CardTitle>
                    <CardDescription>
                        Ustaw nowe hasło do swojego konta
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
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nowe hasło</FormLabel>
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
                                        <FormLabel>Potwierdź nowe hasło</FormLabel>
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
                                disabled={isLoading}
                            >
                                {isLoading ? 'Zapisywanie...' : 'Zmień hasło'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}