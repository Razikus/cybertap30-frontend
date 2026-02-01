// src/app/[orgid]/pub/[pubid]/devices/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiClient, TapSlotWithProduct, type TapSlot } from '@/lib/apiClient'
import { 
  Settings, 
  Loader2, 
  Ban, 
  Gauge,
  PackageMinus,
  Zap,
  Beer,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

function BarrelProgress({ charged, total }: { charged: number | null, total: number | null }) {
  const totalVol = total || 0
  const chargedVol = charged || 0

  if (totalVol === 0) {
    return <span className="text-xs text-muted-foreground">Brak danych</span>
  }

  const remaining = totalVol - chargedVol
  const percentage = Math.round((remaining / totalVol) * 100)

  const getColor = () => {
    if (percentage < 20) return 'bg-red-500'
    if (percentage < 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Pozostało</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
              className={`h-full transition-all ${getColor()}`}
              style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span>{(remaining / 1000).toFixed(1)}L pozostało</span>
          <span>/ {(totalVol / 1000).toFixed(1)}L</span>
        </div>
      </div>
  )
}

export default function PubDevicesPage() {
  const { session } = useAuth()
  const params = useParams()
  const [orgId, setOrgId] = useState<number | null>(null)
  const [pubId, setPubId] = useState<number | null>(null)
  
  const [tapSlots, setTapSlots] = useState<TapSlotWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialogs
  const [precisionDialogOpen, setPrecisionDialogOpen] = useState(false)
  const [unloadDialogOpen, setUnloadDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TapSlotWithProduct | null>(null)
  const [newPrecision, setNewPrecision] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleToggleBlock = async (slot: TapSlotWithProduct) => {
    if (!session) return

    try {
      if (slot.blocked) {
        await apiClient.unblockTapSlot(session, slot.id)
        toast.success(`Kran ${slot.position} odblokowany`)
      } else {
        await apiClient.blockTapSlot(session, slot.id)
        toast.success(`Kran ${slot.position} zablokowany`)
      }
      fetchTapSlots()
    } catch (error) {
      console.error('Failed to toggle block:', error)
      toast.error('Nie udało się zmienić statusu kranu')
    }
  }

  const getImageUrl = (uuid: string | null) => {
      if (!uuid || !session) {
          return null
      }

      return `https://cybertap.razniewski.eu/public/resource/get?uuid=${uuid}&code=default_public_code`
  }

  useEffect(() => {
    const getIds = async () => {
      const resolvedParams = await params
      setOrgId(parseInt(resolvedParams.orgid as string))
      setPubId(parseInt(resolvedParams.pubid as string))
    }
    getIds()
  }, [params])

  const fetchTapSlots = async () => {
    if (!session || !orgId || !pubId) return
    
    setLoading(true)
    try {
      const slots = await apiClient.listTapSlots(session, orgId, pubId)
      setTapSlots(slots)
    } catch (error) {
      console.error('Failed to fetch tap slots:', error)
      toast.error('Nie udało się pobrać kranów')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId && pubId) {
      fetchTapSlots()
    }
  }, [orgId, pubId, session])

  const handleOpenPrecisionDialog = (slot: TapSlotWithProduct) => {
    setSelectedSlot(slot)
    setNewPrecision(slot.precision?.toString() || '')
    setPrecisionDialogOpen(true)
  }

  const handleOpenUnloadDialog = (slot: TapSlotWithProduct) => {
    setSelectedSlot(slot)
    setUnloadDialogOpen(true)
  }

  const handleUpdatePrecision = async () => {
    if (!selectedSlot || !session) return
    
    // TODO: Implement precision update endpoint
    toast.info('Funkcja w przygotowaniu')
    setPrecisionDialogOpen(false)
  }

  const handleUnload = async () => {
    if (!selectedSlot || !session) return
    
    // TODO: Implement unload endpoint (take off TapAssignment)
    toast.info('Funkcja w przygotowaniu')
    setUnloadDialogOpen(false)
  }

  const getProgressPercentage = (slot: TapSlot) => {
    // This would need warehouse item data - for now return 0
    // You'll need to fetch warehouse item data through the slot
    return 0
  }

  const getProgressColor = (percentage: number) => {
    if (percentage > 70) return 'bg-red-500'
    if (percentage > 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading && !orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Urządzenia pubu</CardTitle>
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
          <CardTitle>Krany w pubie</CardTitle>
          <CardDescription>
            Zarządzaj kranami i ich stanami
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Taps Grid */}
      {tapSlots == null || tapSlots.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Beer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Brak kranów</h3>
              <p className="text-muted-foreground">
                Skontaktuj się z administratorem
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {tapSlots
            .sort((a, b) => a.position - b.position)
            .map((slot) => {
              const hasProduct = slot.product_name && slot.product_id
              const hasTap = slot.tap_id !== null
              const progressPercentage = getProgressPercentage(slot)
            const imageUrl = getImageUrl(slot.main_image_resource_uuid)
              
              return (
                <Card key={slot.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">Kran {slot.position}</CardTitle>
                        {!hasTap && (
                          <Badge variant="secondary" className="text-xs">
                            Brak kranu
                          </Badge>
                        )}
                        {slot.blocked && (
                            <Badge variant="destructive" className="text-xs">
                              Zablokowany
                            </Badge>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenPrecisionDialog(slot)}>
                            <Gauge className="h-4 w-4 mr-2" />
                            Zmień precyzję
                          </DropdownMenuItem>
                          {hasProduct && (
                            <DropdownMenuItem 
                              onClick={() => handleOpenUnloadDialog(slot)}
                              variant="destructive"
                            >
                              <PackageMinus className="h-4 w-4 mr-2" />
                              Odładuj produkt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleBlock(slot)}>
                            {slot.blocked ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Odblokuj
                                </>
                            ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Zablokuj
                                </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Product */}

          {hasProduct && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
              {imageUrl ? (
                <img 
                  src={imageUrl}
                  alt={slot.product_name || 'Produkt'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback na ikonę gdy obrazek się nie wczyta
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Beer className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Załadowane</Label>
                      <p className="text-sm font-medium mt-1">
                        {hasProduct ? slot.product_name : 'Brak produktu'}
                      </p>
                    </div>

                    {/* Progress bar - tylko gdy jest produkt */}
                    {hasProduct && (
                        <BarrelProgress
                            charged={slot.charged_volume}
                            total={slot.total_volume}
                        />
                    )}

                    {/* Precision */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Precyzja</Label>
                      <p className="text-sm font-medium mt-1">
                        {slot.precision ? `${slot.precision.toFixed(2)}ml` : 'Nie ustawiono'}
                      </p>
                    </div>

                    {/* Status indicator */}
                    {!hasTap && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Przypisz fizyczny kran w sekcji urządzeń
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Precision Dialog */}
      <Dialog open={precisionDialogOpen} onOpenChange={setPrecisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień precyzję kranu</DialogTitle>
            <DialogDescription>
              Kran {selectedSlot?.position}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nowa precyzja (ml)</Label>
              <Input
                type="number"
                step="0.01"
                value={newPrecision}
                onChange={(e) => setNewPrecision(e.target.value)}
                placeholder="1.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Precyzja określa ile ml przypada na jeden impuls z kranu
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setPrecisionDialogOpen(false)}
                disabled={submitting}
              >
                Anuluj
              </Button>
              <Button 
                onClick={handleUpdatePrecision}
                disabled={submitting || !newPrecision}
              >
                Zapisz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unload Dialog */}
      <Dialog open={unloadDialogOpen} onOpenChange={setUnloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odładuj produkt z kranu</DialogTitle>
            <DialogDescription>
              Kran {selectedSlot?.position} - {selectedSlot?.product_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ta operacja odepnie produkt od kranu. Produkt pozostanie w magazynie i będzie można go przypisać ponownie.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setUnloadDialogOpen(false)}
                disabled={submitting}
              >
                Anuluj
              </Button>
              <Button 
                variant="destructive"
                onClick={handleUnload}
                disabled={submitting}
              >
                Odładuj produkt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}