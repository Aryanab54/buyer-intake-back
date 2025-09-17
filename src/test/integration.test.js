const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('../generated/prisma');
const { generateJWT } = require('../utils/authentication');

const prisma = new PrismaClient();

describe('Integration Tests', () => {
  let testUser;
  let authToken;
  let buyerId;

  beforeAll(async () => {
    // Create test user and token
    testUser = await prisma.user.create({
      data: { email: 'integration@test.com', name: 'Integration User' }
    });
    authToken = generateJWT(testUser.id, testUser.email);
  });

  afterAll(async () => {
    // Cleanup
    if (buyerId) {
      await prisma.buyerHistory.deleteMany({ where: { buyerId } });
      await prisma.buyer.deleteMany({ where: { ownerId: testUser.id } });
    }
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  test('Full buyer lifecycle - Create, Read, Update, Delete', async () => {
    // Create buyer
    const createRes = await request(app)
      .post('/api/buyers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Integration Test User',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: 'TWO',
        purpose: 'Buy',
        timeline: 'ZERO_TO_THREE_MONTHS',
        source: 'Website'
      });

    expect(createRes.statusCode).toBe(201);
    buyerId = createRes.body.data.id;

    // Read buyer
    const readRes = await request(app)
      .get(`/api/buyers/${buyerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(readRes.statusCode).toBe(200);
    expect(readRes.body.data.fullName).toBe('Integration Test User');

    // Update buyer
    const updateRes = await request(app)
      .put(`/api/buyers/${buyerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Qualified', notes: 'Updated in integration test' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.status).toBe('Qualified');

    // Get history
    const historyRes = await request(app)
      .get(`/api/buyers/${buyerId}/history`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(historyRes.statusCode).toBe(200);
    expect(historyRes.body.data).toHaveLength(2); // Create + Update

    // Delete buyer
    const deleteRes = await request(app)
      .delete(`/api/buyers/${buyerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.statusCode).toBe(200);
    buyerId = null; // Prevent cleanup
  });

  test('CSV import with validation errors', async () => {
    const csvData = `fullName,phone,city,propertyType,purpose,timeline,source
John Valid,9876543210,Chandigarh,Apartment,Buy,ZERO_TO_THREE_MONTHS,Website
Invalid,123,InvalidCity,InvalidType,InvalidPurpose,InvalidTimeline,InvalidSource`;

    const importRes = await request(app)
      .post('/api/buyers/import')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from(csvData), 'test.csv');

    expect(importRes.statusCode).toBe(200);
    expect(importRes.body.imported).toBe(1);
    expect(importRes.body.errors).toHaveLength(1);

    // Cleanup imported buyer
    await prisma.buyerHistory.deleteMany({ where: { buyerId: importRes.body.data[0].id } });
    await prisma.buyer.delete({ where: { id: importRes.body.data[0].id } });
  });

  test('CSV export with filters', async () => {
    // Create test buyer
    const buyer = await prisma.buyer.create({
      data: {
        fullName: 'Export Test',
        phone: '9876543210',
        city: 'Mohali',
        propertyType: 'Villa',
        purpose: 'Rent',
        timeline: 'THREE_TO_SIX_MONTHS',
        source: 'Referral',
        status: 'NEW',
        ownerId: testUser.id,
        tags: ['export', 'test']
      }
    });

    const exportRes = await request(app)
      .get('/api/buyers/export/csv?city=Mohali')
      .set('Authorization', `Bearer ${authToken}`);

    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.text).toContain('Export Test');
    expect(exportRes.text).toContain('Mohali');

    // Cleanup
    await prisma.buyer.delete({ where: { id: buyer.id } });
  });

  test('Pagination and filtering', async () => {
    // Create multiple buyers
    const buyers = await Promise.all([
      prisma.buyer.create({
        data: {
          fullName: 'Page Test 1',
          phone: '9876543211',
          city: 'Chandigarh',
          propertyType: 'Apartment',
          purpose: 'Buy',
          timeline: 'ZERO_TO_THREE_MONTHS',
          source: 'Website',
          ownerId: testUser.id
        }
      }),
      prisma.buyer.create({
        data: {
          fullName: 'Page Test 2',
          phone: '9876543212',
          city: 'Mohali',
          propertyType: 'Villa',
          purpose: 'Rent',
          timeline: 'THREE_TO_SIX_MONTHS',
          source: 'Referral',
          ownerId: testUser.id
        }
      })
    ]);

    // Test pagination
    const pageRes = await request(app)
      .get('/api/buyers?page=1&limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(pageRes.statusCode).toBe(200);
    expect(pageRes.body.data).toHaveLength(1);
    expect(pageRes.body.pagination.totalPages).toBeGreaterThan(1);

    // Test filtering
    const filterRes = await request(app)
      .get('/api/buyers?city=Chandigarh&search=Page')
      .set('Authorization', `Bearer ${authToken}`);

    expect(filterRes.statusCode).toBe(200);
    expect(filterRes.body.data).toHaveLength(1);
    expect(filterRes.body.data[0].city).toBe('Chandigarh');

    // Cleanup
    await prisma.buyer.deleteMany({ where: { id: { in: buyers.map(b => b.id) } } });
  });
});