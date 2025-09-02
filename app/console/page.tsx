"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserInfoTable } from "@/components/console/user-info-table"
import { useUserInfo } from "@/lib/hooks/use-user-info"
import { Database, Search, Filter, Download } from "lucide-react"

export default function ConsolePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [limit, setLimit] = useState(50)

  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useUserInfo({
    limit,
    eventType: eventTypeFilter === "all" ? undefined : eventTypeFilter,
  })

  const eventTypes = [
    "all",
    "signup_identity_completed",
    "signup_security_completed",
    "signup_completed",
    "login_attempt",
    "login_success",
    "login_failed",
    "security_questions_verified",
    "device_verified",
    "location_verified",
    "login_session_completed",
  ]

  const filteredEvents =
    events?.events?.filter(
      (event) =>
        searchTerm === "" ||
        event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(event.event_data).toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredEvents, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `user-events-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Info Console</h1>
              <p className="text-muted-foreground">Monitor and analyze user interaction events and security data</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events?.total || 0}</div>
              <p className="text-xs text-muted-foreground">All user interactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Events</CardTitle>
              <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
                L
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredEvents.filter((e) => e.event_type.includes("login")).length}
              </div>
              <p className="text-xs text-muted-foreground">Login attempts & successes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signup Events</CardTitle>
              <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
                S
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredEvents.filter((e) => e.event_type.includes("signup")).length}
              </div>
              <p className="text-xs text-muted-foreground">Registration activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
                V
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredEvents.filter((e) => e.event_type.includes("verified")).length}
              </div>
              <p className="text-xs text-muted-foreground">Verification activities</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
            <CardDescription>Filter and search through user interaction events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Events" : type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(Number.parseInt(value))}>
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => refetch()} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Events</CardTitle>
            <CardDescription>
              Showing {filteredEvents.length} of {events?.total || 0} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Failed to load events: {error.message}</p>
                <Button onClick={() => refetch()} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : (
              <UserInfoTable events={filteredEvents} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
