'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { Joyride, Step, type EventData, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TourContextType {
  startTour: () => void;
  isTourOpen: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const CustomBeacon = (props: any) => (
  <button 
    {...props} 
    className="relative flex items-center group transition-all"
    title="Clique para continuar o tour"
  >
    <span className="absolute flex h-8 w-8">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-600 border-2 border-white shadow-md"></span>
    </span>
    <div className="ml-10 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-xl whitespace-nowrap transform transition-transform group-hover:scale-110 flex items-center gap-1.5 border border-white/20">
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      CLIQUE AQUI PARA CONTINUAR
    </div>
  </button>
);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within a TourProvider');
  return context;
};

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [finishedOpen, setFinishedOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load state from localStorage on mount and route change
  useEffect(() => {
    // Reset welcome if moving back to home and not completed
    if (pathname === '/' && localStorage.getItem('tour_completed') !== 'true') {
      const tourActive = localStorage.getItem('tour_active') === 'true';
      if (!tourActive) setWelcomeOpen(true);
    }

    const checkElementAndStart = (attempts = 0) => {
      const tourActive = localStorage.getItem('tour_active') === 'true';
      const tourCompleted = localStorage.getItem('tour_completed') === 'true';
      const savedIndex = parseInt(localStorage.getItem('tour_step_index') || '0', 10);

      if (!tourActive || tourCompleted) return;

      // Targets for page transitions
      const targets = [
        '#filters-section', 
        '#mobile-filter-toggle', 
        '#child-prontuario-card'
      ];
      
      const found = targets.some(selector => {
        const el = document.querySelector(selector);
        return el && (el as HTMLElement).offsetParent !== null; // Check if visible
      });

      if (found || attempts > 20) { // Max 2 seconds of polling
        setStepIndex(savedIndex);
        setRun(true);
      } else {
        setTimeout(() => checkElementAndStart(attempts + 1), 100);
      }
    };

    if (pathname !== '/') {
      checkElementAndStart();
    } else {
      const timer = setTimeout(() => {
        const tourActive = localStorage.getItem('tour_active') === 'true';
        const savedIndex = parseInt(localStorage.getItem('tour_step_index') || '0', 10);
        if (tourActive) {
          setStepIndex(savedIndex);
          setRun(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const startTour = () => {
    setWelcomeOpen(false);
    localStorage.setItem('tour_active', 'true');
    localStorage.setItem('tour_completed', 'false');
    localStorage.setItem('tour_step_index', '0');
    setStepIndex(0);
    setRun(true);
  };

  const skipTourPermanently = () => {
    localStorage.setItem('tour_completed', 'true');
    localStorage.setItem('tour_active', 'false');
    setWelcomeOpen(false);
    setRun(false);
  };

  const steps: any[] = [
    // DASHBOARD (0-6)
    {
      target: '#indicators-section',
      content: 'Estes são os indicadores principais. Mostram o total de crianças e alertas ativos em cada área (Saúde, Educação, Social).',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tab-priority',
      content: 'A "Gestão de Casos" destaca crianças em situação crítica e erros de cadastro que precisam de atenção imediata.',
      placement: 'top',
    },
    {
      target: '#tab-analytics',
      content: 'No "Panorama", você encontra gráficos comparativos e estatísticas por bairro para uma visão estratégica.',
      placement: 'top',
    },
    {
      target: '#tab-map',
      content: 'A "Distribuição Geográfica" mostra onde os casos estão concentrados através de mapas de calor.',
      placement: 'top',
    },
    {
      target: '#theme-toggle',
      content: 'O sistema possui Modo Escuro! Clique aqui para alternar e ter mais conforto visual.',
      placement: 'bottom',
    },
    {
      target: '#nav-base-alunos',
      content: 'Vamos agora para a Base de Alunos, onde você pode gerenciar a lista completa.',
      placement: 'bottom',
    },
    // TRANSITION TO LIST (7)
    {
      target: '#nav-children',
      content: 'Navegue para a lista completa de crianças por aqui.',
      placement: 'bottom',
    },
    // CHILDREN LIST (8-10)
    {
      target: '#filters-section',
      content: 'Use os filtros avançados para encontrar crianças por nome, bairro, escola ou tipo de alerta.',
      placement: 'bottom',
      disableBeacon: false,
      disableOverlay: true,
      beaconComponent: CustomBeacon,
    },
    {
      target: '#col-nome',
      content: 'A tabela mostra dados vitais. Você pode ordenar as colunas clicando nos títulos.',
      placement: 'bottom',
    },
    {
      target: '#child-row-0',
      content: 'Clique em "Ver Caso" para abrir o prontuário detalhado de uma criança.',
      placement: 'top',
    },
    // CHILD DETAILS (11-17)
    {
      target: '#child-prontuario-card',
      content: 'Aqui estão os dados cadastrais básicos e o contato do responsável.',
      placement: 'bottom',
      disableBeacon: false,
      disableOverlay: true,
      beaconComponent: CustomBeacon,
    },
    {
      target: '#vitality-bar-card',
      content: 'A Barra de Vitalidade mostra a saúde geral do acompanhamento. 100% significa zero alertas.',
      placement: 'bottom',
    },
    {
      target: '#health-card',
      content: 'Acompanhe o status de vacinação e consultas médicas nesta seção.',
      placement: 'bottom',
    },
    {
      target: '#education-card',
      content: 'Veja a escola atual e o percentual de frequência escolar.',
      placement: 'bottom',
    },
    {
      target: '#social-card',
      content: 'Verifique a situação do CadÚnico e se o benefício social está ativo.',
      placement: 'bottom',
    },
    {
      target: '#inconsistencies-card',
      content: 'Inconsistências de registro são mostradas aqui com sugestões de correção.',
      placement: 'bottom',
    },
    {
      target: '#revision-history-card',
      content: 'O histórico mantém o registro de todas as visitas e anotações técnicas anteriores.',
      placement: 'bottom',
    },
    {
      target: '#btn-open-revision',
      content: 'Finalmente, use este botão para registrar uma nova revisão após sua visita técnica.',
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, index, action } = data;
    
    if (status === STATUS.FINISHED) {
      setRun(false);
      localStorage.setItem('tour_active', 'false');
      localStorage.setItem('tour_completed', 'true');
      setFinishedOpen(true);
    } else if (status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem('tour_active', 'false');
      localStorage.setItem('tour_completed', 'true');
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // Page Transitions
      // Dashboard -> Children List (After #nav-children)
      if (index === 6 && action === ACTIONS.NEXT && pathname !== '/children') {
        setRun(false);
        localStorage.setItem('tour_step_index', '7');
        router.push('/children');
        return;
      }

      // Children List -> Child Details (After #child-row-0)
      if (index === 9 && action === ACTIONS.NEXT && !pathname.startsWith('/children/')) {
        const firstChildLink = document.querySelector('[id^="child-row-0"] a') as HTMLAnchorElement || 
                               document.querySelector('table a') as HTMLAnchorElement;
        if (firstChildLink) {
          setRun(false);
          localStorage.setItem('tour_step_index', '10');
          firstChildLink.click();
        }
        return;
      }

      // Sync step index
      setStepIndex(nextIndex);
      localStorage.setItem('tour_step_index', nextIndex.toString());
    }
  };

  return (
    <TourContext.Provider value={{ startTour, isTourOpen: run }}>
      {children}
      
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="relative h-32 bg-blue-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
            <HelpCircle size={64} className="text-white/20 absolute -right-4 -bottom-4 rotate-12" />
            <div className="relative z-10 text-center">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">Bem-vindo(a)</h3>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Portal de Monitoramento</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center leading-tight">
                Gostaria de um tour guiado pelas funcionalidades?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed font-medium">
                Vamos mostrar como navegar pelos indicadores, gerenciar casos críticos e realizar revisões técnicas de campo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={startTour} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                Iniciar Tour Guiado
              </Button>
              <Button 
                variant="ghost" 
                onClick={skipTourPermanently} 
                className="w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                Não, obrigado. Pular para sempre.
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={finishedOpen} onOpenChange={setFinishedOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="relative h-32 bg-green-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <div className="relative z-10 text-center">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">Tour Finalizado!</h3>
              <p className="text-green-100 text-xs font-bold uppercase tracking-widest opacity-80">Pronto para começar</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center leading-tight">
                O tour acabou!
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed font-medium">
                Esperamos que este painel seja muito útil no seu dia a dia de acompanhamento. Bom uso do sistema!
              </p>
            </div>

            <div className="grid grid-cols-1">
              <Button 
                onClick={() => {
                  setFinishedOpen(false);
                  router.push('/');
                }} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95"
              >
                Finalizar e ir para o Início
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        onEvent={handleJoyrideCallback as any}
        locale={{
          back: 'Anterior',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          skip: 'Encerrar Tour',
        }}
        options={{
          buttons: ['back', 'primary', 'skip'],
          primaryColor: '#2563eb',
          zIndex: 10000,
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          arrowColor: '#ffffff',
          scrollOffset: 150,
        }}
        styles={{
          tooltip: {
            borderRadius: '16px',
            padding: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltipTitle: {
            fontWeight: 800,
            fontSize: '16px',
            color: '#2563eb',
            marginBottom: '6px',
          },
          tooltipContent: {
            fontSize: '13px',
            lineHeight: '1.4',
            color: '#4b5563',
          },
          buttonPrimary: {
            borderRadius: '8px',
            fontWeight: 700,
            padding: '8px 16px',
            backgroundColor: '#2563eb',
          },
          buttonBack: {
            fontWeight: 700,
            marginRight: '10px',
            color: '#9ca3af',
          },
          buttonSkip: {
            color: '#ef4444',
            fontWeight: 700,
          }
        }}
      />
    </TourContext.Provider>
  );
}
