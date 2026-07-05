import { NextResponse } from 'next/server';

/**
 * Server-side location endpoint using Nominatim (OpenStreetMap)
 * -------------------------------------------------------------
 * This route generates a random U.S. coordinate and reverse-geocodes it using
 * the free Nominatim API (no API key required).
 *
 * Response shape (successful): { label: string, latitude: number, longitude: number }
 */

const MIN_LAT = 24;
const MAX_LAT = 50;
const MIN_LON = -125;
const MAX_LON = -66;
const MAX_ATTEMPTS = 3;

const generateRandomUSCoordinates = () => {
  const latitude = MIN_LAT + Math.random() * (MAX_LAT - MIN_LAT);
  const longitude = MIN_LON + Math.random() * (MAX_LON - MIN_LON);
  return { latitude, longitude };
};

const reverseGeocodeNominatim = async (latitude: number, longitude: number) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', latitude.toString());
  url.searchParams.set('lon', longitude.toString());
  url.searchParams.set('zoom', '10');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a descriptive User-Agent.
      'User-Agent': 'DailyBrew-App/1.0 (local dev)'
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Record<string, unknown>;
  const address = data.address as Record<string, unknown> | undefined;
  if (!address) {
    return null;
  }

  const city = (address.city || address.town || address.village || '') as string;
  const state = (address.state || '') as string;
  const country = (address.country || 'United States') as string;
  const labelParts = [city, state, country].filter((part) => typeof part === 'string' && part.trim());
  const label = labelParts.join(', ') || 'Random U.S. location';

  return { label };
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('debug') === 'true') {
      return NextResponse.json({ message: 'Nominatim-based location endpoint (no auth required)' });
    }
  }
  catch {
    // ignore URL parsing errors
  }

  try {
    let candidate = generateRandomUSCoordinates();
    let label = 'Random U.S. location';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const result = await reverseGeocodeNominatim(candidate.latitude, candidate.longitude);
      if (result?.label) {
        label = result.label;
        break;
      }
      candidate = generateRandomUSCoordinates();
    }

    return NextResponse.json({
      label,
      latitude: candidate.latitude,
      longitude: candidate.longitude
    }, { status: 200 });
  }
  catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
