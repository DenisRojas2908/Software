-- Restricciones del diseño físico (02 §9) que Prisma no expresa en schema.prisma.
-- Las mismas reglas se validan también en el dominio para dar mensajes claros; aquí son la última barrera.

-- ───────────── CHECK ─────────────
ALTER TABLE "parametros_comerciales"
  ADD CONSTRAINT "ck_parametros_porcentajes" CHECK (
    "descuento_primera_compra" BETWEEN 0 AND 100 AND "descuento_maximo" BETWEEN 0 AND 100),
  ADD CONSTRAINT "ck_parametros_positivos" CHECK (
    "max_intentos" > 0 AND "dias_seguimiento" > 0 AND "max_cuotas" > 0 AND "vigencia_enlace_dias" > 0);

ALTER TABLE "vehiculo" ADD CONSTRAINT "ck_vehiculo_anio" CHECK ("anio" BETWEEN 1950 AND 2100);

-- Una prima está disponible si y solo si tiene monto
ALTER TABLE "prima_cotizada" ADD CONSTRAINT "ck_prima_disponible" CHECK ("disponible" = ("prima" IS NOT NULL));

-- RN-11 / D-37: cerrar sin conversión exige motivo
ALTER TABLE "seguimiento" ADD CONSTRAINT "ck_seguimiento_motivo" CHECK (
  "estado" = 'EN_SEGUIMIENTO' OR "motivo_cierre" IS NOT NULL OR "estado" = 'CONVERTIDO');

ALTER TABLE "descuento" ADD CONSTRAINT "ck_descuento_porcentaje" CHECK ("porcentaje" > 0 AND "porcentaje" <= 100);

-- RN-14: UNICO no lleva número de cuotas; CUOTAS sí
ALTER TABLE "pago" ADD CONSTRAINT "ck_pago_modo_cuotas" CHECK (("modo" = 'UNICO') = ("numero_cuotas" IS NULL));
ALTER TABLE "pago" ADD CONSTRAINT "ck_pago_monto" CHECK ("monto" > 0);

-- Un solo pago confirmado por orden
CREATE UNIQUE INDEX "ux_pago_confirmado_por_orden" ON "pago" ("orden_compra_id") WHERE "estado" = 'CONFIRMADO';

-- ───────────── Triggers (6 reglas) ─────────────
-- T1: quien figura como asesor debe tener rol ASESOR y estar activo
CREATE FUNCTION fn_validar_asesor() RETURNS trigger AS $$
BEGIN
  IF NEW.asesor_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM usuario u WHERE u.id = NEW.asesor_id AND u.rol = 'ASESOR' AND u.activo) THEN
    RAISE EXCEPTION 'T1: el usuario % no es un asesor activo', NEW.asesor_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_solicitud_asesor BEFORE INSERT OR UPDATE OF asesor_id ON solicitud_asesoria
  FOR EACH ROW EXECUTE FUNCTION fn_validar_asesor();
CREATE TRIGGER tg_intento_asesor BEFORE INSERT OR UPDATE OF asesor_id ON intento_contacto
  FOR EACH ROW EXECUTE FUNCTION fn_validar_asesor();
CREATE TRIGGER tg_descuento_asesor BEFORE INSERT OR UPDATE OF asesor_id ON descuento
  FOR EACH ROW EXECUTE FUNCTION fn_validar_asesor();

-- T2 (RN-07): descuento ≤ máximo de parámetros comerciales
CREATE FUNCTION fn_descuento_maximo() RETURNS trigger AS $$
DECLARE maximo numeric;
BEGIN
  SELECT descuento_maximo INTO maximo FROM parametros_comerciales LIMIT 1;
  IF maximo IS NOT NULL AND NEW.porcentaje > maximo THEN
    RAISE EXCEPTION 'T2: el descuento % supera el máximo %', NEW.porcentaje, maximo;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_descuento_maximo BEFORE INSERT OR UPDATE OF porcentaje ON descuento
  FOR EACH ROW EXECUTE FUNCTION fn_descuento_maximo();

-- T3 (RN-14): número de cuotas ≤ máximo de cuotas
CREATE FUNCTION fn_cuotas_maximas() RETURNS trigger AS $$
DECLARE maximo int;
BEGIN
  SELECT max_cuotas INTO maximo FROM parametros_comerciales LIMIT 1;
  IF NEW.numero_cuotas IS NOT NULL AND maximo IS NOT NULL AND NEW.numero_cuotas > maximo THEN
    RAISE EXCEPTION 'T3: % cuotas supera el máximo %', NEW.numero_cuotas, maximo;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_pago_cuotas BEFORE INSERT OR UPDATE OF numero_cuotas ON pago
  FOR EACH ROW EXECUTE FUNCTION fn_cuotas_maximas();

-- T4: un solo pago confirmado por orden (mensaje claro; el índice parcial es la garantía)
CREATE FUNCTION fn_un_pago_confirmado() RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'CONFIRMADO' AND EXISTS (
       SELECT 1 FROM pago p WHERE p.orden_compra_id = NEW.orden_compra_id
         AND p.estado = 'CONFIRMADO' AND p.id <> NEW.id) THEN
    RAISE EXCEPTION 'T4: la orden % ya tiene un pago confirmado', NEW.orden_compra_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_pago_unico_confirmado BEFORE INSERT OR UPDATE OF estado ON pago
  FOR EACH ROW EXECUTE FUNCTION fn_un_pago_confirmado();

-- T5 (D-24): parametros_comerciales tiene una sola fila
CREATE FUNCTION fn_parametros_unica_fila() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM parametros_comerciales) THEN
    RAISE EXCEPTION 'T5: parametros_comerciales admite una sola fila';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_parametros_unica_fila BEFORE INSERT ON parametros_comerciales
  FOR EACH ROW EXECUTE FUNCTION fn_parametros_unica_fila();

-- T6 (D-24, RN-10): los intentos del seguimiento no superan el máximo
CREATE FUNCTION fn_intentos_maximos() RETURNS trigger AS $$
DECLARE maximo int;
BEGIN
  SELECT max_intentos INTO maximo FROM parametros_comerciales LIMIT 1;
  IF maximo IS NOT NULL AND NEW.intentos > maximo THEN
    RAISE EXCEPTION 'T6: % intentos supera el máximo %', NEW.intentos, maximo;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_seguimiento_intentos BEFORE INSERT OR UPDATE OF intentos ON seguimiento
  FOR EACH ROW EXECUTE FUNCTION fn_intentos_maximos();

-- ───────────── RLS (diseño físico): activado sin políticas; la app entra con conexión directa ─────────────
ALTER TABLE "aseguradora" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campo_requerido" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "valor_permitido" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regla_inspeccion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parametros_comerciales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehiculo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ubicacion_uso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cotizacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cotizacion_opcion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prima_cotizada" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "solicitud_asesoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seguimiento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "intento_contacto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "descuento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orden_compra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cuota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "poliza" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "registro_actividad" ENABLE ROW LEVEL SECURITY;
