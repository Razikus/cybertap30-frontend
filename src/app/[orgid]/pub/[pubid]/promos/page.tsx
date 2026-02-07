// src/app/[orgid]/pub/[pubid]/promos/page.tsx
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
import { useRef } from 'react'
import { DateTimeInput } from '@/components/ui/datetime-input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    apiClient,
    type Promo,
    type CreatePromoRequest,
    type UpdatePromoRequest,
    type BeerProduct,
    type HardProduct,
    type WineProduct,
    type NonAlcoProduct,
} from '@/lib/apiClient'
import {
    Plus,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Pencil,
    Trash2,
    Tag,
    Clock,
    Percent,
    AlertCircle,
    CheckCircle,
    XCircle,
    Repeat,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

const DAYS_OF_WEEK = [
    { value: 0, label: 'Niedziela', short: 'Nd' },
    { value: 1, label: 'Poniedziałek', short: 'Pn' },
    { value: 2, label: 'Wtorek', short: 'Wt' },
    { value: 3, label: 'Środa', short: 'Śr' },
    { value: 4, label: 'Czwartek', short: 'Cz' },
    { value: 5, label: 'Piątek', short: 'Pt' },
    { value: 6, label: 'Sobota', short: 'Sb' },
]

const PRODUCT_TYPES = [
    { value: '', label: 'Wszystkie typy' },
    { value: 'BEER', label: 'Piwa' },
    { value: 'HARD', label: 'Mocne alkohole' },
    { value: 'WINE', label: 'Wina' },
    { value: 'NONALCO', label: 'Bezalkoholowe' },
]

type AnyProduct = BeerProduct | HardProduct | WineProduct | NonAlcoProduct

interface PromoFormData {
    name: string
    discount_percent: number
    product_type: string
    product_id: number | null
    valid_from: string
    valid_to: string
    recurrent: boolean
    recurrent_days: number[]
    recurrent_time_from: string
    recurrent_time_to: string
    priority: number
    active: boolean
}

const defaultFormData: PromoFormData = {
    name: '',
    discount_percent: 10,
    product_type: '',
    product_id: null,
    valid_from: new Date().toISOString(),
    valid_to: '',
    recurrent: false,
    recurrent_days: [],
    recurrent_time_from: '16:00',
    recurrent_time_to: '18:00',
    priority: 0,
    active: true,
}

interface ProductSearchComboboxProps {
    productType: string
    selectedProductId: number | null
    onSelect: (productId: number | null, productName: string | null) => void
    session: any
    orgId: number | null
}

function ProductSearchCombobox({ productType, selectedProductId, onSelect, session, orgId }: ProductSearchComboboxProps) {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<AnyProduct[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedName, setSelectedName] = useState<string | null>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Fetch selected product name on mount/change
    useEffect(() => {
        if (selectedProductId && session && orgId) {
            fetchProductName()
        } else {
            setSelectedName(null)
        }
    }, [selectedProductId, productType])

    const fetchProductName = async () => {
        if (!session || !orgId || !selectedProductId) return

        try {
            let data: AnyProduct[] = []
            switch (productType) {
                case 'BEER':
                    const beers = await apiClient.listBeers(session, { organizationId: orgId, limit: 100 })
                    data = beers.data
                    break
                case 'HARD':
                    const hards = await apiClient.listHards(session, { organizationId: orgId, limit: 100 })
                    data = hards.data
                    break
                case 'WINE':
                    const wines = await apiClient.listWines(session, { organizationId: orgId, limit: 100 })
                    data = wines.data
                    break
                case 'NONALCO':
                    const nonalcos = await apiClient.listNonAlcoholics(session, { organizationId: orgId, limit: 100 })
                    data = nonalcos.data
                    break
            }
            const product = data.find(p => p.id === selectedProductId)
            setSelectedName(product?.name || null)
        } catch (error) {
            console.error('Failed to fetch product name:', error)
        }
    }

    const searchProducts = async (query: string) => {
        if (!session || !orgId) return

        setLoading(true)
        try {
            let data: AnyProduct[] = []

            switch (productType) {
                case 'BEER':
                    const beers = await apiClient.listBeers(session, { organizationId: orgId, search: query, limit: 5 })
                    data = beers.data
                    break
                case 'HARD':
                    const hards = await apiClient.listHards(session, { organizationId: orgId, search: query, limit: 5 })
                    data = hards.data
                    break
                case 'WINE':
                    const wines = await apiClient.listWines(session, { organizationId: orgId, search: query, limit: 5 })
                    data = wines.data
                    break
                case 'NONALCO':
                    const nonalcos = await apiClient.listNonAlcoholics(session, { organizationId: orgId, search: query, limit: 5 })
                    data = nonalcos.data
                    break
            }

            setResults(data.slice(0, 5))
        } catch (error) {
            console.error('Failed to search products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setOpen(true)

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        if (value.trim().length >= 1) {
            debounceRef.current = setTimeout(() => {
                searchProducts(value.trim())
            }, 300)
        } else {
            setResults([])
        }
    }

    const handleSelect = (product: AnyProduct | null) => {
        if (product) {
            onSelect(product.id, product.name)
            setSelectedName(product.name)
            setSearch('')
        } else {
            onSelect(null, null)
            setSelectedName(null)
        }
        setOpen(false)
        setResults([])
    }

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const typeLabel = PRODUCT_TYPES.find(t => t.value === productType)?.label.toLowerCase() || 'produkty'

    return (
        <div className="space-y-2">
            <Label>Konkretny produkt (opcjonalnie)</Label>

            {selectedProductId && selectedName ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <span className="flex-1 text-sm">{selectedName}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelect(null)}
                        className="h-6 w-6 p-0"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div ref={containerRef} className="relative">
                    <Input
                        placeholder={`Szukaj wśród ${typeLabel}...`}
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => search.length >= 1 && setOpen(true)}
                    />

                    {open && (search.length >= 1 || loading) && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                            {loading ? (
                                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Szukam...
                                </div>
                            ) : results.length > 0 ? (
                                <div className="py-1">
                                    {results.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                            onClick={() => handleSelect(product)}
                                        >
                                            {product.name}
                                        </button>
                                    ))}
                                </div>
                            ) : search.length >= 1 ? (
                                <div className="p-3 text-sm text-muted-foreground">
                                    Brak wyników dla &quot;{search}&quot;
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Zostaw puste aby promocja dotyczyła wszystkich {typeLabel}
            </p>
        </div>
    )
}

export default function PubPromosPage() {
    const { session } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)
    const [pubId, setPubId] = useState<number | null>(null)

    const [promos, setPromos] = useState<Promo[]>([])
    const [loading, setLoading] = useState(true)
    const [activeOnly, setActiveOnly] = useState(false)

    // Products for selection
    const [products, setProducts] = useState<AnyProduct[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [hasNext, setHasNext] = useState(false)
    const [hasPrev, setHasPrev] = useState(false)
    const pageSize = 20

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null)
    const [formData, setFormData] = useState<PromoFormData>(defaultFormData)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const getIds = async () => {
            const resolvedParams = await params
            setOrgId(parseInt(resolvedParams.orgid as string))
            setPubId(parseInt(resolvedParams.pubid as string))
        }
        getIds()
    }, [params])

    // Fetch products when type changes
    const fetchProducts = useCallback(async (productType: string) => {
        if (!session || !orgId) return

        if (!productType) {
            setProducts([])
            return
        }

        setLoadingProducts(true)
        try {
            let data: AnyProduct[] = []

            switch (productType) {
                case 'BEER':
                    const beers = await apiClient.listBeers(session, { organizationId: orgId, limit: 100 })
                    data = beers.data
                    break
                case 'HARD':
                    const hards = await apiClient.listHards(session, { organizationId: orgId, limit: 100 })
                    data = hards.data
                    break
                case 'WINE':
                    const wines = await apiClient.listWines(session, { organizationId: orgId, limit: 100 })
                    data = wines.data
                    break
                case 'NONALCO':
                    const nonalcos = await apiClient.listNonAlcoholics(session, { organizationId: orgId, limit: 100 })
                    data = nonalcos.data
                    break
            }

            setProducts(data)
        } catch (error) {
            console.error('Failed to fetch products:', error)
            toast.error('Nie udało się pobrać produktów')
        } finally {
            setLoadingProducts(false)
        }
    }, [session, orgId])

    // When product_type changes in form, fetch products
    useEffect(() => {
        if (formData.product_type) {
            fetchProducts(formData.product_type)
        } else {
            setProducts([])
            setFormData(prev => ({ ...prev, product_id: null }))
        }
    }, [formData.product_type, fetchProducts])

    const fetchPromos = useCallback(async (page = 1) => {
        if (!session || !orgId || !pubId) return

        setLoading(true)
        try {
            const response = await apiClient.listPromos(session, {
                organizationId: orgId,
                pubId: pubId,
                page,
                limit: pageSize,
                activeOnly,
            })

            setPromos(response.data)
            setCurrentPage(response.pagination.page)
            setTotalPages(response.pagination.total_pages)
            setTotalCount(response.pagination.total)
            setHasNext(response.pagination.has_next)
            setHasPrev(response.pagination.has_prev)
        } catch (error) {
            console.error('Failed to fetch promos:', error)
            toast.error('Nie udało się pobrać promocji')
        } finally {
            setLoading(false)
        }
    }, [session, orgId, pubId, activeOnly])

    useEffect(() => {
        if (orgId && pubId) {
            fetchPromos(1)
        }
    }, [orgId, pubId, activeOnly, fetchPromos])

    const handlePageChange = (newPage: number) => {
        fetchPromos(newPage)
    }

    const handleOpenCreateDialog = () => {
        setFormData(defaultFormData)
        setProducts([])
        setCreateDialogOpen(true)
    }

    const handleOpenEditDialog = async (promo: Promo) => {
        setSelectedPromo(promo)

        const newFormData: PromoFormData = {
            name: promo.name,
            discount_percent: promo.discount_percent,
            product_type: promo.product_type || '',
            product_id: promo.product_id || null,
            valid_from: promo.valid_from ? promo.valid_from : '',
            valid_to: promo.valid_to ? promo.valid_to : '',
            recurrent: promo.recurrent,
            recurrent_days: promo.recurrent_days || [],
            recurrent_time_from: promo.recurrent_time_from || '16:00',
            recurrent_time_to: promo.recurrent_time_to || '18:00',
            priority: promo.priority,
            active: promo.active,
        }

        setFormData(newFormData)

        // Fetch products if type is set
        if (promo.product_type) {
            await fetchProducts(promo.product_type)
        }

        setEditDialogOpen(true)
    }

    const handleOpenDeleteDialog = (promo: Promo) => {
        setSelectedPromo(promo)
        setDeleteDialogOpen(true)
    }

    const handleCreate = async () => {
        if (!session || !orgId || !pubId) return

        if (!formData.name.trim()) {
            toast.error('Nazwa promocji jest wymagana')
            return
        }

        if (formData.recurrent && formData.recurrent_days.length === 0) {
            toast.error('Wybierz dni tygodnia dla promocji cyklicznej')
            return
        }

        setSubmitting(true)
        try {
            const request: CreatePromoRequest = {
                organization_id: orgId,
                pub_id: pubId,
                name: formData.name.trim(),
                discount_percent: formData.discount_percent,
                product_type: formData.product_type || undefined,
                product_id: formData.product_id || undefined,
                valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : undefined,
                valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : undefined,
                recurrent: formData.recurrent,
                recurrent_days: formData.recurrent ? formData.recurrent_days : undefined,
                recurrent_time_from: formData.recurrent ? formData.recurrent_time_from : undefined,
                recurrent_time_to: formData.recurrent ? formData.recurrent_time_to : undefined,
                priority: formData.priority,
            }

            await apiClient.createPromo(session, request)
            toast.success('Promocja utworzona')
            setCreateDialogOpen(false)
            fetchPromos(1)
        } catch (error: any) {
            console.error('Failed to create promo:', error)
            toast.error(error.message || 'Nie udało się utworzyć promocji')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdate = async () => {
        console.log('=== DEBUG ===')
        console.log('formData.valid_from:', formData.valid_from)
        console.log('formData.valid_to:', formData.valid_to)
        console.log('typeof valid_to:', typeof formData.valid_to)
        if (!session || !selectedPromo) return

        if (!formData.name.trim()) {
            toast.error('Nazwa promocji jest wymagana')
            return
        }

        if (formData.recurrent && formData.recurrent_days.length === 0) {
            toast.error('Wybierz dni tygodnia dla promocji cyklicznej')
            return
        }

        setSubmitting(true)
        try {
            const request: UpdatePromoRequest = {
                promo_id: selectedPromo.id,
                name: formData.name.trim(),
                discount_percent: formData.discount_percent,
                product_type: formData.product_type || null,
                product_id: formData.product_id || null,
                valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : undefined,
                valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
                recurrent: formData.recurrent,
                recurrent_days: formData.recurrent ? formData.recurrent_days : [],
                recurrent_time_from: formData.recurrent ? formData.recurrent_time_from : null,
                recurrent_time_to: formData.recurrent ? formData.recurrent_time_to : null,
                priority: formData.priority,
                active: formData.active,
            }

            await apiClient.updatePromo(session, request)
            toast.success('Promocja zaktualizowana')
            setEditDialogOpen(false)
            setSelectedPromo(null)
            fetchPromos(currentPage)
        } catch (error: any) {
            console.error('Failed to update promo:', error)
            toast.error(error.message || 'Nie udało się zaktualizować promocji')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!session || !selectedPromo) return

        setSubmitting(true)
        try {
            await apiClient.deletePromo(session, selectedPromo.id)
            toast.success('Promocja usunięta')
            setDeleteDialogOpen(false)
            setSelectedPromo(null)
            fetchPromos(currentPage)
        } catch (error: any) {
            console.error('Failed to delete promo:', error)
            toast.error(error.message || 'Nie udało się usunąć promocji')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleActive = async (promo: Promo) => {
        if (!session) return

        try {
            await apiClient.updatePromo(session, {
                promo_id: promo.id,
                active: !promo.active,
            })
            toast.success(promo.active ? 'Promocja dezaktywowana' : 'Promocja aktywowana')
            fetchPromos(currentPage)
        } catch (error) {
            console.error('Failed to toggle promo:', error)
            toast.error('Nie udało się zmienić statusu')
        }
    }

    const toggleDay = (day: number) => {
        setFormData(prev => ({
            ...prev,
            recurrent_days: prev.recurrent_days.includes(day)
                ? prev.recurrent_days.filter(d => d !== day)
                : [...prev.recurrent_days, day].sort((a, b) => a - b)
        }))
    }

    const handleProductTypeChange = (value: string) => {
        const newType = value === 'all' ? '' : value
        setFormData(prev => ({
            ...prev,
            product_type: newType,
            product_id: null // Reset product when type changes
        }))
    }

    const handleProductChange = (value: string) => {
        const productId = value === 'all' ? null : parseInt(value)
        setFormData(prev => ({ ...prev, product_id: productId }))
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDays = (days: number[] | null) => {
        if (!days || days.length === 0) return '-'
        if (days.length === 7) return 'Codziennie'
        if (JSON.stringify([...days].sort()) === JSON.stringify([1, 2, 3, 4, 5])) return 'Pn-Pt'
        if (JSON.stringify([...days].sort()) === JSON.stringify([0, 6])) return 'Weekendy'
        return days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.short).join(', ')
    }

    // Get product name by id (for display in table)
    const getProductName = (promo: Promo) => {
        if (promo.product_id) {
            // We'd need to store product names somewhere or fetch them
            // For now just show ID
            return `Produkt #${promo.product_id}`
        }
        if (promo.product_type) {
            return PRODUCT_TYPES.find(t => t.value === promo.product_type)?.label || promo.product_type
        }
        return 'Wszystkie'
    }

    const renderPromoForm = () => (
        <div className="space-y-4">
            {/* Nazwa */}
            <div className="space-y-2">
                <Label>Nazwa promocji *</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="np. Happy Hour, VIP, Weekendowa"
                    maxLength={255}
                />
            </div>

            {/* Rabat */}
            <div className="space-y-2">
                <Label>Rabat (%)</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                        className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                </div>
            </div>

            {/* Typ produktu */}
            <div className="space-y-2">
                <Label>Typ produktu</Label>
                <Select
                    value={formData.product_type || 'all'}
                    onValueChange={handleProductTypeChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Wybierz typ produktu" />
                    </SelectTrigger>
                    <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                            <SelectItem key={type.value || 'all'} value={type.value || 'all'}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {formData.product_type && (
                <ProductSearchCombobox
                    productType={formData.product_type}
                    selectedProductId={formData.product_id}
                    onSelect={(productId, productName) => {
                        setFormData(prev => ({ ...prev, product_id: productId }))
                    }}
                    session={session}
                    orgId={orgId}
                />
            )}

            {/* Ważność */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Ważna od</Label>
                    <DateTimeInput
                        value={formData.valid_from}
                        onChange={(iso) => setFormData({ ...formData, valid_from: iso })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ważna do (opcjonalnie)</Label>
                    <DateTimeInput
                        value={formData.valid_to}
                        onChange={(iso) => setFormData({ ...formData, valid_to: iso })}
                    />
                </div>
            </div>

            {/* Cykliczność */}
            <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Promocja cykliczna</Label>
                        <p className="text-sm text-muted-foreground">
                            Aktywna tylko w określonych dniach i godzinach
                        </p>
                    </div>
                    <Switch
                        checked={formData.recurrent}
                        onCheckedChange={(checked) => setFormData({ ...formData, recurrent: checked })}
                    />
                </div>

                {formData.recurrent && (
                    <>
                        {/* Dni tygodnia */}
                        <div className="space-y-2">
                            <Label>Dni tygodnia</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <Button
                                        key={day.value}
                                        type="button"
                                        variant={formData.recurrent_days.includes(day.value) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleDay(day.value)}
                                    >
                                        {day.short}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, recurrent_days: [1, 2, 3, 4, 5] }))}
                                >
                                    Pn-Pt
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, recurrent_days: [0, 6] }))}
                                >
                                    Weekendy
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, recurrent_days: [0, 1, 2, 3, 4, 5, 6] }))}
                                >
                                    Codziennie
                                </Button>
                            </div>
                        </div>

                        {/* Godziny */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Od godziny</Label>
                                <Input
                                    type="time"
                                    value={formData.recurrent_time_from}
                                    onChange={(e) => setFormData({ ...formData, recurrent_time_from: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Do godziny</Label>
                                <Input
                                    type="time"
                                    value={formData.recurrent_time_to}
                                    onChange={(e) => setFormData({ ...formData, recurrent_time_to: e.target.value })}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Priorytet */}
            <div className="space-y-2">
                <Label>Priorytet</Label>
                <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-24"
                />
                <p className="text-xs text-muted-foreground">
                    Wyższy priorytet = wyświetlana wcześniej. Promocje sumują się (np. 10% + 5% = 15% rabatu).
                </p>
            </div>

            {/* Aktywna (tylko edycja) */}
            {editDialogOpen && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                        <Label>Promocja aktywna</Label>
                        <p className="text-sm text-muted-foreground">
                            Wyłączona promocja nie będzie naliczana
                        </p>
                    </div>
                    <Switch
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                </div>
            )}
        </div>
    )

    if (loading && !orgId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Promocje</CardTitle>
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
                            <CardTitle>Promocje</CardTitle>
                            <CardDescription>Zarządzaj rabatami i promocjami w pubie</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={activeOnly ? 'default' : 'outline'}
                                onClick={() => setActiveOnly(!activeOnly)}
                            >
                                {activeOnly ? 'Tylko aktywne' : 'Wszystkie'}
                            </Button>
                            <Button onClick={handleOpenCreateDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj promocję
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Promos List */}
            <Card>
                <CardContent className="pt-6">
                    {!loading && promos.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Brak promocji</h3>
                            <p className="text-muted-foreground mb-4">
                                {activeOnly
                                    ? 'Nie ma aktywnych promocji w tym pubie'
                                    : 'Nie utworzono jeszcze żadnych promocji'}
                            </p>
                            <Button onClick={handleOpenCreateDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Utwórz pierwszą promocję
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Nazwa</th>
                                        <th className="text-left p-3">Rabat</th>
                                        <th className="text-left p-3">Dotyczy</th>
                                        <th className="text-left p-3">Harmonogram</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Priorytet</th>
                                        <th className="text-left p-3">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {promos.map((promo) => (
                                        <tr key={promo.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">
                                                <div className="font-medium">{promo.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDate(promo.valid_from)}
                                                    {promo.valid_to && ` → ${formatDate(promo.valid_to)}`}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="secondary" className="text-lg">
                                                    -{promo.discount_percent}%
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="space-y-1">
                                                    {promo.product_id ? (
                                                        <Badge variant="default">
                                                            Produkt #{promo.product_id}
                                                        </Badge>
                                                    ) : promo.product_type ? (
                                                        <Badge variant="outline">
                                                            {PRODUCT_TYPES.find(t => t.value === promo.product_type)?.label}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">Wszystkie produkty</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {promo.recurrent ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <Repeat className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">{formatDays(promo.recurrent_days)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">
                                  {promo.recurrent_time_from} - {promo.recurrent_time_to}
                                </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Ciągła</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(promo)}
                                                    className={promo.active ? 'text-green-600' : 'text-muted-foreground'}
                                                >
                                                    {promo.active ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Aktywna
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Nieaktywna
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge variant="outline">{promo.priority}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(promo)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edytuj
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenDeleteDialog(promo)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Usuń
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Strona {currentPage} z {totalPages} • {totalCount} promocji
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

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nowa promocja</DialogTitle>
                        <DialogDescription>
                            Utwórz nową promocję dla tego pubu
                        </DialogDescription>
                    </DialogHeader>

                    {renderPromoForm()}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                            disabled={submitting}
                        >
                            Anuluj
                        </Button>
                        <Button onClick={handleCreate} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Tworzenie...
                                </>
                            ) : (
                                'Utwórz promocję'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edytuj promocję</DialogTitle>
                        <DialogDescription>
                            Zmień ustawienia promocji
                        </DialogDescription>
                    </DialogHeader>

                    {renderPromoForm()}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={submitting}
                        >
                            Anuluj
                        </Button>
                        <Button onClick={handleUpdate} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Zapisywanie...
                                </>
                            ) : (
                                'Zapisz zmiany'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Usuń promocję</DialogTitle>
                        <DialogDescription>
                            Czy na pewno chcesz usunąć promocję &quot;{selectedPromo?.name}&quot;?
                        </DialogDescription>
                    </DialogHeader>

                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Ta operacja jest nieodwracalna. Promocja zostanie trwale usunięta.
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
                                'Usuń promocję'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}