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
                className="pl-9 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 h-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bairro</span>
            <Input 
              placeholder="Filtrar por bairro..." 
              value={bairro} 
              onChange={(e) => setBairro(e.target.value)} 
              className="dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 h-10"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tipos de Alerta</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between h-10 dark:bg-gray-900 dark:border-gray-800 font-normal">
                  <span className="truncate">
                    {selectedAlerts.length === 0 ? "Filtrar por tipo..." : `${selectedAlerts.length} selecionado(s)`}
                  </span>
                  <Filter className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="space-y-1">
                  {alertOptions.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      <Checkbox checked={selectedAlerts.includes(alert.id)} id={alert.id} />
                      <label htmlFor={alert.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {alert.label}
                      </label>
                    </div>
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
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 h-10">
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
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 h-10">
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
              <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow className="dark:border-gray-800">
                  <TableHead 
                    className="dark:text-gray-400 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/80 transition-colors"
                    onClick={() => toggleSort('nome')}
                  >
                    Nome <SortIcon field="nome" />
                  </TableHead>
                  <TableHead 
                    className="dark:text-gray-400 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/80 transition-colors"
                    onClick={() => toggleSort('bairro')}
                  >
                    Bairro <SortIcon field="bairro" />
                  </TableHead>
                  <TableHead 
                    className="dark:text-gray-400 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/80 transition-colors"
                    onClick={() => toggleSort('idade')}
                  >
                    Idade <SortIcon field="idade" />
                  </TableHead>
                  <TableHead 
                    className="dark:text-gray-400 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/80 transition-colors"
                    onClick={() => toggleSort('alertas')}
                  >
                    Alertas <SortIcon field="alertas" />
                  </TableHead>
                  <TableHead className="dark:text-gray-400">Revisado</TableHead>
                  <TableHead className="text-right dark:text-gray-400">Ação</TableHead>
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
                      <TableRow key={child.id} className="dark:border-gray-800">
                        <TableCell className="font-medium dark:text-gray-200">{child.nome}</TableCell>
                        <TableCell className="dark:text-gray-300">{child.bairro}</TableCell>
                        <TableCell className="dark:text-gray-300">{age} anos</TableCell>
                        <TableCell>
                          {numAlertas > 0 ? (
                            <Badge variant="destructive">{numAlertas} alerta(s)</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">Tudo OK</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {child.revisado ? (
                            <Badge variant="default" className="bg-blue-600 dark:bg-blue-700">Sim</Badge>
                          ) : (
                            <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/children/${child.originalId}`} passHref>
                            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:text-white">
                              <Eye className="w-4 h-4 mr-2" /> Ver
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
                  <div key={child.id} className="p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{child.nome}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                          <span>{child.bairro}</span>
                          <span>•</span>
                          <span>{age} anos</span>
                        </div>
                      </div>
                      <Link href={`/children/${child.originalId}`} passHref>
                        <Button variant="outline" size="sm" className="h-8 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400">
                          <Eye className="w-4 h-4 mr-1.5" /> Ver Caso
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Alertas</p>
                        {numAlertas > 0 ? (
                          <Badge variant="destructive" className="w-full justify-center py-1">{numAlertas} Alerta(s) Ativo(s)</Badge>
                        ) : (
                          <Badge variant="outline" className="w-full justify-center py-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">Tudo OK</Badge>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Revisado</p>
                        {child.revisado ? (
                          <Badge variant="default" className="w-full justify-center py-1 bg-blue-600">Sim</Badge>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-center py-1 dark:bg-gray-800">Não</Badge>
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
