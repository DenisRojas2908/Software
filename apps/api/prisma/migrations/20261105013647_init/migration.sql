-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CLIENTE', 'ASESOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "UsoVehiculo" AS ENUM ('PARTICULAR', 'COMERCIAL_LIGERO', 'TRANSPORTE_PASAJEROS');

-- CreateEnum
CREATE TYPE "CanalContacto" AS ENUM ('LLAMADA', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('REGISTRADA', 'CONVERTIDA', 'NO_CONCRETADA');

-- CreateEnum
CREATE TYPE "OpcionVenta" AS ENUM ('COMPRA_INMEDIATA', 'ASESORIA');

-- CreateEnum
CREATE TYPE "MotivoAsesoria" AS ENUM ('DUDA', 'NEGOCIACION', 'DESCUENTO', 'INSPECCION', 'NO_ASEGURABLE');

-- CreateEnum
CREATE TYPE "OrigenCaso" AS ENUM ('SISTEMA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'EN_ATENCION', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PRIMERA_COMPRA', 'NEGOCIADO');

-- CreateEnum
CREATE TYPE "EstadoSeguimiento" AS ENUM ('EN_SEGUIMIENTO', 'CONVERTIDO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "MotivoCierre" AS ENUM ('PRECIO', 'YA_CONTRATO', 'NO_RESPONDE', 'SIN_INTERES', 'OTRO');

-- CreateEnum
CREATE TYPE "ResultadoIntento" AS ENUM ('CONTACTADO', 'NO_RESPONDE', 'RECHAZA', 'ACEPTA');

-- CreateEnum
CREATE TYPE "ModoPago" AS ENUM ('UNICO', 'CUOTAS');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "CanalVenta" AS ENUM ('AUTONOMO', 'ASESORIA', 'TELEMARKETING');

-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('TEXTO', 'NUMERO', 'LISTA');

-- CreateTable
CREATE TABLE "aseguradora" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "codigo_estrategia" TEXT NOT NULL,

    CONSTRAINT "aseguradora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "aseguradora_id" UUID NOT NULL,

    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campo_requerido" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCampo" NOT NULL,
    "obligatorio" BOOLEAN NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "aseguradora_id" UUID NOT NULL,

    CONSTRAINT "campo_requerido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valor_permitido" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "valor" TEXT NOT NULL,
    "campo_requerido_id" UUID NOT NULL,

    CONSTRAINT "valor_permitido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regla_inspeccion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uso" "UsoVehiculo" NOT NULL,
    "requiere_inspeccion" BOOLEAN NOT NULL,
    "aseguradora_id" UUID NOT NULL,

    CONSTRAINT "regla_inspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_comerciales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "descuento_primera_compra" DECIMAL(5,2) NOT NULL,
    "descuento_maximo" DECIMAL(5,2) NOT NULL,
    "max_intentos" INTEGER NOT NULL,
    "dias_seguimiento" INTEGER NOT NULL,
    "max_cuotas" INTEGER NOT NULL,
    "vigencia_enlace_dias" INTEGER NOT NULL,

    CONSTRAINT "parametros_comerciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "hash_contrasena" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT,
    "numero_documento" TEXT,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "canal_preferido" "CanalContacto" NOT NULL,
    "usuario_id" UUID,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uso" "UsoVehiculo" NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "clase" TEXT,
    "tipo" TEXT,
    "datos_adicionales" JSONB NOT NULL DEFAULT '{}',
    "cliente_id" UUID NOT NULL,

    CONSTRAINT "vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicacion_uso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "departamento" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "vehiculo_id" UUID NOT NULL,

    CONSTRAINT "ubicacion_uso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'REGISTRADA',
    "motivo_derivacion" "MotivoAsesoria",
    "vehiculo_id" UUID NOT NULL,

    CONSTRAINT "cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion_opcion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "opcion" "OpcionVenta" NOT NULL,
    "cotizacion_id" UUID NOT NULL,

    CONSTRAINT "cotizacion_opcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prima_cotizada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prima" DECIMAL(10,2),
    "disponible" BOOLEAN NOT NULL,
    "cotizacion_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,

    CONSTRAINT "prima_cotizada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_asesoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "motivo" "MotivoAsesoria" NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "canal" "CanalContacto" NOT NULL,
    "origen" "OrigenCaso" NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" TEXT,
    "cotizacion_id" UUID NOT NULL,
    "asesor_id" UUID,

    CONSTRAINT "solicitud_asesoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estado" "EstadoSeguimiento" NOT NULL DEFAULT 'EN_SEGUIMIENTO',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "fecha_apertura" TIMESTAMPTZ(6) NOT NULL,
    "fecha_cierre" TIMESTAMPTZ(6),
    "motivo_cierre" "MotivoCierre",
    "enlace_token" TEXT,
    "enlace_expira_en" TIMESTAMPTZ(6),
    "cotizacion_id" UUID NOT NULL,

    CONSTRAINT "seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intento_contacto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "canal" "CanalContacto" NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "resultado" "ResultadoIntento" NOT NULL,
    "seguimiento_id" UUID NOT NULL,
    "asesor_id" UUID NOT NULL,

    CONSTRAINT "intento_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "TipoDescuento" NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "aceptado" BOOLEAN NOT NULL,
    "cotizacion_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "asesor_id" UUID,

    CONSTRAINT "descuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_compra" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prima_final" DECIMAL(10,2) NOT NULL,
    "acepta_condiciones" BOOLEAN NOT NULL DEFAULT false,
    "firma_simulada" BOOLEAN NOT NULL DEFAULT false,
    "canal_venta" "CanalVenta" NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cotizacion_id" UUID NOT NULL,
    "prima_cotizada_id" UUID NOT NULL,

    CONSTRAINT "orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "monto" DECIMAL(10,2) NOT NULL,
    "modo" "ModoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "numero_cuotas" INTEGER,
    "referencia" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "orden_compra_id" UUID NOT NULL,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuota" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "pago_id" UUID NOT NULL,

    CONSTRAINT "cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poliza" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" TEXT NOT NULL,
    "fecha_emision" TIMESTAMPTZ(6) NOT NULL,
    "archivo_pdf" TEXT NOT NULL,
    "canal_venta" "CanalVenta" NOT NULL,
    "orden_compra_id" UUID NOT NULL,

    CONSTRAINT "poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_actividad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "usuario_id" UUID,

    CONSTRAINT "registro_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aseguradora_nombre_key" ON "aseguradora"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "aseguradora_codigo_estrategia_key" ON "aseguradora"("codigo_estrategia");

-- CreateIndex
CREATE UNIQUE INDEX "plan_aseguradora_id_nombre_key" ON "plan"("aseguradora_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "campo_requerido_aseguradora_id_nombre_key" ON "campo_requerido"("aseguradora_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "valor_permitido_campo_requerido_id_valor_key" ON "valor_permitido"("campo_requerido_id", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "regla_inspeccion_aseguradora_id_uso_key" ON "regla_inspeccion"("aseguradora_id", "uso");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_usuario_id_key" ON "cliente"("usuario_id");

-- CreateIndex
CREATE INDEX "cliente_numero_documento_idx" ON "cliente"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "ubicacion_uso_vehiculo_id_key" ON "ubicacion_uso"("vehiculo_id");

-- CreateIndex
CREATE INDEX "cotizacion_fecha_idx" ON "cotizacion"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "cotizacion_opcion_cotizacion_id_opcion_key" ON "cotizacion_opcion"("cotizacion_id", "opcion");

-- CreateIndex
CREATE UNIQUE INDEX "prima_cotizada_cotizacion_id_plan_id_key" ON "prima_cotizada"("cotizacion_id", "plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "prima_cotizada_cotizacion_id_id_key" ON "prima_cotizada"("cotizacion_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_enlace_token_key" ON "seguimiento"("enlace_token");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_cotizacion_id_key" ON "seguimiento"("cotizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "orden_compra_cotizacion_id_key" ON "orden_compra"("cotizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "orden_compra_prima_cotizada_id_key" ON "orden_compra"("prima_cotizada_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuota_pago_id_numero_key" ON "cuota"("pago_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "poliza_numero_key" ON "poliza"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "poliza_orden_compra_id_key" ON "poliza"("orden_compra_id");

-- CreateIndex
CREATE INDEX "poliza_fecha_emision_idx" ON "poliza"("fecha_emision");

-- CreateIndex
CREATE INDEX "registro_actividad_fecha_idx" ON "registro_actividad"("fecha");

-- AddForeignKey
ALTER TABLE "plan" ADD CONSTRAINT "plan_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campo_requerido" ADD CONSTRAINT "campo_requerido_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valor_permitido" ADD CONSTRAINT "valor_permitido_campo_requerido_id_fkey" FOREIGN KEY ("campo_requerido_id") REFERENCES "campo_requerido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_inspeccion" ADD CONSTRAINT "regla_inspeccion_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculo" ADD CONSTRAINT "vehiculo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicacion_uso" ADD CONSTRAINT "ubicacion_uso_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion" ADD CONSTRAINT "cotizacion_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_opcion" ADD CONSTRAINT "cotizacion_opcion_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prima_cotizada" ADD CONSTRAINT "prima_cotizada_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prima_cotizada" ADD CONSTRAINT "prima_cotizada_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_asesoria" ADD CONSTRAINT "solicitud_asesoria_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_asesoria" ADD CONSTRAINT "solicitud_asesoria_asesor_id_fkey" FOREIGN KEY ("asesor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento" ADD CONSTRAINT "seguimiento_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intento_contacto" ADD CONSTRAINT "intento_contacto_seguimiento_id_fkey" FOREIGN KEY ("seguimiento_id") REFERENCES "seguimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intento_contacto" ADD CONSTRAINT "intento_contacto_asesor_id_fkey" FOREIGN KEY ("asesor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento" ADD CONSTRAINT "descuento_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento" ADD CONSTRAINT "descuento_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento" ADD CONSTRAINT "descuento_asesor_id_fkey" FOREIGN KEY ("asesor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_compra" ADD CONSTRAINT "orden_compra_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_compra" ADD CONSTRAINT "orden_compra_cotizacion_id_prima_cotizada_id_fkey" FOREIGN KEY ("cotizacion_id", "prima_cotizada_id") REFERENCES "prima_cotizada"("cotizacion_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "orden_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuota" ADD CONSTRAINT "cuota_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza" ADD CONSTRAINT "poliza_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "orden_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_actividad" ADD CONSTRAINT "registro_actividad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
