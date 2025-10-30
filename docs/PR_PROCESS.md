# 🔄 Proceso de Pull Requests

> **Guía completa para crear, revisar y mergear Pull Requests de calidad**

---

## 🎯 Filosofía de PRs

Los **Pull Requests** son el corazón de nuestro proceso de desarrollo colaborativo. Cada PR es una oportunidad para:

- 🔍 **Revisar código** con ojos frescos
- 📚 **Compartir conocimiento** entre el equipo
- 🛡️ **Mantener calidad** del código
- 📖 **Documentar cambios** para el futuro
- 🤝 **Colaborar efectivamente**

---

## 👨‍💻 Para Autores de PRs

### 📋 **Checklist Pre-PR**

Antes de crear tu Pull Request, asegúrate de completar:

#### 🧪 **Testing y Calidad**
- [ ] ✅ **Tests locales pasan**: `npm test`
- [ ] 🎨 **Lint sin errores**: `npm run lint`
- [ ] 🔧 **Build exitoso**: `npm run build`
- [ ] 🌐 **Funciona en desarrollo**: `npm run dev`
- [ ] 📱 **Responsive verificado** (si aplica)
- [ ] ♿ **Accesibilidad básica** verificada

#### 📝 **Documentación**
- [ ] 📚 **README actualizado** (si es necesario)
- [ ] 💬 **Comentarios en código complejo**
- [ ] 📖 **Docs técnicas actualizadas**
- [ ] 🔄 **CHANGELOG.md actualizado** (si aplica)

#### 🔄 **Git y Branching**
- [ ] 🌿 **Rama actualizada** con `main`
- [ ] 📝 **Commits semánticos** siguiendo convenciones
- [ ] 🧹 **Historial limpio** (squash si es necesario)
- [ ] 🏷️ **Nombre de rama descriptivo**

### 📝 **Creando el PR**

#### 🎯 **Título Efectivo**

```
tipo(scope): descripción clara y concisa

✅ Ejemplos buenos:
feat(auth): implementar login con Google OAuth
fix(booking): corregir cálculo de precios con descuentos
docs(api): actualizar documentación de endpoints

❌ Ejemplos malos:
fix bug
update code
changes
```

#### 📋 **Plantilla de Descripción**

```markdown
## 🎯 Qué hace este PR

Descripción clara y concisa de los cambios implementados.

## 🔄 Tipo de cambio

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva feature (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causa cambios incompatibles)
- [ ] 📚 Documentación (cambios solo en documentación)
- [ ] 🎨 Estilo (formateo, espacios, etc. sin cambios de lógica)
- [ ] ♻️ Refactor (cambio de código que no corrige bug ni añade feature)
- [ ] ⚡ Performance (cambio que mejora rendimiento)
- [ ] ✅ Test (añadir tests faltantes o corregir existentes)
- [ ] 🔧 Chore (cambios en build, herramientas, etc.)

## 🧪 Cómo se ha probado

Describe las pruebas realizadas para verificar los cambios:

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Pruebas manuales
- [ ] Tests en diferentes navegadores
- [ ] Tests en dispositivos móviles

## 📸 Screenshots (si aplica)

Antes | Después
-------|--------
![antes](url) | ![después](url)

## 📋 Checklist

- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código, especialmente en áreas complejas
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests que prueban mi fix/feature
- [ ] Tests nuevos y existentes pasan localmente
- [ ] Cambios dependientes han sido mergeados

## 🔗 Issues relacionados

Fixes #123
Closes #456
Related to #789

## 📝 Notas adicionales

Cualquier información adicional que los reviewers deban conocer.
```

#### 🏷️ **Labels Importantes**

| Label | Descripción | Cuándo usar |
|-------|-------------|-------------|
| `🚀 feature` | Nueva funcionalidad | Features nuevas |
| `🐛 bug` | Corrección de errores | Bug fixes |
| `📚 documentation` | Solo documentación | Cambios en docs |
| `🔧 chore` | Mantenimiento | Deps, config, etc. |
| `⚡ performance` | Mejoras de rendimiento | Optimizaciones |
| `🚨 breaking-change` | Cambio incompatible | Breaking changes |
| `🔥 priority-high` | Alta prioridad | Bugs críticos |
| `👀 needs-review` | Necesita revisión | PR listo para review |
| `🚧 work-in-progress` | En desarrollo | Draft PRs |

### 🎯 **Mejores Prácticas para Autores**

#### 📏 **Tamaño del PR**
- ✅ **Ideal**: < 400 líneas de código
- ⚠️ **Aceptable**: 400-800 líneas
- ❌ **Evitar**: > 800 líneas (dividir en PRs más pequeños)

#### 🎯 **Enfoque**
- 🎯 **Un objetivo por PR**: Una feature, un bug, una mejora
- 🔄 **Cambios relacionados**: Solo cambios que contribuyen al objetivo
- 📝 **Contexto claro**: Explicar el "por qué", no solo el "qué"

#### 💬 **Comunicación**
- 📢 **Notificar cambios**: Mencionar a reviewers relevantes
- 🤝 **Ser receptivo**: Responder a comentarios constructivamente
- 🔄 **Iterar rápido**: Hacer cambios solicitados prontamente

---

## 👥 Para Reviewers

### 🔍 **Checklist de Review**

#### 🏗️ **Arquitectura y Diseño**
- [ ] 🎯 **Solución apropiada** para el problema
- [ ] 🏛️ **Arquitectura consistente** con el proyecto
- [ ] 🔄 **Patrones establecidos** seguidos
- [ ] 📦 **Separación de responsabilidades** clara
- [ ] 🔧 **Reutilización** de código existente

#### 💻 **Calidad del Código**
- [ ] 📖 **Legibilidad** y claridad
- [ ] 🎨 **Estilo consistente** con el proyecto
- [ ] 💬 **Comentarios apropiados** en código complejo
- [ ] 🏷️ **Nombres descriptivos** para variables y funciones
- [ ] 🚫 **Sin código duplicado** innecesario

#### 🛡️ **Seguridad y Performance**
- [ ] 🔒 **Sin vulnerabilidades** evidentes
- [ ] 🚫 **Sin hardcoded secrets** o credenciales
- [ ] ⚡ **Performance aceptable**
- [ ] 💾 **Uso eficiente de memoria**
- [ ] 🌐 **Manejo de errores** apropiado

#### 🧪 **Testing**
- [ ] ✅ **Tests apropiados** incluidos
- [ ] 📊 **Cobertura adecuada** de casos
- [ ] 🎯 **Tests enfocados** y claros
- [ ] 🔄 **Tests pasan** consistentemente

#### 📚 **Documentación**
- [ ] 📖 **Documentación actualizada**
- [ ] 💬 **Comentarios útiles** en código
- [ ] 📝 **README actualizado** si es necesario
- [ ] 🔄 **Changelog actualizado**

### 💬 **Tipos de Comentarios**

#### ✅ **Comentarios Constructivos**

```markdown
# 🎯 Sugerencia de mejora
¿Has considerado usar `useMemo` aquí para optimizar el re-render?

# 🤔 Pregunta para entender
¿Podrías explicar por qué elegiste este approach sobre X alternativa?

# 🐛 Posible issue
Este código podría fallar si `user` es null. ¿Qué te parece añadir un guard?

# 👍 Reconocimiento
¡Excelente solución! Me gusta cómo manejaste este edge case.

# 📚 Compartir conocimiento
FYI: Hay una utility function `formatDate` en utils/ que podría ser útil aquí.
```

#### ❌ **Comentarios a Evitar**

```markdown
# ❌ Muy vago
"Esto no se ve bien"

# ❌ Sin contexto
"Cambiar esto"

# ❌ Demasiado crítico
"Este código es terrible"

# ❌ Sin sugerencia
"Esto está mal" (sin explicar cómo mejorarlo)
```

### 🎯 **Proceso de Review**

#### 1️⃣ **Primera Pasada - Vista General**
- 📖 Leer descripción del PR
- 🎯 Entender el objetivo
- 📏 Evaluar tamaño y scope
- 🔍 Identificar áreas de enfoque

#### 2️⃣ **Segunda Pasada - Revisión Detallada**
- 💻 Revisar código línea por línea
- 🧪 Verificar tests
- 📚 Revisar documentación
- 🔍 Buscar posibles issues

#### 3️⃣ **Tercera Pasada - Testing Local**
- 📥 Hacer checkout de la rama
- 🧪 Ejecutar tests
- 🌐 Probar funcionalidad
- 📱 Verificar en diferentes dispositivos

### ⏱️ **Tiempos de Response**

| Prioridad | Tiempo Objetivo | Descripción |
|-----------|----------------|-------------|
| 🔥 **Crítico** | < 2 horas | Hotfixes, bugs críticos |
| ⚡ **Alto** | < 24 horas | Features importantes |
| 📋 **Normal** | < 48 horas | Features regulares |
| 📚 **Bajo** | < 72 horas | Docs, chores |

---

## 🔀 Proceso de Merge

### ✅ **Criterios para Merge**

#### 📋 **Requisitos Obligatorios**
- [ ] ✅ **Al menos 1 aprobación** de reviewer
- [ ] 🧪 **Todos los checks pasan** (CI/CD)
- [ ] 🔄 **Rama actualizada** con main
- [ ] 📝 **Conversaciones resueltas**
- [ ] 🏷️ **Labels apropiadas** asignadas

#### 🎯 **Criterios de Calidad**
- [ ] 📊 **Cobertura de tests** mantenida/mejorada
- [ ] 🚫 **Sin conflictos** de merge
- [ ] 📚 **Documentación completa**
- [ ] 🔍 **No introduce regresiones**

### 🔀 **Estrategias de Merge**

#### 🎯 **Squash & Merge** (Recomendado)
```bash
# Resultado: 1 commit limpio en main
feat(auth): implementar login con Google OAuth (#123)

- Añadir componente LoginButton
- Integrar con Google OAuth API
- Añadir tests para flujo de autenticación
- Actualizar documentación de auth

Co-authored-by: Reviewer Name <email@example.com>
```

**✅ Cuándo usar:**
- Features completas
- Bug fixes
- Mantener historial limpio

#### 🔄 **Merge Commit**
```bash
# Resultado: Preserva historial de la rama
Merge pull request #123 from feature/google-auth

feat(auth): implementar login con Google OAuth
```

**✅ Cuándo usar:**
- Features muy complejas
- Múltiples colaboradores
- Historial de rama importante

#### 📚 **Rebase & Merge**
```bash
# Resultado: Commits individuales en main
feat(auth): añadir componente LoginButton
feat(auth): integrar con Google OAuth API
test(auth): añadir tests para flujo de autenticación
```

**✅ Cuándo usar:**
- Commits ya están limpios
- Historial lineal deseado
- Commits individuales tienen valor

---

## 🤖 Automatización y CI/CD

### 🔧 **GitHub Actions**

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Build project
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 🏷️ **Auto-labeling**

```yaml
# .github/labeler.yml
'🐛 bug':
  - any: ['**/fix/**', '**/bugfix/**']

'✨ feature':
  - any: ['**/feature/**', '**/feat/**']

'📚 documentation':
  - any: ['**/*.md', 'docs/**']

'🧪 tests':
  - any: ['**/*.test.*', '**/*.spec.*', 'tests/**']
```

### 🤖 **PR Templates**

```markdown
<!-- .github/pull_request_template.md -->
## 🎯 Descripción

Breve descripción de los cambios.

## 🔄 Tipo de cambio

- [ ] 🐛 Bug fix
- [ ] ✨ Nueva feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentación

## 🧪 Testing

- [ ] Tests unitarios añadidos/actualizados
- [ ] Tests de integración verificados
- [ ] Pruebas manuales realizadas

## 📋 Checklist

- [ ] Código sigue las convenciones del proyecto
- [ ] Auto-revisión realizada
- [ ] Documentación actualizada
- [ ] Tests pasan localmente

## 🔗 Issues relacionados

Fixes #
```

---

## 📊 Métricas y KPIs

### 📈 **Métricas de Proceso**

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| **Tiempo de review** | < 24h | GitHub Insights |
| **Tiempo de merge** | < 48h | GitHub API |
| **Tamaño promedio de PR** | < 400 líneas | GitHub stats |
| **Tasa de aprobación** | > 95% | Custom dashboard |
| **Conflictos de merge** | < 5% | Git analytics |

### 🔍 **Comandos de Análisis**

```bash
# PRs pendientes de review
gh pr list --state open --label "needs-review"

# Estadísticas de PRs
gh pr list --state all --json number,title,author,createdAt

# PRs por autor
gh pr list --author @me --state all

# Reviews pendientes
gh pr list --review-requested @me
```

---

## 🚨 Casos Especiales

### 🔥 **Hotfixes Críticos**

Para bugs críticos en producción:

```markdown
## 🚨 HOTFIX CRÍTICO

### 🎯 Problema
Descripción del bug crítico en producción.

### 🔧 Solución
Cambios mínimos para resolver el issue.

### ⚡ Urgencia
- [ ] Bug afecta a usuarios en producción
- [ ] Solución mínima y enfocada
- [ ] Tests críticos verificados
- [ ] Deploy inmediato requerido

### 👥 Fast-track Review
@reviewer1 @reviewer2 - Review urgente necesario
```

### 🧪 **PRs Experimentales**

Para features experimentales o POCs:

```markdown
## 🧪 EXPERIMENTAL

### 🎯 Objetivo
Probar concepto X para evaluar viabilidad.

### ⚠️ Advertencias
- Código experimental, no para producción
- Puede requerir cambios significativos
- Feedback y sugerencias bienvenidas

### 🔬 Métricas a evaluar
- Performance impact
- User experience
- Technical feasibility
```

---

## ❓ Preguntas Frecuentes

### 🤔 **¿Cuándo crear un Draft PR?**
- 🚧 Trabajo en progreso que necesita feedback temprano
- 🤝 Colaboración en features complejas
- 📋 Mostrar progreso al equipo
- 🔍 Validar approach antes de completar

### 🤔 **¿Cómo manejar feedback conflictivo?**
1. 💬 **Discutir abiertamente** en el PR
2. 🤝 **Buscar consenso** entre reviewers
3. 📞 **Llamada si es necesario** para resolver
4. 👨‍💼 **Escalate a tech lead** si no hay acuerdo

### 🤔 **¿Qué hacer con PRs obsoletos?**
- 🔄 **Rebase con main** si es posible
- 🗑️ **Cerrar si ya no es relevante**
- 🔄 **Recrear** si los cambios son muy extensos
- 📝 **Documentar** la razón del cierre

---

## 📚 Recursos Adicionales

### 📖 **Documentación Relacionada**
- 🌳 [`BRANCHING.md`](./BRANCHING.md) - Estrategia de branching
- 📝 [`COMMITS.md`](./COMMITS.md) - Convenciones de commits
- 🤝 [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Guía de contribución

### 🔗 **Enlaces Útiles**
- [GitHub PR Best Practices](https://github.com/features/code-review/)
- [Code Review Guidelines](https://google.github.io/eng-practices/review/)
- [Conventional Comments](https://conventionalcomments.org/)

### 🛠️ **Herramientas Recomendadas**
- **GitHub CLI**: `gh` para gestión de PRs
- **VS Code Extensions**: GitHub Pull Requests
- **Browser Extensions**: Refined GitHub

---

**🔄 Un proceso de PR eficiente para un desarrollo colaborativo de calidad**

*Última actualización: Enero 2025*