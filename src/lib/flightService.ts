import { z } from "zod";
import { amadeus, type FlightSearchParams } from "./amadeus";
import { logger } from "./logger";
import { getErrorMessage } from "./utils";

export const flightSearchSchema = z.object({
  originLocationCode: z.string().length(3),
  destinationLocationCode: z.string().length(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0).optional(),
  travelClass: z
    .enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])
    .optional(),
  nonStop: z.coerce.boolean().optional(),
  currencyCode: z.string().length(3).optional(),
});

export async function searchFlights(params: FlightSearchParams) {
  try {
    const parsed = flightSearchSchema.parse(params);
    const res = await amadeus.searchFlightOffers(parsed);
    return res;
  } catch (err: unknown) {
    logger.error("FlightService: error en búsqueda de vuelos", {
      error: getErrorMessage(err),
    });
    throw err;
  }
}
