// src/app/[orgid]/layout.tsx
'use client'

import { useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Settings,
  BarChart3,
  Package2,
  Cpu,
  Menu,
  X,
  Building2,
  Factory,
  FileText,
  Users,
  Tag
} from "lucide-react"

function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const { user, userInfo, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.orgid as string

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const handleSignOut = async () => {
    await signOut()
  }

  const handleMenuItemClick = (itemId: string) => {
    if (itemId.startsWith('org-')) {
      // Organization level routes
      const category = itemId.replace('org-', '')
      // Map category names to actual routes
      const routeMap: Record<string, string> = {
        'statistics': 'stats',
        'devices': 'devices',
        'files': 'files',
        'products': 'products',
        'warehouse': 'warehouse',
        'users': 'users'
      }
      const route = routeMap[category] || category
      router.push(`/${orgId}/${route}`)
    } else {
      // Pub level routes
      const [category, pubId] = itemId.split('-')
      const route = category === 'statistics' ? 'stats' : category
      router.push(`/${orgId}/pub/${pubId}/${route}`)
    }
  }

  // Group user info by pub
  const pubGroups = new Map()
  if (userInfo) {
    userInfo.forEach(info => {
      if (!pubGroups.has(info.pub_id)) {
        pubGroups.set(info.pub_id, {
          pubId: info.pub_id,
          pubName: info.pub_name,
          orgId: info.org_id,
          orgName: info.organization_name
        })
      }
    })
  }

  // Check if user has manager or admin role
  const hasManagerAccess = userInfo?.some(info =>
      info.org_id === parseInt(orgId) &&
      (info.role === 'admin' || info.role === 'manager')
  ) ?? false

  // Organization-level categories
  const orgCategories = [
    ...(hasManagerAccess ? [{ id: 'org-devices', name: 'Urządzenia', icon: Cpu }] : []),
    { id: 'org-files', name: 'Pliki', icon: FileText },
    { id: 'org-products', name: 'Produkty', icon: Package2 },
    // Only show users if has manager access
    ...(hasManagerAccess ? [{ id: 'org-statistics', name: 'Statystyki', icon: BarChart3 }, { id: 'org-users', name: 'Użytkownicy', icon: Users }] : [])
  ]

  // Pub-level categories
  const pubCategories = [
      'devices', 'warehouse',
    ...(hasManagerAccess ? ["promos", 'statistics'] : []),
  ]

  const togglePub = (pubId: number) => {
    const pubKey = `pub-${pubId}`
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(pubKey)) {
      newExpanded.delete(pubKey)
    } else {
      newExpanded.add(pubKey)
    }
    setExpandedCategories(newExpanded)
  }

  // Check if menu item is active
  const isMenuItemActive = (itemId: string) => {
    if (itemId.startsWith('org-')) {
      const category = itemId.replace('org-', '')
      const routeMap: Record<string, string> = {
        'statistics': 'stats',
        'devices': 'devices',
        'files': 'files',
        'products': 'products',
        'warehouse': 'warehouse',
        'users': 'users'
      }
      const route = routeMap[category] || category
      return pathname === `/${orgId}/${route}`
    } else {
      const [category, pubId] = itemId.split('-')
      const route = category === 'statistics' ? 'stats' : category
      return pathname === `/${orgId}/pub/${pubId}/${route}`
    }
  }

  // Get current page title
  const getCurrentPageTitle = () => {
    if (pathname === `/${orgId}`) return 'Dashboard'

    const pathParts = pathname.split('/')
    const lastPart = pathParts[pathParts.length - 1]

    const titleMap: Record<string, string> = {
      'devices': 'Urządzenia',
      'files': 'Pliki',
      'products': 'Produkty',
      'stats': 'Statystyki',
      'warehouse': 'Magazyn',
      'settings': 'Ustawienia',
      'users': 'Użytkownicy'
    }

    return titleMap[lastPart] || 'Dashboard'
  }

  if (!userInfo) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-6">
            <p>Ładowanie informacji o użytkowniku...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className={`bg-card border-r transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-16'}`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                {sidebarOpen && (
                    <div>
                      <h2 className="text-lg font-semibold">CyberTap</h2>
                      <p className="text-sm text-muted-foreground">Zarządzanie Pubem</p>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-2">
              <nav className="space-y-4">
                {/* Organization Level Categories */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {sidebarOpen && 'Organizacja'}
                  </div>
                  <div className="space-y-1">
                    {orgCategories.map((category) => {
                      const CategoryIcon = category.icon
                      const isActive = isMenuItemActive(category.id)

                      return (
                          <button
                              key={category.id}
                              onClick={() => handleMenuItemClick(category.id)}
                              className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                          ${isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-accent hover:text-accent-foreground'
                              }
                          ${!sidebarOpen ? 'justify-center px-2' : ''}
                        `}
                          >
                            <CategoryIcon className="h-5 w-5 shrink-0" />
                            {sidebarOpen && (
                                <span className="text-sm font-medium">{category.name}</span>
                            )}
                          </button>
                      )
                    })}
                  </div>
                </div>

                {/* Pub Level Categories */}
                {sidebarOpen && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Puby
                      </div>
                      <div className="space-y-1">
                        {Array.from(pubGroups.values()).map((pub) => {
                          const pubKey = `pub-${pub.pubId}`
                          const isExpanded = expandedCategories.has(pubKey)

                          return (
                              <div key={pub.pubId}>
                                {/* Pub Header */}
                                <button
                                    onClick={() => togglePub(pub.pubId)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  <Building2 className="h-5 w-5 shrink-0" />
                                  <span className="flex-1 text-sm font-medium">{pub.pubName}</span>
                                  <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </button>

                                {/* Pub Categories */}
                                {isExpanded && (
                                    <div className="ml-8 mt-1 space-y-1">
                                      {pubCategories.map((categoryId) => {
                                        const itemId = `${categoryId}-${pub.pubId}`
                                        const isActive = isMenuItemActive(itemId)

                                        let categoryName = ''
                                        let CategoryIcon = Cpu

                                        switch (categoryId) {
                                          case 'devices':
                                            categoryName = 'Urządzenia'
                                            CategoryIcon = Cpu
                                            break
                                          case 'warehouse':
                                            categoryName = 'Magazyn'
                                            CategoryIcon = Factory
                                            break
                                          case 'statistics':
                                            categoryName = 'Statystyki'
                                            CategoryIcon = BarChart3
                                            break
                                          case 'promos':
                                            categoryName = 'Promocje'
                                            CategoryIcon = Tag
                                            break
                                        }

                                        return (
                                            <button
                                                key={itemId}
                                                onClick={() => handleMenuItemClick(itemId)}
                                                className={`
                                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm
                                      ${isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                                                }
                                    `}
                                            >
                                              <CategoryIcon className="h-4 w-4 shrink-0" />
                                              <span className="truncate">{categoryName}</span>
                                            </button>
                                        )
                                      })}
                                    </div>
                                )}
                              </div>
                          )
                        })}
                      </div>
                    </div>
                )}
              </nav>
            </div>

            {/* User Info & Logout */}
            <div className="p-4 border-t">
              {sidebarOpen && (
                  <div className="mb-4">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
              )}

              <div className="flex gap-2">
                {sidebarOpen && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/${orgId}/settings`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Ustawienia
                    </Button>
                )}

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleSignOut}
                    className={sidebarOpen ? 'flex-1' : 'w-full'}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {sidebarOpen && 'Wyloguj'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-card border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">{getCurrentPageTitle()}</h1>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
      <ProtectedRoute>
        <OrganizationLayout>{children}</OrganizationLayout>
      </ProtectedRoute>
  )
}