import { NextResponse } from 'next/server'
import { flightSearchSchema } from '@/lib/flightService'
import { amadeus } from '@/lib/amadeus'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams.entries())
    const parsed = flightSearchSchema.parse({
      originLocationCode: query.originLocationCode,
      destinationLocationCode: query.destinationLocationCode,
      departureDate: query.departureDate,
      returnDate: query.returnDate,
      adults: query.adults,
      children: query.children,
      travelClass: query.travelClass,
      nonStop: query.nonStop,
      currencyCode: query.currencyCode,
    })

    const data = await amadeus.searchFlightOffers(parsed)
    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (err: unknown) {
    const msg = getErrorMessage(err) || 'Error inesperado'
    logger.error('API /api/flights/search error', { error: msg })
    const status = msg.includes('Amadeus') ? 502 : 400
    return NextResponse.json({ ok: false, error: msg }, { status })
  }
}