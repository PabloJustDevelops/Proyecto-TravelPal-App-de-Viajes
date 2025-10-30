# 📝 Convenciones de Commits

> **Guía completa para escribir commits semánticos y consistentes**

---

## 🎯 Filosofía de Commits

Los **commits semánticos** son la base de un historial de Git limpio y útil. Cada commit debe contar una historia clara sobre **qué cambió** y **por qué cambió**.

### ✅ **Beneficios**
- 📚 **Historial legible** y navegable
- 🤖 **Automatización** de changelogs y releases
- 🔍 **Búsqueda eficiente** de cambios específicos
- 🔄 **Rollbacks precisos** cuando sea necesario
- 👥 **Colaboración mejorada** entre desarrolladores

---

## 📋 Formato Estándar

### 🎯 **Estructura Base**

```
tipo(scope): descripción corta

[cuerpo opcional]

[footer opcional]
```

#### 📏 **Reglas de Formato**
- **Línea 1**: Máximo 72 caracteres
- **Tipo**: Siempre en minúsculas
- **Descripción**: Imperativo, sin punto final
- **Cuerpo**: Opcional, separado por línea en blanco
- **Footer**: Opcional, para breaking changes o issues

---

## 🏷️ Tipos de Commits

### 🚀 **Tipos Principales**

| Tipo | Emoji | Descripción | Cuándo usar |
|------|-------|-------------|-------------|
| `feat` | ✨ | Nueva funcionalidad | Añadir features para usuarios |
| `fix` | 🐛 | Corrección de bugs | Solucionar errores |
| `docs` | 📚 | Solo documentación | Cambios en docs |
| `style` | 🎨 | Formato/estilo | Espacios, formato, etc. |
| `refactor` | ♻️ | Refactorización | Mejorar código sin cambiar funcionalidad |
| `test` | ✅ | Tests | Añadir o corregir tests |
| `chore` | 🔧 | Mantenimiento | Deps, config, build |

### 🔧 **Tipos Secundarios**

| Tipo | Emoji | Descripción | Cuándo usar |
|------|-------|-------------|-------------|
| `perf` | ⚡ | Performance | Mejoras de rendimiento |
| `ci` | 👷 | CI/CD | Cambios en pipelines |
| `build` | 📦 | Build system | Webpack, npm scripts, etc. |
| `revert` | ⏪ | Revertir | Deshacer commits previos |

---

## 🎯 Scopes Recomendados

### 📂 **Por Dominio/Feature**

```bash
# Autenticación
feat(auth): implementar login con Google
fix(auth): corregir validación de tokens

# Reservas/Booking
feat(booking): añadir selección de asientos
fix(booking): calcular precios con descuentos

# Búsqueda
feat(search): filtros avanzados de vuelos
perf(search): optimizar consultas de API

# Dashboard/UI
feat(dashboard): gráficos de estadísticas
style(dashboard): mejorar responsive design
```

### 🏗️ **Por Capa Técnica**

```bash
# API/Backend
feat(api): endpoint para notificaciones
fix(api): manejo de errores 500

# Base de datos
feat(db): migración para tabla users
fix(db): índices para queries lentas

# Frontend/UI
feat(ui): componente DatePicker
fix(ui): modal no se cierra en mobile

# Config/Tooling
chore(config): actualizar ESLint rules
ci(github): añadir workflow de deploy
```

### 🔧 **Scopes Especiales**

```bash
# Sin scope específico
feat: añadir página de contacto
fix: corregir typo en README

# Múltiples áreas
feat(auth,ui): login con diseño renovado
fix(api,db): sincronización de datos
```

---

## ✅ Ejemplos Correctos

### 🚀 **Features**

```bash
# ✅ Feature simple
feat(search): añadir filtro por aerolínea

# ✅ Feature con contexto
feat(booking): implementar pago con Stripe

Permite a los usuarios pagar reservas usando tarjetas de crédito
a través de la integración con Stripe API.

- Añadir componente PaymentForm
- Integrar Stripe Elements
- Manejar webhooks de confirmación
- Añadir tests para flujo de pago

Closes #123
```

### 🐛 **Bug Fixes**

```bash
# ✅ Fix simple
fix(auth): corregir logout en Safari

# ✅ Fix con detalles
fix(booking): calcular correctamente precios con descuentos

El cálculo de descuentos no consideraba impuestos, causando
precios incorrectos en el checkout.

- Aplicar descuentos antes de calcular impuestos
- Añadir validación para descuentos > 100%
- Actualizar tests de pricing

Fixes #456
```

### 📚 **Documentación**

```bash
# ✅ Docs simples
docs: actualizar guía de instalación

# ✅ Docs específicas
docs(api): añadir ejemplos para endpoints de búsqueda

- Ejemplos de request/response
- Códigos de error comunes
- Rate limiting info
```

### 🔧 **Chores y Mantenimiento**

```bash
# ✅ Dependencies
chore(deps): actualizar React a v18.2.0

# ✅ Config
chore(eslint): añadir reglas para hooks

# ✅ Build
build(webpack): optimizar bundle size

Reduce el bundle principal de 2.1MB a 1.8MB mediante:
- Tree shaking mejorado
- Code splitting por rutas
- Compresión gzip
```

---

## ❌ Ejemplos Incorrectos

### 🚫 **Qué NO hacer**

```bash
# ❌ Muy vago
fix: bug

# ❌ Sin tipo
añadir nueva feature

# ❌ Demasiado largo en título
feat(booking): implementar sistema completo de reservas con pago, confirmación, emails y notificaciones push

# ❌ Descripción no imperativa
feat(auth): added login functionality

# ❌ Múltiples cambios no relacionados
feat(auth): login + fix search bug + update docs

# ❌ Tipo incorrecto
feat(fix): corregir error de login

# ❌ Scope muy genérico
feat(app): nueva funcionalidad
```

### ✅ **Versiones Corregidas**

```bash
# ✅ Específico y claro
fix(auth): corregir error de validación en login

# ✅ Con tipo apropiado
feat(auth): implementar login con Google OAuth

# ✅ Título conciso
feat(booking): sistema de reservas con pago

Implementa flujo completo de reservas incluyendo:
- Selección de vuelos y asientos
- Integración con Stripe para pagos
- Confirmación por email
- Notificaciones push

# ✅ Imperativo
feat(auth): implement Google OAuth login

# ✅ Un cambio por commit
feat(auth): implementar login con Google
fix(search): corregir filtros de fecha
docs(readme): actualizar guía de instalación

# ✅ Tipo y scope correctos
fix(auth): corregir validación de tokens JWT
```

---

## 🔄 Breaking Changes

### 💥 **Formato para Breaking Changes**

```bash
# Opción 1: Con ! en el tipo
feat(api)!: cambiar formato de respuesta de usuarios

BREAKING CHANGE: El endpoint /api/users ahora retorna un objeto
con estructura diferente. Ver migration guide en docs/MIGRATION.md

# Opción 2: En el footer
feat(api): mejorar estructura de respuesta de usuarios

BREAKING CHANGE: El campo 'name' se dividió en 'firstName' y 'lastName'.
Actualizar código cliente para usar la nueva estructura.

Antes:
{
  "name": "Juan Pérez"
}

Después:
{
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

### 📋 **Checklist para Breaking Changes**

- [ ] 💥 Usar `!` o `BREAKING CHANGE:` en footer
- [ ] 📖 Documentar el cambio en detalle
- [ ] 🔄 Proporcionar guía de migración
- [ ] 📝 Actualizar documentación de API
- [ ] 🧪 Añadir tests para nueva funcionalidad
- [ ] 📢 Comunicar al equipo antes del merge

---

## 🔗 Referencias a Issues

### 🎯 **Palabras Clave**

| Palabra | Efecto | Cuándo usar |
|---------|--------|-------------|
| `Fixes #123` | Cierra el issue | Bug fixes |
| `Closes #123` | Cierra el issue | Features completadas |
| `Resolves #123` | Cierra el issue | Cualquier resolución |
| `Related to #123` | Solo referencia | Trabajo parcial |
| `See #123` | Solo referencia | Contexto adicional |

### 📝 **Ejemplos**

```bash
# ✅ Cierra issue específico
fix(auth): corregir timeout en login

Fixes #234

# ✅ Múltiples issues
feat(search): filtros avanzados de vuelos

Implementa filtros por:
- Aerolínea
- Horario de salida
- Número de escalas
- Precio máximo

Closes #123, #124, #125

# ✅ Issue relacionado pero no cerrado
refactor(api): mejorar estructura de endpoints

Preparación para implementar cache en #456.
No cierra el issue pero facilita la implementación.

Related to #456
```

---

## 🛠️ Herramientas y Automatización

### 🤖 **Commitizen**

```bash
# Instalar commitizen
npm install -g commitizen
npm install -g cz-conventional-changelog

# Configurar en package.json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}

# Usar para commits interactivos
git cz
```

### 🔧 **Commitlint**

```bash
# Instalar commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Configurar en commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 
      'test', 'chore', 'perf', 'ci', 'build', 'revert'
    ]],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72]
  }
};

# Añadir hook en package.json
{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

### 📊 **Conventional Changelog**

```bash
# Generar changelog automático
npm install --save-dev conventional-changelog-cli

# Script en package.json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}

# Generar changelog
npm run changelog
```

---

## 📈 Flujo de Trabajo Recomendado

### 1️⃣ **Antes del Commit**

```bash
# Verificar cambios
git status
git diff

# Añadir archivos específicos
git add src/components/LoginForm.tsx
git add src/tests/LoginForm.test.tsx

# O añadir todo si estás seguro
git add .
```

### 2️⃣ **Escribir el Commit**

```bash
# Opción 1: Commit directo
git commit -m "feat(auth): implementar login con Google OAuth"

# Opción 2: Con editor para mensaje largo
git commit
# Se abre editor para escribir mensaje completo

# Opción 3: Con commitizen (recomendado)
git cz
```

### 3️⃣ **Verificar el Commit**

```bash
# Ver el último commit
git log -1 --oneline

# Ver detalles completos
git show HEAD

# Corregir si es necesario (solo si no se ha pusheado)
git commit --amend
```

---

## 🔍 Comandos Útiles

### 📊 **Análisis de Commits**

```bash
# Ver historial con formato bonito
git log --oneline --graph --decorate

# Filtrar por tipo
git log --oneline --grep="feat:"
git log --oneline --grep="fix:"

# Ver commits por autor
git log --author="nombre" --oneline

# Estadísticas de commits
git shortlog -sn --since="1 month ago"

# Ver cambios entre versiones
git log v1.0.0..v1.1.0 --oneline
```

### 🔧 **Corrección de Commits**

```bash
# Cambiar mensaje del último commit (no pusheado)
git commit --amend -m "nuevo mensaje"

# Cambiar autor del último commit
git commit --amend --author="Nombre <email@example.com>"

# Revertir commit manteniendo historial
git revert HEAD

# Revertir múltiples commits
git revert HEAD~3..HEAD
```

---

## 📋 Templates y Aliases

### 📝 **Template de Commit**

```bash
# Crear template en ~/.gitmessage
# Tipo(scope): descripción corta (máx 72 chars)
#
# Explicación más detallada del cambio (opcional)
# - Qué cambió
# - Por qué cambió
# - Cómo afecta a los usuarios
#
# Fixes #123
# Closes #456

# Configurar template globalmente
git config --global commit.template ~/.gitmessage
```

### ⚡ **Aliases Útiles**

```bash
# Añadir a ~/.gitconfig
[alias]
  # Commits rápidos
  cf = "!f() { git commit -m \"feat: $1\"; }; f"
  cx = "!f() { git commit -m \"fix: $1\"; }; f"
  cd = "!f() { git commit -m \"docs: $1\"; }; f"
  
  # Ver historial bonito
  lg = log --oneline --graph --decorate --all
  
  # Último commit
  last = log -1 HEAD --stat
  
  # Commits por tipo
  feat = log --oneline --grep="feat:"
  fixes = log --oneline --grep="fix:"
```

---

## ❓ Preguntas Frecuentes

### 🤔 **¿Cuándo usar cada tipo?**

- **feat**: Cualquier cosa nueva que el usuario puede usar
- **fix**: Cualquier corrección de comportamiento incorrecto
- **docs**: Solo cambios en documentación (README, comentarios)
- **style**: Formato, espacios, punto y coma (sin cambios de lógica)
- **refactor**: Cambios de código que no añaden features ni corrigen bugs
- **test**: Añadir tests faltantes o corregir tests existentes
- **chore**: Cambios en herramientas, configuración, dependencias

### 🤔 **¿Qué scope usar?**

1. **Por feature**: `auth`, `booking`, `search`, `payment`
2. **Por componente**: `header`, `sidebar`, `modal`
3. **Por capa**: `api`, `db`, `ui`, `config`
4. **Sin scope**: Para cambios globales o cuando no aplica

### 🤔 **¿Cómo manejar commits grandes?**

```bash
# ❌ Evitar commits masivos
git commit -m "feat: implementar todo el sistema de reservas"

# ✅ Dividir en commits lógicos
git commit -m "feat(booking): añadir modelo de reserva"
git commit -m "feat(booking): implementar API endpoints"
git commit -m "feat(booking): crear componentes UI"
git commit -m "test(booking): añadir tests unitarios"
```

### 🤔 **¿Qué hacer con commits incorrectos?**

```bash
# Si no se ha pusheado - cambiar mensaje
git commit --amend -m "mensaje correcto"

# Si ya se pusheó - crear commit de corrección
git commit -m "fix: corregir typo en mensaje anterior"

# Para cambios mayores - revertir y rehacer
git revert HEAD
git commit -m "feat(auth): implementar login correctamente"
```

---

## 📚 Recursos Adicionales

### 📖 **Documentación Relacionada**
- 🌳 [`BRANCHING.md`](./BRANCHING.md) - Estrategia de branching
- 🔄 [`PR_PROCESS.md`](./PR_PROCESS.md) - Proceso de Pull Requests
- 🤝 [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Guía de contribución

### 🔗 **Enlaces Útiles**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

### 🛠️ **Herramientas Recomendadas**
- **Commitizen**: Commits interactivos
- **Commitlint**: Validación de formato
- **Conventional Changelog**: Generación automática
- **Semantic Release**: Releases automáticos

---

**📝 Commits semánticos para un desarrollo organizado y profesional**

*Última actualización: Enero 2025*