"use client";

import { useState } from "react";
import { getDeviceId, clearDeviceId, generateNewDeviceId, getDeviceInfo } from "@/lib/utils/get-device-id";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DeviceDebugPage() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const handleGetDeviceId = () => {
    const id = getDeviceId();
    setDeviceId(id);
  };

  const handleGetDeviceInfo = () => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
  };

  const handleClearDeviceId = () => {
    clearDeviceId();
    setDeviceId("");
    setDeviceInfo(null);
  };

  const handleGenerateNewDeviceId = () => {
    const newId = generateNewDeviceId();
    setDeviceId(newId);
  };

  const handleGenerateHybridDeviceId = async () => {
    try {
      const response = await fetch("/api/device/generate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        const { deviceId, ip, ipHash, hardwareFingerprint, persistentId } = await response.json();
        setDeviceId(deviceId);
        console.log("Generated hybrid device ID:", {
          deviceId,
          ip,
          ipHash,
          hardwareFingerprint,
          persistentId
        });
      } else {
        console.error("Failed to generate hybrid device ID");
      }
    } catch (error) {
      console.error("Error generating hybrid device ID:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Device ID Debug Page</h1>
        <p className="text-muted-foreground">
          This page helps you test and debug device ID generation and management.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Device ID Actions</CardTitle>
              <CardDescription>
                Test device ID generation and management functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGetDeviceId} className="w-full">
                Get Current Device ID
              </Button>
              <Button onClick={handleGenerateNewDeviceId} variant="outline" className="w-full">
                Generate New Client Device ID
              </Button>
              <Button onClick={handleGenerateHybridDeviceId} variant="outline" className="w-full">
                Generate Hybrid Device ID
              </Button>
              <Button onClick={handleClearDeviceId} variant="destructive" className="w-full">
                Clear Device ID
              </Button>
              <Button onClick={handleGetDeviceInfo} variant="secondary" className="w-full">
                Get Device Info
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Device ID</CardTitle>
              <CardDescription>
                The device ID that will be used for authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deviceId ? (
                <div className="space-y-2">
                  <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                    {deviceId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This ID is stored in localStorage and will persist across browser sessions.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No device ID loaded. Click "Get Current Device ID" to load it.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {deviceInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
              <CardDescription>
                Detailed information about the current device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(deviceInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Hybrid Device ID System</CardTitle>
            <CardDescription>
              How the hybrid device identification works
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Hybrid Device ID Components:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>IP Hash:</strong> First 8 characters of your IP address</li>
                <li>• <strong>Hardware Fingerprint:</strong> Based on screen, CPU, and browser characteristics</li>
                <li>• <strong>Persistent ID:</strong> Stored in localStorage for consistency</li>
                <li>• <strong>Format:</strong> hybrid-[ipHash]-[hardwareFingerprint]-[persistentId]</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-green-800 dark:text-green-200">Recognition Logic:</h4>
              <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                <li>✅ Same persistent ID = Same device</li>
                <li>✅ Same hardware fingerprint = Same device</li>
                <li>✅ Same IP hash = Same network</li>
                <li>❌ All different = Different device (triggers OTP)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
            <CardDescription>
              How to test the device ID functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Test Same Device Login (Hybrid):</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Sign up with a new account (hybrid device ID will be generated)</li>
                <li>Click "Generate Hybrid Device ID" to see your current hybrid ID</li>
                <li>Log out and log back in with the same account</li>
                <li>You should NOT be prompted for OTP (same device should be recognized)</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">Test Different Device Login:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use a different browser or clear browser data</li>
                <li>Try to log in with the same account</li>
                <li>You SHOULD be prompted for OTP (different device should not be recognized)</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">Reset for Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Clear Device ID" to reset</li>
                <li>Refresh the page to generate a fresh device ID</li>
                <li>Use this for testing new device scenarios</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
