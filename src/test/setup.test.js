const { PrismaClient } = require('../generated/prisma');
const request = require('supertest');
const app = require('../../app');

const prisma = new PrismaClient();

describe('Environment Setup Tests', () => {
  test('Database connection works', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
    await prisma.$disconnect();
  });

  test('Environment variables are loaded', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.FRONTEND_URL).toBeDefined();
  });

  test('Express app starts correctly', async () => {
    const res = await request(app).get('/api/test');
    // Should return 404 for non-existent route, not crash
    expect([404, 401]).toContain(res.statusCode);
  });

  test('CORS is configured', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:3009');
    
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  test('Error middleware catches errors', async () => {
    const res = await request(app)
      .post('/api/buyers')
      .send({ invalid: 'data' });
    
    // Should return proper error response, not crash
    expect([400, 401]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });
});