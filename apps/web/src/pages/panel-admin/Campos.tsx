import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/cliente';
import { claseBoton, claseInput } from '../../componentes/Campo';
import { MensajeError, useCambio } from './util';

interface CampoAdmin {
  id: string;
  nombre: string;
  tipo: 'TEXTO' | 'NUMERO' | 'LISTA';
  obligatorio: boolean;
  activo: boolean;
  aseguradora: { nombre: string };
  valores: { valor: string }[];
}

// RF-28 / RNF-13: campos requeridos por aseguradora (obligatoriedad, activo, valores) y campos nuevos (D-11).
export function Campos() {
  const campos = useQuery({
    queryKey: ['admin', 'campos'],
    queryFn: () => api<CampoAdmin[]>('/admin/campos'),
  });
  const aseguradoras = useQuery({
    queryKey: ['admin', 'aseguradoras'],
    queryFn: () => api<{ id: string; nombre: string }[]>('/admin/aseguradoras'),
  });
  const cambio = useCambio([['admin', 'campos'], ['formulario']]);
  const [nuevo, setNuevo] = useState({
    aseguradoraId: '',
    nombre: '',
    tipo: 'TEXTO',
    obligatorio: false,
    valores: '',
  });
  const [editando, setEditando] = useState<{ id: string; valores: string } | null>(null);
  if (campos.isLoading) return <p>Cargando…</p>;
  return (
    <div className="flex flex-col gap-4 text-sm">
      <MensajeError error={cambio.error} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="py-1">Aseguradora</th>
              <th>Campo</th>
              <th>Tipo</th>
              <th>Obligatorio</th>
              <th>Activo</th>
              <th>Valores</th>
            </tr>
          </thead>
          <tbody>
            {campos.data?.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 align-top">
                <td className="py-1">{c.aseguradora.nombre}</td>
                <td>{c.nombre}</td>
                <td>{c.tipo}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={c.obligatorio}
                    aria-label={`${c.aseguradora.nombre} ${c.nombre} obligatorio`}
                    onChange={(e) =>
                      cambio.mutate({
                        ruta: `/admin/campos/${c.id}`,
                        metodo: 'PATCH',
                        cuerpo: { obligatorio: e.target.checked },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={c.activo}
                    aria-label={`${c.aseguradora.nombre} ${c.nombre} activo`}
                    onChange={(e) =>
                      cambio.mutate({
                        ruta: `/admin/campos/${c.id}`,
                        metodo: 'PATCH',
                        cuerpo: { activo: e.target.checked },
                      })
                    }
                  />
                </td>
                <td>
                  {c.tipo !== 'LISTA' ? (
                    '—'
                  ) : editando?.id === c.id ? (
                    <span className="flex gap-1">
                      <input
                        className="w-40 rounded border px-1"
                        value={editando.valores}
                        onChange={(e) => setEditando({ id: c.id, valores: e.target.value })}
                      />
                      <button
                        className="text-indigo-700 underline"
                        onClick={() => {
                          cambio.mutate({
                            ruta: `/admin/campos/${c.id}`,
                            metodo: 'PATCH',
                            cuerpo: {
                              valores: editando.valores
                                .split(',')
                                .map((v) => v.trim())
                                .filter(Boolean),
                            },
                          });
                          setEditando(null);
                        }}
                      >
                        Guardar
                      </button>
                    </span>
                  ) : (
                    <button
                      className="text-left text-indigo-700 underline"
                      onClick={() =>
                        setEditando({ id: c.id, valores: c.valores.map((v) => v.valor).join(', ') })
                      }
                    >
                      {c.valores.length} valores
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          cambio.mutate({
            ruta: '/admin/campos',
            metodo: 'POST',
            cuerpo: {
              ...nuevo,
              valores:
                nuevo.tipo === 'LISTA'
                  ? nuevo.valores
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                  : [],
            },
          });
        }}
      >
        <p className="font-semibold sm:col-span-2">Agregar campo (sin tocar código)</p>
        <select
          className={claseInput}
          value={nuevo.aseguradoraId}
          onChange={(e) => setNuevo({ ...nuevo, aseguradoraId: e.target.value })}
          aria-label="Aseguradora del campo"
        >
          <option value="">Aseguradora…</option>
          {aseguradoras.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <input
          className={claseInput}
          placeholder="nombre (p. ej. color)"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          aria-label="Nombre del campo"
        />
        <select
          className={claseInput}
          value={nuevo.tipo}
          onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
          aria-label="Tipo del campo"
        >
          <option value="TEXTO">Texto</option>
          <option value="NUMERO">Número</option>
          <option value="LISTA">Lista</option>
        </select>
        {nuevo.tipo === 'LISTA' && (
          <input
            className={claseInput}
            placeholder="Valores separados por coma"
            value={nuevo.valores}
            onChange={(e) => setNuevo({ ...nuevo, valores: e.target.value })}
            aria-label="Valores permitidos"
          />
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={nuevo.obligatorio}
            onChange={(e) => setNuevo({ ...nuevo, obligatorio: e.target.checked })}
          />{' '}
          Obligatorio
        </label>
        <button className={claseBoton}>Agregar campo</button>
      </form>
    </div>
  );
}
