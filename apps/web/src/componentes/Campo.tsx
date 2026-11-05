import { ReactNode } from 'react';

// Etiqueta + control + mensaje de error por campo (RF-03, RNF-08).
export function Campo({
  etiqueta,
  error,
  children,
  id,
}: {
  etiqueta: string;
  error?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export const claseInput =
  'w-full rounded border border-slate-300 bg-white px-3 py-2 text-base focus:border-indigo-500 focus:outline-none';
export const claseBoton =
  'rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400';
export const claseBotonSecundario =
  'rounded border border-indigo-600 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50';
