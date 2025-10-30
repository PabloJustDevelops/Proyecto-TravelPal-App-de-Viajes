# App de Viajes - Proyecto Colaborativo

📋 **Descripción del Proyecto**

Esta aplicación web implementa un sistema completo de gestión de viajes que permite organizar itinerarios, controlar gastos, gestionar presupuestos y visualizar analíticas detalladas. Está diseñada como un proyecto colaborativo con enfoque en documentación, mejores prácticas y desarrollo ágil.

🚀 **Características**

✅ **Gestión completa de viajes** - Crear, editar y organizar itinerarios  
✅ **Control de gastos** - Registro y categorización de expenses por viaje  
✅ **Presupuestos inteligentes** - Planificación y seguimiento financiero  
✅ **Dashboard analítico** - Métricas y visualizaciones interactivas  
✅ **Autenticación segura** - Sistema de login con Supabase Auth  
✅ **Logger centralizado** - Sistema de logs con diferentes niveles  
✅ **Notificaciones toast** - Feedback visual para todas las acciones  
✅ **Diseño responsive** - Interfaz optimizada para todos los dispositivos  
✅ **Integración APIs** - Conexión con Amadeus para datos de vuelos  

📁 **Estructura del Proyecto**

```
app-viajes/
├── src/                          # Código fuente principal
│   ├── app/                     # Rutas y páginas (App Router)
│   │   ├── dashboard/           # Panel principal
│   │   ├── trips/               # Gestión de viajes
│   │   ├── expenses/            # Control de gastos
│   │   ├── budget/              # Presupuestos
│   │   ├── analytics/           # Analíticas y reportes
│   │   ├── auth/                # Autenticación
│   │   └── api/                 # API routes
│   ├── components/              # Componentes reutilizables
│   │   ├── ui/                  # Componentes base de UI
│   │   ├── layout/              # Componentes de layout
│   │   ├── trips/               # Componentes específicos de viajes
│   │   ├── expenses/            # Componentes de gastos
│   │   └── charts/              # Gráficos y visualizaciones
│   ├── lib/                     # Utilidades y configuraciones
│   │   ├── supabase.ts          # Cliente de Supabase
│   │   ├── logger.ts            # Sistema de logging
│   │   ├── amadeus.ts           # Integración API Amadeus
│   │   └── utils.ts             # Funciones auxiliares
│   └── contexts/                # Contextos de React
├── docs/                        # Documentación colaborativa
│   ├── TECHNICAL.md             # Documentación técnica
│   ├── CONTRIBUTING.md          # Guía de contribución
│   ├── ARCHITECTURE.md          # Arquitectura del sistema
│   ├── BRANCHING.md             # Estrategia de branching
│   └── DECISIONS/               # Registros de decisiones (ADRs)
├── .github/                     # Configuración de GitHub
│   ├── workflows/               # GitHub Actions (CI/CD)
│   ├── ISSUE_TEMPLATE/          # Plantillas de issues
│   └── PULL_REQUEST_TEMPLATE.md # Plantilla de PRs
├── testsprite_tests/            # Tests automatizados
└── README.md                    # Este archivo
```

🛠️ **Instalación y Uso**

**Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (para base de datos y auth)
- API Key de Amadeus (opcional, para datos de vuelos)

**Instalación**
```bash
# Clonar el repositorio
git clone https://github.com/PabloJustDevelops/colaboracion-alejandro-app-viajes.git
cd colaboracion-alejandro-app-viajes

# Instalar dependencias
npm install
```

**Configuración**
```bash
# Copiar variables de entorno
cp .env.example .env.local

# Configurar las siguientes variables:
# NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
# AMADEUS_CLIENT_ID=tu_amadeus_client_id (opcional)
# AMADEUS_CLIENT_SECRET=tu_amadeus_client_secret (opcional)
```

**Ejecución**

```bash
# Modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Build para producción
npm run build

# Linting y formato
npm run lint
npm run format
```

La aplicación estará disponible en `http://localhost:3000`

**Uso básico**
1. **Registro/Login**: Crear cuenta o iniciar sesión
2. **Crear viaje**: Ir a `/trips` y añadir nuevo viaje
3. **Gestionar gastos**: En `/expenses` registrar gastos por viaje
4. **Ver presupuesto**: Revisar `/budget` para seguimiento financiero
5. **Analizar datos**: Consultar `/analytics` para métricas y gráficos

📖 **Documentación Colaborativa**

La documentación técnica detallada se encuentra en:

- **[TECHNICAL.md](docs/TECHNICAL.md)**: Guía técnica completa y configuración
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)**: Cómo contribuir al proyecto
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Arquitectura y patrones de diseño
- **[BRANCHING.md](docs/BRANCHING.md)**: Estrategia de ramas y workflow Git
- **[PR_PROCESS.md](docs/PR_PROCESS.md)**: Proceso de Pull Requests
- **[COMMITS.md](docs/COMMITS.md)**: Convenciones de commits

🧪 **Testing**

El proyecto incluye tests automatizados con **Testsprite**:

```bash
# Ejecutar suite completa de tests
npm test

# Tests específicos por funcionalidad
npm run test:auth      # Tests de autenticación
npm run test:trips     # Tests de gestión de viajes
npm run test:expenses  # Tests de gastos
```

Los tests cubren:
- ✅ Autenticación y autorización
- ✅ CRUD de viajes y gastos
- ✅ Validaciones de formularios
- ✅ Integración con APIs
- ✅ Componentes de UI críticos

🔧 **Tecnologías**

- **Frontend**: Next.js 15, React 18, TypeScript
- **Estilos**: Tailwind CSS, componentes personalizados
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: Amadeus API para datos de vuelos
- **Testing**: Jest, Testsprite
- **CI/CD**: GitHub Actions
- **Linting**: ESLint, Prettier
- **Commits**: Commitlint, Conventional Commits

📊 **Estado del Desarrollo**

**✅ Funcionalidades Completadas**
- Sistema de autenticación completo
- CRUD de viajes con validaciones
- Gestión de gastos por categorías
- Dashboard con métricas principales
- Sistema de presupuestos
- Analíticas con gráficos interactivos
- Logger centralizado con toast notifications
- Diseño responsive y accesible

**🔄 En Desarrollo**
- Filtros avanzados en analíticas
- Exportación de datos (PDF/Excel)
- Notificaciones push
- Modo offline básico

**📋 Roadmap**
- Internacionalización (i18n)
- Integración con más APIs de viajes
- Sistema de colaboración en viajes
- App móvil (React Native)

👥 **Contribuidores**

- **[Pablo Rodríguez Garijo](https://github.com/PabloJustDevelops)** - Desarrollador principal
- **Alejandro García Redondo** - Desarrollador ayudante


---

**Nota**: Este proyecto forma parte de un ejercicio colaborativo enfocado en mejores prácticas de desarrollo, documentación técnica y metodologías ágiles.

## 🤝 **Contribuir**

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Consulta [CONTRIBUTING.md](docs/CONTRIBUTING.md) para más detalles.

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 📞 **Contacto**

Pablo Rodríguez Garijo - [@PabloJustDevelops](https://github.com/PabloJustDevelops)

Link del proyecto: [https://github.com/PabloJustDevelops/colaboracion-alejandro-app-viajes](https://github.com/PabloJustDevelops/colaboracion-alejandro-app-viajes)
