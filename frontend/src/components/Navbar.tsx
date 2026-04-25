'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import logo from '@/assets/logo.png';
import { LogOut, Home, Users, Menu, X, HelpCircle } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { cn } from '@/lib/utils';
import { useTour } from './TourProvider';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { startTour } = useTour();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/children', label: 'Crianças', icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm border-b px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-all"
              onClick={() => setIsOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </Button>
            
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src={logo} 
                alt="Prefeitura Rio" 
                className="h-8 md:h-10 w-auto object-contain drop-shadow-sm"
                priority
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 ml-4" aria-label="Navegação principal">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  id={link.href === '/' ? 'nav-dashboard' : 'nav-children'}
                  href={link.href} 
                  className={cn(
                    "text-sm font-bold flex items-center gap-2 transition-all relative py-1",
                    isActive 
                      ? "text-blue-700 dark:text-blue-400 after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2px] after:bg-blue-700 dark:after:bg-blue-400" 
                      : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
                  )}
                >
                  <Icon size={18} /> {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            id="tour-start-button"
            variant="ghost" 
            size="icon" 
            onClick={startTour}
            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
            title="Ajuda / Iniciar Tour"
          >
            <HelpCircle size={20} />
          </Button>
          <ModeToggle />
          <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-bold transition-colors"
            aria-label="Sair da conta"
          >
            <LogOut size={18} className="md:mr-2" /> 
            <span className="hidden md:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-gray-950 shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col border-r dark:border-gray-800",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest">Painel Municipal</span>
            <span className="text-lg font-black text-gray-900 dark:text-gray-100">Monitoramento</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
          >
            <X size={24} />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon size={22} /> {link.label}
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t dark:border-gray-800">
            <Button 
              variant="ghost" 
              onClick={() => { setIsOpen(false); startTour(); }}
              className="w-full flex items-center justify-start gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <HelpCircle size={22} /> Iniciar Tour Guiado
            </Button>
          </div>
        </nav>

        <div className="p-6 border-t dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black shadow-inner">
              TR
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-900 dark:text-gray-100">Técnico Rio</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-tighter opacity-70">Campo e Monitoramento</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-center gap-3 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 dark:hover:text-white font-black h-12 rounded-xl transition-all shadow-sm"
            onClick={handleLogout}
          >
            <LogOut size={18} /> Sair da Conta
          </Button>
        </div>
      </aside>
    </>
  );
}
