import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

// RF-03 / RNF-08: errores de validación POR CAMPO → { mensaje, errores: { campo: 'mensaje' } } con 400.
export function validar<T extends z.ZodType>(esquema: T, datos: unknown): z.infer<T> {
  const r = esquema.safeParse(datos);
  if (r.success) return r.data;
  const errores: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const campo = issue.path.join('.') || '_';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  throw new BadRequestException({ mensaje: 'Revisa los datos ingresados', errores });
}
