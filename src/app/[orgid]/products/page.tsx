// src/app/[orgid]/products/page.tsx
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
  type Product,
  type BeerProduct,
  type HardProduct,
  type WineProduct,
  type Resource
} from '@/lib/apiClient'

import {
  Plus,
  Search,
  Beer,
  Wine,
  Droplets,
  Flame,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  ImageIcon,
  Pencil
} from 'lucide-react'
import { toast } from 'sonner'

type ProductType = 'beer' | 'hard' | 'wine' | 'nonalco'

interface ProductFormState {
  id: number
  name: string
  mainImageResourceUUID: string
  glassImageResourceUUID: string
  pricePerVisibleVolume: number
  visibleVolume: number
  defaultWarehouseVolume: number
  active: boolean
  // Beer specific
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  brewery: string
  style: string
  // Hard specific
  smokyness: number
  wood: number
  strongness: number
}

const initialProductState: ProductFormState = {
  id: 0,
  name: '',
  mainImageResourceUUID: '',
  glassImageResourceUUID: '',
  pricePerVisibleVolume: 1500,
  visibleVolume: 500,
  defaultWarehouseVolume: 5000,
  active: true,
  bitterness: 5,
  sweetness: 5,
  acidity: 5,
  extract: 12,
  alcohol: 5,
  brewery: '',
  style: '',
  smokyness: 5,
  wood: 5,
  strongness: 5,
}

export default function OrganizationProductsPage() {
  const { session } = useAuth()
  const params = useParams()
  const [orgId, setOrgId] = useState<number | null>(null)

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editProduct, setEditProduct] = useState<ProductFormState>(initialProductState)

  const [activeTab, setActiveTab] = useState<ProductType>('beer')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false)
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceField, setSelectedResourceField] = useState<'main' | 'glass'>('main')
  const [loadingResources, setLoadingResources] = useState(false)
  const [resourceSearchTerm, setResourceSearchTerm] = useState('')

  // Track which dialog is requesting resource (add or edit)
  const [resourceDialogMode, setResourceDialogMode] = useState<'add' | 'edit'>('add')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const pageSize = 10

  // Form states for adding product
  const [newProduct, setNewProduct] = useState<ProductFormState>(initialProductState)

  // Form states for warehouse
  const [warehouseForm, setWarehouseForm] = useState({
    quantity: 1,
    volume: 5000,
    pubId: 0,
  })

  // Available pubs
  const { userInfo } = useAuth()
  const availablePubs = userInfo && orgId ?
      Array.from(new Map(
          userInfo
              .filter(info => info.org_id === orgId)
              .map(info => [info.pub_id, { id: info.pub_id, name: info.pub_name }])
      ).values())
      : []

  const tabs = [
    { id: 'beer' as ProductType, label: 'Piwa', icon: Beer, color: 'text-amber-600' },
    { id: 'hard' as ProductType, label: 'Mocne', icon: Flame, color: 'text-red-600' },
    { id: 'wine' as ProductType, label: 'Wina', icon: Wine, color: 'text-purple-600' },
    { id: 'nonalco' as ProductType, label: 'Bezalkoholowe', icon: Droplets, color: 'text-blue-600' },
  ]

  // Get orgId from params
  useEffect(() => {
    const getOrgId = async () => {
      const resolvedParams = await params
      setOrgId(parseInt(resolvedParams.orgid as string))
    }
    getOrgId()
  }, [params])

  const fetchProducts = useCallback(async (page = 1, search = '') => {
    if (!session || !orgId) return

    setLoading(true)
    try {
      let response
      const queryParams = {
        organizationId: orgId,
        page,
        limit: pageSize,
        search: search.trim() || undefined
      }

      switch (activeTab) {
        case 'beer':
          response = await apiClient.listBeers(session, queryParams)
          break
        case 'hard':
          response = await apiClient.listHards(session, queryParams)
          break
        case 'wine':
          response = await apiClient.listWines(session, queryParams)
          break
        case 'nonalco':
          response = await apiClient.listNonAlcoholics(session, queryParams)
          break
      }

      setProducts(response.data)
      setCurrentPage(response.pagination.page)
      setTotalPages(response.pagination.total_pages)
      setTotalCount(response.pagination.total)
      setHasNext(response.pagination.has_next)
      setHasPrev(response.pagination.has_prev)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Nie udało się pobrać produktów')
    } finally {
      setLoading(false)
    }
  }, [session, orgId, activeTab])

  useEffect(() => {
    if (orgId) {
      setCurrentPage(1)
      fetchProducts(1, searchTerm)
    }
  }, [activeTab, orgId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (orgId) {
        setCurrentPage(1)
        fetchProducts(1, searchTerm)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage, searchTerm)
  }

  const fetchResources = async () => {
    if (!session || !orgId) return

    setLoadingResources(true)
    try {
      const response = await apiClient.listResources(session, {
        organizationId: orgId,
        page: 1,
        limit: 50,
        search: resourceSearchTerm.trim() || undefined
      })
      setResources(response.data)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      toast.error('Nie udało się pobrać zasobów')
    } finally {
      setLoadingResources(false)
    }
  }

  // Debounced resource search
  useEffect(() => {
    if (resourceDialogOpen) {
      const timeoutId = setTimeout(() => {
        fetchResources()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [resourceSearchTerm, resourceDialogOpen])

  const handleAddProduct = async () => {
    if (!session || !orgId) return

    try {
      const baseData = {
        name: newProduct.name,
        main_image_resource_uuid: newProduct.mainImageResourceUUID || undefined,
        glass_image_resource_uuid: newProduct.glassImageResourceUUID || undefined,
        price_per_visible_volume: newProduct.pricePerVisibleVolume,
        visible_volume: newProduct.visibleVolume,
        default_warehouse_volume: newProduct.defaultWarehouseVolume,
        org_id: orgId,
      }

      switch (activeTab) {
        case 'beer':
          await apiClient.createBeer(session, {
            ...baseData,
            bitterness: newProduct.bitterness,
            sweetness: newProduct.sweetness,
            acidity: newProduct.acidity,
            extract: newProduct.extract,
            alcohol: newProduct.alcohol,
            brewery: newProduct.brewery,
            style: newProduct.style,
          })
          break
        case 'hard':
          await apiClient.createHard(session, {
            ...baseData,
            sweetness: newProduct.sweetness,
            smokyness: newProduct.smokyness,
            wood: newProduct.wood,
            strongness: newProduct.strongness,
            extract: newProduct.extract,
            alcohol: newProduct.alcohol,
            style: newProduct.style,
          })
          break
        case 'wine':
          await apiClient.createWine(session, {
            ...baseData,
            bitterness: newProduct.bitterness,
            sweetness: newProduct.sweetness,
            acidity: newProduct.acidity,
            extract: newProduct.extract,
            alcohol: newProduct.alcohol,
            style: newProduct.style,
          })
          break
        case 'nonalco':
          await apiClient.createNonAlcoholic(session, baseData)
          break
      }

      toast.success('Produkt został dodany pomyślnie')
      setAddDialogOpen(false)
      setNewProduct(initialProductState)
      fetchProducts(currentPage, searchTerm)
    } catch (error) {
      console.error('Failed to add product:', error)
      toast.error('Nie udało się dodać produktu')
    }
  }

  // Open edit dialog with product data
  const openEditDialog = (product: Product) => {
    setEditingProduct(product)

    setEditProduct({
      id: product.id,
      name: product.name,
      mainImageResourceUUID: product.main_image_resource_uuid || '',
      glassImageResourceUUID: product.glass_image_resource_uuid || '',
      pricePerVisibleVolume: product.price_per_visible_volume,
      visibleVolume: product.visible_volume,
      defaultWarehouseVolume: product.default_warehouse_volume,
      active: product.active,
      // Beer/Wine fields
      bitterness: (product as BeerProduct).bitterness || 0,
      sweetness: (product as BeerProduct).sweetness || 0,
      acidity: (product as BeerProduct).acidity || 0,
      extract: (product as BeerProduct).extract || 0,
      alcohol: (product as BeerProduct).alcohol || 0,
      brewery: (product as BeerProduct).brewery || '',
      style: (product as BeerProduct).style || (product as HardProduct).style || (product as WineProduct).style || '',
      // Hard specific
      smokyness: (product as HardProduct).smokyness || 0,
      wood: (product as HardProduct).wood || 0,
      strongness: (product as HardProduct).strongness || 0,
    })

    setEditDialogOpen(true)
  }

  // Handle product update
  const handleUpdateProduct = async () => {
    if (!session || !editingProduct) return

    try {
      const baseData = {
        id: editProduct.id,
        name: editProduct.name,
        main_image_resource_uuid: editProduct.mainImageResourceUUID || null,
        glass_image_resource_uuid: editProduct.glassImageResourceUUID || null,
        price_per_visible_volume: editProduct.pricePerVisibleVolume,
        visible_volume: editProduct.visibleVolume,
        default_warehouse_volume: editProduct.defaultWarehouseVolume,
        active: editProduct.active,
      }

      switch (activeTab) {
        case 'beer':
          await apiClient.updateBeer(session, {
            ...baseData,
            bitterness: editProduct.bitterness,
            sweetness: editProduct.sweetness,
            acidity: editProduct.acidity,
            extract: editProduct.extract,
            alcohol: editProduct.alcohol,
            brewery: editProduct.brewery,
            style: editProduct.style,
          })
          break
        case 'hard':
          await apiClient.updateHard(session, {
            ...baseData,
            sweetness: editProduct.sweetness,
            smokyness: editProduct.smokyness,
            wood: editProduct.wood,
            strongness: editProduct.strongness,
            extract: editProduct.extract,
            alcohol: editProduct.alcohol,
            style: editProduct.style,
          })
          break
        case 'wine':
          await apiClient.updateWine(session, {
            ...baseData,
            bitterness: editProduct.bitterness,
            sweetness: editProduct.sweetness,
            acidity: editProduct.acidity,
            extract: editProduct.extract,
            alcohol: editProduct.alcohol,
            style: editProduct.style,
          })
          break
        case 'nonalco':
          await apiClient.updateNonAlcoholic(session, baseData)
          break
      }

      toast.success('Produkt został zaktualizowany')
      setEditDialogOpen(false)
      setEditingProduct(null)
      fetchProducts(currentPage, searchTerm)
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error('Nie udało się zaktualizować produktu')
    }
  }

  const handleWarehouseSubmit = async () => {
    if (!session || !orgId || !selectedProduct) return

    if (!warehouseForm.pubId) {
      toast.error('Wybierz pub')
      return
    }

    try {
      await apiClient.createWarehouseItem(session, {
        product_id: selectedProduct.id,
        quantity: warehouseForm.quantity,
        org_id: orgId,
        pub_id: warehouseForm.pubId,
        volume: warehouseForm.volume,
      })

      toast.success(`Przyjęto ${warehouseForm.quantity} szt. na magazyn`)
      setWarehouseDialogOpen(false)
      setSelectedProduct(null)
      setWarehouseForm({ quantity: 1, volume: 5000, pubId: 0 })
    } catch (error) {
      console.error('Failed to create warehouse items:', error)
      toast.error('Nie udało się przyjąć na magazyn')
    }
  }

  const openResourceDialog = (field: 'main' | 'glass', mode: 'add' | 'edit') => {
    setSelectedResourceField(field)
    setResourceDialogMode(mode)
    setResourceSearchTerm('')
    fetchResources()
    setResourceDialogOpen(true)
  }

  const selectResource = (uuid: string) => {
    if (resourceDialogMode === 'add') {
      if (selectedResourceField === 'main') {
        setNewProduct({ ...newProduct, mainImageResourceUUID: uuid })
      } else {
        setNewProduct({ ...newProduct, glassImageResourceUUID: uuid })
      }
    } else {
      if (selectedResourceField === 'main') {
        setEditProduct({ ...editProduct, mainImageResourceUUID: uuid })
      } else {
        setEditProduct({ ...editProduct, glassImageResourceUUID: uuid })
      }
    }
    setResourceDialogOpen(false)
  }

  const clearResource = (field: 'main' | 'glass', mode: 'add' | 'edit') => {
    if (mode === 'add') {
      if (field === 'main') {
        setNewProduct({ ...newProduct, mainImageResourceUUID: '' })
      } else {
        setNewProduct({ ...newProduct, glassImageResourceUUID: '' })
      }
    } else {
      if (field === 'main') {
        setEditProduct({ ...editProduct, mainImageResourceUUID: '' })
      } else {
        setEditProduct({ ...editProduct, glassImageResourceUUID: '' })
      }
    }
  }

  // Reusable product fields renderer
  const renderProductFields = (
      product: ProductFormState,
      setProduct: React.Dispatch<React.SetStateAction<ProductFormState>>,
      mode: 'add' | 'edit'
  ) => {
    const commonFields = (
        <>
          <div>
            <Label>Nazwa *</Label>
            <Input
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                placeholder="Nazwa produktu"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Zdjęcie główne</Label>
              <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openResourceDialog('main', mode)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {product.mainImageResourceUUID ? 'Zmień' : 'Wybierz'}
                </Button>
                {product.mainImageResourceUUID && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => clearResource('main', mode)}
                        title="Usuń zdjęcie"
                    >
                      ×
                    </Button>
                )}
              </div>
              {product.mainImageResourceUUID && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {product.mainImageResourceUUID}
                  </p>
              )}
            </div>
            <div>
              <Label>Zdjęcie szklanki</Label>
              <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openResourceDialog('glass', mode)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {product.glassImageResourceUUID ? 'Zmień' : 'Wybierz'}
                </Button>
                {product.glassImageResourceUUID && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => clearResource('glass', mode)}
                        title="Usuń zdjęcie"
                    >
                      ×
                    </Button>
                )}
              </div>
              {product.glassImageResourceUUID && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {product.glassImageResourceUUID}
                  </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cena (gr) *</Label>
              <Input
                  type="number"
                  value={product.pricePerVisibleVolume}
                  onChange={(e) => setProduct({ ...product, pricePerVisibleVolume: parseInt(e.target.value) || 0 })}
                  placeholder="1500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Za {product.visibleVolume}ml
              </p>
            </div>
            <div>
              <Label>Objętość widoczna (ml) *</Label>
              <Input
                  type="number"
                  value={product.visibleVolume}
                  onChange={(e) => setProduct({ ...product, visibleVolume: parseInt(e.target.value) || 500 })}
                  placeholder="500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Np. 100ml, 500ml
              </p>
            </div>
            <div>
              <Label>Pojemność beczki (ml) *</Label>
              <Input
                  type="number"
                  value={product.defaultWarehouseVolume}
                  onChange={(e) => setProduct({ ...product, defaultWarehouseVolume: parseInt(e.target.value) || 5000 })}
                  placeholder="5000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Np. 5000ml, 20000ml
              </p>
            </div>
          </div>
        </>
    )

    if (activeTab === 'beer') {
      return (
          <>
            {commonFields}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Browar</Label>
                <Input
                    value={product.brewery}
                    onChange={(e) => setProduct({ ...product, brewery: e.target.value })}
                    placeholder="Nazwa browaru"
                />
              </div>
              <div>
                <Label>Styl</Label>
                <Input
                    value={product.style}
                    onChange={(e) => setProduct({ ...product, style: e.target.value })}
                    placeholder="IPA, Lager, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Goryczka (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.bitterness}
                    onChange={(e) => setProduct({ ...product, bitterness: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Słodycz (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.sweetness}
                    onChange={(e) => setProduct({ ...product, sweetness: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Kwasowość (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.acidity}
                    onChange={(e) => setProduct({ ...product, acidity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ekstrakt (%)</Label>
                <Input
                    type="number"
                    value={product.extract}
                    onChange={(e) => setProduct({ ...product, extract: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Alkohol (%)</Label>
                <Input
                    type="number"
                    step="0.1"
                    value={product.alcohol}
                    onChange={(e) => setProduct({ ...product, alcohol: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </>
      )
    }

    if (activeTab === 'hard') {
      return (
          <>
            {commonFields}
            <div>
              <Label>Styl</Label>
              <Input
                  value={product.style}
                  onChange={(e) => setProduct({ ...product, style: e.target.value })}
                  placeholder="Whisky, Wódka, etc."
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Słodycz (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.sweetness}
                    onChange={(e) => setProduct({ ...product, sweetness: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Dymność (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.smokyness}
                    onChange={(e) => setProduct({ ...product, smokyness: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Drewno (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.wood}
                    onChange={(e) => setProduct({ ...product, wood: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Moc (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.strongness}
                    onChange={(e) => setProduct({ ...product, strongness: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ekstrakt (%)</Label>
                <Input
                    type="number"
                    value={product.extract}
                    onChange={(e) => setProduct({ ...product, extract: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Alkohol (%)</Label>
                <Input
                    type="number"
                    step="0.1"
                    value={product.alcohol}
                    onChange={(e) => setProduct({ ...product, alcohol: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </>
      )
    }

    if (activeTab === 'wine') {
      return (
          <>
            {commonFields}
            <div>
              <Label>Styl</Label>
              <Input
                  value={product.style}
                  onChange={(e) => setProduct({ ...product, style: e.target.value })}
                  placeholder="Czerwone, Białe, etc."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Goryczka (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.bitterness}
                    onChange={(e) => setProduct({ ...product, bitterness: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Słodycz (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.sweetness}
                    onChange={(e) => setProduct({ ...product, sweetness: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Kwasowość (0-5)</Label>
                <Input
                    type="number"
                    min="0"
                    max="5"
                    value={product.acidity}
                    onChange={(e) => setProduct({ ...product, acidity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ekstrakt (%)</Label>
                <Input
                    type="number"
                    value={product.extract}
                    onChange={(e) => setProduct({ ...product, extract: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Alkohol (%)</Label>
                <Input
                    type="number"
                    step="0.1"
                    value={product.alcohol}
                    onChange={(e) => setProduct({ ...product, alcohol: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </>
      )
    }

    // nonalco
    return commonFields
  }

  if (loading && !orgId) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>Produkty - Poziom organizacji</CardTitle>
            <CardDescription>Ładowanie produktów...</CardDescription>
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
                <CardTitle>Produkty</CardTitle>
                <CardDescription>Zarządzaj katalogiem produktów organizacji</CardDescription>
              </div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj produkt
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
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

            <div className="relative max-w-sm mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                  placeholder="Szukaj produktów..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Brak produktów</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? `Nie znaleziono produktów zawierających "${searchTerm}"` : 'Nie masz jeszcze żadnych produktów w tej kategorii'}
                  </p>
                  {!searchTerm && (
                      <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Dodaj pierwszy produkt
                      </Button>
                  )}
                </div>
            ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nazwa</th>
                        <th className="text-left p-2">Cena</th>
                        <th className="text-left p-2">Objętość</th>
                        {activeTab === 'beer' && <th className="text-left p-2">Browar</th>}
                        {activeTab !== 'nonalco' && <th className="text-left p-2">Alkohol</th>}
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Akcje</th>
                      </tr>
                      </thead>
                      <tbody>
                      {products.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{product.name}</td>
                            <td className="p-2">
                              {product.price_per_visible_volume && product.visible_volume
                                  ? `${(product.price_per_visible_volume / 100).toFixed(2)} zł / ${product.visible_volume}ml`
                                  : 'N/A'
                              }
                            </td>
                            <td className="p-2">{product.visible_volume}ml</td>
                            {activeTab === 'beer' && <td className="p-2">{(product as BeerProduct).brewery || '-'}</td>}
                            {activeTab !== 'nonalco' && <td className="p-2">{(product as BeerProduct | HardProduct | WineProduct).alcohol}%</td>}
                            <td className="p-2">
                              <Badge variant={product.active ? 'default' : 'secondary'}>
                                {product.active ? 'Aktywny' : 'Nieaktywny'}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edytuj
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedProduct(product)
                                        setWarehouseForm({
                                          quantity: 1,
                                          volume: product.default_warehouse_volume,
                                          pubId: availablePubs.length > 0 ? availablePubs[0].id : 0
                                        })
                                        setWarehouseDialogOpen(true)
                                      }}
                                  >
                                    <Package className="h-4 w-4 mr-2" />
                                    Przyjmij na magazyn
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <div className="text-sm text-muted-foreground">
                          Strona {currentPage} z {totalPages} • {totalCount} produktów
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

        {/* Add Product Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Dodaj {activeTab === 'beer' ? 'piwo' : activeTab === 'wine' ? 'wino' : activeTab === 'hard' ? 'mocny alkohol' : 'napój bezalkoholowy'}
              </DialogTitle>
              <DialogDescription>Wypełnij informacje o produkcie</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {renderProductFields(newProduct, setNewProduct, 'add')}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleAddProduct} disabled={!newProduct.name}>
                  Dodaj produkt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edytuj {activeTab === 'beer' ? 'piwo' : activeTab === 'wine' ? 'wino' : activeTab === 'hard' ? 'mocny alkohol' : 'napój bezalkoholowy'}
              </DialogTitle>
              <DialogDescription>Edytuj informacje o produkcie</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {renderProductFields(editProduct, setEditProduct, 'edit')}

              {/* Active toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                    type="checkbox"
                    id="active"
                    checked={editProduct.active}
                    onChange={(e) => setEditProduct({ ...editProduct, active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="active">Produkt aktywny</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleUpdateProduct} disabled={!editProduct.name}>
                  Zapisz zmiany
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warehouse Dialog */}
        <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Przyjmij na magazyn</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pub *</Label>
                <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={warehouseForm.pubId}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pubId: parseInt(e.target.value) })}
                >
                  <option value={0}>Wybierz pub</option>
                  {availablePubs.map((pub) => (
                      <option key={pub.id} value={pub.id}>
                        {pub.name}
                      </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Ilość sztuk *</Label>
                <Input
                    type="number"
                    min="1"
                    value={warehouseForm.quantity}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, quantity: parseInt(e.target.value) || 1 })}
                    placeholder="Ile sztuk przyjmujesz?"
                />
              </div>
              <div>
                <Label>Objętość beczki/butelki/kega (ml) *</Label>
                <Input
                    type="number"
                    min="1"
                    value={warehouseForm.volume}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, volume: parseInt(e.target.value) || 5000 })}
                    placeholder="5000"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Domyślnie: {selectedProduct?.default_warehouse_volume}ml
                </p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Razem:</span> {warehouseForm.quantity} x {warehouseForm.volume}ml = {(warehouseForm.quantity * warehouseForm.volume / 1000).toFixed(1)}L
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleWarehouseSubmit} disabled={!warehouseForm.pubId}>
                  Przyjmij na magazyn
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resource Selection Dialog */}
        <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wybierz zdjęcie</DialogTitle>
              <DialogDescription>
                Wybierz zdjęcie z biblioteki zasobów
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                  placeholder="Szukaj plików..."
                  value={resourceSearchTerm}
                  onChange={(e) => setResourceSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>

            {loadingResources ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {resources.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {resourceSearchTerm ? `Nie znaleziono plików zawierających "${resourceSearchTerm}"` : 'Brak dostępnych zasobów'}
                      </p>
                  ) : (
                      resources.map((resource) => (
                          <Button
                              key={resource.uuid}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => selectResource(resource.uuid)}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {resource.filename}
                          </Button>
                      ))
                  )}
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}