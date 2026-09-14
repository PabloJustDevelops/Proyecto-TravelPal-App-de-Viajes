# MCPs (Mínimos Códigos Productivos) usados en Trae

Este proyecto documenta patrones reutilizables y conectores usados en Trae:

- Logger centralizado (`src/lib/logger.ts`): captura niveles `debug|info|warn|error` y emite toasts.
- Toasts globales (`src/lib/toast.ts`, `src/components/ui/Toast.tsx`): proveedor en `RootLayout`.
- Clientes de servicios (`src/lib/insforge.ts`, `src/lib/amadeus.ts`): inicialización y helpers.
- Pruebas y auditoría (plan): `Jest` + posibilidad de `testsprite`.
- UI modular: componentes reusables en `src/components/ui/*` y por dominio.

Estos MCPs aceleran implementación sin comprometer calidad.