import { useState } from 'react';
import { ColaAsesoria } from './ColaAsesoria';
import { ColaSeguimiento } from './ColaSeguimiento';

// Panel del asesor (paquete de presentación panel-asesor): pestañas Asesoría (CU-03) y Seguimiento (CU-04).
export function PanelAsesor() {
  const [pestana, setPestana] = useState<'asesoria' | 'seguimiento'>('asesoria');
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Panel del asesor</h1>
      <div role="tablist" className="mt-3 flex gap-2">
        {(['asesoria', 'seguimiento'] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`rounded px-3 py-2 text-sm font-medium ${pestana === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {p === 'asesoria' ? 'Asesoría' : 'Seguimiento'}
          </button>
        ))}
      </div>
      <div className="mt-4">{pestana === 'asesoria' ? <ColaAsesoria /> : <ColaSeguimiento />}</div>
    </main>
  );
}
