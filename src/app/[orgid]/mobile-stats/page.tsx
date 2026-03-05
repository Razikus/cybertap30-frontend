// src/app/[orgid]/mobile-stats/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient, type MobileStatsResponse } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import {
    Loader2,
    Smartphone,
    Users,
    CreditCard,
    Megaphone,
    TrendingUp,
    Building2,
    RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

// Format month from ISO date
const formatMonth = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })
}

// Short month for tables
const formatShortMonth = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'short' })
}

export default function MobileStatsPage() {
    const { session, userInfo } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)

    const [data, setData] = useState<MobileStatsResponse | null>(null)
    const [loading, setLoading] = useState(true)

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
            const result = await apiClient.getMobileStats(session, orgId)
            setData(result)
        } catch (error: any) {
            console.error('Failed to fetch mobile stats:', error)
            toast.error(error.message || 'Nie udało się pobrać statystyk aplikacji')
        } finally {
            setLoading(false)
        }
    }, [session, orgId])

    useEffect(() => {
        if (orgId) {
            fetchData()
        }
    }, [orgId, fetchData])

    // Totals
    const totalRegistered = data?.registered_users?.reduce((sum, r) => sum + r.count, 0) ?? 0
    const totalLinks = data?.linked_cards?.reduce((sum, r) => sum + r.links_count, 0) ?? 0
    const totalConsents = data?.marketing_consents?.reduce((sum, r) => sum + r.count, 0) ?? 0

    // Group linked_cards by month for summary
    const linksByMonth = useMemo(() => {
        if (!data?.linked_cards) return []
        const map = new Map<string, { month: string; total: number; pubs: { pub_name: string; count: number }[] }>()

        for (const row of data.linked_cards) {
            const key = row.month
            if (!map.has(key)) {
                map.set(key, { month: key, total: 0, pubs: [] })
            }
            const entry = map.get(key)!
            entry.total += row.links_count
            entry.pubs.push({ pub_name: row.pub_name, count: row.links_count })
        }

        return Array.from(map.values()).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
    }, [data])

    if (loading && !orgId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Aplikacja mobilna</CardTitle>
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
                                <Smartphone className="h-5 w-5" />
                                Aplikacja mobilna — {orgName}
                            </CardTitle>
                            <CardDescription>
                                Statystyki rejestracji, powiązanych kart i zgód marketingowych
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
            ) : !data ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Brak danych do wyświetlenia
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    Zarejestrowani użytkownicy
                                </CardDescription>
                                <CardTitle className="text-3xl text-blue-600">
                                    {totalRegistered}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Łącznie kont powiązanych z organizacją
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-1">
                                    <CreditCard className="h-4 w-4" />
                                    Powiązane karty
                                </CardDescription>
                                <CardTitle className="text-3xl text-green-600">
                                    {totalLinks}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Łącznie powiązań kart ze wszystkich pubów
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-1">
                                    <Megaphone className="h-4 w-4" />
                                    Zgody marketingowe
                                </CardDescription>
                                <CardTitle className="text-3xl text-purple-600">
                                    {totalConsents}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Użytkownicy ze zgodą na marketing
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Registered users per month */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                Rejestracje miesięcznie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.registered_users.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">Brak danych</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Miesiąc</th>
                                            <th className="text-right p-3">Nowi użytkownicy</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.registered_users.map((row, idx) => (
                                            <tr key={idx} className="border-b hover:bg-muted/50">
                                                <td className="p-3 font-medium">{formatMonth(row.month)}</td>
                                                <td className="p-3 text-right">
                                                    <Badge variant="secondary" className="text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300">
                                                        +{row.count}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Linked cards per pub per month */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                Powiązane karty — per pub, miesięcznie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {linksByMonth.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">Brak danych</p>
                            ) : (
                                <div className="space-y-4">
                                    {linksByMonth.map((monthData, idx) => (
                                        <div key={idx} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium">{formatMonth(monthData.month)}</h4>
                                                <Badge variant="outline">
                                                    Łącznie: {monthData.total}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {monthData.pubs
                                                    .sort((a, b) => b.count - a.count)
                                                    .map((pub, pidx) => (
                                                        <div key={pidx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                                            <span className="flex items-center gap-1.5 text-sm">
                                                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                                {pub.pub_name}
                                                            </span>
                                                            <Badge variant="secondary" className="text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300">
                                                                {pub.count}
                                                            </Badge>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Marketing consents per month */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-purple-600" />
                                Zgody marketingowe miesięcznie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.marketing_consents.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">Brak danych</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Miesiąc</th>
                                            <th className="text-right p-3">Nowe zgody</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.marketing_consents.map((row, idx) => (
                                            <tr key={idx} className="border-b hover:bg-muted/50">
                                                <td className="p-3 font-medium">{formatMonth(row.month)}</td>
                                                <td className="p-3 text-right">
                                                    <Badge variant="secondary" className="text-purple-700 bg-purple-100 dark:bg-purple-900 dark:text-purple-300">
                                                        +{row.count}
                                                    </Badge>
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
        </div>
    )
}