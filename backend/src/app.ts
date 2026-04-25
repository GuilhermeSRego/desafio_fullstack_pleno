import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// Middleware de Autenticação
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    (req as any).user = user;
    next();
  });
};

// Helper to find data inconsistencies
const getInconsistenciesForChild = (c: any) => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Educação
  if (!c.educacao || !c.educacao.escola || c.educacao.escola === "Não informado") {
    if (!(c.educacao?.alertas || []).includes('matricula_pendente')) {
      issues.push("Escola não informada e sem alerta de matrícula");
      suggestions.push("Adicionar alerta 'matricula_pendente'");
    }
  }
  if (c.educacao && c.educacao.frequencia_percent !== null && c.educacao.frequencia_percent < 75 && !c.educacao.alertas.includes('frequencia_baixa')) {
    issues.push("Frequência abaixo de 75% sem alerta correspondente");
    suggestions.push("Adicionar alerta 'frequencia_baixa'");
  }

  // Saúde
  if (c.saude) {
    if (c.saude.ultima_consulta && new Date(c.saude.ultima_consulta) < sixMonthsAgo && !c.saude.alertas.includes('consulta_atrasada')) {
      issues.push("Consulta muito antiga (>6 meses) sem alerta");
      suggestions.push("Adicionar alerta 'consulta_atrasada'");
    }
    if (c.saude.vacinas_em_dia === false && !c.saude.alertas.includes('vacinas_atrasadas')) {
      issues.push("Vacinas em atraso sem alerta correspondente");
      suggestions.push("Adicionar alerta 'vacinas_atrasadas'");
    }
  } else {
    issues.push("Dados de saúde totalmente ausentes");
    suggestions.push("Realizar busca ativa para dados de saúde");
  }

  // Social
  if (c.assistencia_social) {
    if (c.assistencia_social.beneficio_ativo === false && !c.assistencia_social.alertas.includes('beneficio_suspenso')) {
      issues.push("Benefício suspenso sem alerta de acompanhamento");
      suggestions.push("Adicionar alerta 'beneficio_suspenso'");
    }
    if (c.assistencia_social.cad_unico === false && !c.assistencia_social.alertas.includes('cadastro_desatualizado')) {
      issues.push("CadÚnico desatualizado/ausente sem alerta");
      suggestions.push("Adicionar alerta 'cadastro_desatualizado'");
    }
  } else {
    issues.push("Dados de assistência social ausentes");
    suggestions.push("Verificar situação no CadÚnico");
  }

  // Cadastro Básico
  if (!c.bairro || !c.responsavel || !c.data_nascimento) {
    issues.push("Dados cadastrais básicos incompletos");
    suggestions.push("Atualizar ficha cadastral da criança");
  }

  return issues.length > 0 ? { issues, suggestions } : null;
};

// POST /auth/token
app.post('/auth/token', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ preferred_username: email }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /summary
app.get('/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const total = await prisma.child.count();
    
    const healthAlerts = await prisma.healthData.count({
      where: { alertas: { isEmpty: false } }
    });
    const educationAlerts = await prisma.educationData.count({
      where: { alertas: { isEmpty: false } }
    });
    const socialAlerts = await prisma.socialData.count({
      where: { alertas: { isEmpty: false } }
    });

    const reviewed = await prisma.child.count({
      where: { revisado: true }
    });

    const allChildren = await prisma.child.findMany({
      include: {
        saude: true,
        educacao: true,
        assistencia_social: true
      }
    });

    const criticalCases = allChildren
      .map(c => ({
        ...c,
        totalAlertas: (c.saude?.alertas?.length || 0) + (c.educacao?.alertas?.length || 0) + (c.assistencia_social?.alertas?.length || 0)
      }))
      .filter(c => c.totalAlertas >= 3)
      .sort((a, b) => b.totalAlertas - a.totalAlertas)
      .slice(0, 5);

    // Inconsistencies analysis
    const inconsistencies = allChildren.filter(c => getInconsistenciesForChild(c));

    // Neighborhood stats for Radar and Stacked Charts
    const neighborhoodStatsMap: Record<string, { 
      neighborhood: string, 
      alerts: number, 
      inconsistencies: number,
      health: number,
      education: number,
      social: number,
      totalChildren: number
    }> = {};
    allChildren.forEach(c => {
      const bairro = c.bairro || 'Não informado';
      if (!neighborhoodStatsMap[bairro]) {
        neighborhoodStatsMap[bairro] = { 
          neighborhood: bairro, 
          alerts: 0, 
          inconsistencies: 0,
          health: 0,
          education: 0,
          social: 0,
          totalChildren: 0
        };
      }
      
      neighborhoodStatsMap[bairro].totalChildren++;
      
      const h = c.saude?.alertas?.length || 0;
      const e = c.educacao?.alertas?.length || 0;
      const s = c.assistencia_social?.alertas?.length || 0;

      if (h > 0) neighborhoodStatsMap[bairro].health++;
      if (e > 0) neighborhoodStatsMap[bairro].education++;
      if (s > 0) neighborhoodStatsMap[bairro].social++;
      
      if (h > 0 || e > 0 || s > 0) neighborhoodStatsMap[bairro].alerts++;
      
      if (getInconsistenciesForChild(c)) neighborhoodStatsMap[bairro].inconsistencies++;
    });

    res.json({
      total,
      healthAlerts,
      educationAlerts,
      socialAlerts,
      reviewed,
      criticalCases,
      inconsistencyCount: inconsistencies.length,
      neighborhoodStats: Object.values(neighborhoodStatsMap),
      schools: Array.from(new Set(allChildren.map(c => c.educacao?.escola).filter(s => s && s !== 'Não informado'))).sort()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /inconsistencies
app.get('/inconsistencies', authenticateToken, async (req: Request, res: Response) => {
  try {
    const allChildren = await prisma.child.findMany({
      include: { saude: true, educacao: true, assistencia_social: true }
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const data = allChildren.map(c => {
      const inconsistency = getInconsistenciesForChild(c);
      if (!inconsistency) return null;

      return { 
        id: c.id, 
        originalId: c.originalId, 
        nome: c.nome, 
        bairro: c.bairro, 
        issues: inconsistency.issues, 
        suggestions: inconsistency.suggestions 
      };
    }).filter(Boolean);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /children
app.get('/children', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      bairro, 
      nome,
      temAlertas, 
      revisado, 
      sortBy, 
      order = 'asc',
      alertas,
      escolas,
      temInconsistencia, // Novo filtro para inconsistências
      area // Novo filtro por área (saude, educacao, social)
    } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (bairro) {
      where.bairro = { contains: bairro as string, mode: 'insensitive' };
    }
    if (nome) {
      where.nome = { contains: nome as string, mode: 'insensitive' };
    }
    if (area === 'saude') {
      where.saude = { alertas: { isEmpty: false } };
    } else if (area === 'educacao') {
      where.educacao = { alertas: { isEmpty: false } };
    } else if (area === 'social') {
      where.assistencia_social = { alertas: { isEmpty: false } };
    }
    if (escolas) {
      const escolasArray = Array.isArray(escolas) ? escolas : (escolas as string).split(',');
      where.educacao = {
        escola: { in: escolasArray as string[], mode: 'insensitive' }
      };
    }
    if (revisado !== undefined && revisado !== '' && revisado !== 'all') {
      where.revisado = revisado === 'true';
    }
    
    // Alertas logic
    const alertFilters: any[] = [];
    if (temAlertas === 'true') {
      alertFilters.push(
        { saude: { alertas: { isEmpty: false } } },
        { educacao: { alertas: { isEmpty: false } } },
        { assistencia_social: { alertas: { isEmpty: false } } }
      );
      where.OR = alertFilters;
    } else if (temAlertas === 'false') {
      where.AND = [
        { saude: { alertas: { isEmpty: true } } },
        { educacao: { alertas: { isEmpty: true } } },
        { assistencia_social: { alertas: { isEmpty: true } } }
      ];
    }

    // Specific alert types filter (multi-select)
    if (alertas) {
      const selectedAlerts = Array.isArray(alertas) ? alertas : (alertas as string).split(',');
      const alertTypeFilters = selectedAlerts.map(alert => ({
        OR: [
          { saude: { alertas: { has: alert } } },
          { educacao: { alertas: { has: alert } } },
          { assistencia_social: { alertas: { has: alert } } }
        ]
      }));
      if (where.AND) {
        where.AND.push(...alertTypeFilters);
      } else {
        where.AND = alertTypeFilters;
      }
    }

    let orderBy: any = { nome: 'asc' };
    if (sortBy === 'bairro') {
      orderBy = { bairro: order };
    } else if (sortBy === 'idade') {
      orderBy = { data_nascimento: order === 'asc' ? 'desc' : 'asc' };
    } else if (sortBy === 'nome') {
      orderBy = { nome: order };
    }

    let data = await prisma.child.findMany({
      where,
      skip: (sortBy === 'alertas' || temInconsistencia === 'true') ? undefined : skip,
      take: (sortBy === 'alertas' || temInconsistencia === 'true') ? undefined : limitNumber,
      include: {
        saude: true,
        educacao: true,
        assistencia_social: true
      },
      orderBy
    });

    let total = await prisma.child.count({ where });

    if (temInconsistencia === 'true') {
      data = data.filter(c => !!getInconsistenciesForChild(c));
      total = data.length;
      // Paginação manual para inconsistências se necessário
      if (sortBy !== 'alertas') {
        data = data.slice(skip, skip + limitNumber);
      }
    }

    if (sortBy === 'alertas') {
      data = data.sort((a, b) => {
        const alertsA = (a.saude?.alertas?.length || 0) + (a.educacao?.alertas?.length || 0) + (a.assistencia_social?.alertas?.length || 0);
        const alertsB = (b.saude?.alertas?.length || 0) + (b.educacao?.alertas?.length || 0) + (b.assistencia_social?.alertas?.length || 0);
        return order === 'asc' ? alertsA - alertsB : alertsB - alertsA;
      }).slice(skip, skip + limitNumber);
    }

    res.json({
      data: data.map(c => ({
        ...c,
        inconsistencies: getInconsistenciesForChild(c)
      })),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /children/:id
app.get('/children/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const child = await prisma.child.findUnique({
      where: { originalId: req.params.id as string },
      include: {
        saude: true,
        educacao: true,
        assistencia_social: true,
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!child) return res.status(404).json({ error: 'Child not found' });
    res.json({
      ...child,
      inconsistencies: getInconsistenciesForChild(child)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper to recalculate alerts
const calculateAlerts = (childData: any) => {
  const saudeAlerts = [];
  if (childData.saude.vacinas_em_dia === false) saudeAlerts.push('vacinas_atrasadas');
  
  if (!childData.saude.ultima_consulta) {
    saudeAlerts.push('cadastro_ausente');
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (new Date(childData.saude.ultima_consulta) < sixMonthsAgo) saudeAlerts.push('consulta_atrasada');
  }

  const educAlerts = [];
  if (!childData.educacao.escola || childData.educacao.escola === "Não informado") {
    educAlerts.push('matricula_pendente');
  }
  if (childData.educacao.frequencia_percent !== null && childData.educacao.frequencia_percent !== undefined && childData.educacao.frequencia_percent < 75) {
    educAlerts.push('frequencia_baixa');
  }

  const socialAlerts = [];
  if (childData.assistencia_social.beneficio_ativo === false) socialAlerts.push('beneficio_suspenso');
  if (childData.assistencia_social.cad_unico === false) socialAlerts.push('cadastro_desatualizado');

  return { saudeAlerts, educAlerts, socialAlerts };
};

// PATCH /children/:id/review
app.patch('/children/:id/review', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const username = (req as any).user.preferred_username;
    const { 
      anotacao, 
      frequencia_nova, 
      vacinas_em_dia, 
      cad_unico, 
      beneficio_ativo,
      nome,
      data_nascimento,
      bairro,
      responsavel,
      escola,
      ultima_consulta
    } = req.body;
    
    const child = await prisma.child.findUnique({
      where: { originalId: req.params.id as string },
      include: { saude: true, educacao: true, assistencia_social: true }
    });

    if (!child) return res.status(404).json({ error: 'Child not found' });

    // New data for recalculation
    const newData = {
      saude: {
        vacinas_em_dia: vacinas_em_dia !== undefined ? vacinas_em_dia : child.saude?.vacinas_em_dia,
        ultima_consulta: ultima_consulta === '' ? null : (ultima_consulta || child.saude?.ultima_consulta)
      },
      educacao: {
        frequencia_percent: frequencia_nova === '' ? null : (frequencia_nova !== undefined ? parseFloat(frequencia_nova) : child.educacao?.frequencia_percent),
        escola: escola === '' ? null : (escola !== undefined ? escola : child.educacao?.escola)
      },
      assistencia_social: {
        cad_unico: cad_unico !== undefined ? cad_unico : child.assistencia_social?.cad_unico,
        beneficio_ativo: beneficio_ativo !== undefined ? beneficio_ativo : child.assistencia_social?.beneficio_ativo
      }
    };

    const { saudeAlerts, educAlerts, socialAlerts } = calculateAlerts(newData);

    // Snapshot anterior para histórico
    const snapshotAnterior = {
      frequencia: child.educacao?.frequencia_percent,
      alertasSaude: child.saude?.alertas?.length || 0,
      alertasEduc: child.educacao?.alertas?.length || 0,
      alertasSocial: child.assistencia_social?.alertas?.length || 0,
    };

    // Atualiza dados da criança e relações em uma transação
    await prisma.$transaction([
      prisma.child.update({
        where: { originalId: req.params.id as string },
        data: {
          nome: nome || child.nome,
          data_nascimento: data_nascimento ? new Date(data_nascimento) : child.data_nascimento,
          bairro: bairro || child.bairro,
          responsavel: responsavel || child.responsavel,
          revisado: true,
          revisado_por: username,
          revisado_em: new Date(),
          saude: {
            upsert: {
              create: {
                vacinas_em_dia: newData.saude.vacinas_em_dia ?? false,
                ultima_consulta: newData.saude.ultima_consulta ? new Date(newData.saude.ultima_consulta) : null,
                alertas: saudeAlerts
              },
              update: {
                vacinas_em_dia: newData.saude.vacinas_em_dia,
                ultima_consulta: newData.saude.ultima_consulta ? new Date(newData.saude.ultima_consulta) : null,
                alertas: saudeAlerts
              }
            }
          },
          educacao: {
            upsert: {
              create: {
                frequencia_percent: newData.educacao.frequencia_percent,
                escola: newData.educacao.escola,
                alertas: educAlerts
              },
              update: {
                frequencia_percent: newData.educacao.frequencia_percent,
                escola: newData.educacao.escola,
                alertas: educAlerts
              }
            }
          },
          assistencia_social: {
            upsert: {
              create: {
                cad_unico: newData.assistencia_social.cad_unico ?? false,
                beneficio_ativo: newData.assistencia_social.beneficio_ativo ?? false,
                alertas: socialAlerts
              },
              update: {
                cad_unico: newData.assistencia_social.cad_unico,
                beneficio_ativo: newData.assistencia_social.beneficio_ativo,
                alertas: socialAlerts
              }
            }
          }
        }
      }),
      prisma.reviewHistory.create({
        data: {
          childId: child.id,
          anotacao: anotacao || "Atualização de cadastro e acompanhamento",
          revisado_por: username,
          frequencia_anterior: snapshotAnterior.frequencia,
          frequencia_nova: newData.educacao.frequencia_percent,
          num_alertas_saude_anterior: snapshotAnterior.alertasSaude,
          num_alertas_saude_novo: saudeAlerts.length,
          num_alertas_educ_anterior: snapshotAnterior.alertasEduc,
          num_alertas_educ_novo: educAlerts.length,
          num_alertas_social_anterior: snapshotAnterior.alertasSocial,
          num_alertas_social_novo: socialAlerts.length
        }
      })
    ]);

    const updatedChild = await prisma.child.findUnique({
      where: { originalId: req.params.id as string },
      include: { saude: true, educacao: true, assistencia_social: true, reviews: { orderBy: { createdAt: 'desc' } } }
    });

    res.json({
      ...updatedChild,
      inconsistencies: getInconsistenciesForChild(updatedChild)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;
