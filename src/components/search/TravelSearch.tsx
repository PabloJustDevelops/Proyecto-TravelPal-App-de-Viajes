"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatCurrency } from "@/lib/utils";

interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: {
    duration: string;
    segments: {
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
    }[];
  }[];
}

export default function TravelSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlightOffer[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    adults: 1,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const params = new URLSearchParams({
        originLocationCode: formData.origin.toUpperCase(),
        destinationLocationCode: formData.destination.toUpperCase(),
        departureDate: formData.departureDate,
        adults: formData.adults.toString(),
      });

      if (formData.returnDate) {
        params.append("returnDate", formData.returnDate);
      }

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error en la búsqueda");
      }

      // Amadeus API returns data in 'data' field
      setResults(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label="Buscar viajes"
      >
        <MagnifyingGlassIcon className="h-6 w-6" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Buscar Vuelos"
        size="lg"
      >
        <form onSubmit={handleSearch} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Origen (IATA)</label>
              <Input
                placeholder="MAD"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Destino (IATA)</label>
              <Input
                placeholder="NYC"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ida</label>
              <Input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vuelta (Opcional)</label>
              <Input
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pasajeros</label>
            <Input
              type="number"
              min={1}
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Buscando..." : "Buscar Vuelos"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <h3 className="font-medium text-gray-900">Resultados ({results.length})</h3>
            <div className="space-y-3">
              {results.slice(0, 5).map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">
                        {formatCurrency(parseFloat(offer.price.total), offer.price.currency)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {offer.itineraries[0].segments[0].carrierCode} - {offer.itineraries[0].duration}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver Oferta
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {offer.itineraries[0].segments.map((seg, idx) => (
                      <div key={idx}>
                        {seg.departure.iataCode} ({new Date(seg.departure.at).toLocaleTimeString()}) → {seg.arrival.iataCode} ({new Date(seg.arrival.at).toLocaleTimeString()})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!loading && results.length === 0 && !error && formData.origin && (
           <div className="mt-4 text-center text-gray-500 text-sm">
             No se encontraron resultados o realiza una búsqueda para ver opciones.
           </div>
        )}
      </Modal>
    </>
  );
}
