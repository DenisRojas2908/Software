// Datos del seed del SVAS (02-especificacion §10). Los usa `prisma/seed.ts` (npm run db:seed), las pruebas y el reinicio de la demo (F8).
// Valores FICTICIOS, solo para la simulación (RN-26, D-20).
// Es el ÚNICO lugar donde viven los valores iniciales de negocio (5 %, 10 %, 4 intentos, 7 días…): RNF-13.
import { CanalVenta, PrismaClient, TipoCampo, UsoVehiculo } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const PARAMETROS_INICIALES = {
  descuentoPrimeraCompra: 5,
  descuentoMaximo: 10,
  maxIntentos: 4,
  diasSeguimiento: 7,
  maxCuotas: 12,
  vigenciaEnlaceDias: 7,
};

export const ASEGURADORAS = [
  { nombre: 'Rímac', codigoEstrategia: 'RIMAC' },
  { nombre: 'Pacífico', codigoEstrategia: 'PACIFICO' },
  { nombre: 'La Positiva', codigoEstrategia: 'LA_POSITIVA' },
  { nombre: 'Mapfre', codigoEstrategia: 'MAPFRE' },
  { nombre: 'Quálitas', codigoEstrategia: 'QUALITAS' },
];

const PLANES = [
  {
    nombre: 'Básico',
    descripcion: 'Responsabilidad civil, robo total y pérdida total (coberturas genéricas de prueba).',
  },
  {
    nombre: 'Intermedio',
    descripcion: 'Básico + daño propio con deducible y asistencia vehicular (genérico).',
  },
  { nombre: 'Full', descripcion: 'Todo riesgo, auto de reemplazo y deducibles reducidos (genérico).' },
];

const MARCAS = [
  'Toyota',
  'Hyundai',
  'Kia',
  'Nissan',
  'Chevrolet',
  'Suzuki',
  'Mazda',
  'Volkswagen',
  'Honda',
  'Mitsubishi',
];
// D-39: se agrega REMOLCADOR
const CLASES = ['AUTOMOVIL', 'CAMIONETA', 'SUV', 'PICK_UP', 'CAMION', 'BUS', 'REMOLCADOR'];
const TIPOS = ['SEDAN', 'HATCHBACK', 'STATION_WAGON', '4X2', '4X4'];
export const DEPARTAMENTOS = [
  'Amazonas',
  'Áncash',
  'Apurímac',
  'Arequipa',
  'Ayacucho',
  'Cajamarca',
  'Callao',
  'Cusco',
  'Huancavelica',
  'Huánuco',
  'Ica',
  'Junín',
  'La Libertad',
  'Lambayeque',
  'Lima',
  'Loreto',
  'Madre de Dios',
  'Moquegua',
  'Pasco',
  'Piura',
  'Puno',
  'San Martín',
  'Tacna',
  'Tumbes',
  'Ucayali',
];

type DefCampo = { nombre: string; tipo: TipoCampo; valores?: string[] };
const CAMPO: Record<string, DefCampo> = {
  uso: { nombre: 'uso', tipo: 'LISTA', valores: Object.values(UsoVehiculo) },
  marca: { nombre: 'marca', tipo: 'LISTA', valores: MARCAS },
  modelo: { nombre: 'modelo', tipo: 'TEXTO' },
  anio: { nombre: 'anio', tipo: 'NUMERO' },
  clase: { nombre: 'clase', tipo: 'LISTA', valores: CLASES },
  tipo: { nombre: 'tipo', tipo: 'LISTA', valores: TIPOS },
  departamento: { nombre: 'departamento', tipo: 'LISTA', valores: DEPARTAMENTOS },
  provincia: { nombre: 'provincia', tipo: 'TEXTO' },
  distrito: { nombre: 'distrito', tipo: 'TEXTO' },
};
// RN-18 … RN-23: campos que pide cada aseguradora
const CAMPOS_POR_ASEGURADORA: Record<string, string[]> = {
  RIMAC: ['marca', 'modelo', 'anio'],
  PACIFICO: ['marca', 'modelo', 'anio', 'departamento', 'provincia', 'distrito'],
  LA_POSITIVA: ['marca', 'modelo', 'anio', 'clase', 'tipo'],
  MAPFRE: ['uso', 'marca', 'modelo', 'anio', 'departamento', 'provincia', 'distrito'],
  QUALITAS: ['uso', 'marca', 'modelo', 'anio', 'departamento', 'provincia', 'distrito'],
};

export const USUARIOS_DEMO = {
  admin: { email: 'admin@svas.demo', clave: 'Admin123!' },
  asesor1: { email: 'asesor1@svas.demo', clave: 'Asesor123!' },
  asesor2: { email: 'asesor2@svas.demo', clave: 'Asesor123!' },
  cliente: { email: 'cliente@svas.demo', clave: 'Cliente123!', documento: '70000001' },
};

const TABLAS = [
  'registro_actividad',
  'poliza',
  'cuota',
  'pago',
  'orden_compra',
  'descuento',
  'intento_contacto',
  'seguimiento',
  'solicitud_asesoria',
  'prima_cotizada',
  'cotizacion_opcion',
  'cotizacion',
  'ubicacion_uso',
  'vehiculo',
  'cliente',
  'usuario',
  'parametros_comerciales',
  'regla_inspeccion',
  'valor_permitido',
  'campo_requerido',
  'plan',
  'aseguradora',
];

// Generador pseudoaleatorio determinista: el seed siempre produce los mismos datos.
function aleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

// `hoy` lo da quien llama: el Reloj (demo), la fecha fija de las pruebas o la fecha real (npm run db:seed)
export async function sembrar(prisma: PrismaClient, hoy: Date) {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLAS.map((t) => `"${t}"`).join(', ')} CASCADE`);

  await prisma.parametrosComerciales.create({ data: PARAMETROS_INICIALES });

  // Catálogo
  const aseguradoras = [];
  for (const a of ASEGURADORAS) {
    const aseg = await prisma.aseguradora.create({
      data: {
        ...a,
        planes: { create: PLANES },
        // RN-25: inspección activa por defecto para TRANSPORTE_PASAJEROS
        reglasInspeccion: {
          create: Object.values(UsoVehiculo).map((uso) => ({
            uso,
            requiereInspeccion: uso === 'TRANSPORTE_PASAJEROS',
          })),
        },
      },
      include: { planes: true },
    });
    for (const clave of CAMPOS_POR_ASEGURADORA[a.codigoEstrategia]) {
      const def = CAMPO[clave];
      await prisma.campoRequerido.create({
        data: {
          aseguradoraId: aseg.id,
          nombre: def.nombre,
          tipo: def.tipo,
          obligatorio: true,
          valores: def.valores ? { create: def.valores.map((valor) => ({ valor })) } : undefined,
        },
      });
    }
    aseguradoras.push(aseg);
  }

  // Usuarios demo (contraseñas con bcrypt, RNF-09)
  const hash = (c: string) => bcrypt.hashSync(c, 10);
  await prisma.usuario.create({
    data: {
      email: USUARIOS_DEMO.admin.email,
      hashContrasena: hash(USUARIOS_DEMO.admin.clave),
      rol: 'ADMINISTRADOR',
    },
  });
  const asesor1 = await prisma.usuario.create({
    data: {
      email: USUARIOS_DEMO.asesor1.email,
      hashContrasena: hash(USUARIOS_DEMO.asesor1.clave),
      rol: 'ASESOR',
    },
  });
  await prisma.usuario.create({
    data: {
      email: USUARIOS_DEMO.asesor2.email,
      hashContrasena: hash(USUARIOS_DEMO.asesor2.clave),
      rol: 'ASESOR',
    },
  });
  const usuarioCliente = await prisma.usuario.create({
    data: {
      email: USUARIOS_DEMO.cliente.email,
      hashContrasena: hash(USUARIOS_DEMO.cliente.clave),
      rol: 'CLIENTE',
    },
  });
  const clienteDemo = await prisma.cliente.create({
    data: {
      nombres: 'Carla',
      apellidos: 'Demo Pérez',
      numeroDocumento: USUARIOS_DEMO.cliente.documento,
      telefono: '900000001',
      email: USUARIOS_DEMO.cliente.email,
      canalPreferido: 'WHATSAPP',
      usuarioId: usuarioCliente.id,
    },
  });

  // Historial sintético (~80 pólizas en 90 días) para que los reportes no salgan vacíos.
  // La primera es la póliza previa de cliente@svas.demo (prueba de que NO aplica RN-08).
  const azar = aleatorio(2026);
  const canales: CanalVenta[] = ['AUTONOMO', 'ASESORIA', 'TELEMARKETING'];
  const DIA = 24 * 60 * 60 * 1000;
  for (let i = 0; i < 80; i++) {
    const aseg = aseguradoras[i % aseguradoras.length];
    const plan = aseg.planes[Math.floor(i / 5) % aseg.planes.length];
    const canal = i === 0 ? 'AUTONOMO' : canales[Math.floor(azar() * 3)];
    const fecha = new Date(hoy.getTime() - Math.floor(azar() * 90 * DIA) - DIA);
    const prima = Math.round((900 + azar() * 1700) * 100) / 100;
    const cliente =
      i === 0
        ? clienteDemo
        : await prisma.cliente.create({
            data: {
              nombres: `Demo ${String(i).padStart(2, '0')}`,
              apellidos: 'Ficticio',
              numeroDocumento: String(71000000 + i),
              telefono: String(910000000 + i),
              canalPreferido: azar() < 0.5 ? 'LLAMADA' : 'WHATSAPP',
            },
          });
    const vehiculo = await prisma.vehiculo.create({
      data: {
        uso: 'PARTICULAR',
        marca: MARCAS[i % MARCAS.length],
        modelo: 'Modelo demo',
        anio: 2015 + (i % 10),
        clienteId: cliente.id,
        ubicacion: { create: { departamento: 'Lima', provincia: 'Lima', distrito: 'Miraflores' } },
      },
    });
    const cotizacion = await prisma.cotizacion.create({
      data: {
        fecha,
        estado: 'CONVERTIDA',
        vehiculoId: vehiculo.id,
        opciones: { create: [{ opcion: 'COMPRA_INMEDIATA' }, { opcion: 'ASESORIA' }] },
        primas: { create: [{ planId: plan.id, prima, disponible: true }] },
      },
      include: { primas: true },
    });
    if (canal === 'ASESORIA') {
      await prisma.solicitudAsesoria.create({
        data: {
          cotizacionId: cotizacion.id,
          motivo: 'NEGOCIACION',
          estado: 'CERRADA',
          canal: cliente.canalPreferido,
          origen: 'CLIENTE',
          fechaCreacion: fecha,
          resultado: 'ACEPTA',
          asesorId: asesor1.id,
        },
      });
    }
    if (canal === 'TELEMARKETING') {
      await prisma.seguimiento.create({
        data: {
          cotizacionId: cotizacion.id,
          estado: 'CONVERTIDO',
          intentos: 1,
          fechaApertura: fecha,
          fechaCierre: fecha,
          intentosContacto: {
            create: [{ canal: cliente.canalPreferido, fecha, resultado: 'ACEPTA', asesorId: asesor1.id }],
          },
        },
      });
    }
    const orden = await prisma.ordenCompra.create({
      data: {
        cotizacionId: cotizacion.id,
        primaCotizadaId: cotizacion.primas[0].id,
        primaFinal: prima,
        aceptaCondiciones: true,
        firmaSimulada: true,
        canalVenta: canal,
        creadoEn: fecha,
      },
    });
    await prisma.pago.create({
      data: {
        ordenCompraId: orden.id,
        monto: prima,
        modo: 'UNICO',
        estado: 'CONFIRMADO',
        referencia: `SIM-HIST-${String(i).padStart(3, '0')}`,
        fecha,
      },
    });
    const numero = `SVAS-${aseg.codigoEstrategia}-H${String(i).padStart(4, '0')}`;
    await prisma.poliza.create({
      data: {
        ordenCompraId: orden.id,
        numero,
        fechaEmision: fecha,
        archivoPdf: `storage/polizas/${numero}.pdf`,
        canalVenta: canal,
      },
    });
  }
}
