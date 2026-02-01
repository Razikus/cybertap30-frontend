// src/app/[orgid]/users/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    apiClient,
    type UserWithRole
} from '@/lib/apiClient'
import {
    Users,
    Search,
    MoreHorizontal,
    Loader2,
    UserPlus,
    Shield,
    Key,
    Trash2,
    AlertCircle,
    Crown,
    UserCog,
    User as UserIcon,
    Ban,
    RefreshCw,
    Building2
} from 'lucide-react'
import { toast } from 'sonner'

type RoleType = 'admin' | 'manager' | 'staff' | 'none'

const roleLabels: Record<RoleType, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Pracownik',
    none: 'Brak dostępu'
}

const roleColors: Record<RoleType, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    staff: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    none: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

const roleIcons: Record<RoleType, React.ReactNode> = {
    admin: <Crown className="h-4 w-4" />,
    manager: <Shield className="h-4 w-4" />,
    staff: <UserIcon className="h-4 w-4" />,
    none: <Ban className="h-4 w-4" />
}

interface PubWithUsers {
    pubId: number
    pubName: string
    myRole: string
    users: UserWithRole[]
}

export default function OrganizationUsersPage() {
    const { session, userInfo } = useAuth()
    const params = useParams()
    const [orgId, setOrgId] = useState<number | null>(null)

    // Data states
    const [allUsers, setAllUsers] = useState<UserWithRole[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
    const [selectedPubId, setSelectedPubId] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [newUserForm, setNewUserForm] = useState({
        email: '',
        password: '',
        role: 'staff' as RoleType,
        pubId: null as number | null
    })
    const [newRole, setNewRole] = useState<RoleType>('staff')
    const [newPassword, setNewPassword] = useState('')

    // Get orgId from params
    useEffect(() => {
        const getOrgId = async () => {
            const resolvedParams = await params
            setOrgId(parseInt(resolvedParams.orgid as string))
        }
        getOrgId()
    }, [params])

    // Get pubs where I'm manager or admin
    const managedPubs = useMemo(() => {
        if (!userInfo || !orgId) return []
        return userInfo
            .filter(info =>
                info.org_id === orgId &&
                (info.role === 'admin' || info.role === 'manager')
            )
            .map(info => ({
                pubId: info.pub_id,
                pubName: info.pub_name,
                myRole: info.role
            }))
    }, [userInfo, orgId])

    // Group users by pub
    const pubsWithUsers = useMemo((): PubWithUsers[] => {
        return managedPubs.map(pub => {
            const pubUsers = allUsers.filter(user => user.pub_id === pub.pubId)
            // Filter by search
            const filtered = pubUsers.filter(user =>
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role.toLowerCase().includes(searchTerm.toLowerCase())
            )
            return {
                ...pub,
                users: filtered
            }
        })
    }, [managedPubs, allUsers, searchTerm])

    // Fetch users
    const fetchUsers = useCallback(async () => {
        if (!session || !orgId) return

        setLoading(true)
        try {
            const response = await apiClient.listOrganizationUsers(session, orgId)
            setAllUsers(response.users)
        } catch (error) {
            console.error('Failed to fetch users:', error)
            toast.error('Nie udało się pobrać użytkowników')
        } finally {
            setLoading(false)
        }
    }, [session, orgId])

    useEffect(() => {
        if (orgId) {
            fetchUsers()
        }
    }, [orgId, fetchUsers])

    // Check if can manage user based on my role in that pub
    const canManageUser = (targetRole: string, myRole: string): boolean => {
        const roleLevel: Record<string, number> = {
            admin: 4,
            manager: 3,
            staff: 2,
            none: 1
        }

        const myLevel = roleLevel[myRole] || 0
        const targetLevel = roleLevel[targetRole] || 0

        if (myLevel >= 4) return true // Admin może wszystko
        if (myLevel >= 3) return targetLevel <= 2 // Manager może staff i none
        return false
    }

    // Get available roles for assignment based on my role
    const getAvailableRoles = (myRole: string): RoleType[] => {
        if (myRole === 'admin') {
            return ['admin', 'manager', 'staff', 'none']
        }
        if (myRole === 'manager') {
            return ['staff', 'none']
        }
        return []
    }

    // Handle add user
    const handleAddUser = async () => {
        if (!session || !orgId || !newUserForm.pubId) return
        if (!newUserForm.email || !newUserForm.role) {
            toast.error('Email i rola są wymagane')
            return
        }

        setSubmitting(true)
        try {
            await apiClient.addUserToOrganization(session, {
                email: newUserForm.email,
                password: newUserForm.password || undefined,
                organization_id: orgId,
                pub_id: newUserForm.pubId,
                role: newUserForm.role
            })

            toast.success('Użytkownik został dodany')
            setAddDialogOpen(false)
            setNewUserForm({ email: '', password: '', role: 'staff', pubId: null })
            fetchUsers()
        } catch (error: any) {
            toast.error(error.message || 'Nie udało się dodać użytkownika')
        } finally {
            setSubmitting(false)
        }
    }

    // Handle role change
    const handleChangeRole = async () => {
        if (!session || !orgId || !selectedUser) return

        setSubmitting(true)
        try {
            await apiClient.changeUserRole(session, {
                target_user_id: selectedUser.user_id,
                organization_id: orgId,
                new_role: newRole,
                pub_id: selectedUser.pub_id
            })

            toast.success('Rola została zmieniona')
            setRoleDialogOpen(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error: any) {
            toast.error(error.message || 'Nie udało się zmienić roli')
        } finally {
            setSubmitting(false)
        }
    }

    // Handle password change
    const handleChangePassword = async () => {
        if (!session || !orgId || !selectedUser) return
        if (!newPassword || newPassword.length < 8) {
            toast.error('Hasło musi mieć minimum 8 znaków')
            return
        }

        setSubmitting(true)
        try {
            await apiClient.changeUserPassword(session, {
                target_user_id: selectedUser.user_id,
                organization_id: orgId,
                new_password: newPassword
            })

            toast.success('Hasło zostało zmienione')
            setPasswordDialogOpen(false)
            setSelectedUser(null)
            setNewPassword('')
        } catch (error: any) {
            toast.error(error.message || 'Nie udało się zmienić hasła')
        } finally {
            setSubmitting(false)
        }
    }

    // Handle user removal
    const handleRemoveUser = async () => {
        if (!session || !orgId || !selectedUser) return

        setSubmitting(true)
        try {
            await apiClient.removeUserFromOrganization(session, {
                target_user_id: selectedUser.user_id,
                organization_id: orgId
            })

            toast.success('Użytkownik został usunięty z pubu')
            setDeleteDialogOpen(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error: any) {
            toast.error(error.message || 'Nie udało się usunąć użytkownika')
        } finally {
            setSubmitting(false)
        }
    }

    // Open dialogs
    const openAddDialog = (pubId: number) => {
        setSelectedPubId(pubId)
        setNewUserForm({
            email: '',
            password: '',
            role: 'staff',
            pubId: pubId
        })
        setAddDialogOpen(true)
    }

    const openRoleDialog = (user: UserWithRole, myRole: string) => {
        setSelectedUser(user)
        setNewRole(user.role as RoleType)
        setRoleDialogOpen(true)
    }

    const openPasswordDialog = (user: UserWithRole) => {
        setSelectedUser(user)
        setNewPassword('')
        setPasswordDialogOpen(true)
    }

    const openDeleteDialog = (user: UserWithRole) => {
        setSelectedUser(user)
        setDeleteDialogOpen(true)
    }

    // Get my role for selected pub (for dialogs)
    const getMyRoleForPub = (pubId: number | null): string => {
        if (!pubId) return ''
        const pub = managedPubs.find(p => p.pubId === pubId)
        return pub?.myRole || ''
    }

    if (loading && !orgId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Użytkownicy</CardTitle>
                    <CardDescription>Ładowanie użytkowników...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (managedPubs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Zarządzanie użytkownikami
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Brak uprawnień</h3>
                        <p className="text-muted-foreground">
                            Nie jesteś managerem ani administratorem w żadnym pubie tej organizacji.
                        </p>
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
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Zarządzanie użytkownikami
                            </CardTitle>
                            <CardDescription>
                                Zarządzaj użytkownikami w pubach gdzie jesteś managerem
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={fetchUsers}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Odśwież
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Szukaj użytkowników..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pub sections */}
            {pubsWithUsers.map((pub) => (
                <Card key={pub.pubId}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-lg">{pub.pubName}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        Twoja rola:
                                        <Badge className={roleColors[pub.myRole as RoleType]}>
                                            {roleIcons[pub.myRole as RoleType]}
                                            <span className="ml-1">{roleLabels[pub.myRole as RoleType]}</span>
                                        </Badge>
                                        • {pub.users.length} użytkowników
                                    </CardDescription>
                                </div>
                            </div>
                            <Button onClick={() => openAddDialog(pub.pubId)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Dodaj
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : pub.users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {searchTerm
                                    ? `Brak użytkowników pasujących do "${searchTerm}"`
                                    : 'Brak użytkowników w tym pubie'
                                }
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Email</th>
                                        <th className="text-left p-3">Rola</th>
                                        <th className="text-left p-3">Dodano</th>
                                        <th className="text-left p-3">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pub.users.map((user) => {
                                        const canManage = canManageUser(user.role, pub.myRole)

                                        return (
                                            <tr key={user.user_id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <UserIcon className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium">{user.email}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={roleColors[user.role as RoleType] || 'bg-gray-100'}>
                                                        {roleIcons[user.role as RoleType]}
                                                        <span className="ml-1">{roleLabels[user.role as RoleType] || user.role}</span>
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {user.created_at
                                                        ? new Date(user.created_at).toLocaleDateString('pl-PL')
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="p-3">
                                                    {canManage ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openRoleDialog(user, pub.myRole)}>
                                                                    <UserCog className="h-4 w-4 mr-2" />
                                                                    Zmień rolę
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                                                    <Key className="h-4 w-4 mr-2" />
                                                                    Zmień hasło
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(user)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Usuń z pubu
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Brak uprawnień</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}

            {/* Add User Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dodaj użytkownika do pubu</DialogTitle>
                        <DialogDescription>
                            {managedPubs.find(p => p.pubId === selectedPubId)?.pubName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={newUserForm.email}
                                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <Label>Hasło (opcjonalne)</Label>
                            <Input
                                type="password"
                                value={newUserForm.password}
                                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                placeholder="Zostaw puste jeśli użytkownik istnieje"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Podaj hasło tylko jeśli chcesz utworzyć nowe konto. Min. 8 znaków.
                            </p>
                        </div>

                        <div>
                            <Label>Rola *</Label>
                            <Select
                                value={newUserForm.role}
                                onValueChange={(value: RoleType) => setNewUserForm({ ...newUserForm, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableRoles(getMyRoleForPub(selectedPubId)).map(role => (
                                        <SelectItem key={role} value={role}>
                                            <div className="flex items-center gap-2">
                                                {roleIcons[role]}
                                                {roleLabels[role]}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAddDialogOpen(false)}
                            disabled={submitting}
                        >
                            Anuluj
                        </Button>
                        <Button onClick={handleAddUser} disabled={submitting || !newUserForm.email}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Dodawanie...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Dodaj
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zmień rolę użytkownika</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Nowa rola</Label>
                            <Select
                                value={newRole}
                                onValueChange={(value: RoleType) => setNewRole(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableRoles(getMyRoleForPub(selectedUser?.pub_id || null)).map(role => (
                                        <SelectItem key={role} value={role}>
                                            <div className="flex items-center gap-2">
                                                {roleIcons[role]}
                                                {roleLabels[role]}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRoleDialogOpen(false)}
                            disabled={submitting}
                        >
                            Anuluj
                        </Button>
                        <Button onClick={handleChangeRole} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Zapisywanie...
                                </>
                            ) : (
                                'Zapisz'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zmień hasło użytkownika</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Nowe hasło</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 8 znaków"
                            />
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Użytkownik będzie musiał zalogować się nowym hasłem.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPasswordDialogOpen(false)}
                            disabled={submitting}
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            disabled={submitting || newPassword.length < 8}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Zapisywanie...
                                </>
                            ) : (
                                <>
                                    <Key className="h-4 w-4 mr-2" />
                                    Zmień hasło
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Usuń użytkownika z pubu</DialogTitle>
                        <DialogDescription>
                            Czy na pewno chcesz usunąć użytkownika {selectedUser?.email} z pubu?
                        </DialogDescription>
                    </DialogHeader>

                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Ta operacja jest nieodwracalna. Użytkownik straci dostęp do tego pubu.
                        </AlertDescription>
                    </Alert>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={submitting}
                        >
                            Anuluj
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveUser}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Usuwanie...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}