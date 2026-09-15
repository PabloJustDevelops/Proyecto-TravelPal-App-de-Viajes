# ADR-006: Se retira Amadeus y el vuelo se registra a mano

## Contexto

La app tenía una búsqueda de vuelos en vivo: `GET /api/flights/search`, un route handler que
validaba los parámetros con zod y llamaba a la API de Amadeus (`src/lib/amadeus.ts`, token OAuth de
`client_credentials`, endpoint `v2/shopping/flight-offers`). La UI era `TravelSearch`, un modal
montado en la barra de navegación que pintaba hasta cinco ofertas y no persistía nada: el botón
"Ver Oferta" no tenía `onClick` y ninguna oferta llegaba a `trips` ni a `bookings`.

Dos hechos cierran la vida de esa integración:

- **El handler no pide sesión.** No llama a `requireUser()`; con parámetros inválidos responde 400,
  nunca 401. Es un proxy abierto: cualquiera puede gastar la cuota del proveedor.
- **El proveedor ya no existe para este proyecto.** Amadeus retiró su portal *self-service*
  (gratuito) el 17 de julio; solo queda el portal Enterprise, comercial. Las alternativas
  comprobadas no sirven: Aviationstack da 100 peticiones/mes gratis (inservible) y 49,99 $/mes por
  10.000; AirLabs no tiene tramo gratuito serio.

Además, la [auditoría SPA vs Next](../audits/auditoria-spa-vs-next.md) y el issue #38 contaban
`flights/search` entre los endpoints que debían **sobrevivir** (por usar un secreto de servidor), y
el #38 fijaba como "Etapa 1" añadirle `requireUser()`. Esa premisa deja de ser cierta: proteger un
proxy a un proveedor retirado no arregla nada.

## Decisión

1. **Se borra el proxy, no se autentica.** Desaparecen `src/app/api/flights/search/route.ts`,
   `src/lib/amadeus.ts`, `src/lib/flightService.ts` y `TravelSearch`, junto con su montaje en la
   barra de navegación y las variables `AMADEUS_*` de `src/lib/env.ts` y `.env.example`. Un test
   guardia falla si el proxy o su cliente reaparecen.
2. **El vuelo se registra a mano como una reserva.** Se reutiliza `bookings` con `type = 'flight'`,
   que ya tiene coste, moneda, fecha, hora, confirmación, FK a `trips` y RLS de propietario. Se
   añaden cuatro columnas nullable (`airline`, `flight_number`, `origin`, `destination`) en una
   migración nueva. No se crea tabla nueva ni se toca `trips`.
3. **El autocompletado no llama a nadie.** Aerolíneas y aeropuertos salen de un juego de datos
   abierto empaquetado como fichero estático: aeropuertos de OurAirports (dominio público) y
   aerolíneas de OpenFlights (ODbL, con atribución). Sin claves y sin red en tiempo de ejecución.
4. **La inspiración de precios queda escrita, no implementada.** Travelpayouts (Aviasales) Data API
   es gratuita pero necesita cuenta y token del propietario: va en su propia spec (#41).

### Alternativas consideradas

- **Añadir `requireUser()` al proxy** (lo que decía el #38): cierra el agujero pero deja un endpoint
  que llama a un proveedor que ya no existe. Se descarta.
- **Guardar el vuelo en `trips` sin migración**: el formulario de viaje ya pide aerolínea, número de
  vuelo, origen, destino y fecha/hora, pero `trips` no tiene precio y un vuelo no es un viaje:
  perderíamos el coste y la reserva no aparecería en planning ni en el calendario.
- **Tabla `flights` propia**: más limpia para varios tramos, pero exige tabla, políticas RLS, UI y
  endpoints nuevos para un único tramo. Se descarta por coste.
- **API de vuelos de pago** (Aviationstack, AirLabs): descartada por coste y por cuota.

## Consecuencias

- La app **pierde la búsqueda de vuelos en vivo**. Es una pérdida real de funcionalidad, asumida:
  no era un planificador de vuelos y no persistía nada.
- `bookings` gana cuatro columnas nullable. **No hacen falta políticas ni grants nuevos**: las
  políticas de `bookings` son por fila (`auth.uid() = user_id`) y los grants de tabla ya cubren las
  columnas nuevas.
- El issue #38 debe actualizarse: su Etapa 1 pasa de "añadir `requireUser()`" a "borrar el
  endpoint", y `flights/search` sale de su tabla de endpoints supervivientes. Sobreviven `chat` y
  `auth/refresh`.
- Los documentos que citaban Amadeus (`README.md`, `docs/ARCHITECTURE.md`, `docs/TECHNICAL.md`,
  `docs/MCPs.md`) se corrigen. La auditoría se deja como historia y se anota al final.
- Cualquier precio de vuelo futuro que no sea el que teclea el usuario saldrá de una fuente de
  caché (Travelpayouts) y vivirá en el servidor, con su propio secreto y su propia decisión.

## Estado

Aprobado
