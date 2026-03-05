// src/app/[orgid]/game-test/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { apiClient } from '@/lib/apiClient'
import { Loader2, Play, Building2, Gamepad2, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

const AVAILABLE_GAMES = [
    { id: 'lucky_pour', label: 'Lucky Pour', description: 'Dźwięk + przekaźnik przy wygranej Lucky Pour' },
    { id: 'lucky_tap', label: 'Szczęśliwy Kran', description: 'Dźwięk + przekaźnik przy wygranej Lucky Tap' },
    { id: 'lucky_tap_start', label: 'Lucky Tap START', description: 'Rozpocznij testową rundę Lucky Tap (5 min, 20%, 500 nagrody)' },
    { id: 'lucky_tap_stop', label: 'Lucky Tap STOP', description: 'Zakończ rundę Lucky Tap na wszystkich kranach' },
]

export default function GameTestPage() {
    const { session, userInfo } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)

    const [selectedPubId, setSelectedPubId] = useState<string>('')
    const [selectedGame, setSelectedGame] = useState<string>('')
    const [sending, setSending] = useState(false)
    const [lastSent, setLastSent] = useState<{ game: string; pubId: number; topic: string } | null>(null)

    const availablePubs = useMemo(() => {
        if (!userInfo || !orgId) return []
        return Array.from(new Map(
            userInfo
                .filter(info => info.org_id === orgId)
                .map(info => [info.pub_id, { id: info.pub_id, name: info.pub_name }])
        ).values())
    }, [userInfo, orgId])

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

    // Auto-select first pub
    useEffect(() => {
        if (availablePubs.length > 0 && !selectedPubId) {
            setSelectedPubId(availablePubs[0].id.toString())
        }
    }, [availablePubs, selectedPubId])

    const handleSend = async () => {
        if (!session || !selectedPubId || !selectedGame) return

        setSending(true)
        try {
            const result = await apiClient.testGameEvent(session, parseInt(selectedPubId), selectedGame)
            setLastSent({ game: result.game, pubId: result.pub_id, topic: result.topic })
            toast.success(`Event "${selectedGame}" wysłany do pubu #${selectedPubId}`)
        } catch (error: any) {
            toast.error(error.message || 'Nie udało się wysłać eventu')
        } finally {
            setSending(false)
        }
    }

    const getPubName = (pubId: string) => {
        const pub = availablePubs.find(p => p.id.toString() === pubId)
        return pub?.name || `Pub #${pubId}`
    }

    const selectedGameInfo = AVAILABLE_GAMES.find(g => g.id === selectedGame)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Gamepad2 className="h-6 w-6" />
                        <div>
                            <CardTitle>Test Game Events - {orgName}</CardTitle>
                            <CardDescription>
                                Wyślij testowy event MQTT aby przetestować dźwięki i przekaźnik w pubie
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Wyślij event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Pub select */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Pub</label>
                        <Select value={selectedPubId} onValueChange={setSelectedPubId}>
                            <SelectTrigger className="w-full max-w-sm">
                                <Building2 className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Wybierz pub" />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePubs.map((pub) => (
                                    <SelectItem key={pub.id} value={pub.id.toString()}>
                                        {pub.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Game select */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Game Event</label>
                        <Select value={selectedGame} onValueChange={setSelectedGame}>
                            <SelectTrigger className="w-full max-w-sm">
                                <Volume2 className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Wybierz event" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_GAMES.map((game) => (
                                    <SelectItem key={game.id} value={game.id}>
                                        {game.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedGameInfo && (
                            <p className="text-sm text-muted-foreground">{selectedGameInfo.description}</p>
                        )}
                    </div>

                    {/* Send button */}
                    <Button
                        size="lg"
                        onClick={handleSend}
                        disabled={sending || !selectedPubId || !selectedGame}
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4 mr-2" />
                        )}
                        Wyślij event
                    </Button>

                    {/* Last sent info */}
                    {lastSent && (
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                            <p className="text-sm font-medium">Ostatnio wysłano:</p>
                            <p className="text-sm text-muted-foreground">
                                Game: <span className="font-mono">{lastSent.game}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Pub: <span className="font-mono">#{lastSent.pubId}</span> ({getPubName(lastSent.pubId.toString())})
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Topic: <span className="font-mono">{lastSent.topic}</span>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}