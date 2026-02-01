// src/app/[orgid]/pub/[pubid]/stats/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { apiClient, ShiftInfo, TopupStats, ProductSaleStats, SalesStats, VisitsStats } from '@/lib/apiClient'
import {
    Loader2,
    Calendar,
    CreditCard,
    ShoppingCart,
    TrendingUp,
    Users,
    Beer,
    CheckCircle2,
    Filter,
    RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

type StatsTab = 'topups' | 'products' | 'sales' | 'visits'

// Helper to get current month date range
const getCurrentMonthRange = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
    }
}

// Format currency (grosze to PLN)
const formatCurrency = (grosze: number) => {
    return (grosze / 100).toFixed(2) + ' zł'
}

// Format volume (ml to L)
const formatVolume = (ml: number) => {
    return (ml / 1000).toFixed(2) + ' L'
}

// Format date
const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Format short date
const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function PubStatsPage() {
    const { session, userInfo } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)
    const [pubId, setPubId] = useState<number | null>(null)

    const [activeTab, setActiveTab] = useState<StatsTab>('sales')
    const [loading, setLoading] = useState(true)
    const [loadingStats, setLoadingStats] = useState(false)

    // Shifts
    const [shifts, setShifts] = useState<ShiftInfo[]>([])
    const [selectedShiftIds, setSelectedShiftIds] = useState<number[]>([])
    const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
    const [dateRange, setDateRange] = useState(getCurrentMonthRange())

    // Stats data
    const [topupStats, setTopupStats] = useState<TopupStats | null>(null)
    const [productStats, setProductStats] = useState<ProductSaleStats[]>([])
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null)
    const [visitsStats, setVisitsStats] = useState<VisitsStats | null>(null)

    // Get pub name
    const pubName = useMemo(() => {
        if (!userInfo || !pubId) return 'Pub'
        const info = userInfo.find(i => i.pub_id === pubId)
        return info?.pub_name || 'Pub'
    }, [userInfo, pubId])

    const tabs = [
        { id: 'sales' as StatsTab, label: 'Sprzedaż', icon: TrendingUp },
        { id: 'products' as StatsTab, label: 'Produkty', icon: Beer },
        { id: 'topups' as StatsTab, label: 'Doładowania', icon: CreditCard },
        { id: 'visits' as StatsTab, label: 'Odwiedziny', icon: Users },
    ]

    // Get IDs from params
    useEffect(() => {
        const getIds = async () => {
            const resolvedParams = await params
            setOrgId(parseInt(resolvedParams.orgid as string))
            setPubId(parseInt(resolvedParams.pubid as string))
        }
        getIds()
    }, [params])

    // Fetch shifts
    const fetchShifts = useCallback(async () => {
        if (!session || !orgId || !pubId) return

        setLoading(true)
        try {
            const shiftsData = await apiClient.listShifts(session, {
                organizationId: orgId,
                pubId: pubId,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            })
            setShifts(shiftsData)

            // Auto-select all shifts from current month
            const shiftIds = shiftsData.map(s => s.id)
            setSelectedShiftIds(shiftIds)
        } catch (error) {
            console.error('Failed to fetch shifts:', error)
            toast.error('Nie udało się pobrać zmian')
        } finally {
            setLoading(false)
        }
    }, [session, orgId, pubId, dateRange])

    useEffect(() => {
        if (orgId && pubId) {
            fetchShifts()
        }
    }, [orgId, pubId, fetchShifts])

    // Fetch stats when shifts or tab changes
    const fetchStats = useCallback(async () => {
        if (!session || !orgId || !pubId || selectedShiftIds.length === 0) return

        setLoadingStats(true)
        try {
            const params = {
                organizationId: orgId,
                pubId: pubId,
                shiftIds: selectedShiftIds,
            }

            switch (activeTab) {
                case 'topups':
                    const topups = await apiClient.getTopupStats(session, params)
                    setTopupStats(topups)
                    break
                case 'products':
                    const products = await apiClient.getProductStats(session, params)
                    setProductStats(products)
                    break
                case 'sales':
                    const sales = await apiClient.getSalesStats(session, params)
                    setSalesStats(sales)
                    break
                case 'visits':
                    const visits = await apiClient.getVisitsStats(session, params)
                    setVisitsStats(visits)
                    break
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
            toast.error('Nie udało się pobrać statystyk')
        } finally {
            setLoadingStats(false)
        }
    }, [session, orgId, pubId, selectedShiftIds, activeTab])

    useEffect(() => {
        if (selectedShiftIds.length > 0) {
            fetchStats()
        }
    }, [selectedShiftIds, activeTab, fetchStats])

    // Toggle shift selection
    const toggleShift = (shiftId: number) => {
        setSelectedShiftIds(prev => {
            if (prev.includes(shiftId)) {
                return prev.filter(id => id !== shiftId)
            }
            return [...prev, shiftId]
        })
    }

    // Select all shifts
    const selectAllShifts = () => {
        setSelectedShiftIds(shifts.map(s => s.id))
    }

    // Deselect all shifts
    const deselectAllShifts = () => {
        setSelectedShiftIds([])
    }

    // Render stats content based on active tab
    const renderStatsContent = () => {
        if (selectedShiftIds.length === 0) {
            return (
                <div className="text-center py-12">
                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Wybierz zmiany</h3>
                    <p className="text-muted-foreground mb-4">
                        Kliknij przycisk &#34;Wybierz zmiany&#34; aby wybrać okres do analizy
                    </p>
                    <Button onClick={() => setShiftDialogOpen(true)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Wybierz zmiany
                    </Button>
                </div>
            )
        }

        if (loadingStats) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )
        }

        switch (activeTab) {
            case 'sales':
                return renderSalesStats()
            case 'products':
                return renderProductStats()
            case 'topups':
                return renderTopupStats()
            case 'visits':
                return renderVisitsStats()
            default:
                return null
        }
    }

    const renderSalesStats = () => {
        if (!salesStats) return null

        return (
            <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Łączny przychód</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                {formatCurrency(salesStats.total_revenue)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Łączna objętość</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatVolume(salesStats.total_volume)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Liczba transakcji</CardDescription>
                            <CardTitle className="text-2xl">
                                {salesStats.transaction_count}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Średnia transakcja</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(salesStats.average_transaction)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Additional info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Podsumowanie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Wybrano <span className="font-medium text-foreground">{selectedShiftIds.length}</span> zmian
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Średnio <span className="font-medium text-foreground">
                  {formatCurrency(salesStats.total_revenue / selectedShiftIds.length)}
                </span> na zmianę
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Średnio <span className="font-medium text-foreground">
                  {Math.round(salesStats.transaction_count / selectedShiftIds.length)}
                </span> transakcji na zmianę
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderProductStats = () => {
        if (productStats.length === 0) {
            return (
                <div className="text-center py-12">
                    <Beer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Brak danych</h3>
                    <p className="text-muted-foreground">
                        Brak sprzedaży produktów w wybranym okresie
                    </p>
                </div>
            )
        }

        const totalRevenue = productStats.reduce((sum, p) => sum + p.total_revenue, 0)

        return (
            <div className="space-y-6">
                {/* Products table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b">
                            <th className="text-left p-3">Produkt</th>
                            <th className="text-right p-3">Ilość (L)</th>
                            <th className="text-right p-3">Transakcje</th>
                            <th className="text-right p-3">Przychód</th>
                            <th className="text-right p-3">Udział</th>
                        </tr>
                        </thead>
                        <tbody>
                        {productStats.map((product, idx) => {
                            const share = totalRevenue > 0 ? (product.total_revenue / totalRevenue) * 100 : 0
                            return (
                                <tr key={idx} className="border-b hover:bg-muted/50">
                                    <td className="p-3 font-medium">{product.product_name}</td>
                                    <td className="p-3 text-right">{formatVolume(product.total_volume)}</td>
                                    <td className="p-3 text-right">{product.transaction_count}</td>
                                    <td className="p-3 text-right font-medium text-green-600">
                                        {formatCurrency(product.total_revenue)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Badge variant="secondary">{share.toFixed(1)}%</Badge>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                        <tfoot>
                        <tr className="bg-muted/50">
                            <td className="p-3 font-bold">Razem</td>
                            <td className="p-3 text-right font-bold">
                                {formatVolume(productStats.reduce((sum, p) => sum + p.total_volume, 0))}
                            </td>
                            <td className="p-3 text-right font-bold">
                                {productStats.reduce((sum, p) => sum + p.transaction_count, 0)}
                            </td>
                            <td className="p-3 text-right font-bold text-green-600">
                                {formatCurrency(totalRevenue)}
                            </td>
                            <td className="p-3 text-right">
                                <Badge>100%</Badge>
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        )
    }

    const renderTopupStats = () => {
        if (!topupStats) return null

        return (
            <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Łączna kwota doładowań</CardDescription>
                            <CardTitle className="text-2xl text-blue-600">
                                {formatCurrency(topupStats.total_amount)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Liczba doładowań</CardDescription>
                            <CardTitle className="text-2xl">
                                {topupStats.total_count}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Średnie doładowanie</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(topupStats.average_amount)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Additional info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Podsumowanie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Średnio <span className="font-medium text-foreground">
                  {formatCurrency(topupStats.total_amount / selectedShiftIds.length)}
                </span> doładowań na zmianę
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Średnio <span className="font-medium text-foreground">
                  {Math.round(topupStats.total_count / selectedShiftIds.length)}
                </span> doładowań na zmianę
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderVisitsStats = () => {
        if (!visitsStats) return null

        return (
            <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Nowe karty</CardDescription>
                            <CardTitle className="text-2xl text-purple-600">
                                {visitsStats.new_accounts}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Konta utworzone w wybranym okresie
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Aktywni klienci</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                {visitsStats.active_accounts}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Klienci którzy dokonali transakcji
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (loading && !orgId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Statystyki</CardTitle>
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
                            <CardTitle>Statystyki - {pubName}</CardTitle>
                            <CardDescription>
                                Analiza sprzedaży i aktywności pubu
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={fetchStats}
                                disabled={loadingStats || selectedShiftIds.length === 0}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
                                Odśwież
                            </Button>
                            <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Wybierz zmiany ({selectedShiftIds.length})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>Wybierz zmiany</DialogTitle>
                                        <DialogDescription>
                                            Zaznacz zmiany do uwzględnienia w statystykach
                                        </DialogDescription>
                                    </DialogHeader>

                                    {/* Date range selector */}
                                    <div className="grid grid-cols-2 gap-4 py-4 border-b">
                                        <div>
                                            <label className="text-sm font-medium">Od</label>
                                            <input
                                                type="date"
                                                value={dateRange.startDate}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Do</label>
                                            <input
                                                type="date"
                                                value={dateRange.endDate}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 py-2">
                                        <Button variant="outline" size="sm" onClick={selectAllShifts}>
                                            Zaznacz wszystkie
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={deselectAllShifts}>
                                            Odznacz wszystkie
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={fetchShifts}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Wczytaj zmiany
                                        </Button>
                                    </div>

                                    {/* Shifts list */}
                                    <div className="flex-1 overflow-y-auto py-2 space-y-2 min-h-0">
                                        {loading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </div>
                                        ) : shifts.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Brak zmian w wybranym okresie
                                            </div>
                                        ) : (
                                            shifts.map((shift) => {
                                                const isSelected = selectedShiftIds.includes(shift.id)
                                                return (
                                                    <div
                                                        key={shift.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                            isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                                                        }`}
                                                        onClick={() => toggleShift(shift.id)}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleShift(shift.id)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium">
                                                                {formatShortDate(shift.started_at)}
                                                                {shift.finished_at && (
                                                                    <span className="text-muted-foreground">
                                    {' → '}{formatShortDate(shift.finished_at)}
                                  </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground flex gap-4">
                                                                <span>Sprzedaż: {formatCurrency(shift.total_sales)}</span>
                                                                <span>Doładowania: {formatCurrency(shift.total_topups)}</span>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                                        )}
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Wybrano {selectedShiftIds.length} z {shifts.length} zmian
                    </span>
                                        <Button onClick={() => setShiftDialogOpen(false)}>
                                            Gotowe
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tabs */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2 flex-wrap">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'default' : 'outline'}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </CardTitle>
                    {selectedShiftIds.length > 0 && (
                        <CardDescription>
                            Dane z {selectedShiftIds.length} wybranych zmian
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {renderStatsContent()}
                </CardContent>
            </Card>
        </div>
    )
}