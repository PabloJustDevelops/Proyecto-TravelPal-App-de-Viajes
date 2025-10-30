# 🛠️ Documentación Técnica

> **Guía técnica completa y configuración del proyecto App Viajes**

---

## 📋 Requisitos del Sistema

| Componente | Versión Mínima | Descripción |
|------------|----------------|-------------|
| 🟢 **Node.js** | `>= 18.0.0` | Runtime de JavaScript |
| 📦 **npm** | `>= 9.0.0` | Gestor de paquetes |
| 🗄️ **Supabase** | - | Base de datos y autenticación |
| ✈️ **Amadeus API** | - | API de viajes (opcional) |

---

## 🔧 Dependencias Principales

### 📚 Framework y Librerías Core
```json
{
  "next": "^14.x",
  "react": "^18.x", 
  "typescript": "^5.x"
}
```

### 🧪 Testing y Calidad de Código
```json
{
  "jest": "^29.x",
  "eslint": "^8.x",
  "prettier": "^3.x"
}
```

> 💡 **Tip:** Consulta `package.json` para ver todas las dependencias exactas y sus versiones.

---

## 🚀 Instalación Paso a Paso

### 1️⃣ **Clonar y Configurar**
```bash
# Clonar el repositorio
git clone https://github.com/PabloJustDevelops/colaboracion-alejandro-app-viajes.git
cd colaboracion-alejandro-app-viajes
```

### 2️⃣ **Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar variables (ver sección Variables de Entorno)
```

### 3️⃣ **Instalar Dependencias**
```bash
npm install
```

### 4️⃣ **Ejecutar en Desarrollo**
```bash
npm run dev
```

🎉 **¡Listo!** La aplicación estará disponible en `http://localhost:3000`

---

## ⚡ Comandos Disponibles

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `npm run dev` | 🔥 Servidor de desarrollo | Desarrollo local |
| `npm run build` | 📦 Build de producción | Antes del deploy |
| `npm run start` | 🚀 Servidor de producción | Servir build |
| `npm test` | 🧪 Ejecutar tests | Testing |
| `npm run lint` | 🔍 Análisis de código | Calidad de código |
| `npm run lint:fix` | 🔧 Corregir lint automáticamente | Formateo |

---

## 🔐 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# 🗄️ Configuración de Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui

# 📊 Configuración de Logging
NEXT_PUBLIC_LOG_LEVEL=info

# ✈️ API de Amadeus (OPCIONAL)
AMADEUS_API_KEY=tu_amadeus_api_key
AMADEUS_API_SECRET=tu_amadeus_api_secret
```

### 🔑 Obtener Credenciales

- **Supabase**: Crea un proyecto en [supabase.com](https://supabase.com)
- **Amadeus**: Regístrate en [developers.amadeus.com](https://developers.amadeus.com)

---

## 📁 Estructura del Proyecto

```
app-viajes/
├── 📂 src/
│   ├── 📂 app/                    # 🏠 Páginas y layouts (App Router)
│   │   ├── 📄 layout.tsx          # Layout principal
│   │   ├── 📄 page.tsx            # Página de inicio
│   │   └── 📂 auth/               # Páginas de autenticación
│   ├── 📂 components/             # 🧩 Componentes reutilizables
│   │   ├── 📂 ui/                 # Componentes de UI base
│   │   ├── 📂 auth/               # Componentes de autenticación
│   │   └── 📂 travel/             # Componentes de viajes
│   └── 📂 lib/                    # 🔧 Utilidades y configuración
│       ├── 📄 supabase.ts         # Cliente de Supabase
│       ├── 📄 logger.ts           # Sistema de logging
│       └── 📄 toast.ts            # Notificaciones
├── 📂 docs/                       # 📚 Documentación
├── 📂 .github/                    # 🤖 Workflows y plantillas
└── 📄 package.json                # Configuración del proyecto
```

---

## 🔧 Configuración Adicional

### 🎨 **Tailwind CSS**
El proyecto usa Tailwind CSS para estilos. La configuración está en `tailwind.config.js`.

### 🧪 **Testing**
- Framework: **Jest** + **React Testing Library**
- Archivos de test: `*.test.ts` o `*.test.tsx`
- Configuración: `jest.config.js`

### 📝 **ESLint & Prettier**
- ESLint: `.eslintrc.json`
- Prettier: `.prettierrc`
- Ejecuta `npm run lint:fix` para formatear automáticamente

---

## 🆘 Solución de Problemas

### ❌ Error de instalación de dependencias
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### ❌ Error de variables de entorno
- Verifica que `.env.local` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo después de cambiar variables

### ❌ Error de Supabase
- Verifica que la URL y la clave anónima son correctas
- Asegúrate de que el proyecto de Supabase está activo

---

## 📞 Soporte

¿Necesitas ayuda? 

- 📧 **Email**: [pablo@example.com](mailto:pablo@example.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/PabloJustDevelops/colaboracion-alejandro-app-viajes/issues)
- 📖 **Documentación**: Revisa los otros archivos en `docs/`

---

*Última actualización: Enero 2025*