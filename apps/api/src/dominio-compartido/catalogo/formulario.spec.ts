import { CampoCatalogo, unirCampos, validarContraCatalogo } from './formulario';

const campo = (
  nombre: string,
  obligatorio = true,
  tipo: CampoCatalogo['tipo'] = 'TEXTO',
  valores: string[] = [],
) => ({
  nombre,
  obligatorio,
  tipo,
  valores,
});

describe('Formulario dinámico (RF-02, RF-03, RN-17)', () => {
  it('RN-17: es la unión de los campos de las aseguradoras activas, sin repetir', () => {
    const f = unirCampos([campo('marca'), campo('departamento'), campo('marca'), campo('clase')]);
    expect(f.map((c) => c.nombre)).toEqual(['uso', 'marca', 'modelo', 'anio', 'clase', 'departamento']);
  });

  it('RN-17: un campo es obligatorio si alguna aseguradora activa lo exige', () => {
    const f = unirCampos([campo('distrito', false), campo('distrito', true)]);
    expect(f.find((c) => c.nombre === 'distrito')?.obligatorio).toBe(true);
  });

  it('D-26: uso, marca, modelo y año se piden aunque ninguna aseguradora activa los liste', () => {
    const f = unirCampos([]);
    expect(f.filter((c) => c.obligatorio).map((c) => c.nombre)).toEqual(['uso', 'marca', 'modelo', 'anio']);
  });

  it('RF-03: errores por campo: obligatorio, número, valor fuera de lista y año fuera de rango', () => {
    const f = unirCampos([campo('clase', true, 'LISTA', ['SUV', 'SEDAN'])]);
    const errores = validarContraCatalogo(
      f,
      { uso: 'PARTICULAR', marca: 'Toyota', anio: '20x', clase: 'AVION' },
      2026,
    );
    expect(errores).toEqual({
      modelo: 'Este dato es obligatorio',
      anio: 'Debe ser un número entero',
      clase: 'Elige un valor de la lista',
    });
    expect(
      validarContraCatalogo(
        f,
        { uso: 'PARTICULAR', marca: 'T', modelo: 'Y', anio: 1900, clase: 'SUV' },
        2026,
      ),
    ).toEqual({
      anio: 'Año entre 1950 y 2027',
    });
  });

  it('RF-03: el uso solo admite los valores del enum', () => {
    const f = unirCampos([]);
    expect(validarContraCatalogo(f, { uso: 'AVION', marca: 'T', modelo: 'Y', anio: 2022 }, 2026)).toEqual({
      uso: 'Elige un valor de la lista',
    });
  });
});
