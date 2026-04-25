import { render, screen } from '@testing-library/react';
import Navbar from '../components/Navbar';

// Mocks para evitar erros no ambiente de teste com App Router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

jest.mock('../components/TourProvider', () => ({
  useTour: () => ({
    startTour: jest.fn(),
  }),
}));

jest.mock('../components/AccessibilityProvider', () => ({
  useAccessibility: () => ({
    fontSize: 100,
    increaseFontSize: jest.fn(),
    decreaseFontSize: jest.fn(),
    resetFontSize: jest.fn(),
    isSpeaking: false,
    toggleSpeech: jest.fn(),
    isPointAndReadActive: false,
    togglePointAndRead: jest.fn(),
    speak: jest.fn(),
    stopSpeech: jest.fn(),
  }),
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
    const logo = screen.getByAltText(/Prefeitura Rio/i);
    expect(logo).toBeInTheDocument();
  });

  it('deve renderizar os links de navegação principal', () => {
    render(<Navbar />);
    expect(screen.getAllByText(/Dashboard/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Crianças/i)[0]).toBeInTheDocument();
  });

  it('deve conter botão de Sair', () => {
    render(<Navbar />);
    // Tem dois botões (desktop e mobile)
    const logoutButtons = screen.getAllByRole('button', { name: /Sair da conta/i });
    expect(logoutButtons.length).toBeGreaterThan(0);
    expect(logoutButtons[0]).toBeInTheDocument();
  });
});
