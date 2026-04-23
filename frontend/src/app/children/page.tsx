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
import { Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function ChildrenList() {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [bairro, setBairro] = useState('');
  const [temAlertas, setTemAlertas] = useState('all');
  const [revisado, setRevisado] = useState('all');

  const fetchChildren = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (bairro) params.append('bairro', bairro);
      if (temAlertas !== 'all') params.append('temAlertas', temAlertas);
      if (revisado !== 'all') params.append('revisado', revisado);

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
    fetchChildren(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bairro, temAlertas, revisado]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Crianças Acompanhadas</h2>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Filtrar por bairro..." 
            value={bairro} 
            onChange={(e) => setBairro(e.target.value)} 
            className="md:max-w-xs"
          />
          <Select value={temAlertas} onValueChange={(val) => setTemAlertas(val || 'all')}>
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Status de Alertas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Com Alertas</SelectItem>
              <SelectItem value="false">Sem Alertas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={revisado} onValueChange={(val) => setRevisado(val || 'all')}>
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Status de Revisão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Revisados</SelectItem>
              <SelectItem value="false">Não Revisados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Alertas</TableHead>
                <TableHead>Revisado</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Carregando dados...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">{child.nome}</TableCell>
                      <TableCell>{child.bairro}</TableCell>
                      <TableCell>{age} anos</TableCell>
                      <TableCell>
                        {numAlertas > 0 ? (
                          <Badge variant="destructive">{numAlertas} alerta(s)</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Tudo OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {child.revisado ? (
                          <Badge variant="default" className="bg-blue-600">Sim</Badge>
                        ) : (
                          <Badge variant="secondary">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/children/${child.originalId}`}>
                          <Button variant="ghost" size="sm">
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

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Mostrando página {meta.page} de {meta.totalPages} (Total: {meta.total})
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchChildren(meta.page - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchChildren(meta.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
