import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Mock Prisma para evitar logs de erro no console durante testes do middleware
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: { 
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.email === 'tecnico@prefeitura.rio') {
          // A senha 'painel@2024' hasheada com bcrypt
          return Promise.resolve({
            id: 1,
            email: 'tecnico@prefeitura.rio',
            password: require('bcryptjs').hashSync('painel@2024', 10)
          });
        }
        return Promise.resolve(null);
      })
    },
    child: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    healthData: { count: jest.fn().mockResolvedValue(0) },
    educationData: { count: jest.fn().mockResolvedValue(0) },
    socialData: { count: jest.fn().mockResolvedValue(0) },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Auth Flow', () => {
  describe('POST /auth/token', () => {
    it('deve retornar um token JWT com credenciais válidas', async () => {
      const res = await request(app)
        .post('/auth/token')
        .send({ email: 'tecnico@prefeitura.rio', password: 'painel@2024' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
      expect(decoded.preferred_username).toBe('tecnico@prefeitura.rio');
    });

    it('deve retornar 401 com credenciais inválidas', async () => {
      const res = await request(app)
        .post('/auth/token')
        .send({ email: 'errado@rio.br', password: '123' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('Middleware authenticateToken', () => {
    it('deve retornar 401 se o cabeçalho Authorization estiver ausente', async () => {
      const res = await request(app).get('/summary');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Token missing');
    });

    it('deve retornar 403 para um token malformado ou inválido', async () => {
      const res = await request(app)
        .get('/summary')
        .set('Authorization', 'Bearer token-invalido');
      
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Invalid token');
    });

    it('deve permitir o acesso com um token válido', async () => {
      const token = jwt.sign({ preferred_username: 'test@rio.br' }, JWT_SECRET);
      const res = await request(app)
        .get('/summary')
        .set('Authorization', `Bearer ${token}`);
      
      // Aqui não importa o resultado do summary, apenas que PASSOU pelo middleware (não retornou 401/403)
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });
});
