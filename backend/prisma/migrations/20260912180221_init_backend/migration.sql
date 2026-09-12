-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'DIRECTORIO', 'CONSULTA');

-- CreateEnum
CREATE TYPE "TipoCopropietario" AS ENUM ('PROPIETARIO', 'INQUILINO');

-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('DEPARTAMENTO', 'PARQUEO', 'BAULERA');

-- CreateEnum
CREATE TYPE "MetodoMora" AS ENUM ('SIMPLE', 'COMPUESTO');

-- CreateEnum
CREATE TYPE "EstadoPeriodo" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoExpensa" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('CAJA', 'BANCO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "OrigenMovimiento" AS ENUM ('PAGO', 'INGRESO', 'EGRESO', 'NOMINA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "EstadoConciliacion" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'QR');

-- CreateEnum
CREATE TYPE "AplicacionPago" AS ENUM ('CAPITAL', 'MORA');

-- CreateEnum
CREATE TYPE "EstadoAnticipo" AS ENUM ('DISPONIBLE', 'APLICADO');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoConceptoPlanilla" AS ENUM ('BONO', 'DESCUENTO', 'ANTICIPO');

-- CreateEnum
CREATE TYPE "EstadoPlanilla" AS ENUM ('BORRADOR', 'PAGADA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombre_usuario" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CONSULTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copropietario" (
    "id" SERIAL NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "ci" VARCHAR(20),
    "telefono" VARCHAR(30),
    "email" VARCHAR(150),
    "tipo" "TipoCopropietario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "copropietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidad" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "tipo" "TipoUnidad" NOT NULL,
    "piso" INTEGER,
    "superficie_m2" DECIMAL(8,2),
    "coeficiente" DECIMAL(6,4),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocupacion" (
    "id" SERIAL NOT NULL,
    "unidad_id" INTEGER NOT NULL,
    "copropietario_id" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "es_responsable_pago" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ocupacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_mora" (
    "id" SERIAL NOT NULL,
    "tasa_mensual" DECIMAL(5,2) NOT NULL,
    "dias_gracia" INTEGER NOT NULL DEFAULT 0,
    "dia_vencimiento" INTEGER NOT NULL DEFAULT 10,
    "metodo" "MetodoMora" NOT NULL DEFAULT 'SIMPLE',
    "vigente_desde" DATE NOT NULL,
    "vigente_hasta" DATE,
    "creado_por_id" INTEGER,

    CONSTRAINT "configuracion_mora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodo" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monto_base" DECIMAL(12,2) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" "EstadoPeriodo" NOT NULL DEFAULT 'ABIERTO',

    CONSTRAINT "periodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expensa" (
    "id" SERIAL NOT NULL,
    "unidad_id" INTEGER NOT NULL,
    "periodo_id" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "mora_acumulada" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" "EstadoExpensa" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuenta" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "banco" VARCHAR(100),
    "nro_cuenta" VARCHAR(50),
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliacion" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "saldo_banco" DECIMAL(12,2) NOT NULL,
    "saldo_sistema" DECIMAL(12,2) NOT NULL,
    "diferencia" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoConciliacion" NOT NULL DEFAULT 'ABIERTA',
    "observacion" VARCHAR(255),
    "usuario_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimiento" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldo_resultante" DECIMAL(12,2) NOT NULL,
    "origen_tipo" "OrigenMovimiento" NOT NULL,
    "descripcion" VARCHAR(255),
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "conciliacion_id" INTEGER,
    "usuario_id" INTEGER,

    CONSTRAINT "movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" SERIAL NOT NULL,
    "unidad_id" INTEGER NOT NULL,
    "copropietario_id" INTEGER,
    "cuenta_id" INTEGER NOT NULL,
    "movimiento_id" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" VARCHAR(100),
    "comprobante_url" VARCHAR(255),
    "observacion" VARCHAR(255),
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_detalle" (
    "id" SERIAL NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "expensa_id" INTEGER NOT NULL,
    "monto_aplicado" DECIMAL(12,2) NOT NULL,
    "aplicado_a" "AplicacionPago" NOT NULL DEFAULT 'CAPITAL',

    CONSTRAINT "pago_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anticipo" (
    "id" SERIAL NOT NULL,
    "unidad_id" INTEGER NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldo_disponible" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoAnticipo" NOT NULL DEFAULT 'DISPONIBLE',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anticipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" "TipoCategoria" NOT NULL,
    "descripcion" VARCHAR(255),
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingreso" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "movimiento_id" INTEGER,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "comprobante_url" VARCHAR(255),
    "usuario_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egreso" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "movimiento_id" INTEGER,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "proveedor" VARCHAR(150),
    "nro_factura" VARCHAR(50),
    "descripcion" VARCHAR(255) NOT NULL,
    "comprobante_url" VARCHAR(255),
    "usuario_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "egreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleado" (
    "id" SERIAL NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "ci" VARCHAR(20),
    "cargo" VARCHAR(100) NOT NULL,
    "salario_base" DECIMAL(12,2) NOT NULL,
    "fecha_ingreso" DATE NOT NULL,
    "fecha_salida" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anticipo_empleado" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "descontado" BOOLEAN NOT NULL DEFAULT false,
    "planilla_id" INTEGER,
    "observacion" VARCHAR(255),

    CONSTRAINT "anticipo_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planilla" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "cuenta_id" INTEGER,
    "movimiento_id" INTEGER,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "salario_base" DECIMAL(12,2) NOT NULL,
    "total_bonos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_descuentos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_anticipos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "neto" DECIMAL(12,2) NOT NULL,
    "fecha_pago" DATE,
    "estado" "EstadoPlanilla" NOT NULL DEFAULT 'BORRADOR',
    "usuario_id" INTEGER,

    CONSTRAINT "planilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planilla_detalle" (
    "id" SERIAL NOT NULL,
    "planilla_id" INTEGER NOT NULL,
    "tipo" "TipoConceptoPlanilla" NOT NULL,
    "concepto" VARCHAR(150) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "planilla_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_nombre_usuario_key" ON "usuario"("nombre_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "copropietario_ci_key" ON "copropietario"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "unidad_codigo_key" ON "unidad"("codigo");

-- CreateIndex
CREATE INDEX "ocupacion_unidad_id_idx" ON "ocupacion"("unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "periodo_anio_mes_key" ON "periodo"("anio", "mes");

-- CreateIndex
CREATE INDEX "expensa_estado_idx" ON "expensa"("estado");

-- CreateIndex
CREATE INDEX "expensa_fecha_vencimiento_idx" ON "expensa"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "expensa_unidad_id_periodo_id_key" ON "expensa"("unidad_id", "periodo_id");

-- CreateIndex
CREATE INDEX "movimiento_cuenta_id_fecha_idx" ON "movimiento"("cuenta_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "pago_movimiento_id_key" ON "pago"("movimiento_id");

-- CreateIndex
CREATE INDEX "pago_unidad_id_fecha_idx" ON "pago"("unidad_id", "fecha");

-- CreateIndex
CREATE INDEX "pago_detalle_expensa_id_idx" ON "pago_detalle"("expensa_id");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_tipo_key" ON "categoria"("nombre", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ingreso_movimiento_id_key" ON "ingreso"("movimiento_id");

-- CreateIndex
CREATE INDEX "ingreso_fecha_idx" ON "ingreso"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "egreso_movimiento_id_key" ON "egreso"("movimiento_id");

-- CreateIndex
CREATE INDEX "egreso_fecha_idx" ON "egreso"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "empleado_ci_key" ON "empleado"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "planilla_movimiento_id_key" ON "planilla"("movimiento_id");

-- CreateIndex
CREATE UNIQUE INDEX "planilla_empleado_id_anio_mes_key" ON "planilla"("empleado_id", "anio", "mes");

-- AddForeignKey
ALTER TABLE "ocupacion" ADD CONSTRAINT "ocupacion_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocupacion" ADD CONSTRAINT "ocupacion_copropietario_id_fkey" FOREIGN KEY ("copropietario_id") REFERENCES "copropietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracion_mora" ADD CONSTRAINT "configuracion_mora_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expensa" ADD CONSTRAINT "expensa_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expensa" ADD CONSTRAINT "expensa_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacion" ADD CONSTRAINT "conciliacion_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacion" ADD CONSTRAINT "conciliacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_conciliacion_id_fkey" FOREIGN KEY ("conciliacion_id") REFERENCES "conciliacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_copropietario_id_fkey" FOREIGN KEY ("copropietario_id") REFERENCES "copropietario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_detalle" ADD CONSTRAINT "pago_detalle_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_detalle" ADD CONSTRAINT "pago_detalle_expensa_id_fkey" FOREIGN KEY ("expensa_id") REFERENCES "expensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anticipo" ADD CONSTRAINT "anticipo_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anticipo" ADD CONSTRAINT "anticipo_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso" ADD CONSTRAINT "ingreso_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso" ADD CONSTRAINT "ingreso_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso" ADD CONSTRAINT "ingreso_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso" ADD CONSTRAINT "ingreso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anticipo_empleado" ADD CONSTRAINT "anticipo_empleado_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anticipo_empleado" ADD CONSTRAINT "anticipo_empleado_planilla_id_fkey" FOREIGN KEY ("planilla_id") REFERENCES "planilla"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla" ADD CONSTRAINT "planilla_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla" ADD CONSTRAINT "planilla_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla" ADD CONSTRAINT "planilla_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla" ADD CONSTRAINT "planilla_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla_detalle" ADD CONSTRAINT "planilla_detalle_planilla_id_fkey" FOREIGN KEY ("planilla_id") REFERENCES "planilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;
