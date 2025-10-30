import { logger } from './logger'

type OAuthToken = {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

const AMADEUS_HOST = process.env.AMADEUS_API_HOST || 'https://test.api.amadeus.com'

async function fetchAccessToken(): Promise<string> {
  const clientId = process.env.AMADEUS_API_KEY
  const clientSecret = process.env.AMADEUS_API_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Configuración de Amadeus incompleta: faltan AMADEUS_API_KEY/SECRET')
  }

  // Usa token en caché si no ha expirado
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token
  }

  const url = `${AMADEUS_HOST}/v1/security/oauth2/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.error('Amadeus OAuth error', { status: res.status, body: text })
    throw new Error(`Amadeus OAuth error: ${res.status}`)
  }

  const data = (await res.json()) as OAuthToken
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.token
}

export type FlightSearchParams = {
  originLocationCode: string
  destinationLocationCode: string
  departureDate: string // YYYY-MM-DD
  returnDate?: string // YYYY-MM-DD
  adults: number
  children?: number
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  nonStop?: boolean
  currencyCode?: string
}

export async function searchFlightOffers(params: FlightSearchParams) {
  const token = await fetchAccessToken()
  const url = new URL(`${AMADEUS_HOST}/v2/shopping/flight-offers`)

  const qp: Record<string, string> = {
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: String(params.adults),
  }

  if (params.returnDate) qp.returnDate = params.returnDate
  if (params.children) qp.children = String(params.children)
  if (params.travelClass) qp.travelClass = params.travelClass
  if (typeof params.nonStop === 'boolean') qp.nonStop = String(params.nonStop)
  if (params.currencyCode) qp.currencyCode = params.currencyCode

  Object.entries(qp).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.error('Amadeus flight search error', { status: res.status, body: text, query: qp })
    throw new Error(`Amadeus flight search error: ${res.status}`)
  }

  const data = await res.json()
  return data
}

export const amadeus = { searchFlightOffers }