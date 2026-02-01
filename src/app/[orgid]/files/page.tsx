// src/app/[orgid]/files/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { apiClient, Resource, PaginatedResourcesResponse } from '@/lib/apiClient'
import { 
  Upload, 
  Search, 
  Download, 
  FileText, 
  Image, 
  File, 
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Calendar,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

// Utility functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return <Image className="h-8 w-8 text-blue-500" />
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return <FileText className="h-8 w-8 text-red-500" />
    default:
      return <File className="h-8 w-8 text-gray-500" />
  }
}

const getFileTypeColor = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'pdf':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    case 'doc':
    case 'docx':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'txt':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')
}

interface FileCardProps {
  resource: Resource
  onDownload: (resource: Resource) => void
  downloading: boolean
  session: any
}

const FileCard = ({ resource, onDownload, downloading, session }: FileCardProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const isImage = isImageFile(resource.filename)

  useEffect(() => {
    if (isImage && session) {
      setLoadingPreview(true)
      apiClient.downloadResource(session, resource.uuid)
        .then(blob => {
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
        })
        .catch(error => {
          console.error('Preview failed:', error)
        })
        .finally(() => {
          setLoadingPreview(false)
        })
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [isImage, session, resource.uuid])

  return (
    <div className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-all">
      {/* Actions */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0 shadow-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onDownload(resource)}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pobieranie...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Pobierz
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview or Icon */}
      <div className="aspect-video bg-muted flex items-center justify-center">
        {isImage ? (
          loadingPreview ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : previewUrl ? (
            <img 
              src={previewUrl} 
              alt={resource.filename}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="h-12 w-12 text-muted-foreground" />
          )
        ) : (
          getFileIcon(resource.filename)
        )}
      </div>
      
      {/* File Info */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="font-medium text-sm truncate" title={resource.filename}>
            {resource.filename}
          </h4>
          <Badge 
            variant="secondary" 
            className={`text-xs mt-1 ${getFileTypeColor(resource.filename)}`}
          >
            {resource.filename.split('.').pop()?.toUpperCase() || 'FILE'}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(resource.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrganizationFilesPage() {
  const { session } = useAuth()
  const params = useParams()
  const [orgId, setOrgId] = useState<number | null>(null)
  
  // State management
  const [resources, setResources] = useState<Resource[]>([]) // Ensure it's always an array
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10) // Changed to 10 as requested
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)

  // Get orgId from params
  useEffect(() => {
    const getOrgId = async () => {
      const resolvedParams = await params
      setOrgId(parseInt(resolvedParams.orgid as string))
    }
    getOrgId()
  }, [params])

  // Fetch resources with pagination and search
  const fetchResources = useCallback(async (page: number = 1, search: string = '') => {
    if (!session || !orgId) return
    
    setLoading(true)
    try {
      const response: PaginatedResourcesResponse = await apiClient.listResources(session, {
        organizationId: orgId,
        page,
        limit: pageSize,
        search: search.trim() || undefined
      })
      
      setResources(response.data)
      setCurrentPage(response.pagination.page)
      setTotalPages(response.pagination.total_pages)
      setTotalCount(response.pagination.total)
      setHasNext(response.pagination.has_next)
      setHasPrev(response.pagination.has_prev)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      toast.error('Nie udało się pobrać plików')
    } finally {
      setLoading(false)
    }
  }, [session, orgId, pageSize])

  // Initial load and search handling
  useEffect(() => {
    if (orgId) {
      fetchResources(1, searchTerm)
    }
  }, [orgId, fetchResources])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (orgId) {
        setCurrentPage(1)
        fetchResources(1, searchTerm)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, orgId, fetchResources])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchResources(newPage, searchTerm)
  }

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !session || !orgId) return

    setUploading(true)
    try {
      await apiClient.createResource(session, selectedFile, orgId)
      toast.success('Plik został przesłany pomyślnie')
      setSelectedFile(null)
      setUploadDialogOpen(false)
      fetchResources(currentPage, searchTerm)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Nie udało się przesłać pliku')
    } finally {
      setUploading(false)
    }
  }

  // Handle file download
  const handleDownload = async (resource: Resource) => {
    if (!session) return
    
    setDownloading(resource.uuid)
    try {
      await apiClient.downloadResourceFile(session, resource.uuid, resource.filename)
      toast.success('Pobieranie rozpoczęte')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Nie udało się pobrać pliku')
    } finally {
      setDownloading(null)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchResources(currentPage, searchTerm)
  }

  // Show loading state only when initially loading
  if (loading && !orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pliki - Poziom organizacji</CardTitle>
          <CardDescription>Ładowanie plików...</CardDescription>
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
              <CardTitle>Pliki - Poziom organizacji</CardTitle>
              <CardDescription>
                Zarządzaj plikami organizacji • {totalCount} plików
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Odśwież
              </Button>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Prześlij plik
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Prześlij nowy plik</DialogTitle>
                    <DialogDescription>
                      Wybierz plik do przesłania do organizacji
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-primary file:text-primary-foreground
                            hover:file:bg-primary/90
                          "
                        />
                      </div>
                      {selectedFile && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          {getFileIcon(selectedFile.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadDialogOpen(false)
                          setSelectedFile(null)
                        }}
                        disabled={uploading}
                      >
                        Anuluj
                      </Button>
                      <Button
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Przesyłanie...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Prześlij
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Szukaj plików..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Pliki {searchTerm && `(wyszukiwanie: "${searchTerm}")`}
            </CardTitle>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!loading && (!resources || resources.length === 0) ? (
            <div className="text-center py-12">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Brak wyników wyszukiwania' : 'Brak plików'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `Nie znaleziono plików zawierających "${searchTerm}"`
                  : 'Nie masz jeszcze żadnych plików w organizacji'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Prześlij pierwszy plik
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Files Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {resources && resources.map((resource) => (
                  <FileCard
                    key={resource.uuid}
                    resource={resource}
                    onDownload={handleDownload}
                    downloading={downloading === resource.uuid}
                    session={session}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Strona {currentPage} z {totalPages} • {totalCount} plików
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
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else {
                          if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            disabled={loading}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>

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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}