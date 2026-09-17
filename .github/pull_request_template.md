## Historia(s) de Usuario
<!-- Ej: HU-FI-01 · Como administrador quiero generar automáticamente las expensas mensuales -->
- HU-__ · 

## Semana / Sprint
Semana __ · Sprint __

## ¿Qué incluye este PR?
- 
- 

## ¿Cómo probarlo?
```bash
cd backend && npm install && cp .env.example .env
npx prisma migrate dev && npm run db:seed
npm test && npm run dev
```

## Checklist (Definition of Done)
- [ ] La rama sale de `develop` y el PR apunta a `develop`
- [ ] El código compila y el servidor arranca sin errores
- [ ] `npm test` pasa y el CI está en verde
- [ ] Documentación de API actualizada (Postman en `backend/docs/`)
- [ ] Revisado por al menos un compañero (Code Review)
- [ ] Tarea movida a **Done** en el tablero
