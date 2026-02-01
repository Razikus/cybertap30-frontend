// src/app/[orgid]/page.tsx
'use client'

import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default function OrganizationDashboard() {
  const { userInfo } = useAuth()

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Panel Zarządzania CyberTap</CardTitle>
        <CardDescription>
          Wybierz sekcję z menu aby rozpocząć pracę
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(pubGroups.values()).map((pub) => (
              <Card key={pub.pubId} className="border-2 border-dashed border-muted">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{pub.pubName}</CardTitle>
                  </div>
                  <CardDescription>{pub.orgName}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          {userInfo && userInfo.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Twoje uprawnienia:</h3>
              <div className="space-y-2">
                {userInfo.map((info) => (
                  <div key={`${info.org_id}-${info.pub_id}`} className="text-sm text-muted-foreground">
                    <span className="font-medium">{info.pub_name}</span> - {info.role}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}