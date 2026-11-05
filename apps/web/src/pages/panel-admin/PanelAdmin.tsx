import { useState } from 'react';
import { Actividad } from './Actividad';
import { Campos } from './Campos';
import { Catalogo } from './Catalogo';
import { Inspeccion } from './Inspeccion';
import { Parametros } from './Parametros';
import { Reportes } from './Reportes';
import { Usuarios } from './Usuarios';

const PESTANAS = {
  reportes: { titulo: 'Reportes', vista: Reportes },
  catalogo: { titulo: 'Aseguradoras y planes', vista: Catalogo },
  campos: { titulo: 'Campos', vista: Campos },
  inspeccion: { titulo: 'Inspección', vista: Inspeccion },
  parametros: { titulo: 'Parámetros', vista: Parametros },
  usuarios: { titulo: 'Usuarios', vista: Usuarios },
  actividad: { titulo: 'Actividad', vista: Actividad },
};
type Pestana = keyof typeof PESTANAS;

// Panel del administrador (paquete panel-admin, CU-05): todo se configura sin tocar código (RNF-13).
export function PanelAdmin() {
  const [pestana, setPestana] = useState<Pestana>('reportes');
  const Vista = PESTANAS[pestana].vista;
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Panel del administrador</h1>
      <div role="tablist" className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(PESTANAS) as Pestana[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`rounded px-3 py-2 text-sm font-medium ${pestana === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {PESTANAS[p].titulo}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Vista />
      </div>
    </main>
  );
}
