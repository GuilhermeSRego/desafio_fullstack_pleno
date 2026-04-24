'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar, MapPin, User, ShieldAlert, HeartPulse, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input as UiInput } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function ChildDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [openReview, setOpenReview] = useState(false);

  // Form de revisão
  const [reviewForm, setReviewForm] = useState({
    anotacao: '',
    frequencia_nova: '',
    vacinas_em_dia: true,
    cad_unico: true,
    beneficio_ativo: true,
    nome: '',
    data_nascimento: '',
    bairro: '',
    responsavel: '',
    escola: '',
    ultima_consulta: ''
  });

  useEffect(() => {
    const fetchChild = async () => {
      try {
        const res = await api.get(`/children/${id}`);
        setChild(res.data);
        // Inicializa form com dados atuais
        if (res.data) {
          setReviewForm({
            anotacao: '',
            frequencia_nova: res.data.educacao?.frequencia_percent?.toString() || '',
            vacinas_em_dia: res.data.saude?.vacinas_em_dia ?? true,
            cad_unico: res.data.assistencia_social?.cad_unico ?? true,
            beneficio_ativo: res.data.assistencia_social?.beneficio_ativo ?? true,
            nome: res.data.nome || '',
            data_nascimento: res.data.data_nascimento ? format(new Date(res.data.data_nascimento), 'yyyy-MM-dd') : '',
            bairro: res.data.bairro || '',
            responsavel: res.data.responsavel || '',
            escola: res.data.educacao?.escola || '',
            ultima_consulta: res.data.saude?.ultima_consulta ? format(new Date(res.data.saude.ultima_consulta), 'yyyy-MM-dd') : ''
          });
        }
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados da criança.');
      } finally {
        setLoading(false);
      }
    };
    fetchChild();
  }, [id]);

  const handleReviewSubmit = async () => {
    setReviewing(true);
    try {
      const res = await api.patch(`/children/${id}/review`, reviewForm);
      toast.success('Caso atualizado e revisado com sucesso!');
      setChild(res.data);
      setOpenReview(false);
    } catch (error) {
      toast.error('Erro ao salvar alterações.');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-800 dark:text-gray-200">Carregando...</div>;
  if (!child) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-800 dark:text-gray-200">Criança não encontrada.</div>;

  // Dados para gráfico de evolução (histórico de alertas)
  const evolutionData = child.reviews?.slice().reverse().map((r: any) => ({
    data: format(new Date(r.createdAt), 'dd/MM'),
    saude: r.num_alertas_saude_novo,
    educacao: r.num_alertas_educ_novo,
    social: r.num_alertas_social_novo
  })) || [];

  // Se não houver histórico, adiciona o ponto atual
  if (evolutionData.length === 0) {
    evolutionData.push({
      data: 'Atual',
      saude: child.saude?.alertas?.length || 0,
      educacao: child.educacao?.alertas?.length || 0,
      social: child.assistencia_social?.alertas?.length || 0
    });
  }

  const numAlertas = (child.saude?.alertas?.length || 0) + 
                     (child.educacao?.alertas?.length || 0) + 
                     (child.assistencia_social?.alertas?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 transition-colors">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/children" passHref>
              <Button variant="outline" size="icon" aria-label="Voltar" className="dark:border-gray-800 dark:text-gray-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Prontuário da Criança</h2>
          </div>
          
          <Dialog open={openReview} onOpenChange={setOpenReview}>
            <DialogTrigger render={
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 shadow-md">
                <CheckCircle className="w-4 h-4 mr-2" />
                {child.revisado ? 'Nova Revisão' : 'Iniciar Revisão'}
              </Button>
            } />
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-800">
              <DialogHeader>
                <DialogTitle>Atualizar Dados e Acompanhamento</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* DADOS CADASTRAIS */}
                <div className="space-y-4 border-b pb-4 dark:border-gray-800">
                  <h4 className="text-sm font-bold uppercase text-gray-500">Dados Cadastrais</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <UiInput id="nome" value={reviewForm.nome} onChange={(e) => setReviewForm({...reviewForm, nome: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="nasc">Data de Nascimento</Label>
                      <UiInput id="nasc" type="date" value={reviewForm.data_nascimento} onChange={(e) => setReviewForm({...reviewForm, data_nascimento: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="bairro">Bairro</Label>
                      <UiInput id="bairro" value={reviewForm.bairro} onChange={(e) => setReviewForm({...reviewForm, bairro: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="resp">Responsável</Label>
                      <UiInput id="resp" value={reviewForm.responsavel} onChange={(e) => setReviewForm({...reviewForm, responsavel: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* ACOMPANHAMENTO POR ÁREA */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase text-gray-500">Acompanhamento</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="escola">Escola Atual</Label>
                      <UiInput id="escola" value={reviewForm.escola} onChange={(e) => setReviewForm({...reviewForm, escola: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="freq">Frequência Escolar (%)</Label>
                      <UiInput id="freq" type="number" value={reviewForm.frequencia_nova} onChange={(e) => setReviewForm({...reviewForm, frequencia_nova: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="cons">Última Consulta Médica</Label>
                      <UiInput id="cons" type="date" value={reviewForm.ultima_consulta} onChange={(e) => setReviewForm({...reviewForm, ultima_consulta: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between border p-3 rounded-md dark:border-gray-800">
                      <Label htmlFor="vacinas" className="cursor-pointer">Vacinas em Dia</Label>
                      <Switch id="vacinas" checked={reviewForm.vacinas_em_dia} onCheckedChange={(val) => setReviewForm({...reviewForm, vacinas_em_dia: val})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between border p-3 rounded-md dark:border-gray-800">
                      <Label htmlFor="cad" className="cursor-pointer">CadÚnico Ativo</Label>
                      <Switch id="cad" checked={reviewForm.cad_unico} onCheckedChange={(val) => setReviewForm({...reviewForm, cad_unico: val})} />
                    </div>
                    <div className="flex items-center justify-between border p-3 rounded-md dark:border-gray-800">
                      <Label htmlFor="ben" className="cursor-pointer">Benefício Ativo</Label>
                      <Switch id="ben" checked={reviewForm.beneficio_ativo} onCheckedChange={(val) => setReviewForm({...reviewForm, beneficio_ativo: val})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anotacao">Anotações e Próximos Passos</Label>
                  <Textarea id="anotacao" placeholder="Descreva a visita técnica ou observações relevantes..." value={reviewForm.anotacao} onChange={(e) => setReviewForm({...reviewForm, anotacao: e.target.value})} className="min-h-[80px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenReview(false)}>Cancelar</Button>
                <Button onClick={handleReviewSubmit} disabled={reviewing}>
                  {reviewing ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl dark:text-gray-100 flex items-center gap-3">
                  {child.nome}
                  {child.inconsistencies && (
                    <span 
                      title={`Inconsistência de Registro:\n${child.inconsistencies.issues.map((iss: string, idx: number) => `• ${iss}\n  Sugestão: ${child.inconsistencies.suggestions[idx]}`).join('\n')}`}
                      className="flex items-center"
                    >
                      <ShieldAlert 
                        size={24} 
                        className="text-pink-500 cursor-help animate-pulse" 
                      />
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-[10px] uppercase font-bold block opacity-70">Nascimento</span>
                    <span className="font-medium">{format(new Date(child.data_nascimento), "dd/MM/yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-[10px] uppercase font-bold block opacity-70">Bairro</span>
                    <span className="font-medium">{child.bairro}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4 text-green-500" />
                  <div>
                    <span className="text-[10px] uppercase font-bold block opacity-70">Responsável</span>
                    <span className="font-medium">{child.responsavel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HP Bar - Vida da Criança */}
            <Card className="p-6 bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Status de Acompanhamento</h3>
                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                      {numAlertas === 0 
                        ? (child.inconsistencies ? 'Comprometido' : 'Excelente') 
                        : (numAlertas <= 2 ? 'Atenção' : 'Crítico')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase">Vitalidade Social</span>
                    <p className="text-xl font-black tabular-nums">{Math.max(0, 100 - (numAlertas * 20))}%</p>
                  </div>
                </div>

                <div className="relative h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-inner">
                  {/* Background Bar (Dynamic Color) */}
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out flex ${
                      numAlertas === 0 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                      numAlertas <= 2 ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' :
                      'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    }`}
                    style={{ width: `${Math.max(5, 100 - (numAlertas * 20))}%` }}
                  >
                    {/* Inconsistency Segment (Pink) */}
                    {child.inconsistencies && (
                      <div 
                        className="h-full bg-pink-500 animate-pulse" 
                        style={{ width: '30%' }} 
                        title="Inconsistência de dados detectada"
                      />
                    )}
                  </div>
                  
                  {/* Glossy Overlay */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
                </div>
                
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <span>Vulnerabilidade</span>
                  <div className="flex gap-4">
                    {child.inconsistencies && <span className="text-pink-500 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-pink-500 rounded-full" /> Inconsistência</span>}
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full" /> Total</span>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Saúde */}
              <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm border-t-4 border-t-red-500 overflow-hidden">
                <CardHeader className="bg-red-50/30 dark:bg-red-950/10 py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-2">
                    <HeartPulse size={14} /> Saúde
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Última Consulta</span>
                    <span className="font-bold">{child.saude?.ultima_consulta ? format(new Date(child.saude.ultima_consulta), "dd/MM/yyyy") : 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 block">Vacinas</span>
                    <Badge variant={child.saude?.vacinas_em_dia ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5">
                      {child.saude?.vacinas_em_dia ? 'EM DIA' : 'ATRASADAS'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Educação */}
              <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm border-t-4 border-t-orange-500 overflow-hidden">
                <CardHeader className="bg-orange-50/30 dark:bg-orange-950/10 py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <BookOpen size={14} /> Educação
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Escola</span>
                    <span className="font-bold truncate block">{child.educacao?.escola || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Frequência</span>
                    <span className="font-bold">
                      {typeof child.educacao?.frequencia_percent === 'number' 
                        ? `${child.educacao.frequencia_percent}%` 
                        : 'Não informado'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Social */}
              <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm border-t-4 border-t-purple-500 overflow-hidden">
                <CardHeader className="bg-purple-50/30 dark:bg-purple-950/10 py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <ShieldAlert size={14} /> Social
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] text-gray-500 block">CadÚnico</span>
                    <span className="font-bold">{child.assistencia_social?.cad_unico ? 'Ativo' : 'Pendente'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 block">Benefício</span>
                    <Badge variant={child.assistencia_social?.beneficio_ativo ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5">
                      {child.assistencia_social?.beneficio_ativo ? 'ATIVO' : 'SUSPENSO'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Alertas Ativos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...(child.saude?.alertas || []), ...(child.educacao?.alertas || []), ...(child.assistencia_social?.alertas || [])].length > 0 ? (
                  [...(child.saude?.alertas || []), ...(child.educacao?.alertas || []), ...(child.assistencia_social?.alertas || [])].map((alerta, i) => (
                    <div key={i} className="flex gap-2 items-start p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-red-800 dark:text-red-300 font-medium capitalize">{alerta.replace(/_/g, ' ')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4 italic">Nenhum alerta ativo.</p>
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50/50 dark:bg-gray-900">
                <CardTitle className="text-lg">Histórico de Revisão</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto divide-y dark:divide-gray-800">
                  {child.reviews?.slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((rev: any) => (
                    <div key={rev.id} className="p-4 space-y-2 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(rev.createdAt), "dd/MM/yy HH:mm")}</span>
                        <Badge 
                          variant="outline" 
                          className="text-[10px] py-0 cursor-help transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400"
                          title={rev.revisado_por}
                        >
                          {rev.revisado_por.split('@')[0]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-snug">"{rev.anotacao || 'Sem anotações'}"</p>
                      <div className="flex gap-3 text-[10px] font-medium">
                        <span className="text-blue-500">Freq: {rev.frequencia_nova}%</span>
                        <span className="text-orange-500">Alertas: {rev.num_alertas_saude_novo + rev.num_alertas_educ_novo + rev.num_alertas_social_novo}</span>
                      </div>
                    </div>
                  ))}
                  {(!child.reviews || child.reviews.length === 0) && (
                    <div className="p-8 text-center text-gray-500 text-sm italic">Nenhuma revisão registrada.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inconsistências de Registro */}
            {child.inconsistencies && (
              <Card className="border-pink-100 dark:border-pink-900 shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50/20 dark:bg-pink-950/10 py-3 border-b dark:border-pink-900/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-pink-600 dark:text-pink-400 uppercase tracking-tight">
                    <ShieldAlert size={16} />
                    Inconsistências de Registro
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-white dark:bg-gray-950">
                  <div className="space-y-4">
                    {child.inconsistencies.issues.map((issue: string, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <p className="text-pink-600 dark:text-pink-400 font-semibold text-[11px] leading-tight">• {issue}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 italic ml-3">Sugerido: {child.inconsistencies.suggestions[i]}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
