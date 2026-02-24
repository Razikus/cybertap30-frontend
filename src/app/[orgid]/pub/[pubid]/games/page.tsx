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
import { apiClient, type LuckyPourConfig, type LuckyTapConfig } from '@/lib/apiClient'
import {
  Loader2,
  Dices,
  Clover,
  Trophy,
  AlertCircle,
  Settings,
  Sparkles,
  Beer,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

type GameTab = 'luckypour' | 'luckytap'

// ==================== LUCKY POUR TYPES ====================

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

// ==================== LUCKY TAP TYPES ====================

interface LuckyTapFormData {
  enabled: boolean
  mode: 'scheduled' | 'random'
  scheduled_times: string[]
  max_rounds_per_shift: number | null
  min_interval_min: number | null
  round_duration_min: number
  discount_percent: number
  reward_amount: number
}

const defaultLuckyTapForm: LuckyTapFormData = {
  enabled: false,
  mode: 'scheduled',
  scheduled_times: [],
  max_rounds_per_shift: 4,
  min_interval_min: 60,
  round_duration_min: 15,
  discount_percent: 20,
  reward_amount: 500,
}

// Generate all 30-min slots for a day
const ALL_TIME_SLOTS: string[] = []
for (let h = 0; h < 24; h++) {
  ALL_TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`)
  ALL_TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`)
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
  const [lpConfig, setLpConfig] = useState<LuckyPourConfig | null>(null)
  const [lpFormData, setLpFormData] = useState<LuckyPourFormData>(defaultLuckyPourForm)
  const [lpHasChanges, setLpHasChanges] = useState(false)

  // Lucky Tap state
  const [ltConfig, setLtConfig] = useState<LuckyTapConfig | null>(null)
  const [ltFormData, setLtFormData] = useState<LuckyTapFormData>(defaultLuckyTapForm)
  const [ltHasChanges, setLtHasChanges] = useState(false)
  const [ltLoading, setLtLoading] = useState(true)

  // Delete dialogs
  const [lpDeleteDialogOpen, setLpDeleteDialogOpen] = useState(false)
  const [ltDeleteDialogOpen, setLtDeleteDialogOpen] = useState(false)

  const tabs = [
    { id: 'luckypour' as GameTab, label: 'Lucky Pour', icon: Clover },
    { id: 'luckytap' as GameTab, label: 'Szczęśliwy Kran', icon: Beer },
  ]

  useEffect(() => {
    const getIds = async () => {
      const resolvedParams = await params
      setOrgId(parseInt(resolvedParams.orgid as string))
      setPubId(parseInt(resolvedParams.pubid as string))
    }
    getIds()
  }, [params])

  // ==================== LUCKY POUR LOGIC ====================

  const fetchLpConfig = useCallback(async () => {
    if (!session || !pubId) return

    setLoading(true)
    try {
      const data = await apiClient.getLuckyPourConfig(session, pubId)
      setLpConfig(data)
      if (data) {
        setLpFormData({
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
        setLpFormData(defaultLuckyPourForm)
      }
      setLpHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch lucky pour config:', error)
      toast.error('Nie udało się pobrać konfiguracji Lucky Pour')
    } finally {
      setLoading(false)
    }
  }, [session, pubId])

  useEffect(() => {
    if (pubId) {
      fetchLpConfig()
    }
  }, [pubId, fetchLpConfig])

  const updateLpForm = (updates: Partial<LuckyPourFormData>) => {
    setLpFormData(prev => ({ ...prev, ...updates }))
    setLpHasChanges(true)
  }

  const handleLpSave = async () => {
    if (!session || !pubId) return

    if (lpFormData.chance_percent <= 0 || lpFormData.chance_percent > 100) {
      toast.error('Szansa musi być między 0 a 100%')
      return
    }
    if (lpFormData.reward_amount <= 0) {
      toast.error('Nagroda musi być większa niż 0')
      return
    }

    setSubmitting(true)
    try {
      const result = await apiClient.upsertLuckyPourConfig(session, {
        pub_id: pubId,
        enabled: lpFormData.enabled,
        chance_percent: lpFormData.chance_percent,
        reward_amount: lpFormData.reward_amount,
        min_pour_volume: lpFormData.min_pour_volume,
        min_pour_cost: lpFormData.min_pour_cost,
        max_wins_per_day_per_account: lpFormData.max_wins_per_day_per_account,
        max_wins_per_shift: lpFormData.max_wins_per_shift,
        daily_budget: lpFormData.daily_budget,
      })
      setLpConfig(result)
      setLpHasChanges(false)
      toast.success('Konfiguracja zapisana')
    } catch (error: any) {
      console.error('Failed to save config:', error)
      toast.error(error.message || 'Nie udało się zapisać konfiguracji')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLpToggle = async (enabled: boolean) => {
    if (!session || !pubId || !lpConfig) return

    try {
      await apiClient.toggleLuckyPour(session, pubId, enabled)
      setLpConfig(prev => prev ? { ...prev, enabled } : null)
      setLpFormData(prev => ({ ...prev, enabled }))
      toast.success(enabled ? 'Lucky Pour włączone' : 'Lucky Pour wyłączone')
    } catch (error) {
      console.error('Failed to toggle:', error)
      toast.error('Nie udało się zmienić statusu')
    }
  }

  const handleLpDelete = async () => {
    if (!session || !pubId) return

    setSubmitting(true)
    try {
      await apiClient.deleteLuckyPourConfig(session, pubId)
      setLpConfig(null)
      setLpFormData(defaultLuckyPourForm)
      setLpHasChanges(false)
      setLpDeleteDialogOpen(false)
      toast.success('Konfiguracja usunięta')
    } catch (error: any) {
      console.error('Failed to delete:', error)
      toast.error(error.message || 'Nie udało się usunąć konfiguracji')
    } finally {
      setSubmitting(false)
    }
  }

  // ==================== LUCKY TAP LOGIC ====================

  const fetchLtConfig = useCallback(async () => {
    if (!session || !pubId) return

    setLtLoading(true)
    try {
      const data = await apiClient.getLuckyTapConfig(session, pubId)
      setLtConfig(data)
      if (data) {
        setLtFormData({
          enabled: data.enabled,
          mode: data.mode as 'scheduled' | 'random',
          scheduled_times: (data.scheduled_times || []).map((t) => t.split(':').slice(0, 2).join(':')),
          max_rounds_per_shift: data.max_rounds_per_shift,
          min_interval_min: data.min_interval_min,
          round_duration_min: data.round_duration_min,
          discount_percent: data.discount_percent,
          reward_amount: data.reward_amount,
        })
      } else {
        setLtFormData(defaultLuckyTapForm)
      }
      setLtHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch lucky tap config:', error)
      toast.error('Nie udało się pobrać konfiguracji Szczęśliwego Kranu')
    } finally {
      setLtLoading(false)
    }
  }, [session, pubId])

  useEffect(() => {
    if (pubId) {
      fetchLtConfig()
    }
  }, [pubId, fetchLtConfig])

  const updateLtForm = (updates: Partial<LuckyTapFormData>) => {
    setLtFormData(prev => ({ ...prev, ...updates }))
    setLtHasChanges(true)
  }

  const toggleTimeSlot = (time: string) => {
    setLtFormData(prev => {
      const exists = prev.scheduled_times.includes(time)
      const newTimes = exists
          ? prev.scheduled_times.filter(t => t !== time)
          : [...prev.scheduled_times, time].sort()
      return { ...prev, scheduled_times: newTimes }
    })
    setLtHasChanges(true)
  }

  const handleLtSave = async () => {
    if (!session || !pubId) return

    if (ltFormData.discount_percent < 0 || ltFormData.discount_percent > 100) {
      toast.error('Zniżka musi być między 0 a 100%')
      return
    }
    if (ltFormData.round_duration_min <= 0) {
      toast.error('Czas trwania rundy musi być większy niż 0')
      return
    }
    if (ltFormData.mode === 'scheduled' && ltFormData.scheduled_times.length === 0) {
      toast.error('Wybierz przynajmniej jedną godzinę w harmonogramie')
      return
    }
    if (ltFormData.mode === 'random') {
      if (!ltFormData.max_rounds_per_shift || ltFormData.max_rounds_per_shift <= 0) {
        toast.error('Podaj maksymalną liczbę rund na zmianę')
        return
      }
      if (!ltFormData.min_interval_min || ltFormData.min_interval_min < 60) {
        toast.error('Minimalny odstęp musi wynosić co najmniej 60 minut')
        return
      }
    }

    setSubmitting(true)
    try {
      const result = await apiClient.upsertLuckyTapConfig(session, {
        pub_id: pubId,
        enabled: ltFormData.enabled,
        mode: ltFormData.mode,
        scheduled_times: ltFormData.scheduled_times,
        max_rounds_per_shift: ltFormData.max_rounds_per_shift,
        min_interval_min: ltFormData.min_interval_min,
        round_duration_min: ltFormData.round_duration_min,
        discount_percent: ltFormData.discount_percent,
        reward_amount: ltFormData.reward_amount,
      })
      setLtConfig(result)
      setLtHasChanges(false)
      toast.success('Konfiguracja Szczęśliwego Kranu zapisana')
    } catch (error: any) {
      console.error('Failed to save lucky tap config:', error)
      toast.error(error.message || 'Nie udało się zapisać konfiguracji')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLtToggle = async (enabled: boolean) => {
    if (!session || !pubId || !ltConfig) return

    try {
      await apiClient.toggleLuckyTap(session, pubId, enabled)
      setLtConfig(prev => prev ? { ...prev, enabled } : null)
      setLtFormData(prev => ({ ...prev, enabled }))
      toast.success(enabled ? 'Szczęśliwy Kran włączony' : 'Szczęśliwy Kran wyłączony')
    } catch (error) {
      console.error('Failed to toggle:', error)
      toast.error('Nie udało się zmienić statusu')
    }
  }

  const handleLtDelete = async () => {
    if (!session || !pubId) return

    setSubmitting(true)
    try {
      await apiClient.deleteLuckyTapConfig(session, pubId)
      setLtConfig(null)
      setLtFormData(defaultLuckyTapForm)
      setLtHasChanges(false)
      setLtDeleteDialogOpen(false)
      toast.success('Konfiguracja usunięta')
    } catch (error: any) {
      console.error('Failed to delete:', error)
      toast.error(error.message || 'Nie udało się usunąć konfiguracji')
    } finally {
      setSubmitting(false)
    }
  }

  // ==================== HELPERS ====================

  const parseNullableInt = (value: string): number | null => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = parseInt(value)
    return isNaN(parsed) ? null : parsed
  }

  const formatCurrency = (grosze: number) => {
    return (grosze / 100).toFixed(2) + ' zł'
  }

  // ==================== LUCKY POUR TAB ====================

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
          {lpConfig && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {lpConfig.enabled ? (
                      <Badge className="bg-green-600">Aktywne</Badge>
                  ) : (
                      <Badge variant="secondary">Nieaktywne</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                Szansa: {lpConfig.chance_percent}% • Nagroda: {formatCurrency(lpConfig.reward_amount)}
              </span>
                </div>
                <Switch
                    checked={lpConfig.enabled}
                    onCheckedChange={handleLpToggle}
                />
              </div>
          )}

          {!lpConfig && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Lucky Pour nie jest jeszcze skonfigurowane dla tego pubu. Wypełnij formularz i zapisz aby aktywować.
                </AlertDescription>
              </Alert>
          )}

          <SimulationCard
              chancePercent={lpFormData.chance_percent}
              rewardAmount={lpFormData.reward_amount}
              maxWinsPerDay={lpFormData.max_wins_per_day_per_account}
              maxWinsPerShift={lpFormData.max_wins_per_shift}
              dailyBudget={lpFormData.daily_budget}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Szansa na wygraną (%)</Label>
                  <Input
                      type="number"
                      step="0.1"
                      min={0.1}
                      max={100}
                      value={lpFormData.chance_percent}
                      onChange={(e) => updateLpForm({ chance_percent: parseFloat(e.target.value) || 0 })}
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
                      value={lpFormData.reward_amount}
                      onChange={(e) => updateLpForm({ reward_amount: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {lpFormData.reward_amount > 0 && `= ${formatCurrency(lpFormData.reward_amount)}`}
                  </p>
                </div>
              </div>

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
                        value={lpFormData.min_pour_volume ?? ''}
                        onChange={(e) => updateLpForm({ min_pour_volume: parseNullableInt(e.target.value) })}
                        placeholder="Brak limitu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Min. koszt nalewania (grosze)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={lpFormData.min_pour_cost ?? ''}
                        onChange={(e) => updateLpForm({ min_pour_cost: parseNullableInt(e.target.value) })}
                        placeholder="Brak limitu"
                    />
                    {lpFormData.min_pour_cost && lpFormData.min_pour_cost > 0 && (
                        <p className="text-xs text-muted-foreground">
                          = {formatCurrency(lpFormData.min_pour_cost)}
                        </p>
                    )}
                  </div>
                </div>
              </div>

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
                        value={lpFormData.max_wins_per_day_per_account ?? ''}
                        onChange={(e) => updateLpForm({ max_wins_per_day_per_account: parseNullableInt(e.target.value) })}
                        placeholder="Bez limitu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max wygranych / zmiana</Label>
                    <Input
                        type="number"
                        min={1}
                        value={lpFormData.max_wins_per_shift ?? ''}
                        onChange={(e) => updateLpForm({ max_wins_per_shift: parseNullableInt(e.target.value) })}
                        placeholder="Bez limitu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Budżet dzienny (grosze)</Label>
                    <Input
                        type="number"
                        min={1}
                        value={lpFormData.daily_budget ?? ''}
                        onChange={(e) => updateLpForm({ daily_budget: parseNullableInt(e.target.value) })}
                        placeholder="Bez limitu"
                    />
                    {lpFormData.daily_budget && lpFormData.daily_budget > 0 && (
                        <p className="text-xs text-muted-foreground">
                          = {formatCurrency(lpFormData.daily_budget)}
                        </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Gra aktywna</Label>
                  <p className="text-sm text-muted-foreground">
                    Wyłączona gra nie będzie losowana po nalewaniu
                  </p>
                </div>
                <Switch
                    checked={lpFormData.enabled}
                    onCheckedChange={(checked) => updateLpForm({ enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  {lpConfig && (
                      <Button
                          variant="destructive"
                          onClick={() => setLpDeleteDialogOpen(true)}
                          disabled={submitting}
                      >
                        Usuń konfigurację
                      </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {lpHasChanges && (
                      <Button
                          variant="outline"
                          onClick={fetchLpConfig}
                          disabled={submitting}
                      >
                        Anuluj zmiany
                      </Button>
                  )}
                  <Button
                      onClick={handleLpSave}
                      disabled={submitting || (!lpHasChanges && lpConfig !== null)}
                  >
                    {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Zapisywanie...
                        </>
                    ) : lpConfig ? (
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

  // ==================== LUCKY TAP TAB ====================

  const renderLuckyTapTab = () => {
    if (ltLoading) {
      return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
    }

    return (
        <div className="space-y-6">
          {/* Status bar */}
          {ltConfig && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {ltConfig.enabled ? (
                      <Badge className="bg-green-600">Aktywny</Badge>
                  ) : (
                      <Badge variant="secondary">Nieaktywny</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                Tryb: {ltConfig.mode === 'scheduled' ? 'Harmonogram' : 'Losowy'}
                    {' '}• Zniżka: {ltConfig.discount_percent}%
                    {' '}• Bonus: {formatCurrency(ltConfig.reward_amount)}
              </span>
                </div>
                <Switch
                    checked={ltConfig.enabled}
                    onCheckedChange={handleLtToggle}
                />
              </div>
          )}

          {!ltConfig && (
              <Alert>
                <Beer className="h-4 w-4" />
                <AlertDescription>
                  Szczęśliwy Kran nie jest jeszcze skonfigurowany. Wypełnij formularz i zapisz aby aktywować.
                </AlertDescription>
              </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ustawienia Szczęśliwego Kranu</CardTitle>
              <CardDescription>
                Co jakiś czas losowy kran staje się &#34;szczęśliwy&#34; — klienci dostają zniżkę i bonus na konto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Mode selector */}
              <div className="space-y-3">
                <Label>Tryb działania</Label>
                <div className="flex gap-2">
                  <Button
                      variant={ltFormData.mode === 'scheduled' ? 'default' : 'outline'}
                      onClick={() => updateLtForm({ mode: 'scheduled' })}
                      className="flex-1"
                  >
                    📅 Harmonogram
                  </Button>
                  <Button
                      variant={ltFormData.mode === 'random' ? 'default' : 'outline'}
                      onClick={() => updateLtForm({ mode: 'random' })}
                      className="flex-1"
                  >
                    🎲 Losowy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ltFormData.mode === 'scheduled'
                      ? 'Szczęśliwy kran odpala się o wybranych godzinach'
                      : 'System sam losowo decyduje kiedy odpalić (na pełnych i połówkach godzin)'
                  }
                </p>
              </div>

              {/* Scheduled mode: time grid */}
              {ltFormData.mode === 'scheduled' && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Harmonogram godzin</h4>
                      <span className="text-sm text-muted-foreground">
                    Wybrano: {ltFormData.scheduled_times.length}
                  </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                      {ALL_TIME_SLOTS.map((time) => {
                        const isSelected = ltFormData.scheduled_times.includes(time)
                        const hour = parseInt(time.split(':')[0])
                        // Subtle background color by time-of-day
                        const isEvening = hour >= 18 || hour < 2
                        const isAfternoon = hour >= 12 && hour < 18

                        return (
                            <button
                                key={time}
                                type="button"
                                onClick={() => toggleTimeSlot(time)}
                                className={`
                          px-2 py-1.5 text-xs font-mono rounded border transition-all
                          ${isSelected
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : isEvening
                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                        : isAfternoon
                                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:border-primary/50'
                                            : 'bg-background border-border hover:border-primary/50'
                                }
                        `}
                            >
                              {time}
                            </button>
                        )
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Select typical evening hours
                            const evening = ALL_TIME_SLOTS.filter(t => {
                              const h = parseInt(t.split(':')[0])
                              return h >= 18 && h <= 23
                            })
                            updateLtForm({ scheduled_times: evening })
                          }}
                      >
                        Wieczór (18-23)
                      </Button>
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Every full hour from 15 to 23
                            const fullHours = ALL_TIME_SLOTS.filter(t => {
                              const h = parseInt(t.split(':')[0])
                              return t.endsWith(':00') && h >= 15 && h <= 23
                            })
                            updateLtForm({ scheduled_times: fullHours })
                          }}
                      >
                        Pełne godziny (15-23)
                      </Button>
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateLtForm({ scheduled_times: [] })}
                      >
                        Wyczyść
                      </Button>
                    </div>
                  </div>
              )}

              {/* Random mode settings */}
              {ltFormData.mode === 'random' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Ustawienia losowe</h4>
                    <p className="text-sm text-muted-foreground">
                      System będzie losował czy odpalić rundę na każdej pełnej i połowie godziny
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max rund na zmianę</Label>
                        <Input
                            type="number"
                            min={1}
                            value={ltFormData.max_rounds_per_shift ?? ''}
                            onChange={(e) => updateLtForm({ max_rounds_per_shift: parseNullableInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Ile razy maksymalnie w jednej zmianie
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Min. odstęp między rundami (min)</Label>
                        <Input
                            type="number"
                            min={60}
                            step={30}
                            value={ltFormData.min_interval_min ?? 60}
                            onChange={(e) => updateLtForm({ min_interval_min: parseNullableInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum 60 minut
                        </p>
                      </div>
                    </div>
                  </div>
              )}

              {/* Common settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Czas trwania rundy (min)</Label>
                  <Input
                      type="number"
                      min={1}
                      max={120}
                      value={ltFormData.round_duration_min}
                      onChange={(e) => updateLtForm({ round_duration_min: parseInt(e.target.value) || 15 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Jak długo kran jest &#34;szczęśliwy&#34;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Zniżka (%)</Label>
                  <Input
                      type="number"
                      min={1}
                      max={100}
                      value={ltFormData.discount_percent}
                      onChange={(e) => updateLtForm({ discount_percent: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Zniżka na nalewanie ze szczęśliwego kranu
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Bonus na konto (grosze)</Label>
                  <Input
                      type="number"
                      min={0}
                      value={ltFormData.reward_amount}
                      onChange={(e) => updateLtForm({ reward_amount: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {ltFormData.reward_amount > 0 && `= ${formatCurrency(ltFormData.reward_amount)}`}
                    {ltFormData.reward_amount === 0 && 'Brak bonusu — tylko zniżka'}
                  </p>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Gra aktywna</Label>
                  <p className="text-sm text-muted-foreground">
                    Wyłączona gra nie będzie uruchamiana przez scheduler
                  </p>
                </div>
                <Switch
                    checked={ltFormData.enabled}
                    onCheckedChange={(checked) => updateLtForm({ enabled: checked })}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  {ltConfig && (
                      <Button
                          variant="destructive"
                          onClick={() => setLtDeleteDialogOpen(true)}
                          disabled={submitting}
                      >
                        Usuń konfigurację
                      </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {ltHasChanges && (
                      <Button
                          variant="outline"
                          onClick={fetchLtConfig}
                          disabled={submitting}
                      >
                        Anuluj zmiany
                      </Button>
                  )}
                  <Button
                      onClick={handleLtSave}
                      disabled={submitting || (!ltHasChanges && ltConfig !== null)}
                  >
                    {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Zapisywanie...
                        </>
                    ) : ltConfig ? (
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

  // ==================== MAIN RENDER ====================

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

        {activeTab === 'luckypour' && renderLuckyPourTab()}
        {activeTab === 'luckytap' && renderLuckyTapTab()}

        {/* Lucky Pour Delete Dialog */}
        <Dialog open={lpDeleteDialogOpen} onOpenChange={setLpDeleteDialogOpen}>
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
              <Button variant="outline" onClick={() => setLpDeleteDialogOpen(false)} disabled={submitting}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={handleLpDelete} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Usuwanie...</> : 'Usuń konfigurację'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lucky Tap Delete Dialog */}
        <Dialog open={ltDeleteDialogOpen} onOpenChange={setLtDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuń konfigurację Szczęśliwego Kranu</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunąć konfigurację Szczęśliwego Kranu dla tego pubu?
              </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ta operacja jest nieodwracalna. Gra zostanie wyłączona i konfiguracja usunięta.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setLtDeleteDialogOpen(false)} disabled={submitting}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={handleLtDelete} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Usuwanie...</> : 'Usuń konfigurację'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}

// ==================== SIMULATION CARD (Lucky Pour) ====================

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

    let rawWinsPerDay = txPerDay * (chancePercent / 100)

    if (maxWinsPerDay !== null && uniqueAccounts > 0) {
      const maxFromAccountLimit = uniqueAccounts * maxWinsPerDay
      rawWinsPerDay = Math.min(rawWinsPerDay, maxFromAccountLimit)
    }

    if (maxWinsPerShift !== null) {
      rawWinsPerDay = Math.min(rawWinsPerDay, maxWinsPerShift)
    }

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

          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            Przy {txPerDay} transakcjach dziennie i szansie {chancePercent}% — efektywny win rate po limitach: <span className="font-medium">{winRate}%</span>
            {' '}• Średni koszt na transakcję: <span className="font-medium">{txPerDay > 0 ? formatCurrency(Math.round(stats.daily.cost / txPerDay)) : '0 zł'}</span>
          </div>
        </CardContent>
      </Card>
  )
}