"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ExternalLink, Code, Database, Shield, Zap } from "lucide-react"

export default function APIDocsPage() {
  const [apiSpec, setApiSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api-docs/user-info-api.json")
      .then((res) => res.json())
      .then((spec) => {
        setApiSpec(spec)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Failed to load API spec:", error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API documentation...</p>
        </div>
      </div>
    )
  }

  if (!apiSpec) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load API documentation</p>
        </div>
      </div>
    )
  }

  const endpoints = Object.entries(apiSpec.paths || {})

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{apiSpec.info?.title}</h1>
              <p className="text-muted-foreground">{apiSpec.info?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Version {apiSpec.info?.version}</Badge>
            <Button variant="outline" size="sm" asChild>
              <a href="/api-docs/user-info-api.json" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View OpenAPI Spec
              </a>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="schemas">Schemas</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Event Storage
                  </CardTitle>
                  <CardDescription>
                    Centralized storage for all user interaction events with automatic timestamping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Signup flow tracking</li>
                    <li>• Login attempt logging</li>
                    <li>• Security verification events</li>
                    <li>• Device and location data</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Security Features
                  </CardTitle>
                  <CardDescription>Built-in security with hashing and authentication requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Automatic data hashing</li>
                    <li>• JWT authentication</li>
                    <li>• Secure verification</li>
                    <li>• Security score calculation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Performance
                  </CardTitle>
                  <CardDescription>Optimized for high-performance user interaction tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Fast event storage</li>
                    <li>• Efficient querying</li>
                    <li>• Pagination support</li>
                    <li>• Real-time updates</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>All API endpoints require authentication via Bearer token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-sm">Authorization: Bearer &lt;your-jwt-token&gt;</code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tokens are automatically provided when users are authenticated via Supabase Auth.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            {endpoints.map(([path, methods]: [string, any]) =>
              Object.entries(methods).map(([method, spec]: [string, any]) => (
                <Card key={`${method}-${path}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Badge variant={method === "get" ? "secondary" : method === "post" ? "default" : "outline"}>
                        {method.toUpperCase()}
                      </Badge>
                      <code className="text-lg">{path}</code>
                    </CardTitle>
                    <CardDescription>{spec.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{spec.description}</p>

                    {spec.parameters && (
                      <div>
                        <h4 className="font-semibold mb-2">Parameters</h4>
                        <div className="space-y-2">
                          {spec.parameters.map((param: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <code className="bg-muted px-2 py-1 rounded">{param.name}</code>
                              <Badge variant="outline" className="text-xs">
                                {param.in}
                              </Badge>
                              <span className="text-muted-foreground">{param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Responses</h4>
                      <div className="space-y-2">
                        {Object.entries(spec.responses || {}).map(([code, response]: [string, any]) => (
                          <div key={code} className="flex items-center gap-2 text-sm">
                            <Badge
                              variant={
                                code.startsWith("2") ? "default" : code.startsWith("4") ? "destructive" : "secondary"
                              }
                            >
                              {code}
                            </Badge>
                            <span className="text-muted-foreground">{response.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )),
            )}
          </TabsContent>

          <TabsContent value="schemas" className="space-y-6">
            {Object.entries(apiSpec.components?.schemas || {}).map(([name, schema]: [string, any]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle>{name}</CardTitle>
                  <CardDescription>{schema.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{JSON.stringify(schema, null, 2)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Signup Event</CardTitle>
                <CardDescription>Example of storing a user signup completion event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`POST /api/user-info
Content-Type: application/json
Authorization: Bearer <token>

{
  "event_type": "signup_completed",
  "event_data": {
    "email": "user@example.com",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retrieve User Events</CardTitle>
                <CardDescription>Example of fetching user interaction events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`GET /api/user-info?event_type=login_attempt&limit=10
Authorization: Bearer <token>

Response:
{
  "events": [
    {
      "event_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "user-uuid",
      "event_type": "login_attempt",
      "event_data": {
        "email": "user@example.com",
        "method": "password"
      },
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verify User Data</CardTitle>
                <CardDescription>Example of verifying user-provided data against stored values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`POST /api/user-info/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "event_type": "security_questions_verified",
  "verification_data": {
    "answer": "fluffy"
  }
}

Response:
{
  "verified": true
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
