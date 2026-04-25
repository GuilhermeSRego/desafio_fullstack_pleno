import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    child: { 
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    }
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Children Controller', () => {
  let prisma: any;
  let token: string;

  beforeAll(() => {
    prisma = new PrismaClient();
    token = jwt.sign({ preferred_username: 'tecnico@prefeitura.rio' }, JWT_SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /children', () => {
    it('deve listar crianças com paginação padrão', async () => {
      prisma.child.findMany.mockResolvedValue([
        { id: 1, nome: 'Criança 1', bairro: 'Centro' },
        { id: 2, nome: 'Criança 2', bairro: 'Bangu' }
      ]);
      prisma.child.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/children')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
      expect(prisma.child.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10
      }));
    });

    it('deve aplicar filtro por bairro corretamente', async () => {
      prisma.child.findMany.mockResolvedValue([{ id: 1, nome: 'Criança 1', bairro: 'Centro' }]);
      prisma.child.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/children?bairro=Centro')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prisma.child.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          bairro: { contains: 'Centro', mode: 'insensitive' }
        })
      }));
    });

    it('deve filtrar crianças com inconsistências', async () => {
      // Mock de uma criança COM inconsistência (sem escola)
      prisma.child.findMany.mockResolvedValue([
        { 
          id: 1, 
          nome: 'Criança Inconsistente', 
          bairro: 'Centro',
          educacao: { escola: 'Não informado', alertas: [] },
          saude: { alertas: [] },
          assistencia_social: { alertas: [] }
        },
        { 
          id: 2, 
          nome: 'Criança OK', 
          bairro: 'Centro',
          responsavel: 'Responsavel Teste',
          data_nascimento: '2015-01-01',
          educacao: { escola: 'Escola A', alertas: [] },
          saude: { alertas: [], status: 'estável', vacinas_em_dia: true, ultima_consulta: new Date().toISOString() },
          assistencia_social: { alertas: [], cad_unico: true, beneficio_ativo: true }
        }
      ]);

      const res = await request(app)
        .get('/children?temInconsistencia=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // O filtro de inconsistência no código é feito via .filter() após o findMany
      // Então esperamos apenas 1 resultado (a criança 1)
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nome).toBe('Criança Inconsistente');
      expect(res.body.data[0].inconsistencies).not.toBeNull();
    });
  });

  describe('GET /children/:id', () => {
    it('deve retornar 404 para criança inexistente', async () => {
      prisma.child.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/children/nao-existe')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Child not found');
    });

    it('deve retornar os detalhes completos da criança', async () => {
      prisma.child.findUnique.mockResolvedValue({
        id: 1,
        originalId: 'child-1',
        nome: 'Ana Silva',
        saude: { alertas: [] },
        educacao: { alertas: [] },
        assistencia_social: { alertas: [] }
      });

      const res = await request(app)
        .get('/children/child-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Ana Silva');
    });
  });
});
