# Estrategia de ramas — Git Flow (Proyecto Nexa)

## 1. Ramas base

| Rama | Propósito | Protegida |
|---|---|---|
| `main` | Producción — siempre desplegable en Render | Sí (PR + CI obligatorio) |
| `develop` | Integración continua de todos los roles | Sí (PR obligatorio) |
| `release/*` | Estabilización antes de pasar a `main` (ej. `release/sprint-1`) | Temporal |
| `feature/*` | Una funcionalidad o Historia de Usuario específica | No |
| `hotfix/*` | Corrección urgente sobre `main` | Temporal |

`support/*` no se usa en este proyecto (solo aplica cuando hay que mantener
varias versiones antiguas en producción en paralelo, lo cual no ocurre en un
proyecto académico de un semestre).

## 2. Convención de nombres (ligada al backlog de HU)

```
feature/<ID-HU>-<descripcion-corta-en-kebab-case>
```

Ejemplos con las HU actuales:

```
feature/HU-CP-01-registro-propietarios
feature/HU-CP-02-registro-departamentos
feature/HU-CP-03-datos-personales-contacto
feature/HU-CP-04-historial-ocupantes
feature/HU-SE-01-login-jwt
feature/HU-SE-02-rbac-roles
```

Para releases y hotfixes:

```
release/sprint-1
release/sprint-2
hotfix/HU-SE-01-fix-token-expira
```

## 3. Diagrama del flujo

```
main ────────────●─────────────────●──── (releases estables → deploy Render)
                  │                 │
develop ──●───●───●───●───●───●─────●──── (integración continua)
           \   \       \       \
   feature/HU-CP-01  feature/HU-SE-01  feature/HU-SE-02
```

## 4. Flujo de trabajo paso a paso

1. Cada integrante crea su rama de trabajo **desde `develop`**.
2. Al terminar la funcionalidad, abre un **Pull Request hacia `develop`**.
3. QA (William) valida en `develop` con pruebas E2E (Playwright) y de API
   (Postman/Newman) antes del cierre de cada Sprint.
4. Al cierre de Sprint, se crea `release/sprint-N` desde `develop` para
   estabilizar (últimos ajustes, sin nuevas funcionalidades).
5. Se hace merge de `release/sprint-N` → `main` (dispara el deploy a
   Render) y también de vuelta → `develop`, para que ambas ramas queden
   sincronizadas.
6. Si aparece un bug crítico ya en producción, se abre `hotfix/*` desde
   `main`, se corrige, y se mergea tanto a `main` como a `develop`.

## 5. Comandos con la extensión `git-flow` (opcional pero recomendado)

Instalación (una sola vez por integrante):

```bash
# macOS
brew install git-flow-avh

# Windows (con Git Bash / Chocolatey)
choco install gitflow-avh

# Linux (Debian/Ubuntu)
sudo apt-get install git-flow
```

Inicializar Git Flow en el repo (una sola vez):

```bash
git flow init
# main branch: main
# develop branch: develop
# feature prefix: feature/
# release prefix: release/
# hotfix prefix: hotfix/
# support prefix: support/
# version tag prefix: v
```

### Trabajar una Historia de Usuario (feature)

```bash
# Crear la rama desde develop
git flow feature start HU-CP-01-registro-propietarios

# ... trabajar, hacer commits normales ...
git add .
git commit -m "feat(HU-CP-01): registrar propietarios e inquilinos"

# Subir la rama para abrir el Pull Request en GitHub
git push origin feature/HU-CP-01-registro-propietarios
# (el cierre/merge se hace vía Pull Request revisado, NO con
#  'git flow feature finish' directo, para forzar revisión de código)
```

### Preparar un release de Sprint

```bash
git flow release start sprint-1
# ajustes finales, fixes menores, actualización de versión/changelog
git flow release finish sprint-1
# esto mergea a main Y a develop, y crea el tag v-sprint-1
git push origin main develop --tags
```

### Hotfix urgente en producción

```bash
git flow hotfix start HU-SE-01-fix-token-expira
# corregir el bug
git flow hotfix finish HU-SE-01-fix-token-expira
git push origin main develop --tags
```

## 6. Commits — convención sugerida (Conventional Commits)

```
feat(HU-CP-01): registrar propietarios e inquilinos
fix(HU-SE-01): corregir expiración de token JWT
docs: actualizar README con instrucciones de despliegue
chore(devops): configurar pipeline de CI/CD
test(qa): agregar pruebas E2E de login
```

## 7. Reglas de protección de ramas recomendadas (GitHub → Settings → Branches)

- **`main`**
  - Require a pull request before merging (mínimo 1 aprobación).
  - Require status checks to pass (CI de backend/frontend en verde).
  - No permitir *force push* ni borrado de la rama.
- **`develop`**
  - Require a pull request before merging.
  - Require status checks to pass.

## 8. Nota sobre Neon (branching de base de datos)

Neon permite crear ramas de base de datos igual que Git. Se recomienda:

- Una rama de Neon `main` asociada a la rama `main` del repo (producción).
- Una rama de Neon `develop` asociada a la rama `develop` del repo, donde
  Backend prueba migraciones de Prisma (`prisma migrate dev`) antes de
  promoverlas a producción con `prisma migrate deploy`.
