import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, Reloj } from '../../comun/reloj';
import { DatosVehiculo, EstrategiaCotizacion, PlanACotizar } from './estrategia-cotizacion';
import { primaDePrueba, TarifaAseguradora } from './tarifa-prueba';

// Base común: calcula la antigüedad con el Reloj (D-38) y aplica la fórmula de prueba.
// Cada aseguradora solo declara su tarifa y, si tiene, su recargo propio.
abstract class EstrategiaDePrueba implements EstrategiaCotizacion {
  abstract readonly codigo: string;
  protected abstract readonly tarifa: TarifaAseguradora;

  constructor(@Inject(RELOJ) private readonly reloj: Reloj) {}

  protected recargo(_datos: DatosVehiculo): number {
    return 1;
  }

  cotizar(datos: DatosVehiculo, plan: PlanACotizar): number | null {
    const anioActual = this.reloj.ahora().getFullYear();
    return primaDePrueba(this.tarifa, plan, datos.uso, datos.anio, anioActual, this.recargo(datos));
  }
}

// RN-18: Rímac cotiza con marca, modelo y año.
@Injectable()
export class EstrategiaRimac extends EstrategiaDePrueba {
  readonly codigo = 'RIMAC';
  protected readonly tarifa = { tarifaBase: 1450, antiguedadMaxima: 15 };
}

// RN-19: Pacífico agrega la ubicación → recargo de 10 % en Lima y Callao.
@Injectable()
export class EstrategiaPacifico extends EstrategiaDePrueba {
  readonly codigo = 'PACIFICO';
  protected readonly tarifa = { tarifaBase: 1380, antiguedadMaxima: 20 };
  protected recargo(d: DatosVehiculo) {
    return d.departamento === 'Lima' || d.departamento === 'Callao' ? 1.1 : 1;
  }
}

// RN-20: La Positiva agrega clase y tipo → recargo por clase.
@Injectable()
export class EstrategiaLaPositiva extends EstrategiaDePrueba {
  readonly codigo = 'LA_POSITIVA';
  protected readonly tarifa = { tarifaBase: 1290, antiguedadMaxima: 16 };
  protected recargo(d: DatosVehiculo) {
    if (d.clase === 'SUV' || d.clase === 'CAMIONETA') return 1.15;
    if (d.clase === 'PICK_UP') return 1.2;
    return 1;
  }
}

// RN-21 / RN-24: Mapfre usa el formulario común (uso, marca, modelo, año, ubicación).
@Injectable()
export class EstrategiaMapfre extends EstrategiaDePrueba {
  readonly codigo = 'MAPFRE';
  protected readonly tarifa = { tarifaBase: 1350, antiguedadMaxima: 20 };
}

// RN-22: Quálitas usa el formulario común.
@Injectable()
export class EstrategiaQualitas extends EstrategiaDePrueba {
  readonly codigo = 'QUALITAS';
  protected readonly tarifa = { tarifaBase: 1200, antiguedadMaxima: 20 };
}

// Registro de estrategias. Agregar una aseguradora = nueva clase aquí + fila en el catálogo (RNF-14).
export const CLASES_ESTRATEGIA = [
  EstrategiaRimac,
  EstrategiaPacifico,
  EstrategiaLaPositiva,
  EstrategiaMapfre,
  EstrategiaQualitas,
];
