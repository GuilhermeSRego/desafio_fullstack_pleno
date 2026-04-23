'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ChildDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        const res = await api.get(`/children/${id}`);
        setChild(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados da criança.');
      } finally {
        setLoading(false);
      }
    };
    fetchChild();
  }, [id]);

  const handleReview = async () => {
    setReviewing(true);
    try {
      await api.patch(`/children/${id}/review`);
      toast.success('Caso marcado como revisado com sucesso!');
      setChild({ ...child, revisado: true, revisado_por: 'Você', revisado_em: new Date().toISOString() });
    } catch (error) {
      toast.error('Erro ao marcar caso como revisado.');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  if (!child) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Criança não encontrada.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/children">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800">Detalhes do Acompanhamento</h2>
          </div>
          {!child.revisado ? (
            <Button onClick={handleReview} disabled={reviewing} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              {reviewing ? 'Marcando...' : 'Marcar como Revisado'}
            </Button>
          ) : (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-100 px-4 py-2 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" /> Revisado
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{child.nome}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <strong>Nascimento:</strong> {format(new Date(child.data_nascimento), "dd/MM/yyyy")}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <strong>Bairro:</strong> {child.bairro}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <strong>Responsável:</strong> {child.responsavel}
            </div>
          </CardContent>
        </Card>

        <h3 className="text-xl font-semibold mt-8 mb-4">Situação por Área</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SAÚDE */}
          <Card className={child.saude?.alertas?.length ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Saúde
                {child.saude?.alertas?.length > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!child.saude ? (
                <p className="text-gray-500 italic">Sem dados registrados na Saúde.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p><strong>Última consulta:</strong> {format(new Date(child.saude.ultima_consulta), "dd/MM/yyyy")}</p>
                  <p>
                    <strong>Vacinas:</strong>{' '}
                    {child.saude.vacinas_em_dia ? (
                      <span className="text-green-600 font-medium">Em dia</span>
                    ) : (
                      <span className="text-red-600 font-medium">Atrasadas</span>
                    )}
                  </p>
                  {child.saude.alertas.length > 0 && (
                    <div>
                      <strong className="text-red-600">Alertas Ativos:</strong>
                      <ul className="list-disc pl-5 mt-1 text-red-600">
                        {child.saude.alertas.map((alerta: string) => (
                          <li key={alerta}>{alerta.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* EDUCAÇÃO */}
          <Card className={child.educacao?.alertas?.length ? 'border-orange-200 bg-orange-50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Educação
                {child.educacao?.alertas?.length > 0 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!child.educacao ? (
                <p className="text-gray-500 italic">Sem dados registrados na Educação.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p><strong>Escola:</strong> {child.educacao.escola || 'Não matriculado'}</p>
                  {child.educacao.frequencia_percent !== null && (
                    <p><strong>Frequência:</strong> {child.educacao.frequencia_percent}%</p>
                  )}
                  {child.educacao.alertas.length > 0 && (
                    <div>
                      <strong className="text-orange-600">Alertas Ativos:</strong>
                      <ul className="list-disc pl-5 mt-1 text-orange-600">
                        {child.educacao.alertas.map((alerta: string) => (
                          <li key={alerta}>{alerta.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ASSISTÊNCIA SOCIAL */}
          <Card className={child.assistencia_social?.alertas?.length ? 'border-purple-200 bg-purple-50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Assistência Social
                {child.assistencia_social?.alertas?.length > 0 && <AlertTriangle className="w-4 h-4 text-purple-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!child.assistencia_social ? (
                <p className="text-gray-500 italic">Sem dados registrados na Assistência Social.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>CadÚnico:</strong>{' '}
                    {child.assistencia_social.cad_unico ? 'Ativo' : 'Inativo/Ausente'}
                  </p>
                  <p>
                    <strong>Benefício:</strong>{' '}
                    {child.assistencia_social.beneficio_ativo ? (
                      <span className="text-green-600 font-medium">Ativo</span>
                    ) : (
                      <span className="text-red-600 font-medium">Suspenso/Inativo</span>
                    )}
                  </p>
                  {child.assistencia_social.alertas.length > 0 && (
                    <div>
                      <strong className="text-purple-600">Alertas Ativos:</strong>
                      <ul className="list-disc pl-5 mt-1 text-purple-600">
                        {child.assistencia_social.alertas.map((alerta: string) => (
                          <li key={alerta}>{alerta.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>

      </main>
    </div>
  );
}
