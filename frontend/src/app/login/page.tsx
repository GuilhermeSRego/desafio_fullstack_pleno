'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('tecnico@prefeitura.rio');
  const [password, setPassword] = useState('painel@2024');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/auth/token', { email, password });
      Cookies.set('token', res.data.token, { expires: 1 }); // 1 day
      toast.success('Login realizado com sucesso!');
      router.push('/');
    } catch (error) {
      toast.error('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10" />

      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <Image 
          src={logo} 
          alt="Prefeitura Rio Logo" 
          className="h-24 w-auto mb-4 object-contain drop-shadow-md"
          priority
        />
        <h2 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-[0.3em] text-center">
          Monitoramento Infantil
        </h2>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-black tracking-tight">Acesso ao Painel</CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            Entre com suas credenciais funcionais
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">E-mail Institucional</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tecnico@prefeitura.rio"
                className="h-12 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-4 flex flex-col space-y-4">
            <Button type="submit" className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all" disabled={loading}>
              {loading ? 'Validando acesso...' : 'Entrar no Sistema'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <footer className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-loose">
          © 2026 Prefeitura da Cidade do Rio de Janeiro <br/>
          Painel de Monitoramento de Vulnerabilidade Social
        </p>
      </footer>
    </div>
  );
}
