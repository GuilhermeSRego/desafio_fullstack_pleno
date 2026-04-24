'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users } from 'lucide-react';
import { ModeToggle } from './ModeToggle';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-950 shadow-sm border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-xl text-blue-700 dark:text-blue-500">Prefeitura Rio</h1>
        <nav className="hidden md:flex items-center gap-4" aria-label="Navegação principal">
          <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2" aria-label="Ir para Dashboard">
            <Home size={18} /> Dashboard
          </Link>
          <Link href="/children" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2" aria-label="Ir para lista de Crianças">
            <Users size={18} /> Crianças
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" aria-label="Sair da conta">
          <LogOut size={18} className="mr-2" /> Sair
        </Button>
      </div>
    </header>
  );
}
