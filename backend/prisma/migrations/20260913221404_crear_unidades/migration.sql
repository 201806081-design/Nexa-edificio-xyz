-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('DEPARTAMENTO', 'PARQUEO', 'BAULERA');

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "documentoIdentidad" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidad" (
    "id" TEXT NOT NULL,
    "tipo" "TipoUnidad" NOT NULL,
    "codigo" TEXT NOT NULL,
    "piso" INTEGER,
    "superficieM2" DECIMAL(10,2),
    "propietarioId" TEXT,
    "inquilinoId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Persona_documentoIdentidad_key" ON "Persona"("documentoIdentidad");

-- CreateIndex
CREATE INDEX "Unidad_propietarioId_idx" ON "Unidad"("propietarioId");

-- CreateIndex
CREATE INDEX "Unidad_inquilinoId_idx" ON "Unidad"("inquilinoId");

-- CreateIndex
CREATE UNIQUE INDEX "Unidad_tipo_codigo_key" ON "Unidad"("tipo", "codigo");

-- AddForeignKey
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
