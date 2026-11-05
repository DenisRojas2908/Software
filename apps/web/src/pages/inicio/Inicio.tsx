import { Link } from 'react-router-dom';

export function Inicio() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">SVAS</h1>
      <p className="mt-2 text-slate-700">
        Sistema de Venta Autónoma de Seguros vehiculares — simulación académica.
      </p>
      <p className="mt-4 text-slate-700">
        Cotiza tu seguro vehicular en varias aseguradoras a la vez y compra en línea sin esperar la llamada de un asesor, o
        pide asesoría si la prefieres.
      </p>
      <Link
        to="/cotizar"
        className="mt-6 inline-block rounded bg-indigo-600 px-5 py-3 font-medium text-white"
      >
        Cotizar ahora
      </Link>
    </main>
  );
}
