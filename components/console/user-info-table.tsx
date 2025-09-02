"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EventDetailsModal } from "./event-details-modal"
import { Eye, Calendar, User, Activity } from "lucide-react"
import type { UserInfoEvent } from "@/lib/types/user-info"

interface UserInfoTableProps {
  events: UserInfoEvent[]
}

export function UserInfoTable({ events }: UserInfoTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<UserInfoEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes("signup")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (eventType.includes("login")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (eventType.includes("failed")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    if (eventType.includes("verified")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("signup")) return <User className="h-3 w-3" />
    if (eventType.includes("login")) return <Activity className="h-3 w-3" />
    return <Calendar className="h-3 w-3" />
  }

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getEventSummary = (event: UserInfoEvent) => {
    const data = event.event_data as any
    if (data.email) return data.email
    if (data.deviceInfo?.fingerprint) return `Device: ${data.deviceInfo.fingerprint.substring(0, 8)}...`
    if (data.locationInfo?.city) return `${data.locationInfo.city}, ${data.locationInfo.country}`
    return "Event data"
  }

  const handleViewDetails = (event: UserInfoEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No events found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.event_id}>
                <TableCell>
                  <Badge className={`${getEventTypeColor(event.event_type)} flex items-center gap-1 w-fit`}>
                    {getEventIcon(event.event_type)}
                    {formatEventType(event.event_type)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{getEventSummary(event)}</TableCell>
                <TableCell className="text-muted-foreground">{formatTimestamp(event.created_at)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(event)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
        }}
      />
    </>
  )
}
