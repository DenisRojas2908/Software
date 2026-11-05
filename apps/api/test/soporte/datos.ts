// Datos de prueba reutilizables (ficticios).
let contador = 0;
export function contactoUnico(extra: Record<string, string> = {}) {
  contador++;
  const n = String(Date.now() % 1_000_000).padStart(6, '0') + String(contador % 100).padStart(2, '0');
  return { nombres: 'Prueba Demo', telefono: `9${n}`, canalPreferido: 'WHATSAPP', ...extra };
}

export function datosAuto(extra: Record<string, string | number> = {}) {
  return {
    uso: 'PARTICULAR',
    marca: 'Toyota',
    modelo: 'Yaris',
    anio: 2022,
    clase: 'AUTOMOVIL',
    tipo: 'SEDAN',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Miraflores',
    ...extra,
  };
}
