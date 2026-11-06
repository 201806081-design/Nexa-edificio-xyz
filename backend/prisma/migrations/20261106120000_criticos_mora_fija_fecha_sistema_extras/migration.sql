-- Criticos del docente (6-nov): mora por monto fijo, dia de generacion, fecha del sistema simulable y extras con descripcion
ALTER TYPE "MetodoMora" ADD VALUE IF NOT EXISTS 'FIJO';

ALTER TABLE "configuracion_mora" ADD COLUMN "monto_fijo" DECIMAL(12,2);
ALTER TABLE "configuracion_mora" ADD COLUMN "dia_generacion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "parametro_sistema" (
  "clave" VARCHAR(50) NOT NULL,
  "valor" VARCHAR(255) NOT NULL,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parametro_sistema_pkey" PRIMARY KEY ("clave")
);

ALTER TABLE "expensa" ADD COLUMN "monto_extras" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE "expensa_extra" (
  "id" SERIAL NOT NULL,
  "expensa_id" INTEGER NOT NULL,
  "descripcion" VARCHAR(150) NOT NULL,
  "monto" DECIMAL(12,2) NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expensa_extra_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "expensa_extra_expensa_id_fkey" FOREIGN KEY ("expensa_id") REFERENCES "expensa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "expensa_extra_expensa_id_idx" ON "expensa_extra"("expensa_id");
