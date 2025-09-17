const { PrismaClient } = require('../generated/prisma');
const buyersService = require('../buyers/buyers.service');
const userService = require('../user/user.service');

const prisma = new PrismaClient();

describe('Concurrency Tests', () => {
  let testUser;
  let testBuyer;

  beforeAll(async () => {
    testUser = await userService.createUser('concurrency@test.com', 'Concurrency User');
    
    testBuyer = await buyersService.createBuyer({
      fullName: 'Concurrency Test',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: 'TWO',
      purpose: 'Buy',
      timeline: 'ZERO_TO_THREE_MONTHS',
      source: 'Website'
    }, testUser.id);
  });

  afterAll(async () => {
    if (testBuyer) {
      await prisma.buyerHistory.deleteMany({ where: { buyerId: testBuyer.id } });
      await prisma.buyer.delete({ where: { id: testBuyer.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
  });

  test('Concurrent update with stale timestamp fails', async () => {
    // Get current buyer
    const currentBuyer = await buyersService.getBuyerById(testBuyer.id, testUser.id);
    
    // Simulate another user updating the buyer
    await buyersService.updateBuyer(testBuyer.id, {
      status: 'Qualified',
      notes: 'Updated by user 1'
    }, testUser.id);

    // Try to update with stale timestamp
    await expect(
      buyersService.updateBuyer(testBuyer.id, {
        status: 'Contacted',
        notes: 'Updated by user 2',
        updatedAt: currentBuyer.updatedAt.toISOString()
      }, testUser.id)
    ).rejects.toThrow('Record has been modified by another user');
  });

  test('CSV import transaction rollback on error', async () => {
    const csvData = [
      {
        fullName: 'Valid User 1',
        phone: '9876543211',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        purpose: 'Buy',
        timeline: 'ZERO_TO_THREE_MONTHS',
        source: 'Website'
      },
      {
        fullName: 'Invalid User',
        phone: '123', // Invalid phone
        city: 'Chandigarh',
        propertyType: 'Apartment',
        purpose: 'Buy',
        timeline: 'ZERO_TO_THREE_MONTHS',
        source: 'Website'
      }
    ];

    // Mock CSV validation to return mixed results
    const { validateCSVData } = require('../utils/csvHandler');
    const result = await validateCSVData(csvData);
    
    expect(result.validData).toHaveLength(1);
    expect(result.errors).toHaveLength(1);

    // Import should only create valid records
    const importResult = await buyersService.importCSV(
      Buffer.from('fullName,phone,city,propertyType,purpose,timeline,source\nValid User 1,9876543211,Chandigarh,Apartment,Buy,ZERO_TO_THREE_MONTHS,Website\nInvalid User,123,Chandigarh,Apartment,Buy,ZERO_TO_THREE_MONTHS,Website'),
      testUser.id
    );

    expect(importResult.imported).toBe(1);
    expect(importResult.errors).toHaveLength(1);

    // Cleanup
    await prisma.buyerHistory.deleteMany({ where: { buyerId: importResult.data[0].id } });
    await prisma.buyer.delete({ where: { id: importResult.data[0].id } });
  });

  test('History tracking with multiple updates', async () => {
    // Make multiple updates
    await buyersService.updateBuyer(testBuyer.id, { status: 'Qualified' }, testUser.id);
    await buyersService.updateBuyer(testBuyer.id, { status: 'Contacted' }, testUser.id);
    await buyersService.updateBuyer(testBuyer.id, { status: 'Visited' }, testUser.id);

    const history = await buyersService.getBuyerHistory(testBuyer.id, testUser.id);
    
    // Should have create + 4 updates (including the one from concurrency test)
    expect(history.length).toBeGreaterThanOrEqual(4);
    
    // Check history order (most recent first)
    expect(history[0].diff.status.to).toBe('Visited');
    expect(history[1].diff.status.to).toBe('Contacted');
  });
});