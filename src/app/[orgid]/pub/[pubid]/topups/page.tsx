// app/[orgid]/pub/[pubid]/topups/page.tsx
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
import { apiClient, type ShiftInfo, type TopupEntry, type TopupListResponse } from '@/lib/apiClient'
import {
    Loader2,
    Calendar,
    CreditCard,
    CheckCircle2,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ArrowUpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { DateTimeInput } from '@/components/ui/datetime-input'

const getCurrentMonthRange = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return {
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString()
    }
}

const formatCurrency = (grosze: number) => (grosze / 100).toFixed(2) + ' zł'

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

const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function PubTopupsPage() {
    const { session, userInfo } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)
    const [pubId, setPubId] = useState<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [loadingTopups, setLoadingTopups] = useState(false)

    // Shifts
    const [shifts, setShifts] = useState<ShiftInfo[]>([])
    const [selectedShiftIds, setSelectedShiftIds] = useState<number[]>([])
    const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
    const [dateRange, setDateRange] = useState(getCurrentMonthRange())

    // Topups data
    const [topupsData, setTopupsData] = useState<TopupListResponse | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 50

    const pubName = useMemo(() => {
        if (!userInfo || !pubId) return 'Pub'
        const info = userInfo.find(i => i.pub_id === pubId)
        return info?.pub_name || 'Pub'
    }, [userInfo, pubId])

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

    // Fetch topups
    const fetchTopups = useCallback(async (page = 1) => {
        if (!session || !orgId || !pubId || selectedShiftIds.length === 0) return

        setLoadingTopups(true)
        try {
            const result = await apiClient.listTopups(session, {
                organizationId: orgId,
                pubId: pubId,
                shiftIds: selectedShiftIds,
                page,
                limit: pageSize,
            })
            setTopupsData(result)
            setCurrentPage(page)
        } catch (error) {
            console.error('Failed to fetch topups:', error)
            toast.error('Nie udało się pobrać doładowań')
        } finally {
            setLoadingTopups(false)
        }
    }, [session, orgId, pubId, selectedShiftIds])

    useEffect(() => {
        if (selectedShiftIds.length > 0) {
            fetchTopups(1)
        } else {
            setTopupsData(null)
        }
    }, [selectedShiftIds, fetchTopups])

    const handlePageChange = (newPage: number) => {
        fetchTopups(newPage)
    }

    const toggleShift = (shiftId: number) => {
        setSelectedShiftIds(prev =>
            prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]
        )
    }

    const selectAllShifts = () => setSelectedShiftIds(shifts.map(s => s.id))
    const deselectAllShifts = () => setSelectedShiftIds([])

    if (loading && !orgId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Historia doładowań</CardTitle>
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
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                                Historia doładowań — {pubName}
                            </CardTitle>
                            <CardDescription>
                                Lista wszystkich doładowań w wybranych zmianach
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchTopups(currentPage)}
                                disabled={loadingTopups || selectedShiftIds.length === 0}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingTopups ? 'animate-spin' : ''}`} />
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
                                            Zaznacz zmiany aby zobaczyć doładowania z tych okresów
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-b">
                                        <div>
                                            <label className="text-sm font-medium">Od</label>
                                            <DateTimeInput
                                                value={dateRange.startDate}
                                                onChange={(iso) => setDateRange(prev => ({ ...prev, startDate: iso }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Do</label>
                                            <DateTimeInput
                                                value={dateRange.endDate}
                                                onChange={(iso) => setDateRange(prev => ({ ...prev, endDate: iso }))}
                                            />
                                        </div>
                                    </div>

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

            {/* Summary */}
            {topupsData && topupsData.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Łączna kwota</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                {formatCurrency(topupsData.summary.total_amount)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Liczba doładowań</CardDescription>
                            <CardTitle className="text-2xl">
                                {topupsData.summary.total_count}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Średnie doładowanie</CardDescription>
                            <CardTitle className="text-2xl">
                                {topupsData.summary.total_count > 0
                                    ? formatCurrency(Math.round(topupsData.summary.total_amount / topupsData.summary.total_count))
                                    : '0 zł'
                                }
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Topups table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Doładowania</CardTitle>
                        {loadingTopups && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedShiftIds.length === 0 ? (
                        <div className="text-center py-12">
                            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Wybierz zmiany</h3>
                            <p className="text-muted-foreground mb-4">
                                Kliknij &quot;Wybierz zmiany&quot; aby zobaczyć doładowania
                            </p>
                            <Button onClick={() => setShiftDialogOpen(true)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Wybierz zmiany
                            </Button>
                        </div>
                    ) : loadingTopups && !topupsData ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !topupsData || topupsData.data.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Brak doładowań</h3>
                            <p className="text-muted-foreground">
                                Brak doładowań w wybranych zmianach
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Data</th>
                                        <th className="text-right p-3">Kwota</th>
                                        <th className="text-left p-3">Karta</th>
                                        <th className="text-left p-3">Konto</th>
                                        <th className="text-left p-3">Zmiana</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {topupsData.data.map((topup) => (
                                        <tr key={topup.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3 text-sm">
                                                {formatDate(topup.created_at)}
                                            </td>
                                            <td className="p-3 text-right font-medium text-green-600">
                                                +{formatCurrency(topup.amount)}
                                            </td>
                                            <td className="p-3">
                                                {topup.card_prefix ? (
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {topup.card_prefix}...
                                                    </code>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs gap-1"
                                                    onClick={() => window.open(`/${orgId}/acclookup?account_id=${topup.account_id}`, '_blank')}
                                                >
                                                    <CreditCard className="h-3 w-3"/>
                                                    Historia #{topup.account_id} (KLIK)
                                                </Button>
                                            </td>
                                            <td className="p-3">
                                                {topup.shift_id ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        #{topup.shift_id}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {topupsData.pagination.total_pages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Strona {topupsData.pagination.page} z {topupsData.pagination.total_pages} • {topupsData.pagination.total} doładowań
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={!topupsData.pagination.has_prev || loadingTopups}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Poprzednia
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                { length: Math.min(5, topupsData.pagination.total_pages) },
                                                (_, i) => {
                                                    const tp = topupsData.pagination.total_pages
                                                    const cp = topupsData.pagination.page
                                                    let pageNumber: number
                                                    if (tp <= 5) {
                                                        pageNumber = i + 1
                                                    } else if (cp <= 3) {
                                                        pageNumber = i + 1
                                                    } else if (cp >= tp - 2) {
                                                        pageNumber = tp - 4 + i
                                                    } else {
                                                        pageNumber = cp - 2 + i
                                                    }
                                                    return (
                                                        <Button
                                                            key={pageNumber}
                                                            variant={cp === pageNumber ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => handlePageChange(pageNumber)}
                                                            disabled={loadingTopups}
                                                            className="w-8 h-8 p-0"
                                                        >
                                                            {pageNumber}
                                                        </Button>
                                                    )
                                                }
                                            )}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={!topupsData.pagination.has_next || loadingTopups}
                                        >
                                            Następna
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}