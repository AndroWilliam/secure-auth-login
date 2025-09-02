export async function tryGetGeolocationSilently(): Promise<{ lat: number; lon: number } | null> {
  try {
    if (typeof navigator === "undefined") return null
    const anyNav: any = navigator
    if (anyNav.permissions && anyNav.permissions.query) {
      const p = await anyNav.permissions.query({ name: "geolocation" as any })
      if (p.state === "denied") return null
    }
    return await new Promise((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 },
      ),
    )
  } catch {
    return null
  }
}




