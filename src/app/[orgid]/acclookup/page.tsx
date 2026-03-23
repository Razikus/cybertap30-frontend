'use client'

import {useEffect, useState} from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClient, type AccountHistoryResponse } from '@/lib/apiClient'

import { useSearchParams } from 'next/navigation'
import {
    Search, Loader2, AlertCircle, CreditCard,
    ArrowUpCircle, ArrowDownCircle, Gift, Beer
} from 'lucide-react'
import { toast } from 'sonner'

export default function AccountHistoryPage() {
    const { session } = useAuth()
    const [uuid, setUuid] = useState('')
    const [data, setData] = useState<AccountHistoryResponse | null>(null)
    const [loading, setLoading] = useState(false)

    const searchParams = useSearchParams()

    const search = async () => {
        if (!session || !uuid.trim()) return
        setLoading(true)
        try {
            const result = await apiClient.getAccountHistory(session, uuid.trim(), undefined)
            setData(result)
        } catch (e: any) {
            toast.error(e.message || 'Nie znaleziono konta')
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    const fmt = (v: number) => (v / 100).toFixed(2) + ' zł'
    const fmtMl = (v: number) => v + ' ml'
    const fmtDate = (d: string) => new Date(d).toLocaleString('pl-PL')


    useEffect(() => {
        const accountId = searchParams.get('account_id')
        if (accountId && session && !data) {
            setLoading(true)
            apiClient.getAccountHistory(session, undefined, parseInt(accountId))
                .then(result => setData(result))
                .catch((e: any) => toast.error(e.message || 'Nie znaleziono konta'))
                .finally(() => setLoading(false))
        }
    }, [searchParams, session])

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Historia konta
                    </CardTitle>
                    <CardDescription>Wpisz numer karty (zobaczysz go po przyłożeniu do terminala) aby zobaczyć pełną historię</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 max-w-lg">
                        <Input
                            placeholder="Sekret karty..."
                            value={uuid}
                            onChange={(e) => setUuid(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && search()}
                        />
                        <Button onClick={search} disabled={loading || !uuid.trim()}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                    <details className="mt-4" open>
                        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                            Gdzie znaleźć numer karty? To ciąg cyfr i znaków po ZAŁADOWANO:
                        </summary>
                        <img
                            src="/zrzut.png"
                            alt="Numer karty na ekranie kasy"
                            className="mt-2 rounded-lg border max-w-md"
                        />
                    </details>
                </CardContent>
            </Card>

            {data && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Saldo</div>
                                <div className="text-2xl font-bold">{fmt(data.account.cash)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Doładowania</div>
                                <div className="text-2xl font-bold text-green-600">{fmt(data.summary.total_topups)}</div>
                                <div className="text-xs text-muted-foreground">{data.summary.total_topup_count}x</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Wydane</div>
                                <div className="text-2xl font-bold text-red-600">{fmt(data.summary.total_spent)}</div>
                                <div className="text-xs text-muted-foreground">{fmtMl(data.summary.total_volume_ml)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Rozbieżność</div>
                                <div className={`text-2xl font-bold ${data.summary.balance_discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {fmt(data.summary.balance_discrepancy)}
                                </div>
                                {data.summary.balance_discrepancy !== 0 && (
                                    data.summary.migrated_account
                                        ? <div className="flex items-center gap-1 text-xs text-orange-500">
                                            <AlertCircle className="h-3 w-3" /> Rozbieżność NA PLUS może wynikać z migracji ze starego systemu
                                        </div>
                                        : <div className="flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" /> Coś się nie zgadza
                                        </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Account info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4 text-sm">
                                <span>UUID: <code className="bg-muted px-1 rounded">{data.account.uuid}</code></span>
                                <span>ID: {data.account.id}</span>
                                <span>Utworzono: {fmtDate(data.account.created_at)}</span>
                                {data.account.blocked && <Badge variant="destructive">Zablokowane</Badge>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Beer className="h-5 w-5" />
                                Transakcje ({data.transactions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.transactions.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">Brak transakcji</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Data</th>
                                            <th className="text-left p-2">Produkt</th>
                                            <th className="text-left p-2">Kran</th>
                                            <th className="text-right p-2">Objętość</th>
                                            <th className="text-right p-2">Koszt</th>
                                            <th className="text-left p-2">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.transactions.map((t) => (
                                            <tr key={t.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{fmtDate(t.created_at)}</td>
                                                <td className="p-2 font-medium">{t.product_name}</td>
                                                <td className="p-2">{t.tap_slot_position ? `#${t.tap_slot_position}` : '-'} {t.pub_name && `(${t.pub_name})`}</td>
                                                <td className="p-2 text-right">{t.charged_volume_ml != null ? fmtMl(t.charged_volume_ml) : '-'}</td>
                                                <td className="p-2 text-right font-medium text-red-600">{t.cost != null ? fmt(t.cost) : '-'}</td>
                                                <td className="p-2">
                                                    {t.finished_at
                                                        ? <Badge variant="outline" className="text-green-600">OK</Badge>
                                                        : <Badge variant="destructive">Niezakończona</Badge>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {data.summary.migrated_account && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Saldo ze starego systemu</div>
                                <div className="text-2xl font-bold text-blue-600">{fmt(data.summary.old_system_cash)}</div>
                                <div className="text-xs text-muted-foreground">Zmigrowane konto</div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Topups */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                                Doładowania ({data.topups.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.topups.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">Brak doładowań</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Data</th>
                                            <th className="text-right p-2">Kwota</th>
                                            <th className="text-left p-2">Pub</th>
                                            <th className="text-left p-2">Zmiana</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.topups.map((t) => (
                                            <tr key={t.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{fmtDate(t.created_at)}</td>
                                                <td className="p-2 text-right font-medium text-green-600">+{fmt(t.amount)}</td>
                                                <td className="p-2">{t.pub_name || '-'}</td>
                                                <td className="p-2">{t.shift_id ? `#${t.shift_id}` : '-'}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bonus topups */}
                    {data.bonus_topups.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Gift className="h-5 w-5 text-purple-600" />
                                    Bonusy ({data.bonus_topups.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Data</th>
                                            <th className="text-right p-2">Kwota</th>
                                            <th className="text-left p-2">Źródło</th>
                                            <th className="text-left p-2">Poinformowany</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.bonus_topups.map((b) => (
                                            <tr key={b.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{fmtDate(b.created_at)}</td>
                                                <td className="p-2 text-right font-medium text-purple-600">+{fmt(b.amount)}</td>
                                                <td className="p-2">{b.source}</td>
                                                <td className="p-2">{b.was_informed ? '✅' : '❌'}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}