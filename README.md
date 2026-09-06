# Sistema Integral de Administración — Edificio XYZ

Proyecto académico del equipo **Nexa** (Taller de Ingeniería de Software).

## Roles del equipo

| Rol | Integrante | Stack principal |
|---|---|---|
| Backend (Operativo y Seguridad) | Diego Armando Alvarez Guzman | Node.js, Express, Prisma, PostgreSQL, JWT |
| Backend (Financiero) | Compañero Backend Financiero | Node.js, Express, Prisma, PostgreSQL |
| Frontend (1 y 2) | Oscar Tarque Guzmán | React, Vite, Material UI, Axios, Recharts |
| QA (Manual + Automatizado) | William Vela Uribe | Jira, Playwright, Postman/Newman, k6 |
| DevOps | Jhessica Barrios Muni | Docker, GitHub Actions, Render, Neon (PostgreSQL) |

## Estructura del repositorio (monorepo)

```
nexa-edificio-xyz/
├── backend/                 # Express + Prisma (Operativo + Financiero)
│   ├── src/
│   │   └── modules/
│   │       ├── auth/
│   │       ├── copropietarios/
│   │       ├── personal/
│   │       ├── comunicados/
│   │       ├── documentos/
│   │       ├── auditoria/
│   │       └── financiero/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # React + Vite
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
├── qa/                      # Playwright + colecciones Postman
│   ├── e2e/
│   ├── postman/
│   └── reports/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── deploy-render.yml
├── docker-compose.yml
├── .gitignore
├── GIT_FLOW_GUIDE.md         # Estrategia de ramas y comandos Git Flow
└── README.md
```

Se usa **monorepo** porque ambos backends (Operativo y Financiero) comparten
un único esquema de base de datos con Prisma (`backend/prisma/schema.prisma`),
lo que evita desincronización de migraciones entre repositorios separados.

## Infraestructura

- **Base de datos**: PostgreSQL alojado en **Neon** (soporta *database
  branching*, útil para probar migraciones de Prisma sin tocar producción).
- **Hosting**: **Render** (servicio web + cron jobs para respaldos).
- **CI/CD**: **GitHub Actions**, con *path filters* para que cada pipeline
  (`backend-ci.yml`, `frontend-ci.yml`) corra solo cuando cambia su carpeta.

## Primeros pasos (setup del repositorio)

1. Crear el repositorio en GitHub como privado: `nexa-edificio-xyz`.
2. Clonar y subir esta estructura inicial a la rama `main`.
3. Crear la rama `develop` desde `main` y empujarla — será la rama de
   trabajo por defecto del equipo.
4. Configurar protección de ramas (Settings → Branches):
   - `main`: Pull Request obligatorio + al menos 1 revisión + CI en verde.
   - `develop`: Pull Request obligatorio.
5. Agregar como colaboradores a Diego, Oscar y William con permiso de
   escritura (no admin).
6. Configurar Secrets en Settings → Secrets and variables → Actions:
   - `DATABASE_URL` (cadena de conexión de Neon)
   - `RENDER_API_KEY` / `RENDER_DEPLOY_HOOK_URL`
   - Cualquier secreto de JWT o Cloudinary usado por Backend.
7. Copiar `backend/.env.example` → `backend/.env` y
   `frontend/.env.example` → `frontend/.env`, completando valores locales.

Para el detalle de la estrategia de ramas y los comandos de Git Flow, ver
[`GIT_FLOW_GUIDE.md`](./GIT_FLOW_GUIDE.md).
