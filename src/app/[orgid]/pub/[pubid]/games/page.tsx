// src/app/[orgid]/pub/[pubid]/games/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient, type LuckyPourConfig } from '@/lib/apiClient'
import {
  Loader2,
  Dices,
  Clover,
  Trophy,
  AlertCircle,
  Settings,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

type GameTab = 'luckypour'

interface LuckyPourFormData {
  enabled: boolean
  chance_percent: number
  reward_amount: number
  min_pour_volume: number | null
  min_pour_cost: number | null
  max_wins_per_day_per_account: number | null
  max_wins_per_shift: number | null
  daily_budget: number | null
}

const defaultLuckyPourForm: LuckyPourFormData = {
  enabled: false,
  chance_percent: 5,
  reward_amount: 500,
  min_pour_volume: null,
  min_pour_cost: null,
  max_wins_per_day_per_account: null,
  max_wins_per_shift: null,
  daily_budget: null,
}

export default function PubGamesPage() {
  const { session } = useAuth()
  const params = useParams()
  const [orgId, setOrgId] = useState<number | null>(null)
  const [pubId, setPubId] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<GameTab>('luckypour')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Lucky Pour state
  const [config, setConfig] = useState<LuckyPourConfig | null>(null)
  const [formData, setFormData] = useState<LuckyPourFormData>(defaultLuckyPourForm)
  const [hasChanges, setHasChanges] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const tabs = [
    { id: 'luckypour' as GameTab, label: 'Lucky Pour', icon: Clover },
    // future: { id: 'spinwheel' as GameTab, label: 'Koło fortuny', icon: Dices },
  ]

  useEffect(() => {
    const getIds = async () => {
      const resolvedParams = await params
      setOrgId(parseInt(resolvedParams.orgid as string))
      setPubId(parseInt(resolvedParams.pubid as string))
    }
    getIds()
  }, [params])

  const fetchConfig = useCallback(async () => {
    if (!session || !pubId) return

    setLoading(true)
    try {
      const data = await apiClient.getLuckyPourConfig(session, pubId)
      setConfig(data)
      if (data) {
        setFormData({
          enabled: data.enabled,
          chance_percent: data.chance_percent,
          reward_amount: data.reward_amount,
          min_pour_volume: data.min_pour_volume,
          min_pour_cost: data.min_pour_cost,
          max_wins_per_day_per_account: data.max_wins_per_day_per_account,
          max_wins_per_shift: data.max_wins_per_shift,
          daily_budget: data.daily_budget,
        })
      } else {
        setFormData(defaultLuckyPourForm)
      }
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch lucky pour config:', error)
      toast.error('Nie udało się pobrać konfiguracji')
    } finally {
      setLoading(false)
    }
  }, [session, pubId])

  useEffect(() => {
    if (pubId) {
      fetchConfig()
    }
  }, [pubId, fetchConfig])

  const updateForm = (updates: Partial<LuckyPourFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!session || !pubId) return

    if (formData.chance_percent <= 0 || formData.chance_percent > 100) {
      toast.error('Szansa musi być między 0 a 100%')
      return
    }
    if (formData.reward_amount <= 0) {
      toast.error('Nagroda musi być większa niż 0')
      return
    }

    setSubmitting(true)
    try {
      const result = await apiClient.upsertLuckyPourConfig(session, {
        pub_id: pubId,
        enabled: formData.enabled,
        chance_percent: formData.chance_percent,
        reward_amount: formData.reward_amount,
        min_pour_volume: formData.min_pour_volume,
        min_pour_cost: formData.min_pour_cost,
        max_wins_per_day_per_account: formData.max_wins_per_day_per_account,
        max_wins_per_shift: formData.max_wins_per_shift,
        daily_budget: formData.daily_budget,
      })
      setConfig(result)
      setHasChanges(false)
      toast.success('Konfiguracja zapisana')
    } catch (error: any) {
      console.error('Failed to save config:', error)
      toast.error(error.message || 'Nie udało się zapisać konfiguracji')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!session || !pubId || !config) return

    try {
      await apiClient.toggleLuckyPour(session, pubId, enabled)
      setConfig(prev => prev ? { ...prev, enabled } : null)
      setFormData(prev => ({ ...prev, enabled }))
      toast.success(enabled ? 'Lucky Pour włączone' : 'Lucky Pour wyłączone')
    } catch (error) {
      console.error('Failed to toggle:', error)
      toast.error('Nie udało się zmienić statusu')
    }
  }

  const handleDelete = async () => {
    if (!session || !pubId) return

    setSubmitting(true)
    try {
      await apiClient.deleteLuckyPourConfig(session, pubId)
      setConfig(null)
      setFormData(defaultLuckyPourForm)
      setHasChanges(false)
      setDeleteDialogOpen(false)
      toast.success('Konfiguracja usunięta')
    } catch (error: any) {
      console.error('Failed to delete:', error)
      toast.error(error.message || 'Nie udało się usunąć konfiguracji')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper: parse nullable int from input
  const parseNullableInt = (value: string): number | null => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = parseInt(value)
    return isNaN(parsed) ? null : parsed
  }

  const formatCurrency = (grosze: number) => {
    return (grosze / 100).toFixed(2) + ' zł'
  }

  const renderLuckyPourTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Status bar */}
        {config && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {config.enabled ? (
                <Badge className="bg-green-600">Aktywne</Badge>
              ) : (
                <Badge variant="secondary">Nieaktywne</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Szansa: {config.chance_percent}% • Nagroda: {formatCurrency(config.reward_amount)}
              </span>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        )}

        {!config && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Lucky Pour nie jest jeszcze skonfigurowane dla tego pubu. Wypełnij formularz i zapisz aby aktywować.
            </AlertDescription>
          </Alert>
        )}

        {/* Config form */}
                <SimulationCard
                chancePercent={formData.chance_percent}
                rewardAmount={formData.reward_amount}
                maxWinsPerDay={formData.max_wins_per_day_per_account}
                maxWinsPerShift={formData.max_wins_per_shift}
                dailyBudget={formData.daily_budget}
                formatCurrency={formatCurrency}
                />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ustawienia gry</CardTitle>
            <CardDescription>
              Klient po nalewaniu ma szansę wygrać bonus na konto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Szansa na wygraną (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={100}
                  value={formData.chance_percent}
                  onChange={(e) => updateForm({ chance_percent: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  np. 5 = co 20-te nalewanie wygrywa średnio
                </p>
              </div>

              <div className="space-y-2">
                <Label>Kwota nagrody (grosze)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.reward_amount}
                  onChange={(e) => updateForm({ reward_amount: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.reward_amount > 0 && `= ${formatCurrency(formData.reward_amount)}`}
                </p>
              </div>
            </div>

            {/* Minimum requirements */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Wymagania minimalne</h4>
              <p className="text-sm text-muted-foreground">
                Zostaw puste aby nie ograniczać
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. objętość nalewania (ml)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.min_pour_volume ?? ''}
                    onChange={(e) => updateForm({ min_pour_volume: parseNullableInt(e.target.value) })}
                    placeholder="Brak limitu"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min. koszt nalewania (grosze)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.min_pour_cost ?? ''}
                    onChange={(e) => updateForm({ min_pour_cost: parseNullableInt(e.target.value) })}
                    placeholder="Brak limitu"
                  />
                  {formData.min_pour_cost && formData.min_pour_cost > 0 && (
                    <p className="text-xs text-muted-foreground">
                      = {formatCurrency(formData.min_pour_cost)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Limity bezpieczeństwa</h4>
              <p className="text-sm text-muted-foreground">
                Zabezpieczenia przed nadmiernym rozdawaniem bonusów. Zostaw puste = bez limitu.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max wygranych / konto / dzień</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.max_wins_per_day_per_account ?? ''}
                    onChange={(e) => updateForm({ max_wins_per_day_per_account: parseNullableInt(e.target.value) })}
                    placeholder="Bez limitu"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max wygranych / zmiana</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.max_wins_per_shift ?? ''}
                    onChange={(e) => updateForm({ max_wins_per_shift: parseNullableInt(e.target.value) })}
                    placeholder="Bez limitu"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Budżet dzienny (grosze)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.daily_budget ?? ''}
                    onChange={(e) => updateForm({ daily_budget: parseNullableInt(e.target.value) })}
                    placeholder="Bez limitu"
                  />
                  {formData.daily_budget && formData.daily_budget > 0 && (
                    <p className="text-xs text-muted-foreground">
                      = {formatCurrency(formData.daily_budget)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Active toggle in form */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Gra aktywna</Label>
                <p className="text-sm text-muted-foreground">
                  Wyłączona gra nie będzie losowana po nalewaniu
                </p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => updateForm({ enabled: checked })}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {config && (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={submitting}
                  >
                    Usuń konfigurację
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={fetchConfig}
                    disabled={submitting}
                  >
                    Anuluj zmiany
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={submitting || (!hasChanges && config !== null)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : config ? (
                    'Zapisz zmiany'
                  ) : (
                    'Utwórz konfigurację'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading && !orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gry</CardTitle>
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
              <CardTitle>Gry</CardTitle>
              <CardDescription>
                Grywalizacja i losowania dla klientów
              </CardDescription>
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

      {/* Tab content */}
      {activeTab === 'luckypour' && renderLuckyPourTab()}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń konfigurację Lucky Pour</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć konfigurację Lucky Pour dla tego pubu?
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ta operacja jest nieodwracalna. Gra zostanie wyłączona i konfiguracja usunięta.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                'Usuń konfigurację'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SimulationCard({
  chancePercent,
  rewardAmount,
  maxWinsPerDay,
  maxWinsPerShift,
  dailyBudget,
  formatCurrency,
}: {
  chancePercent: number
  rewardAmount: number
  maxWinsPerDay: number | null
  maxWinsPerShift: number | null
  dailyBudget: number | null
  formatCurrency: (grosze: number) => string
}) {
  const [txPerDay, setTxPerDay] = useState(100)
  const [uniqueAccounts, setUniqueAccounts] = useState(30)

  const simulate = () => {
    if (chancePercent <= 0 || rewardAmount <= 0 || txPerDay <= 0) {
      return { daily: { wins: 0, cost: 0 }, weekly: { wins: 0, cost: 0 }, monthly: { wins: 0, cost: 0 } }
    }

    // Raw expected wins per day (no limits)
    let rawWinsPerDay = txPerDay * (chancePercent / 100)

    // Apply account daily limit: each account can win at most N times
    if (maxWinsPerDay !== null && uniqueAccounts > 0) {
      const maxFromAccountLimit = uniqueAccounts * maxWinsPerDay
      rawWinsPerDay = Math.min(rawWinsPerDay, maxFromAccountLimit)
    }

    if (maxWinsPerShift !== null) {
    rawWinsPerDay = Math.min(rawWinsPerDay, maxWinsPerShift)
    }


    // Apply budget limit
    let dailyCost = rawWinsPerDay * rewardAmount
    if (dailyBudget !== null && dailyCost > dailyBudget) {
      dailyCost = dailyBudget
      rawWinsPerDay = Math.floor(dailyBudget / rewardAmount)
    }

    const dailyWins = Math.round(rawWinsPerDay * 100) / 100
    dailyCost = dailyWins * rewardAmount

    return {
      daily: { wins: dailyWins, cost: dailyCost },
      weekly: { wins: Math.round(dailyWins * 7 * 100) / 100, cost: dailyCost * 7 },
      monthly: { wins: Math.round(dailyWins * 31 * 100) / 100, cost: dailyCost * 31 },
    }
  }

  const stats = simulate()
  const winRate = txPerDay > 0 ? ((stats.daily.wins / txPerDay) * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Symulacja
        </CardTitle>
        <CardDescription>
          Szacunkowe koszty na podstawie obecnych ustawień
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
        <Label>Transakcji dziennie</Label>
        <div className="flex gap-2 mb-2">
            {[
            { label: 'Pn–Cz', value: 260 },
            { label: 'Pt–So', value: 890 },
            { label: 'Nd', value: 295 },
            { label: 'Średnio', value: 400 },
            ].map((preset) => (
            <Button
                key={preset.label}
                size="sm"
                variant={txPerDay === preset.value ? 'default' : 'outline'}
                onClick={() => setTxPerDay(preset.value)}
            >
                {preset.label}
            </Button>
            ))}
        </div>
        <Input
            type="number"
            min={1}
            value={txPerDay}
            onChange={(e) => setTxPerDay(parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
            Presety na podstawie danych historycznych — lub wpisz własną wartość
        </p>
        </div>
          <div className="space-y-2">
            <Label>Unikalnych kont dziennie</Label>
            <Input
              type="number"
              min={1}
              value={uniqueAccounts}
              onChange={(e) => setUniqueAccounts(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Wpływa na limit wygranych/konto/dzień
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Dziennie', data: stats.daily },
            { label: '7 dni', data: stats.weekly },
            { label: '31 dni', data: stats.monthly },
          ].map(({ label, data }) => (
            <div key={label} className="p-4 border rounded-lg space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(Math.round(data.cost))}</p>
                <p className="text-sm text-muted-foreground">
                  ~{data.wins} wygranych
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary line */}
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
          Przy {txPerDay} transakcjach dziennie i szansie {chancePercent}% — efektywny win rate po limitach: <span className="font-medium">{winRate}%</span>
          {' '}• Średni koszt na transakcję: <span className="font-medium">{txPerDay > 0 ? formatCurrency(Math.round(stats.daily.cost / txPerDay)) : '0 zł'}</span>
        </div>
      </CardContent>
    </Card>
  )
}