-- CreateEnum
CREATE TYPE "TipoCuentaContable" AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO');

-- CreateEnum
CREATE TYPE "NaturalezaCuenta" AS ENUM ('DEUDORA', 'ACREEDORA');

-- CreateEnum
CREATE TYPE "OrigenAsiento" AS ENUM ('EMISION_EXPENSAS', 'PAGO', 'INGRESO', 'EGRESO', 'NOMINA', 'AJUSTE', 'MANUAL');

-- CreateEnum
CREATE TYPE "EstadoAsiento" AS ENUM ('REGISTRADO', 'ANULADO');

-- AlterTable
ALTER TABLE "categoria" ADD COLUMN     "cuenta_contable_id" INTEGER;

-- AlterTable
ALTER TABLE "cuenta" ADD COLUMN     "cuenta_contable_id" INTEGER;

-- CreateTable
CREATE TABLE "cuenta_contable" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "tipo" "TipoCuentaContable" NOT NULL,
    "naturaleza" "NaturalezaCuenta" NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "imputable" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "padre_id" INTEGER,

    CONSTRAINT "cuenta_contable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asiento" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "glosa" VARCHAR(255) NOT NULL,
    "origen_tipo" "OrigenAsiento" NOT NULL,
    "origen_id" INTEGER,
    "total_debe" DECIMAL(12,2) NOT NULL,
    "total_haber" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoAsiento" NOT NULL DEFAULT 'REGISTRADO',
    "usuario_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asiento_detalle" (
    "id" SERIAL NOT NULL,
    "asiento_id" INTEGER NOT NULL,
    "cuenta_contable_id" INTEGER NOT NULL,
    "debe" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "haber" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descripcion" VARCHAR(255),

    CONSTRAINT "asiento_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuenta_contable_codigo_key" ON "cuenta_contable"("codigo");

-- CreateIndex
CREATE INDEX "cuenta_contable_tipo_idx" ON "cuenta_contable"("tipo");

-- CreateIndex
CREATE INDEX "asiento_fecha_idx" ON "asiento"("fecha");

-- CreateIndex
CREATE INDEX "asiento_origen_tipo_origen_id_idx" ON "asiento"("origen_tipo", "origen_id");

-- CreateIndex
CREATE INDEX "asiento_detalle_cuenta_contable_id_idx" ON "asiento_detalle"("cuenta_contable_id");

-- AddForeignKey
ALTER TABLE "cuenta" ADD CONSTRAINT "cuenta_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuenta_contable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuenta_contable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_contable" ADD CONSTRAINT "cuenta_contable_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "cuenta_contable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento" ADD CONSTRAINT "asiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_detalle" ADD CONSTRAINT "asiento_detalle_asiento_id_fkey" FOREIGN KEY ("asiento_id") REFERENCES "asiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_detalle" ADD CONSTRAINT "asiento_detalle_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuenta_contable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
