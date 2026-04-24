'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, BookOpen, HeartPulse, ShieldAlert, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
  Label,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import InteractiveMap from '@/components/InteractiveMap';

import { Badge } from '@/components/ui/badge';
import { Eye, TrendingUp, LayoutDashboard, ClipboardCheck, PieChart as PieChartIcon, Map as MapIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SummaryData {
  total: number;
  healthAlerts: number;
  educationAlerts: number;
  socialAlerts: number;
  reviewed: number;
  criticalCases: any[];
  inconsistencyCount: number;
  neighborhoodStats: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [inconsistencies, setInconsistencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenNeighborhoods, setHiddenNeighborhoods] = useState<string[]>([]);
  const [hiddenBarSeries, setHiddenBarSeries] = useState<string[]>([]);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, inconsistencyRes] = await Promise.all([
          api.get('/summary'),
          api.get('/inconsistencies')
        ]);
        setData(summaryRes.data);
        setInconsistencies(inconsistencyRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-800 dark:text-gray-200">Carregando...</div>;

  const alertsData = [
    { name: 'Saúde', alertas: data?.healthAlerts || 0, fill: '#ef4444' }, // red-500
    { name: 'Educação', alertas: data?.educationAlerts || 0, fill: '#f97316' }, // orange-500
    { name: 'Social', alertas: data?.socialAlerts || 0, fill: '#a855f7' }, // purple-500
  ];

  const radarData = [
    { subject: 'Saúde', key: 'health' },
    { subject: 'Educação', key: 'education' },
    { subject: 'Social', key: 'social' },
  ].map(item => {
    const row: any = { subject: item.subject };
    data?.neighborhoodStats?.forEach(stat => {
      row[stat.neighborhood] = stat[item.key];
    });
    return row;
  });

  const neighborhoods = data?.neighborhoodStats?.map(s => s.neighborhood) || [];
  const neighborhoodColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#0891b2'];

  const unreviewed = (data?.total || 0) - (data?.reviewed || 0);
  const reviewData = [
    { name: 'Revisados', value: data?.reviewed || 0, color: '#22c55e' }, // green-500
    { name: 'Pendentes', value: unreviewed > 0 ? unreviewed : 0, color: '#eab308' }, // yellow-500
  ];


  const handleNeighborhoodLegendClick = (o: any) => {
    const { value } = o;
    setHiddenNeighborhoods(prev => 
      prev.includes(value) ? prev.filter(n => n !== value) : [...prev, value]
    );
  };

  const handleBarLegendClick = (o: any) => {
    const { dataKey } = o;
    setHiddenBarSeries(prev => 
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Painel de Monitoramento</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dados consolidados e gestão de casos prioritários</p>
          </div>
          <Link href="/children" passHref className="w-full sm:w-auto">
            <Button 
              variant="outline"
              className="w-full sm:w-auto bg-white dark:bg-gray-950 border-2 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white font-medium h-12 px-6 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
              aria-label="Navegar para a base de alunos"
            >
              <Users size={20} />
              Base de Alunos
            </Button>
          </Link>
        </header>

        <section aria-label="Métricas principais" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Link href="/children" className="block transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Card className="bg-white dark:bg-gray-950 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase">Crianças</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.total || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/children?revisado=true" className="block transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-green-500 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase">Revisados</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data?.reviewed || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/children?area=saude" className="block transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-red-500 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase">Saúde</CardTitle>
                <HeartPulse className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data?.healthAlerts || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/children?area=educacao" className="block transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-orange-500 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase">Educação</CardTitle>
                <BookOpen className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{data?.educationAlerts || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/children?area=social" className="block transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-purple-500 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase">Social</CardTitle>
                <ShieldAlert className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{data?.socialAlerts || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/children?temInconsistencia=true" className="block transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-pink-500 shadow-md h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase">Inconsistências</CardTitle>
                <ShieldAlert className="h-4 w-4 text-pink-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600">{data?.inconsistencyCount || 0}</div>
              </CardContent>
            </Card>
          </Link>
        </section>

        <Tabs defaultValue="priority" className="w-full">
          <TabsList className="flex md:grid w-full md:grid-cols-3 mb-8 h-auto md:h-12 bg-gray-100/50 dark:bg-gray-800/50 p-1 overflow-x-auto whitespace-nowrap md:overflow-visible">
            <TabsTrigger value="priority" className="flex-1 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm px-4 py-2">
              <ClipboardCheck className="w-4 h-4" /> <span className="hidden sm:inline">Gestão de Casos e Alertas</span><span className="sm:hidden">Casos</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm px-4 py-2">
              <PieChartIcon className="w-4 h-4" /> <span className="hidden sm:inline">Panorama e Estatísticas</span><span className="sm:hidden">Análise</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm px-4 py-2">
              <MapIcon className="w-4 h-4" /> <span className="hidden sm:inline">Distribuição Geográfica</span><span className="sm:hidden">Mapa</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="priority" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="flex flex-col shadow-sm border-gray-200 dark:border-gray-800 h-[500px]">
                <CardHeader className="bg-gray-50/50 dark:bg-gray-900/20 rounded-t-lg shrink-0">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Quadro de Prioridades (Críticos)
                  </CardTitle>
                  <CardDescription>Crianças com maior acúmulo de alertas</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10">
                          <th className="p-4 font-bold text-gray-400 uppercase text-[10px]">Criança</th>
                          <th className="p-4 font-bold text-gray-400 uppercase text-[10px] text-center">Nº Alertas</th>
                          <th className="p-4 font-bold text-gray-400 uppercase text-[10px] text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.criticalCases?.map((child: any) => (
                          <tr key={child.id} className="border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-gray-800 dark:text-gray-200">{child.nome}</p>
                              <p className="text-[10px] text-gray-500">{child.bairro}</p>
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant="destructive" className="rounded-full w-7 h-7 p-0 flex items-center justify-center mx-auto font-bold text-sm">{child.totalAlertas}</Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Link href={`/children/${child.originalId}`} passHref>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-9 rounded-full border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white font-medium px-4 transition-all"
                                >
                                  Ver Caso
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y dark:divide-gray-800">
                    {data?.criticalCases?.map((child: any) => (
                      <div key={child.id} className="p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{child.nome}</p>
                            <p className="text-xs text-gray-500">{child.bairro}</p>
                          </div>
                          <Badge variant="destructive" className="rounded-full w-8 h-8 p-0 flex items-center justify-center font-bold">{child.totalAlertas}</Badge>
                        </div>
                        <Link href={`/children/${child.originalId}`} passHref className="block">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-11 rounded-xl border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white font-medium transition-all shadow-sm"
                          >
                            Visualizar Detalhes
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {(!data?.criticalCases || data.criticalCases.length === 0) && (
                      <div className="p-8 text-center text-gray-500">Nenhum caso crítico identificado.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col shadow-sm border-pink-100 dark:border-pink-950 h-[500px]">
                <CardHeader className="bg-pink-50/30 dark:bg-pink-950/10 rounded-t-lg shrink-0">
                  <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400 text-lg">
                    <ShieldAlert className="w-5 h-5" />
                    Inconsistências de Registro
                  </CardTitle>
                  <CardDescription>Dados faltantes que necessitam de atenção técnica</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-100 dark:scrollbar-thumb-pink-900">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10">
                          <th className="p-4 font-bold text-gray-400 uppercase text-[10px]">Criança</th>
                          <th className="p-4 font-bold text-gray-400 uppercase text-[10px]">Divergência e Sugestão</th>
                          <th className="p-4 font-bold text-gray-400 uppercase text-[10px] text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inconsistencies.map((child: any) => (
                          <tr key={child.id} className="border-b dark:border-gray-800 last:border-0 hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-gray-800 dark:text-gray-200">{child.nome}</p>
                              <p className="text-[10px] text-gray-500">{child.bairro}</p>
                            </td>
                            <td className="p-4">
                              <div className="space-y-2">
                                {child.issues.map((issue: string, i: number) => (
                                  <div key={i} className="flex flex-col gap-0.5">
                                    <span className="text-pink-600 dark:text-pink-400 font-semibold text-[11px] block">• {issue}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 italic ml-2">Sugerido: {child.suggestions[i]}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Link href={`/children/${child.originalId}`} passHref>
                                <Button variant="outline" size="sm" className="h-8 border-pink-200 text-pink-700 hover:bg-pink-100 dark:border-pink-900 dark:text-pink-400">Resolver</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y dark:divide-gray-800">
                    {inconsistencies.map((child: any) => (
                      <div key={child.id} className="p-4 space-y-4 hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-colors">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{child.nome}</p>
                          <p className="text-xs text-gray-500 mb-2">{child.bairro}</p>
                          <div className="space-y-2 bg-pink-50/50 dark:bg-pink-900/10 p-3 rounded-lg">
                            {child.issues.map((issue: string, i: number) => (
                              <div key={i} className="flex flex-col gap-1 border-b last:border-0 border-pink-100/50 dark:border-pink-800/30 pb-2 last:pb-0">
                                <span className="text-pink-700 dark:text-pink-300 font-bold text-[11px]">• {issue}</span>
                                <span className="text-[10px] text-pink-500 dark:text-pink-400 italic">Sugerido: {child.suggestions[i]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Link href={`/children/${child.originalId}`} passHref className="block">
                          <Button variant="outline" size="sm" className="w-full h-10 border-pink-200 text-pink-700 hover:bg-pink-50">Resolver Inconsistência</Button>
                        </Link>
                      </div>
                    ))}
                    {inconsistencies.length === 0 && (
                      <div className="p-8 text-center text-gray-500">Tudo em ordem com os cadastros.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="flex flex-col shadow-sm">
                <CardHeader>
                  <CardTitle>Adesão e Revisão</CardTitle>
                  <CardDescription>Crianças revisadas vs pendentes</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[350px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reviewData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reviewData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <Label 
                          value={`${Math.round(((data?.reviewed || 0) / (data?.total || 1)) * 100)}%`} 
                          position="center" 
                          className="text-3xl font-bold fill-gray-800 dark:fill-gray-100" 
                        />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="flex flex-col shadow-sm">
                <CardHeader>
                  <CardTitle>Distribuição de Alertas por Área</CardTitle>
                  <CardDescription>Comparativo setorial por bairro (Radar)</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
                      {neighborhoods.map((n, i) => (
                        <Radar
                          key={n}
                          name={n}
                          dataKey={n}
                          hide={hiddenNeighborhoods.includes(n)}
                          stroke={neighborhoodColors[i % neighborhoodColors.length]}
                          fill={neighborhoodColors[i % neighborhoodColors.length]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Tooltip />
                      <Legend onClick={handleNeighborhoodLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="flex flex-col shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle>Volume de Casos e Alertas por Bairro</CardTitle>
                  <CardDescription>Total vs Alertas e Inconsistências (Barras Empilhadas)</CardDescription>
                </CardHeader>
                <CardContent className="h-[450px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={data?.neighborhoodStats || []} 
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.3} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <YAxis 
                        dataKey="neighborhood" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        width={100}
                        tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} 
                      />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Legend onClick={handleBarLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                      <Bar hide={hiddenBarSeries.includes('totalChildren')} dataKey="totalChildren" name="Total de Crianças" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                      <Bar hide={hiddenBarSeries.includes('alerts')} dataKey="alerts" name="Com Alertas" stackId="status" fill="#ef4444" />
                      <Bar hide={hiddenBarSeries.includes('inconsistencies')} dataKey="inconsistencies" name="Com Inconsistências" stackId="status" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="outline-none">
            <Card className="dark:bg-gray-950 dark:border-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50/50 dark:bg-gray-900/20 border-b dark:border-gray-800">
                <CardTitle className="dark:text-gray-100">Mapa Georreferenciado</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Localização das ocorrências por bairro e intensidade de alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[650px]">
                <InteractiveMap />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
