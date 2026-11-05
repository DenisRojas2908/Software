import { UsoVehiculo } from '@prisma/client';

// RN-05: nicho del bróker. Fuera de nicho → se informa y NO se genera cotización ni solicitud.
// Límites de la definición del alcance (RN-05, D-14, D-39); no son parámetros comerciales configurables.
export const CLASES_FUERA_DE_NICHO = ['CAMION', 'BUS', 'REMOLCADOR'];
export const MAX_VEHICULOS_POR_USO: Record<UsoVehiculo, number> = {
  PARTICULAR: 2,
  COMERCIAL_LIGERO: 5,
  TRANSPORTE_PASAJEROS: 5,
};

export interface ResultadoNicho {
  dentro: boolean;
  mensaje?: string;
}

export function evaluarNicho(
  datos: { uso: UsoVehiculo; clase?: string },
  vehiculosConEseUso: number,
): ResultadoNicho {
  if (datos.clase && CLASES_FUERA_DE_NICHO.includes(datos.clase)) {
    return {
      dentro: false,
      mensaje:
        'No aseguramos vehículos pesados ni de carga (camiones, buses, remolcadores) en esta plataforma.',
    };
  }
  if (vehiculosConEseUso > MAX_VEHICULOS_POR_USO[datos.uso]) {
    return {
      dentro: false,
      mensaje: `Para más de ${MAX_VEHICULOS_POR_USO[datos.uso]} vehículos de uso ${datos.uso} se requiere una póliza de flota, fuera del alcance de esta plataforma.`,
    };
  }
  return { dentro: true };
}
