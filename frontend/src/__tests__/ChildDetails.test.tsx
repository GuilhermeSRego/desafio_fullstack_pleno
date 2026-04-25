import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ChildDetailsPage from '../app/children/[id]/page';
import api from '../lib/api';

// Mocks
jest.mock('../lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useParams: () => ({ id: 'child-1' }),
  usePathname: () => '/children/child-1',
}));

jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Navbar</div>;
  };
});

// Mock Radix Dialog (shadcn/ui)
jest.mock('../components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog-root">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children, render }: any) => <div data-testid="dialog-trigger">{render || children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

jest.mock('date-fns', () => ({
  format: () => '01/01/2024',
}));

jest.mock('lucide-react', () => {
  const MockIcon = () => <div />;
  return {
    ShieldAlert: MockIcon,
    Heart: MockIcon,
    GraduationCap: MockIcon,
    Users: MockIcon,
    Calendar: MockIcon,
    MapPin: MockIcon,
    User: MockIcon,
    ChevronLeft: MockIcon,
    Stethoscope: MockIcon,
    School: MockIcon,
    ClipboardList: MockIcon,
    Plus: MockIcon,
    History: MockIcon,
    ArrowLeft: MockIcon,
    CheckCircle: MockIcon,
    AlertTriangle: MockIcon,
    HeartPulse: MockIcon,
    BookOpen: MockIcon,
  };
});

const mockChildData = {
  id: 1,
  originalId: 'child-1',
  nome: 'Ana Silva Teste',
  bairro: 'Centro',
  revisado: false,
  responsavel: 'Maria Silva',
  data_nascimento: '2018-05-10',
  saude: { 
    status: 'crítico', 
    vacinas_em_dia: false, 
    alertas: ['vacinas_atrasadas'] 
  },
  educacao: { 
    escola: 'E.M. Rio', 
    frequencia_percent: 85, 
    alertas: [] 
  },
  assistencia_social: { 
    cad_unico: true, 
    beneficio_ativo: true, 
    alertas: [] 
  },
  inconsistencies: {
    issues: ['CPF do Responsável Ausente'],
    suggestions: ['Solicitar documento']
  },
  reviews: []
};

describe('ChildDetails Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: mockChildData });
  });

  it('deve carregar e renderizar o nome da criança e o bairro', async () => {
    await act(async () => {
      render(<ChildDetailsPage />);
    });
    
    // Esperar pelo carregamento
    await waitFor(() => {
      const nameElement = screen.queryByText('Ana Silva Teste');
      if (!nameElement) {
        // Se falhar, vamos ver o que tem no "Carregando..."
        expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
      }
      expect(screen.getByText('Ana Silva Teste')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve renderizar o medidor de vulnerabilidade (HP Bar)', async () => {
    await act(async () => {
      render(<ChildDetailsPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Status de Acompanhamento/i)).toBeInTheDocument();
      // O HP bar usa cores/texto baseados no status
      expect(screen.getByText(/Atenção/i)).toBeInTheDocument();
    });
  });

  it('deve exibir o card de inconsistências se houver problemas', async () => {
    await act(async () => {
      render(<ChildDetailsPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Inconsistências de Registro/i)).toBeInTheDocument();
      expect(screen.getByText(/CPF do Responsável Ausente/i)).toBeInTheDocument();
    });
  });

  it('deve preencher o formulário de revisão e chamar a API ao salvar', async () => {
    await act(async () => {
      render(<ChildDetailsPage />);
    });
    
    // Esperar carregar os dados
    await waitFor(() => {
      expect(screen.getByText('Ana Silva Teste')).toBeInTheDocument();
    });

    // Como o Dialog está mockado para mostrar o conteúdo, podemos buscar os campos diretamente
    const textarea = screen.getByPlaceholderText(/Descreva a visita técnica/i);
    const saveButton = screen.getByText(/Salvar Alterações/i);

    // No Testing Library, usamos fireEvent
    fireEvent.change(textarea, { target: { value: 'Visita realizada com sucesso.' } });
    
    mockedApi.patch.mockResolvedValue({ data: { ...mockChildData, revisado: true } });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedApi.patch).toHaveBeenCalledWith(
        expect.stringContaining('/children/child-1/review'),
        expect.objectContaining({ anotacao: 'Visita realizada com sucesso.' })
      );
      
      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('sucesso'));
    });
  });
});
