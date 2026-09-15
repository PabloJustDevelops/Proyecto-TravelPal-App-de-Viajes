# ADR-008: Se retira el asistente y con él el proxy al LLM

## Contexto

La app llevaba un asistente (chatbot) montado en **todas las páginas privadas** desde
`src/components/layout/DashboardLayout.tsx`. La pieza era:

- **Interfaz** bajo `src/components/chatbot/`: el botón flotante (`ChatbotButton`), la ventana
  (`ChatbotWindow`), el campo de escritura (`ChatbotInput`) y la burbuja de mensaje
  (`ChatbotMessage`), más la prueba de la ventana.
- **Proxy de servidor** `src/app/api/chat/route.ts`: un route handler que exigía sesión
  (`requireUser()`), validaba el cuerpo y reenviaba los mensajes al LLM.
- **Cliente del LLM** `src/lib/llmService.ts`: llamaba a la API de OpenRouter
  (`https://openrouter.ai/api/v1/chat/completions`) con la clave **`OPENROUTER_API_KEY`**
  (con `GROQ_API_KEY` como clave de reserva) y un modelo configurable
  (`OPENROUTER_MODEL` / `NEXT_PUBLIC_LLM_MODEL`).

Dos hechos cierran su vida:

- **No hay presupuesto para un LLM detrás.** El asistente solo es útil si algo responde al otro
  lado; sostener un proveedor de pago (o una cuenta gratuita con cuota) no está en el plan.
- **Era la única superficie que guardaba un secreto de servidor.** La auditoría de dependencia del
  servidor ya lo señaló: de los handlers que sobrevivían, el de `chat` era **el único** que
  conservaba un secreto (la clave del LLM). Retirarlo **reduce la superficie** de forma directa:
  una credencial menos que rotar y una puerta menos por la que puede escaparse.

El [inventario de utilidad](../audits/auditoria-utilidad-y-rework.md) lo etiquetaba como "útil pero
secundaria" y ya avisaba de que "su coste no es solo de UI": ese coste es justo el que aquí deja de
compensar.

## Decisión

Se **retira el asistente por completo**:

1. **Se borran** la interfaz (`src/components/chatbot/*`, incluida su prueba), el endpoint
   `src/app/api/chat/route.ts` (y su carpeta) y el cliente `src/lib/llmService.ts` (con su prueba).
2. **Se desconecta** del armazón: `DashboardLayout.tsx` deja de importar y montar
   `ChatbotButton`/`ChatbotWindow`, y pierde su estado.
3. **Se limpian** las variables de entorno que quedan huérfanas: `OPENROUTER_API_KEY`,
   `GROQ_API_KEY` y `OPENROUTER_MODEL` de `src/lib/env.ts`; `NEXT_PUBLIC_LLM_*` de
   `src/lib/public-env.ts`, `next.config.js` y `.env.example`; y los asserts que las citaban en
   `src/lib/__tests__/env.test.ts`. Las claves **de servidor** se revocan aparte (ver Consecuencias).
4. **Se actualiza la guardia** de diseño: `ChatbotWindow.tsx` sale de la lista de botones nativos
   (`src/__tests__/design-system.test.ts`).

### Cómo volvería a levantarse el asistente

Si algún día hay presupuesto, hay dos caminos:

- **Camino A — restaurar del historial de git.** Localizar el commit que aplica este ADR y
  recuperar los ficheros del commit anterior:

  ```
  git log --diff-filter=D --oneline -- src/lib/llmService.ts src/app/api/chat/route.ts
  git checkout <commit>^ -- src/components/chatbot/ src/lib/llmService.ts \
    src/app/api/chat/route.ts src/lib/__tests__/llmService.test.ts
  ```

  Después: volver a montar `ChatbotButton`/`ChatbotWindow` en `DashboardLayout.tsx`, restaurar las
  variables de entorno en `env.ts`/`public-env.ts`/`next.config.js`/`.env.example` y reañadir
  `ChatbotWindow.tsx` a la guardia si vuelve a usar un `<button>` nativo.

- **Camino B — reimplementar sobre el gateway de IA de InsForge.** Si InsForge expone un gateway de
  IA para el proyecto, la llamada al modelo puede vivir detrás del backend ya existente y
  reutilizar `INSFORGE_API_KEY` (que sigue en el repo y en el backend), sin añadir una credencial
  nueva de proveedor. Habría que rehacer el endpoint (o una función de borde) y la interfaz.

**Secretos que harían falta y dónde vivirían:**

- **Camino A (OpenRouter/Groq):** `OPENROUTER_API_KEY` **solo en el servidor**, sin prefijo
  `NEXT_PUBLIC_`, declarada como secreto del Worker (`wrangler secret put`) y en `.dev.vars` para
  desarrollo local; opcionales `GROQ_API_KEY` y `OPENROUTER_MODEL`. Nunca en el bundle del cliente.
- **Camino B (gateway de InsForge):** **ninguno nuevo**; se reutiliza `INSFORGE_API_KEY`, que ya
  vive como secreto de servidor del repo y del backend.

**Qué habría que rehacer en la interfaz:** los cuatro componentes de `src/components/chatbot/`, su
montaje y estado en `DashboardLayout.tsx`, y —si reaparece— su entrada en la lista de botones
nativos de la guardia de diseño.

### Alternativas consideradas

- **Mantener el asistente y no tocar nada.** Descartada: el coste (endpoint, secreto que rotar,
  dependencia y mantenimiento de UI) sigue corriendo sin presupuesto que lo justifique.
- **Dejar el endpoint sin interfaz** (por si se reusa). Descartada: mantiene un proxy a un LLM de
  pago expuesto y un secreto vivo a cambio de nada. La mitad que se tira es la que menos cuesta
  recuperar (está en git).
- **Pasar la clave al cliente** con prefijo `NEXT_PUBLIC_` para llamar al LLM desde el navegador.
  Descartada de raíz: **publicaría el secreto**, que es justo la superficie que este ADR elimina.
- **Endurecer el endpoint** (límite de tasa, cuota por usuario) en vez de retirarlo. Descartada:
  sigue habiendo un LLM de pago detrás, que es el problema de fondo.
- **Sustituirlo por el gateway de IA de InsForge.** Es una buena reencarnación *cuando haya
  presupuesto*, no una alternativa a retirarlo hoy. Queda como camino B arriba.

## Consecuencias

- **Se pierde el asistente**: una funcionalidad real, asumida. Hoy no hay analítica de producto que
  mida su uso, así que la pérdida es de superficie, no de una métrica.
- **Cae el único proxy con secreto de servidor.** `OPENROUTER_API_KEY` (y `GROQ_API_KEY`) dejan de
  hacer falta: se **revocan** en el proveedor y **se borran** de los secretos del backend/Cloudflare.
  Esto reduce superficie de forma directa y es el motivo de seguridad de la decisión.
- **Menos mantenimiento**: un endpoint, un cliente, cuatro componentes y dos ficheros de prueba
  menos; y una dependencia de red y de cuota menos que vigilar.
- **Deuda de dependencias**: `react-markdown` y `remark-gfm` quedan **sin uso** en el código. Son
  candidatas a limpieza en una tarea aparte; aquí **no se toca `package.json`**.
- **Documentos históricos**: se anota al final de
  [`docs/audits/auditoria-utilidad-y-rework.md`](../audits/auditoria-utilidad-y-rework.md) y se
  corrige en [ADR-006](ADR-006-vuelos-de-amadeus-a-entrada-manual.md) la frase que daba `chat` por
  superviviente. El resto de auditorías se dejan como historia.

## Estado

Aprobado
