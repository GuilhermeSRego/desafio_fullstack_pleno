'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-xl text-blue-700">Prefeitura Rio</h1>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
            <Home size={18} /> Dashboard
          </Link>
          <Link href="/children" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
            <Users size={18} /> Crianças
          </Link>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
        <LogOut size={18} className="mr-2" /> Sair
      </Button>
    </nav>
  );
}
