import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsuarioSesion } from './decoradores';

// RF-32 + D-36: un CLIENTE solo accede a lo suyo. Un recurso sin dueño (cotización de invitado)
// se puede leer por su uuid, que no es adivinable. ASESOR y ADMINISTRADOR acceden en sus vistas.
export function verificarPropiedad(
  usuario: UsuarioSesion | undefined,
  usuarioDuenoId: string | null | undefined,
  opciones: { permitirSinDueno?: boolean } = {},
): void {
  if (usuario && usuario.rol !== 'CLIENTE') return;
  if (!usuarioDuenoId) {
    if (opciones.permitirSinDueno) return;
    throw new NotFoundException('No encontrado');
  }
  if (!usuario) throw new ForbiddenException('Inicia sesión con la cuenta dueña de este trámite');
  if (usuario.id !== usuarioDuenoId) throw new ForbiddenException('Este trámite pertenece a otra cuenta');
}
