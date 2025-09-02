"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Calendar, Database, Shield } from "lucide-react"
import type { UserInfoEvent } from "@/lib/types/user-info"

interface EventDetailsModalProps {
  event: UserInfoEvent | null
  isOpen: boolean
  onClose: () => void
}

export function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  if (!event) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes("signup")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (eventType.includes("login")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (eventType.includes("failed")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    if (eventType.includes("verified")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  const renderEventData = (data: any, level = 0) => {
    if (typeof data !== "object" || data === null) {
      return <span className="text-muted-foreground">{String(data)}</span>
    }

    return (
      <div className={`space-y-2 ${level > 0 ? "ml-4 border-l pl-4" : ""}`}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{key}:</span>
              {typeof value === "object" && value !== null ? (
                <Badge variant="outline" className="text-xs">
                  {Array.isArray(value) ? "array" : "object"}
                </Badge>
              ) : null}
            </div>
            {typeof value === "object" && value !== null ? (
              renderEventData(value, level + 1)
            ) : (
              <div className="text-sm text-muted-foreground ml-2">{String(value)}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Event Details
          </DialogTitle>
          <DialogDescription>Detailed information about this user interaction event</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Event Metadata */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Event Information</h3>
                <Badge className={getEventTypeColor(event.event_type)}>{formatEventType(event.event_type)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Event ID:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-xs">{event.event_id}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(event.event_id)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="font-medium">User ID:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-xs">{event.user_id}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(event.user_id)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created At:
                  </span>
                  <div className="mt-1 text-muted-foreground">{new Date(event.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Event Data */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                Event Data
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">{renderEventData(event.event_data)}</div>
            </div>

            {/* Hashed Data (if present) */}
            {event.hashed_data && Object.keys(event.hashed_data).length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Hashed Data
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Sensitive data is automatically hashed for security
                    </p>
                    {renderEventData(event.hashed_data)}
                  </div>
                </div>
              </>
            )}

            {/* Raw JSON */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Raw JSON</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">
                  <code>{JSON.stringify(event, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
