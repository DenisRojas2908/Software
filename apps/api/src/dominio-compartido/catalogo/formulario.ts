import { TipoCampo, UsoVehiculo } from '@prisma/client';

// RF-02 / RN-17: el formulario es la UNIÓN de los campos requeridos de las aseguradoras activas.
// Un campo es obligatorio si ALGUNA aseguradora activa lo marca obligatorio (02 §5 paso 1).
export interface CampoFormulario {
  nombre: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  valores: string[];
  base: boolean; // D-26: campo fijo del vehículo, siempre se pide
}

export interface CampoCatalogo {
  nombre: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  valores: string[];
}

// D-26: uso, marca, modelo y año se piden siempre (el algoritmo y la tabla vehiculo los necesitan).
const CAMPOS_BASE: CampoCatalogo[] = [
  { nombre: 'uso', tipo: 'LISTA', obligatorio: true, valores: Object.values(UsoVehiculo) },
  { nombre: 'marca', tipo: 'TEXTO', obligatorio: true, valores: [] },
  { nombre: 'modelo', tipo: 'TEXTO', obligatorio: true, valores: [] },
  { nombre: 'anio', tipo: 'NUMERO', obligatorio: true, valores: [] },
];

// Orden de presentación de los campos conocidos; los agregados por el admin van al final.
const ORDEN = ['uso', 'marca', 'modelo', 'anio', 'clase', 'tipo', 'departamento', 'provincia', 'distrito'];

export function unirCampos(camposDeAseguradorasActivas: CampoCatalogo[]): CampoFormulario[] {
  const mapa = new Map<string, CampoFormulario>();
  for (const c of [...CAMPOS_BASE, ...camposDeAseguradorasActivas]) {
    const previo = mapa.get(c.nombre);
    if (!previo) {
      mapa.set(c.nombre, {
        ...c,
        valores: [...c.valores],
        base: CAMPOS_BASE.some((b) => b.nombre === c.nombre),
      });
      continue;
    }
    previo.obligatorio = previo.obligatorio || c.obligatorio;
    // Si el catálogo trae una lista de valores para un campo base (p. ej. marca), se usa la lista.
    if (c.tipo === 'LISTA' && previo.tipo !== 'LISTA') previo.tipo = 'LISTA';
    for (const v of c.valores) if (!previo.valores.includes(v)) previo.valores.push(v);
  }
  const posicion = (n: string) => (ORDEN.includes(n) ? ORDEN.indexOf(n) : ORDEN.length);
  return [...mapa.values()].sort((a, b) => posicion(a.nombre) - posicion(b.nombre));
}

// RF-03: valida contra el catálogo (obligatoriedad, tipo, valores permitidos). Devuelve errores POR CAMPO.
export function validarContraCatalogo(
  campos: CampoFormulario[],
  datos: Record<string, unknown>,
  anioActual: number,
): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const c of campos) {
    const crudo = datos[c.nombre];
    const vacio = crudo === undefined || crudo === null || String(crudo).trim() === '';
    if (vacio) {
      if (c.obligatorio) errores[c.nombre] = 'Este dato es obligatorio';
      continue;
    }
    const valor = String(crudo).trim();
    if (c.tipo === 'NUMERO') {
      const n = Number(valor);
      if (!Number.isInteger(n)) errores[c.nombre] = 'Debe ser un número entero';
      else if (c.nombre === 'anio' && (n < 1950 || n > anioActual + 1))
        errores[c.nombre] = `Año entre 1950 y ${anioActual + 1}`;
    } else if (c.tipo === 'LISTA' && c.valores.length && !c.valores.includes(valor)) {
      errores[c.nombre] = 'Elige un valor de la lista';
    }
  }
  return errores;
}
