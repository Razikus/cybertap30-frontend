// src/app/[orgid]/special-status/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Loader2,
    Shield,
    Search,
    UserPlus,
    Trash2,
    RefreshCw,
    Users,
    Percent,
    Ban,
    Mail,
    CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import type { StatusDef, MobileUserSearchResult, SpecialStatusEntry } from '@/lib/apiClient'

export default function SpecialStatusPage() {
    const { session, userInfo } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)

    // Data
    const [statusDefs, setStatusDefs] = useState<StatusDef[]>([])
    const [statusUsers, setStatusUsers] = useState<SpecialStatusEntry[]>([])
    const [searchResults, setSearchResults] = useState<MobileUserSearchResult[]>([])

    // UI state
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [selectedStatusDefId, setSelectedStatusDefId] = useState<string>('')
    const [assigning, setAssigning] = useState<number | null>(null) // account_id being assigned
    const [removeDialog, setRemoveDialog] = useState<SpecialStatusEntry | null>(null)
    const [removing, setRemoving] = useState(false)

    const orgName = useMemo(() => {
        if (!userInfo || !orgId) return 'Organizacja'
        const info = userInfo.find(i => i.org_id === orgId)
        return info?.organization_name || 'Organizacja'
    }, [userInfo, orgId])

    useEffect(() => {
        const getId = async () => {
            const resolvedParams = await params
            setOrgId(parseInt(resolvedParams.orgid as string))
        }
        getId()
    }, [params])

    const fetchData = useCallback(async () => {
        if (!session || !orgId) return

        setLoading(true)
        try {
            const [defs, users] = await Promise.all([
                apiClient.listStatusDefs(session, orgId),
                apiClient.listSpecialStatusUsers(session, orgId),
            ])
            setStatusDefs(defs)
            setStatusUsers(users)

            if (defs.length > 0 && !selectedStatusDefId) {
                setSelectedStatusDefId(defs[0].id.toString())
            }
        } catch (error: any) {
            console.error('Failed to fetch special status data:', error)
            toast.error(error.message || 'Nie udało się pobrać danych')
        } finally {
            setLoading(false)
        }
    }, [session, orgId])

    useEffect(() => {
        if (orgId) {
            fetchData()
        }
    }, [orgId, fetchData])

    // Search mobile users
    const handleSearch = useCallback(async () => {
        if (!session || !orgId || searchQuery.length < 3) return

        setSearching(true)
        try {
            const results = await apiClient.searchMobileUsers(session, orgId, searchQuery)
            setSearchResults(results)
            if (results.length === 0) {
                toast.info('Nie znaleziono użytkowników')
            }
        } catch (error: any) {
            console.error('Search failed:', error)
            toast.error(error.message || 'Błąd wyszukiwania')
        } finally {
            setSearching(false)
        }
    }, [session, orgId, searchQuery])

    // Assign status
    const handleAssign = useCallback(async (accountId: number) => {
        if (!session || !orgId || !selectedStatusDefId) return

        setAssigning(accountId)
        try {
            await apiClient.assignSpecialStatus(session, accountId, orgId, parseInt(selectedStatusDefId))
            toast.success('Status nadany')
            // Refresh list & clear search
            const users = await apiClient.listSpecialStatusUsers(session, orgId)
            setStatusUsers(users)
            setSearchResults([])
            setSearchQuery('')
        } catch (error: any) {
            console.error('Assign failed:', error)
            toast.error(error.message || 'Nie udało się nadać statusu')
        } finally {
            setAssigning(null)
        }
    }, [session, orgId, selectedStatusDefId])

    // Remove status
    const handleRemove = useCallback(async () => {
        if (!session || !orgId || !removeDialog) return

        setRemoving(true)
        try {
            await apiClient.removeSpecialStatus(session, removeDialog.account_id, orgId)
            toast.success('Status usunięty')
            setStatusUsers(prev => prev.filter(u => u.account_id !== removeDialog.account_id))
            setRemoveDialog(null)
        } catch (error: any) {
            console.error('Remove failed:', error)
            toast.error(error.message || 'Nie udało się usunąć statusu')
        } finally {
            setRemoving(false)
        }
    }, [session, orgId, removeDialog])

    // Check if account already has status
    const accountHasStatus = useCallback((accountId: number) => {
        return statusUsers.some(u => u.account_id === accountId)
    }, [statusUsers])

    const getStatusForAccount = useCallback((accountId: number) => {
        return statusUsers.find(u => u.account_id === accountId)
    }, [statusUsers])

    if (loading && !orgId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Statusy specjalne</CardTitle>
                    <CardDescription>Ładowanie...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Statusy specjalne — {orgName}
                            </CardTitle>
                            <CardDescription>
                                Zarządzanie statusami specjalnymi kont (np. pracownik)
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Odśwież
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Available status definitions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Percent className="h-5 w-5 text-amber-600" />
                                Dostępne statusy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {statusDefs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">
                                    Brak zdefiniowanych statusów dla tej organizacji
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {statusDefs.map((def) => (
                                        <div
                                            key={def.id}
                                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                        >
                                            <div>
                                                <p className="font-medium">{def.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Rabat: {def.discount}%
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant="secondary" className="text-amber-700 bg-amber-100 dark:bg-amber-900 dark:text-amber-300">
                                                    -{def.discount}%
                                                </Badge>
                                                {def.is_excluding_from_other_promos && (
                                                    <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                                        <Ban className="h-3 w-3 mr-1" />
                                                        Wyklucza promo
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Search & assign */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-blue-600" />
                                Nadaj status
                            </CardTitle>
                            <CardDescription>
                                Wyszukaj użytkownika mobilnego po adresie email (min. 3 znaki)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status selector */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                                        Status do nadania
                                    </label>
                                    <Select
                                        value={selectedStatusDefId}
                                        onValueChange={setSelectedStatusDefId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusDefs.map((def) => (
                                                <SelectItem key={def.id} value={def.id.toString()}>
                                                    {def.name} (−{def.discount}%)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Search input */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Wpisz email użytkownika (min. 3 znaki)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSearch()
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={searching || searchQuery.length < 3 || !selectedStatusDefId}
                                >
                                    {searching ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                    <span className="ml-2 hidden sm:inline">Szukaj</span>
                                </Button>
                            </div>

                            {/* Search results */}
                            {searchResults.length > 0 && (
                                <div className="border rounded-lg divide-y">
                                    {searchResults.map((user) => {
                                        const existing = getStatusForAccount(user.account_id)
                                        return (
                                            <div
                                                key={user.account_id}
                                                className="flex items-center justify-between p-3 hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{user.email}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Konto #{user.account_id}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {existing ? (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                            {existing.status_name}
                                                        </Badge>
                                                    ) : null}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAssign(user.account_id)}
                                                        disabled={assigning === user.account_id || !selectedStatusDefId}
                                                    >
                                                        {assigning === user.account_id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <UserPlus className="h-4 w-4" />
                                                        )}
                                                        <span className="ml-1.5">
                                                            {existing ? 'Zmień' : 'Nadaj'}
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Current special status users */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-600" />
                                Użytkownicy ze statusem specjalnym
                                <Badge variant="secondary" className="ml-2">
                                    {statusUsers.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {statusUsers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">
                                    Brak użytkowników ze statusem specjalnym
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Email</th>
                                            <th className="text-left p-3">Konto</th>
                                            <th className="text-left p-3">Status</th>
                                            <th className="text-right p-3">Rabat</th>
                                            <th className="text-right p-3">Saldo</th>
                                            <th className="text-left p-3">Nadano</th>
                                            <th className="text-right p-3">Akcje</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {statusUsers.map((entry) => (
                                            <tr key={entry.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="font-medium">
                                                                {entry.email || '—'}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm font-mono">
                                                                #{entry.account_id}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                                        {entry.status_name}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right">
                                                        <span className="font-medium text-amber-600">
                                                            −{entry.discount}%
                                                        </span>
                                                </td>
                                                <td className="p-3 text-right font-mono text-sm">
                                                    {(entry.cash / 100).toFixed(2)} zł
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {new Date(entry.created_at).toLocaleDateString('pl-PL')}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                        onClick={() => setRemoveDialog(entry)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Remove confirmation dialog */}
            <Dialog open={!!removeDialog} onOpenChange={() => setRemoveDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Usuń status specjalny</DialogTitle>
                        <DialogDescription>
                            Czy na pewno chcesz usunąć status <strong>{removeDialog?.status_name}</strong> z konta{' '}
                            <strong>{removeDialog?.email || `#${removeDialog?.account_id}`}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveDialog(null)} disabled={removing}>
                            Anuluj
                        </Button>
                        <Button variant="destructive" onClick={handleRemove} disabled={removing}>
                            {removing ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Usuń status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}