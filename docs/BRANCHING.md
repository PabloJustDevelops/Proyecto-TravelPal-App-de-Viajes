# 🌳 Estrategia de Branching

> **Flujo de trabajo con Git para el proyecto App Viajes**

---

## 🎯 Filosofía de Branching

Seguimos un **flujo simplificado basado en GitHub Flow** que prioriza la **simplicidad**, **colaboración** y **despliegues frecuentes**. Nuestro objetivo es mantener un historial limpio y facilitar la colaboración entre desarrolladores.

---

## 🏠 Rama Principal

### 🌟 **`main`** - Rama de Producción

| Característica | Descripción |
|----------------|-------------|
| 🎯 **Propósito** | Código estable y desplegable |
| 🛡️ **Protección** | Protegida contra push directo |
| 🔄 **Actualizaciones** | Solo mediante Pull Requests |
| 🚀 **Despliegue** | Auto-deploy a producción |
| ✅ **Requisitos** | Tests pasando + Review aprobado |

#### 🔒 **Reglas de Protección**
- ❌ **No push directo** - Solo PRs permitidos
- ✅ **Review obligatorio** - Al menos 1 aprobación
- 🧪 **Status checks** - Tests y lint deben pasar
- 🔄 **Branch actualizada** - Debe estar al día con main

---

## 🌿 Ramas de Trabajo

### 🆕 **Feature Branches** - Nuevas Funcionalidades

```bash
# Nomenclatura
feature/<descripcion-breve>
feature/<numero-issue>-<descripcion>

# Ejemplos
feature/login-google
feature/123-busqueda-vuelos
feature/dashboard-usuario
```

#### 📋 **Características**
- 🎯 **Propósito**: Desarrollo de nuevas funcionalidades
- ⏱️ **Duración**: Corta (1-5 días idealmente)
- 🔄 **Origen**: Siempre desde `main` actualizada
- 🎯 **Destino**: Merge hacia `main` via PR

#### 🚀 **Flujo de Trabajo**
```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 3. Desarrollar y commitear
git add .
git commit -m "feat: añadir nueva funcionalidad"

# 4. Push y crear PR
git push origin feature/nueva-funcionalidad
```

### 🐛 **Fix Branches** - Corrección de Bugs

```bash
# Nomenclatura
fix/<descripcion-del-bug>
fix/<numero-issue>-<descripcion>

# Ejemplos
fix/error-login
fix/456-calculo-precios
fix/responsive-mobile
```

#### 📋 **Características**
- 🎯 **Propósito**: Corrección de errores y bugs
- ⚡ **Prioridad**: Alta (especialmente bugs críticos)
- 🔄 **Origen**: Desde `main` o desde la rama afectada
- 🚨 **Urgencia**: Pueden tener fast-track para bugs críticos

### 🔧 **Chore Branches** - Tareas de Mantenimiento

```bash
# Nomenclatura
chore/<descripcion-tarea>

# Ejemplos
chore/actualizar-dependencias
chore/configurar-eslint
chore/mejorar-documentacion
```

#### 📋 **Características**
- 🎯 **Propósito**: Mantenimiento, configuración, refactoring
- 📚 **Incluye**: Docs, deps, config, tooling
- 🔄 **Impacto**: No afecta funcionalidad del usuario

---

## 🔄 Flujo de Trabajo Completo

### 1️⃣ **Preparación**

```bash
# Asegurar que main está actualizada
git checkout main
git pull origin main

# Verificar estado limpio
git status
```

### 2️⃣ **Crear Rama de Trabajo**

```bash
# Crear y cambiar a nueva rama
git checkout -b tipo/descripcion-clara

# Verificar rama actual
git branch --show-current
```

### 3️⃣ **Desarrollo**

```bash
# Hacer cambios y commits frecuentes
git add archivo-modificado.ts
git commit -m "tipo(scope): descripción clara"

# Push regular para backup
git push origin nombre-de-rama
```

### 4️⃣ **Mantener Actualizada**

```bash
# Sincronizar con main regularmente
git checkout main
git pull origin main
git checkout tu-rama
git rebase main  # o git merge main
```

### 5️⃣ **Preparar para PR**

```bash
# Verificar que todo está commiteado
git status

# Ejecutar tests y lint
npm run lint
npm test

# Push final
git push origin tu-rama
```

### 6️⃣ **Pull Request**

1. 🌐 Ir a GitHub y crear PR
2. 📝 Completar plantilla del PR
3. 🏷️ Añadir labels apropiadas
4. 👥 Solicitar reviewers
5. ✅ Esperar aprobación y merge

---

## 🔀 Políticas de Merge

### 🎯 **Estrategia Recomendada: Squash & Merge**

#### ✅ **Ventajas**
- 📚 **Historial limpio**: Un commit por feature
- 🔍 **Fácil seguimiento**: Cada feature es un commit
- 🔄 **Rollback simple**: Revertir features completas
- 📝 **Mensaje claro**: Descripción consolidada

#### 📝 **Formato del Commit de Merge**
```
tipo(scope): descripción clara de la feature (#PR)

- Detalle 1 de lo implementado
- Detalle 2 de lo implementado
- Fixes #issue-number
```

### 🔄 **Alternativas Permitidas**

| Estrategia | Cuándo Usar | Resultado |
|------------|-------------|-----------|
| **Squash & Merge** | ✅ Por defecto | 1 commit limpio |
| **Merge Commit** | 🔄 Features complejas | Preserva historial |
| **Rebase & Merge** | 📚 Commits ya limpios | Historial lineal |

---

## 🚨 Casos Especiales

### 🔥 **Hotfixes Críticos**

Para bugs críticos en producción:

```bash
# 1. Crear hotfix desde main
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-critica

# 2. Fix rápido y test
# ... hacer cambios mínimos ...
npm test

# 3. PR con prioridad alta
git push origin hotfix/descripcion-critica
# Crear PR con label "priority: high"
```

### 🔄 **Ramas de Larga Duración**

Para features muy grandes (evitar si es posible):

```bash
# Mantener sincronizada con main
git checkout main
git pull origin main
git checkout feature/gran-feature
git rebase main

# O usar merge si hay conflictos complejos
git merge main
```

### 🧪 **Ramas Experimentales**

Para experimentos y POCs:

```bash
# Nomenclatura especial
experiment/nombre-experimento
poc/prueba-concepto

# No necesariamente van a main
```

---

## 📊 Monitoreo y Métricas

### 📈 **KPIs de Branching**

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| **Tiempo de vida de rama** | < 5 días | GitHub Insights |
| **Tamaño de PR** | < 400 líneas | GitHub PR stats |
| **Tiempo de review** | < 24 horas | GitHub metrics |
| **Conflictos de merge** | < 5% | Git logs |

### 🔍 **Comandos de Análisis**

```bash
# Ver ramas activas
git branch -a

# Ver ramas merged
git branch --merged main

# Limpiar ramas locales merged
git branch --merged main | grep -v main | xargs git branch -d

# Ver estadísticas de commits
git shortlog -sn --since="1 month ago"
```

---

## 🛠️ Herramientas y Automatización

### 🤖 **GitHub Actions**

```yaml
# .github/workflows/branch-protection.yml
name: Branch Protection
on:
  pull_request:
    branches: [main]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      - name: Run lint
        run: npm run lint
```

### 🔧 **Git Hooks**

```bash
# .git/hooks/pre-push
#!/bin/sh
# Ejecutar tests antes de push
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron. Push cancelado."
  exit 1
fi
```

### 📱 **Comandos Útiles**

```bash
# Alias útiles para .gitconfig
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = !gitk
  
  # Crear feature branch
  feature = "!f() { git checkout main && git pull && git checkout -b feature/$1; }; f"
  
  # Limpiar ramas merged
  cleanup = "!git branch --merged main | grep -v main | xargs git branch -d"
```

---

## ❓ Preguntas Frecuentes

### 🤔 **¿Cuándo crear una nueva rama?**
- ✅ Para cualquier cambio que no sea trivial
- ✅ Siempre para nuevas features
- ✅ Para cualquier bug fix
- ✅ Para cambios de documentación extensos

### 🤔 **¿Cómo manejar conflictos?**
```bash
# Durante rebase
git rebase main
# Resolver conflictos manualmente
git add archivo-resuelto.ts
git rebase --continue

# Durante merge
git merge main
# Resolver conflictos
git add .
git commit -m "resolve: conflictos con main"
```

### 🤔 **¿Cuándo hacer rebase vs merge?**
- **Rebase**: Para mantener historial lineal y limpio
- **Merge**: Cuando quieres preservar el contexto de la rama

---

## 📚 Recursos Adicionales

### 📖 **Documentación Relacionada**
- 📝 [`COMMITS.md`](./COMMITS.md) - Convenciones de commits
- 🔄 [`PR_PROCESS.md`](./PR_PROCESS.md) - Proceso de Pull Requests
- 🤝 [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Guía de contribución

### 🔗 **Enlaces Útiles**
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Branching Best Practices](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**🌳 Un flujo de branching simple y efectivo para un desarrollo colaborativo exitoso**

*Última actualización: Enero 2025*