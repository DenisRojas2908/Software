import { screen } from '@testing-library/react';
import { Rutas } from './App';
import { renderizar } from './test/utilidades';

describe('App', () => {
  it('F0: muestra la marca SVAS y el aviso de simulación académica', () => {
    renderizar(<Rutas />);
    expect(screen.getByRole('heading', { name: 'SVAS' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/Simulación académica/);
  });
});
