import { render, screen } from '@testing-library/react';
import Navbar from '../components/Navbar';

// Mocks para evitar erros no ambiente de teste com App Router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

jest.mock('next-themes', () => ({
  useTheme() {
    return {
      theme: 'light',
      setTheme: jest.fn(),
    };
  },
}));

describe('Navbar Component', () => {
  it('deve renderizar o logo da Prefeitura', () => {
    render(<Navbar />);
    const logo = screen.getByText(/Prefeitura Rio/i);
    expect(logo).toBeInTheDocument();
  });

  it('deve renderizar os links de navegação principal', () => {
    render(<Navbar />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Crianças/i)).toBeInTheDocument();
  });

  it('deve conter botão de Sair', () => {
    render(<Navbar />);
    expect(screen.getByRole('button', { name: /Sair da conta/i })).toBeInTheDocument();
  });
});
