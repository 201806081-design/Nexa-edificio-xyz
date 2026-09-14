CREATE TABLE "Ocupacion" (
    "id" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ocupacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ocupacion_unidadId_fechaInicio_idx"
    ON "Ocupacion"("unidadId", "fechaInicio");

CREATE INDEX "Ocupacion_personaId_idx"
    ON "Ocupacion"("personaId");

ALTER TABLE "Ocupacion"
    ADD CONSTRAINT "Ocupacion_unidadId_fkey"
    FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Ocupacion"
    ADD CONSTRAINT "Ocupacion_personaId_fkey"
    FOREIGN KEY ("personaId") REFERENCES "Persona"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
