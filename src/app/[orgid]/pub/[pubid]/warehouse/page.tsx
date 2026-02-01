'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  apiClient,
  type WarehouseItem,
  type TapSlotWithProduct
} from '@/lib/apiClient'
import { 
  Package,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageMinus,
  Zap,
  AlertCircle,
  Beer,
  Wine,
  Droplets,
  Flame
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

type ProductType = 'BEER' | 'HARD' | 'WINE' | 'NONALCO'

export default function PubWarehousePage() {
  const { session } = useAuth()
  const params = useParams()
  const [orgId, setOrgId] = useState<number | null>(null)
  const [pubId, setPubId] = useState<number | null>(null)
  
  const [activeTab, setActiveTab] = useState<ProductType>('BEER')
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const pageSize = 20

  // Dialogs
  const [takeOffDialogOpen, setTakeOffDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null)
  const [takeOffNote, setTakeOffNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Tap slots
  const [tapSlots, setTapSlots] = useState<TapSlotWithProduct[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const tabs = [
    { id: 'BEER' as ProductType, label: 'Piwa', icon: Beer, color: 'text-amber-600' },
    { id: 'HARD' as ProductType, label: 'Mocne', icon: Flame, color: 'text-red-600' },
    { id: 'WINE' as ProductType, label: 'Wina', icon: Wine, color: 'text-purple-600' },
    { id: 'NONALCO' as ProductType, label: 'Bezalkoholowe', icon: Droplets, color: 'text-blue-600' },
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

  const fetchWarehouse = useCallback(async (page = 1, search = '', activeFilter = true) => {
    if (!session || !orgId || !pubId) return
    
    setLoading(true)
    try {
      const response = await apiClient.listWarehouse(session, {
        organizationId: orgId,
        pubId: pubId,
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        activeOnly: activeFilter
      })

      // Filter by active tab
      const filteredData = response.data.filter(item => item.product_type === activeTab)
      
      setWarehouseItems(filteredData)
      setCurrentPage(response.pagination.page)
      setTotalPages(response.pagination.total_pages)
      setTotalCount(filteredData.length)
      setHasNext(response.pagination.has_next)
      setHasPrev(response.pagination.has_prev)
    } catch (error) {
      console.error('Failed to fetch warehouse:', error)
      toast.error('Nie udało się pobrać magazynu')
    } finally {
      setLoading(false)
    }
  }, [session, orgId, pubId, activeTab])

  useEffect(() => {
    if (orgId && pubId) {
      setCurrentPage(1)
      fetchWarehouse(1, searchTerm, activeOnly)
    }
  }, [orgId, pubId, activeOnly, activeTab])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (orgId && pubId) {
        setCurrentPage(1)
        fetchWarehouse(1, searchTerm, activeOnly)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handlePageChange = (newPage: number) => {
    fetchWarehouse(newPage, searchTerm, activeOnly)
  }

  const fetchTapSlots = async () => {
    if (!session || !orgId || !pubId) return
    
    setLoadingSlots(true)
    try {
      const slots = await apiClient.listTapSlots(session, orgId, pubId)
      setTapSlots(slots)
    } catch (error) {
      console.error('Failed to fetch tap slots:', error)
      toast.error('Nie udało się pobrać slotów')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleOpenAssignDialog = async (item: WarehouseItem) => {
    setSelectedItem(item)
    await fetchTapSlots()
    setAssignDialogOpen(true)
  }

  const handleAssignToSlot = async (slotId: number) => {
    if (!selectedItem || !session) return
    
    setSubmitting(true)
    try {
      await apiClient.assignWarehouseItem(session, {
        warehouse_item_id: selectedItem.id,
        tap_slot_id: slotId
      })
      toast.success('Przypisano do kranu')
      setAssignDialogOpen(false)
      setSelectedItem(null)
      fetchWarehouse(currentPage, searchTerm, activeOnly)
    } catch (error) {
      console.error('Failed to assign:', error)
      toast.error('Nie udało się przypisać do kranu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenTakeOffDialog = (item: WarehouseItem) => {
    setSelectedItem(item)
    setTakeOffNote('')
    setTakeOffDialogOpen(true)
  }

  const handleTakeOff = async () => {
    if (!selectedItem || !session) return
    
    setSubmitting(true)
    try {
      await apiClient.takeOffWarehouseItem(session, {
        warehouse_item_id: selectedItem.id,
        note: takeOffNote.trim() || undefined
      })
      toast.success('Zdjęto z magazynu')
      setTakeOffDialogOpen(false)
      setSelectedItem(null)
      setTakeOffNote('')
      fetchWarehouse(currentPage, searchTerm, activeOnly)
    } catch (error) {
      console.error('Failed to take off:', error)
      toast.error('Nie udało się zdjąć z magazynu')
    } finally {
      setSubmitting(false)
    }
  }

  const getProductTypeBadge = (type: string) => {
    const colors = {
      BEER: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      HARD: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      WINE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      NONALCO: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  if (loading && !orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Magazyn</CardTitle>
          <CardDescription>Ładowanie magazynu...</CardDescription>
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
              <CardTitle>Magazyn</CardTitle>
              <CardDescription>Zarządzaj stanami magazynowymi pubu</CardDescription>
            </div>
            <Button
              variant={activeOnly ? 'default' : 'outline'}
              onClick={() => setActiveOnly(!activeOnly)}
            >
              {activeOnly ? 'Tylko aktywne' : 'Wszystkie'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs and Search */}
      <Card>
        <CardContent className="pt-6">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1"
                >
                  <Icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? '' : tab.color}`} />
                  {tab.label}
                </Button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Szukaj produktów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {tabs.find(t => t.id === activeTab)?.label} {searchTerm && `(wyszukiwanie: "${searchTerm}")`}
            </CardTitle>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!loading && warehouseItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Brak pozycji</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `Nie znaleziono pozycji zawierających "${searchTerm}"`
                  : activeOnly 
                    ? `Nie ma aktywnych pozycji typu ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} w magazynie`
                    : `Nie ma żadnych pozycji typu ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} w magazynie`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Produkt</th>
                      <th className="text-left p-2">Objętość</th>
                      <th className="text-left p-2">Nalano</th>
                      <th className="text-left p-2">Pozostało</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Utworzono</th>
                      <th className="text-left p-2">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseItems.map((item) => {
                      const remaining = item.volume - item.charged_volume
                      const percentageUsed = (item.charged_volume / item.volume) * 100
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{item.product_name}</td>
                          <td className="p-2">{(item.volume / 1000).toFixed(1)}L</td>
                          <td className="p-2">{(item.charged_volume / 1000).toFixed(1)}L</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span>{(remaining / 1000).toFixed(1)}L</span>
                              <span className="text-xs text-muted-foreground">
                                ({(100 - percentageUsed).toFixed(0)}%)
                              </span>
                            </div>
                          </td>
                          <td className="p-2">
                            {item.taken_off_at ? (
                              <Badge variant="secondary">Zdjęte</Badge>
                            ) : (
                              <Badge variant="default">Aktywne</Badge>
                            )}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={!!item.taken_off_at}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenAssignDialog(item)}
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  Przydziel do kranu
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenTakeOffDialog(item)}
                                  variant="destructive"
                                >
                                  <PackageMinus className="h-4 w-4 mr-2" />
                                  Zdejmij z magazynu
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    Strona {currentPage} z {totalPages} • {totalCount} pozycji
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPrev || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Poprzednia
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasNext || loading}
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

      {/* Assign to Tap Slot Dialog */}
<Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle className="text-xl">Przydziel do kranu</DialogTitle>
      <DialogDescription className="text-base">
        {selectedItem?.product_name}
      </DialogDescription>
    </DialogHeader>
    
    {loadingSlots ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : tapSlots.length === 0 ? (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Brak dostępnych slotów. Utwórz sloty w sekcji urządzeń pubu.
        </AlertDescription>
      </Alert>
    ) : (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
          {tapSlots
            .sort((a, b) => a.position - b.position)
            .map((slot) => {
              const hasProduct = slot.product_name && slot.product_id
              
              return (
                <Button
                  key={slot.id}
                  variant={hasProduct ? "secondary" : "outline"}
                  className={`h-auto min-h-28 flex flex-col justify-start items-stretch p-4 relative gap-2 ${
                    hasProduct ? 'hover:bg-secondary/80' : 'hover:bg-primary/10'
                  }`}
                  onClick={() => handleAssignToSlot(slot.id)}
                  disabled={submitting}
                >
                  <div className="text-base font-semibold">Slot {slot.position}</div>
                  
                  {hasProduct ? (
                    <div className="text-sm text-left break-words hyphens-auto flex-1 leading-relaxed">
                      {slot.product_name}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex-1">
                      Wolny
                    </div>
                  )}
                  
                  {!slot.tap_id && (
                    <div className="mt-auto pt-2 border-t border-border/50">
                      <Badge 
                        variant="secondary"
                        className="text-sm px-3 py-1 w-full justify-center"
                      >
                        Brak kranu
                      </Badge>
                    </div>
                  )}
                </Button>
              )
            })}
        </div>
        
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          Kliknij na slot aby przypisać produkt. Możesz zamienić istniejący produkt.
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Take Off Dialog */}
      <Dialog open={takeOffDialogOpen} onOpenChange={setTakeOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zdejmij z magazynu</DialogTitle>
            <DialogDescription>
              {selectedItem?.product_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ta operacja oznaczy pozycję jako zdjętą z magazynu. Nie będzie można jej już przypisać do kranu.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Notatka (opcjonalnie)</Label>
              <Input
                value={takeOffNote}
                onChange={(e) => setTakeOffNote(e.target.value)}
                placeholder="Np. pusty keg, uszkodzony, zwrot..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {takeOffNote.length}/500 znaków
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setTakeOffDialogOpen(false)}
                disabled={submitting}
              >
                Anuluj
              </Button>
              <Button 
                variant="destructive"
                onClick={handleTakeOff}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Zdejmowanie...
                  </>
                ) : (
                  'Zdejmij z magazynu'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}