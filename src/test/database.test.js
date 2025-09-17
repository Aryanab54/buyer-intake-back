const { PrismaClient } = require('../generated/prisma');
const buyersService = require('../buyers/buyers.service');
const userService = require('../user/user.service');

const prisma = new PrismaClient();

describe('Database Operations', () => {
  let testUser;
  let testBuyer;

  beforeAll(async () => {
    // Create test user
    testUser = await userService.createUser('test@db.com', 'Test User');
  });

  afterAll(async () => {
    // Cleanup
    if (testBuyer) {
      await prisma.buyerHistory.deleteMany({ where: { buyerId: testBuyer.id } });
      await prisma.buyer.delete({ where: { id: testBuyer.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
  });

  test('Create buyer with history tracking', async () => {
    const buyerData = {
      fullName: 'John Database',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: 'TWO',
      purpose: 'Buy',
      timeline: 'ZERO_TO_THREE_MONTHS',
      source: 'Website',
      tags: ['test', 'database']
    };

    testBuyer = await buyersService.createBuyer(buyerData, testUser.id);

    expect(testBuyer.fullName).toBe('John Database');
    expect(testBuyer.ownerId).toBe(testUser.id);

    // Check history was created
    const history = await prisma.buyerHistory.findMany({
      where: { buyerId: testBuyer.id }
    });
    expect(history).toHaveLength(1);
  });

  test('Update buyer with concurrency check', async () => {
    const updateData = {
      status: 'Qualified',
      notes: 'Updated via test',
      updatedAt: testBuyer.updatedAt.toISOString()
    };

    const updated = await buyersService.updateBuyer(testBuyer.id, updateData, testUser.id);
    expect(updated.status).toBe('Qualified');

    // Check history was updated
    const history = await prisma.buyerHistory.findMany({
      where: { buyerId: testBuyer.id }
    });
    expect(history).toHaveLength(2);
  });

  test('Search and filter buyers', async () => {
    const filters = { search: 'John', city: 'Chandigarh' };
    const result = await buyersService.getBuyers(filters, 1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].fullName).toBe('John Database');
  });

  test('Ownership validation', async () => {
    const otherUser = await userService.createUser('other@test.com');
    
    await expect(
      buyersService.updateBuyer(testBuyer.id, { status: 'Contacted' }, otherUser.id)
    ).rejects.toThrow('Not authorized');

    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});