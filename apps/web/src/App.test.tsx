import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('F0: muestra la marca SVAS y el aviso de simulación académica', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'SVAS' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/Simulación académica/);
  });
});
