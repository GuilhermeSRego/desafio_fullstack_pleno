import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    child: { count: jest.fn() },
    healthData: { count: jest.fn() },
    educationData: { count: jest.fn() },
    socialData: { count: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('GET /summary', () => {
  let prisma: any;
  let token: string;

  beforeAll(() => {
    prisma = new PrismaClient();
    token = jwt.sign({ preferred_username: 'test@test.com' }, process.env.JWT_SECRET || 'secret');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 se não houver token', async () => {
    const res = await request(app).get('/summary');
    expect(res.status).toBe(401);
  });

  it('deve retornar dados agregados corretamente', async () => {
    // Mock return values
    prisma.child.count.mockImplementation((args: any) => {
      if (args && args.where && args.where.revisado) return Promise.resolve(5);
      return Promise.resolve(20); // total
    });
    prisma.healthData.count.mockResolvedValue(10);
    prisma.educationData.count.mockResolvedValue(7);
    prisma.socialData.count.mockResolvedValue(3);

    const res = await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 20,
      healthAlerts: 10,
      educationAlerts: 7,
      socialAlerts: 3,
      reviewed: 5,
    });
  });
});
