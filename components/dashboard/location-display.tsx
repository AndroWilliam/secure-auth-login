"use client"

import { useEffect, useState } from "react"

interface LocationData {
  city: string
  country: string
  coordinates?: { lat: number; lng: number }
}

interface LocationDisplayProps {
  signupLocation?: LocationData | null
  currentLocation?: LocationData | null
}

export function LocationDisplay({ signupLocation, currentLocation }: LocationDisplayProps) {
  const [storedLocation, setStoredLocation] = useState<LocationData | null>(null)

  useEffect(() => {
    // Check secure session for current location data
    const fetchLocationData = async () => {
      try {
        const { getItem, migrateFromLocalStorage } = await import("@/lib/utils/secure-session");
        
        // First try to migrate any existing localStorage data
        await migrateFromLocalStorage('current_location_data', 72);
        
        // Then get from secure session
        const locationData = await getItem('current_location_data');
        console.log('[LOCATION_DISPLAY] Secure location data:', locationData);
        
        if (locationData) {
          setStoredLocation(locationData);
        }
      } catch (e) {
        console.warn('[LOCATION_DISPLAY] Failed to get secure location data:', e);
      }
    };
    
    fetchLocationData();
  }, [])

  console.log('[LOCATION_DISPLAY] Props:', { signupLocation, currentLocation })
  console.log('[LOCATION_DISPLAY] State:', { storedLocation })

  // Priority: storedLocation > currentLocation > signupLocation
  const displayLocation = storedLocation && (storedLocation.city !== 'Unknown' || storedLocation.country !== 'Unknown') 
    ? storedLocation 
    : currentLocation && (currentLocation.city !== 'Unknown' || currentLocation.country !== 'Unknown')
    ? currentLocation
    : signupLocation && (signupLocation.city !== 'Unknown' || signupLocation.country !== 'Unknown')
    ? signupLocation
    : null

  if (displayLocation) {
    return (
      <div>
        <p><strong>
          {storedLocation ? 'Current Location:' : 
           currentLocation ? 'Current Location:' : 'Signup Location:'}
        </strong> {displayLocation.city || 'Unknown'}, {displayLocation.country || 'Unknown'}</p>
        <p className="text-xs font-mono">
          Coords: {displayLocation.coordinates?.lat?.toFixed(6) || 'N/A'}, {displayLocation.coordinates?.lng?.toFixed(6) || 'N/A'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p><strong>Location Access Disabled</strong></p>
      <p className="text-xs">Enable location access in settings below to see your current location</p>
    </div>
  )
}
