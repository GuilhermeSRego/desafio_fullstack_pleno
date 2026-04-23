import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

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

// POST /auth/token
app.post('/auth/token', (req: Request, res: Response): any => {
  const { email, password } = req.body;
  if (email === 'tecnico@prefeitura.rio' && password === 'painel@2024') {
    const token = jwt.sign({ preferred_username: email }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// GET /summary
app.get('/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const total = await prisma.child.count();
    
    // Contagem de alertas nas três áreas
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

    res.json({
      total,
      healthAlerts,
      educationAlerts,
      socialAlerts,
      reviewed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /children
app.get('/children', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', bairro, temAlertas, revisado } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (bairro) {
      where.bairro = { contains: bairro as string, mode: 'insensitive' };
    }
    if (revisado !== undefined && revisado !== '') {
      where.revisado = revisado === 'true';
    }
    if (temAlertas === 'true') {
      where.OR = [
        { saude: { alertas: { isEmpty: false } } },
        { educacao: { alertas: { isEmpty: false } } },
        { assistencia_social: { alertas: { isEmpty: false } } }
      ];
    } else if (temAlertas === 'false') {
      where.AND = [
        { saude: { alertas: { isEmpty: true } } },
        { educacao: { alertas: { isEmpty: true } } },
        { assistencia_social: { alertas: { isEmpty: true } } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.child.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          saude: true,
          educacao: true,
          assistencia_social: true
        },
        orderBy: { nome: 'asc' }
      }),
      prisma.child.count({ where })
    ]);

    res.json({
      data,
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
        assistencia_social: true
      }
    });

    if (!child) return res.status(404).json({ error: 'Child not found' });
    res.json(child);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /children/:id/review
app.patch('/children/:id/review', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const username = (req as any).user.preferred_username;
    
    const child = await prisma.child.findUnique({
      where: { originalId: req.params.id as string }
    });

    if (!child) return res.status(404).json({ error: 'Child not found' });

    const updated = await prisma.child.update({
      where: { originalId: req.params.id as string },
      data: {
        revisado: true,
        revisado_por: username,
        revisado_em: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
