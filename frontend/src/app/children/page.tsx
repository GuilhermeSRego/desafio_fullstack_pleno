'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export default function ChildrenList() {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [bairro, setBairro] = useState('');
  const [nome, setNome] = useState('');
  const [temAlertas, setTemAlertas] = useState('all');
  const [revisado, setRevisado] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  
  // Opções de alertas para multi-select
  const alertOptions = [
    { id: 'vacinas_atrasadas', label: 'Vacinas Atrasadas' },
    { id: 'consulta_atrasada', label: 'Consulta Atrasada' },
    { id: 'frequencia_baixa', label: 'Frequência Baixa' },
    { id: 'cadastro_desatualizado', label: 'Cadastro Desatualizado' },
    { id: 'beneficio_suspenso', label: 'Benefício Suspenso' },
    { id: 'beneficio_suspensos', label: 'Benefício Suspensos' },
    { id: 'cad_unico_pendente', label: 'CadÚnico Pendente' },
    { id: 'matricula_pendente', label: 'Matrícula Pendente' },
    { id: 'cadastro_ausente', label: 'Cadastro Ausente' },
  ];

  // Ordenação
  const [sortBy, setSortBy] = useState<string>('nome');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const fetchChildren = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        order
      });
      if (bairro) params.append('bairro', bairro);
      if (nome) params.append('nome', nome);
      if (temAlertas !== 'all') params.append('temAlertas', temAlertas);
      if (revisado !== 'all') params.append('revisado', revisado);
      if (selectedAlerts.length > 0) params.append('alertas', selectedAlerts.join(','));

      const res = await api.get(`/children?${params.toString()}`);
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChildren(1);
    }, 300); // Debounce
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bairro, nome, temAlertas, revisado, selectedAlerts, sortBy, order]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  };

  const toggleAlert = (id: string) => {
    setSelectedAlerts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline opacity-40" />;
    return order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline" /> : <ArrowDown className="w-3.5 h-3.5 ml-1 inline" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Crianças Acompanhadas</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge variant="outline" className="dark:border-gray-800">{meta.total} registros</Badge>
          </div>
        </header>

        <section aria-label="Filtros de pesquisa" className="bg-white dark:bg-gray-950 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome da Criança</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Buscar por nome..." 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                className="pl-9 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 !h-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bairro</span>
            <Input 
              placeholder="Filtrar por bairro..." 
              value={bairro} 
              onChange={(e) => setBairro(e.target.value)} 
              className="dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 !h-10"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tipos de Alerta</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between !h-10 dark:bg-gray-900 dark:border-gray-800 font-normal w-full">
                  <span className="truncate">
                    {selectedAlerts.length === 0 ? "Filtrar por tipo..." : `${selectedAlerts.length} selecionado(s)`}
                  </span>
                  <Filter className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="space-y-1">
                  {alertOptions.map((alert) => (
                    <label 
                      key={alert.id} 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer w-full"
                    >
                      <Checkbox 
                        checked={selectedAlerts.includes(alert.id)} 
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                      <span className="text-sm font-medium leading-none cursor-pointer select-none">
                        {alert.label}
                      </span>
                    </label>
                  ))}
                  {selectedAlerts.length > 0 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-8" onClick={() => setSelectedAlerts([])}>Limpar seleção</Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Presença de Alerta</span>
            <Select value={temAlertas} onValueChange={(val) => setTemAlertas(val || 'all')}>
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 !h-10 w-full">
                <SelectValue>
                  {temAlertas === 'all' ? 'Ver Todas' : temAlertas === 'true' ? 'Apenas com Alertas' : 'Sem Alertas Ativos'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-950 dark:border-gray-800">
                <SelectItem value="all">Ver Todas</SelectItem>
                <SelectItem value="true">Apenas com Alertas</SelectItem>
                <SelectItem value="false">Sem Alertas Ativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Revisão</span>
            <Select value={revisado} onValueChange={(val) => setRevisado(val || 'all')}>
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 !h-10 w-full">
                <SelectValue>
                  {revisado === 'all' ? 'Todos os Status' : revisado === 'true' ? 'Já Revisados' : 'Não Revisados'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-950 dark:border-gray-800">
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="true">Já Revisados</SelectItem>
                <SelectItem value="false">Não Revisados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section aria-label="Resultados" className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100/50 dark:bg-gray-900/80 border-b-2 border-gray-200 dark:border-gray-800">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead 
                    className="font-bold text-gray-900 dark:text-gray-100 cursor-pointer h-12"
                    onClick={() => toggleSort('nome')}
                  >
                    <div className="flex items-center">
                      Nome <SortIcon field="nome" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold text-gray-900 dark:text-gray-100 cursor-pointer h-12"
                    onClick={() => toggleSort('bairro')}
                  >
                    <div className="flex items-center">
                      Bairro <SortIcon field="bairro" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold text-gray-900 dark:text-gray-100 cursor-pointer h-12 text-center"
                    onClick={() => toggleSort('idade')}
                  >
                    <div className="flex items-center justify-center">
                      Idade <SortIcon field="idade" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold text-gray-900 dark:text-gray-100 cursor-pointer h-12 text-center"
                    onClick={() => toggleSort('alertas')}
                  >
                    <div className="flex items-center justify-center">
                      Alertas <SortIcon field="alertas" />
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-12 text-center">Revisado</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-12 text-right pr-6">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="dark:border-gray-800">
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow className="dark:border-gray-800">
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Nenhuma criança encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((child) => {
                    const numAlertas = 
                      (child.saude?.alertas?.length || 0) + 
                      (child.educacao?.alertas?.length || 0) + 
                      (child.assistencia_social?.alertas?.length || 0);
                    
                    const age = new Date().getFullYear() - new Date(child.data_nascimento).getFullYear();

                    return (
                      <TableRow key={child.id} className="dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-900/40 transition-all duration-200 group">
                        <TableCell className="py-4">
                          <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                            {child.nome}
                          </span>
                        </TableCell>
                        <TableCell className="dark:text-gray-300 py-4 font-medium">{child.bairro}</TableCell>
                        <TableCell className="dark:text-gray-300 py-4 text-center font-medium">{age} anos</TableCell>
                        <TableCell className="py-4 text-center">
                          {numAlertas > 0 ? (
                            <Badge variant="destructive" className="font-bold px-3 py-1 shadow-sm shadow-red-500/10">
                              {numAlertas} {numAlertas === 1 ? 'alerta' : 'alertas'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400 font-bold px-3 py-1">
                              Tudo OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {child.revisado ? (
                            <Badge variant="default" className="bg-blue-600 dark:bg-blue-700 font-bold px-3 py-1">Sim</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-bold px-3 py-1">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6">
                          <Link href={`/children/${child.originalId}`} passHref>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-white dark:bg-gray-950 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white transition-all duration-300 shadow-sm cursor-pointer group-hover:shadow-md h-9 px-4 rounded-full font-medium"
                            >
                              <Eye className="w-4 h-4 mr-2" /> Ver Caso
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y dark:divide-gray-800">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando dados...</div>
            ) : data.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhuma criança encontrada.</div>
            ) : (
              data.map((child) => {
                const numAlertas = 
                  (child.saude?.alertas?.length || 0) + 
                  (child.educacao?.alertas?.length || 0) + 
                  (child.assistencia_social?.alertas?.length || 0);
                
                const age = new Date().getFullYear() - new Date(child.data_nascimento).getFullYear();

                return (
                  <div key={child.id} className="p-5 space-y-5 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-all duration-300">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">
                          {child.nome}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{child.bairro}</span>
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{age} anos</span>
                        </div>
                      </div>
                      <Link href={`/children/${child.originalId}`} passHref className="shrink-0">
                        <Button variant="default" size="sm" className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer font-medium">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1.5">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Status Alertas</p>
                        {numAlertas > 0 ? (
                          <div className="flex items-center text-red-600 dark:text-red-400 font-bold text-sm">
                            <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
                            {numAlertas} {numAlertas === 1 ? 'Alerta' : 'Alertas'}
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600 dark:text-green-400 font-bold text-sm">
                            <span className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                            Tudo em Dia
                          </div>
                        )}
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1.5">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Revisão Técnica</p>
                        {child.revisado ? (
                          <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                            Finalizada
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600 dark:text-amber-400 font-bold text-sm">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse" />
                            Pendente
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Pagination */}
        <nav aria-label="Paginação" className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
            Mostrando página {meta.page} de {meta.totalPages} (Total: {meta.total})
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchChildren(meta.page - 1)}
              aria-label="Ir para página anterior"
              className="dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchChildren(meta.page + 1)}
              aria-label="Ir para próxima página"
              className="dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Próxima
            </Button>
          </div>
        </nav>
      </main>
    </div>
  );
}
