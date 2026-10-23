-- Categoría de departamento (A/B/C) para generar expensas en bloques, y agua por expensa (pizarra 22-oct)
ALTER TABLE "unidad" ADD COLUMN "categoria" VARCHAR(5);
ALTER TABLE "expensa" ADD COLUMN "monto_agua" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "expensa" ADD COLUMN "consumo_m3" DECIMAL(10,2);

-- Dato inicial: departamentos de pisos 1 y 2 → A; del piso 3 en adelante → B. Parqueos y bauleras sin categoría.
UPDATE "unidad" SET "categoria" = CASE
  WHEN "tipo" = 'DEPARTAMENTO' AND COALESCE("piso", 0) <= 2 THEN 'A'
  WHEN "tipo" = 'DEPARTAMENTO' THEN 'B'
  ELSE NULL END
WHERE "categoria" IS NULL;
