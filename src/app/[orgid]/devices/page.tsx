// src/app/[orgid]/devices/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { apiClient, TapDeviceInfo, CashDeskInfo, TapSlot } from '@/lib/apiClient'
import { Settings, Plus, Zap, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

export default function OrganizationDevicesPage() {
  const { session, userInfo } = useAuth()
  const params = useParams()
  const [orgId, setOrgId] = useState<number | null>(null)
  
  const [devices, setDevices] = useState<{ taps: TapDeviceInfo[], cashdesks: CashDeskInfo[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [tapSlotDialogOpen, setTapSlotDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<TapDeviceInfo | CashDeskInfo | null>(null)
  const [selectedTap, setSelectedTap] = useState<TapDeviceInfo | null>(null)
  const [availableTapSlots, setAvailableTapSlots] = useState<TapSlot[]>([])
  const [loadingTapSlots, setLoadingTapSlots] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [slotToReassign, setSlotToReassign] = useState<TapSlot | null>(null)

  // Get orgId from params
  useEffect(() => {
    const getOrgId = async () => {
      const resolvedParams = await params
      setOrgId(parseInt(resolvedParams.orgid as string))
    }
    getOrgId()
  }, [params])

  // Get available pubs for this organization
  const availablePubs = userInfo && orgId ? 
    Array.from(new Map(
      userInfo
        .filter(info => info.org_id === orgId)
        .map(info => [info.pub_id, { id: info.pub_id, name: info.pub_name }])
    ).values()) 
    : []

  useEffect(() => {
    const fetchDevices = async () => {
      if (!session || !orgId) return
      
      try {
        const devicesData = await apiClient.listDevices(session, orgId)
        setDevices(devicesData)
      } catch (error) {
        console.error('Failed to fetch devices:', error)
        toast.error('Nie udało się pobrać urządzeń')
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [session, orgId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nigdy'
    return new Date(dateString).toLocaleString('pl-PL')
  }

  const getDeviceStatus = (device: TapDeviceInfo | CashDeskInfo) => {
    if ('blocked' in device && device.blocked) {
      return <Badge variant="destructive">Zablokowane</Badge>
    }
    console.log(device)
    if ('last_connected_at' in device) {
      const lastConnection = device.last_connected_at ? new Date(device.last_connected_at) : null
      const isRecent = lastConnection && (Date.now() - lastConnection.getTime()) < 5 * 60 * 1000 // 5 minutes
      return isRecent ? 
        <Badge className="bg-green-500">Online</Badge> : 
        <Badge variant="secondary">Offline</Badge>
    }
    return <Badge variant="secondary">Nieznany</Badge>
  }

  const getPubName = (pubId: number | null) => {
    if (!pubId) return 'Nieprzypisany'
    const pub = availablePubs.find(p => p.id === pubId)
    return pub ? pub.name : `Pub ID: ${pubId}`
  }

  const handleAssignToPub = async (deviceId: number, pubId: number, deviceType: 'tap' | 'cashdesk') => {
    try {
      if (deviceType === 'tap') {
        await apiClient.assignTapToPub(session!, deviceId, pubId)
      } else {
        await apiClient.assignCashdeskToPub(session!, deviceId, pubId)
      }
      toast.success(`${deviceType === 'tap' ? 'Kran' : 'Kasa'} została przypisana do pubu`)
      setAssignDialogOpen(false)
      // Refresh devices data
      const devicesData = await apiClient.listDevices(session!, orgId!)
      setDevices(devicesData)
    } catch (error) {
      toast.error('Nie udało się przypisać urządzenia do pubu')
      console.error('Assignment error:', error)
    }
  }

  const handleAssignToTapSlot = async (tap: TapDeviceInfo) => {
    if (!tap.pub_id) {
      toast.error('Kran musi być najpierw przypisany do pubu')
      return
    }
    
    setSelectedTap(tap)
    setLoadingTapSlots(true)
    
    try {
      const tapSlots = await apiClient.listTapSlots(session!, orgId!, tap.pub_id)
      setAvailableTapSlots(tapSlots)
      setTapSlotDialogOpen(true)
    } catch (error) {
      toast.error('Nie udało się pobrać slotów')
      console.error('TapSlot loading error:', error)
    } finally {
      setLoadingTapSlots(false)
    }
  }

  const handleTapSlotAssignment = async (tapSlotId: number) => {
    if (!selectedTap) return

    try {
      await apiClient.assignTapSlot(session!, { tap_id: selectedTap.id, tap_slot_id: tapSlotId })
      toast.success('Kran został przypisany do slotu')
      setTapSlotDialogOpen(false)
      setSelectedTap(null)
      setAvailableTapSlots([])
      setConfirmDialogOpen(false)
      setSlotToReassign(null)
      // Refresh devices data
      const devicesData = await apiClient.listDevices(session!, orgId!)
      setDevices(devicesData)
    } catch (error) {
      toast.error('Nie udało się przypisać kranu do slotu')
      console.error('TapSlot assignment error:', error)
    }
  }

  const handleSlotClick = (slot: TapSlot) => {
    if (slot.tap_id) {
      // Slot is occupied, ask for confirmation
      setSlotToReassign(slot)
      setConfirmDialogOpen(true)
    } else {
      // Slot is free, assign directly
      handleTapSlotAssignment(slot.id)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Urządzenia - Poziom organizacji</CardTitle>
          <CardDescription>Ładowanie urządzeń...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Pobieranie danych urządzeń...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Urządzenia - Poziom organizacji</CardTitle>
          <CardDescription>
            Zarządzaj wszystkimi urządzeniami w organizacji. Przypisuj krany do slotów i pubów.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Taps Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Krany ({devices?.taps.length || 0})
              </CardTitle>
              <CardDescription>
                Zarządzaj kranami do nalewania piwa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">UUID</th>
                  <th className="text-left p-2">Pub</th>
                  <th className="text-left p-2">Slot</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Precyzja</th>
                  <th className="text-left p-2">Ostatnie połączenie</th>
                  <th className="text-left p-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {devices?.taps.map((tap) => (
                  <tr key={tap.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono ">{tap.uuid.slice(0, 16)}</td>
                    <td className="p-2">{getPubName(tap.pub_id)}</td>
                    <td className="p-2">
                      {tap.tap_slot_number ? `Slot ${tap.tap_slot_number}` : 'Nieprzypisany'}
                    </td>
                    <td className="p-2">{getDeviceStatus(tap)}</td>
                    <td className="p-2">{tap.precision === null ? 'N/A' : tap.precision.toFixed(2)}ml</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {formatDate(tap.last_connected_at)}
                    </td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedDevice(tap)
                              setAssignDialogOpen(true)
                            }}
                          >
                            Przypisz do pubu
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssignToTapSlot(tap)}
                            disabled={!tap.pub_id || loadingTapSlots}
                          >
                            {loadingTapSlots ? 'Ładowanie...' : 'Przypisz do slotu'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {(!devices?.taps || devices.taps.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Brak kranów w organizacji
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cash Desks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Kasy ({devices?.cashdesks.length || 0})
              </CardTitle>
              <CardDescription>
                Zarządzaj kasami fiskalnymi i systemami płatności
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">UUID</th>
                  <th className="text-left p-2">Pub</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Utworzono</th>
                  <th className="text-left p-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {devices?.cashdesks.map((cashdesk) => (
                  <tr key={cashdesk.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono ">{cashdesk.uuid.slice(0, 16)}</td>
                    <td className="p-2">{getPubName(cashdesk.pub_id)}</td>
                    <td className="p-2">{getDeviceStatus(cashdesk)}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {formatDate(cashdesk.created_at)}
                    </td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedDevice(cashdesk)
                              setAssignDialogOpen(true)
                            }}
                          >
                            Przypisz do pubu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {(!devices?.cashdesks || devices.cashdesks.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Brak kas w organizacji
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Przypisz {selectedDevice && 'blocked' in selectedDevice ? 'kran' : 'kasę'} do pubu
            </DialogTitle>
            <DialogDescription>
              Wybierz pub do którego chcesz przypisać urządzenie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availablePubs.map((pub) => (
              <Button
                key={pub.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAssignToPub(
                  selectedDevice?.id || 0, 
                  pub.id, 
                  selectedDevice && 'blocked' in selectedDevice ? 'tap' : 'cashdesk'
                )}
              >
                {pub.name}
              </Button>
            ))}
            {availablePubs.length === 0 && (
              <p className="text-muted-foreground text-center">
                Brak dostępnych pubów
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* TapSlot Assignment Dialog */}
      <Dialog open={tapSlotDialogOpen} onOpenChange={setTapSlotDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Przypisz kran do slotu
            </DialogTitle>
            <DialogDescription>
              Wybierz slot do którego chcesz przypisać kran w pubie &#34;{selectedTap?.pub_id ? getPubName(selectedTap.pub_id) : ''}&#34;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableTapSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                {availableTapSlots
                  .sort((a, b) => a.position - b.position)
                  .map((slot) => (
                  <Button
                    key={slot.id}
                    variant={slot.tap_id ? "secondary" : "outline"}
                    className={`h-20 flex flex-col justify-center items-center relative ${
                      slot.tap_id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'
                    }`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={false}
                  >
                    <div className="text-sm font-medium">Slot {slot.position}</div>
                    {slot.precision && (
                      <div className="text-xs text-muted-foreground">
                        {slot.precision.toFixed(1)}ml
                      </div>
                    )}
                    <Badge 
                      variant={slot.tap_id ? "destructive" : "secondary"}
                      className="absolute -top-1 -right-1 text-xs px-1"
                    >
                      {slot.tap_id ? 'Zajęty' : 'Wolny'}
                    </Badge>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {selectedTap?.pub_id ? 
                    'Brak slotów dla tego pubu. Utwórz sloty w sekcji zarządzania pubem.' : 
                    'Kran musi być najpierw przypisany do pubu'
                  }
                </p>
              </div>
            )}
            
            {availableTapSlots.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Dostępne sloty: {availableTapSlots.filter(s => !s.tap_id).length}</span>
                  <span>Zajęte sloty: {availableTapSlots.filter(s => s.tap_id).length}</span>
                  <span>Łącznie: {availableTapSlots.length}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Reassigning Occupied Slot */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź przepisanie slotu</DialogTitle>
            <DialogDescription>
              Slot {slotToReassign?.position} jest już zajęty przez inny kran. 
              Czy na pewno chcesz przepisać ten slot na wybrany kran?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="text-yellow-600 dark:text-yellow-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Uwaga
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Obecny kran zostanie odpięty od tego slotu i będzie musiał być przypisany do innego slotu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmDialogOpen(false)
                  setSlotToReassign(null)
                }}
              >
                Anuluj
              </Button>
              <Button 
                variant="destructive"
                onClick={() => slotToReassign && handleTapSlotAssignment(slotToReassign.id)}
              >
                Tak, przepisz slot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}