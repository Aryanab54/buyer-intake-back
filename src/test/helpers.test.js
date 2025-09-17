const { buildWhereClause, calculatePagination, createHistoryEntry, mapBHKToPrisma, mapTimelineToPrisma } = require('../utils/helpers');

describe('Helper Functions', () => {
  test('Build where clause with filters', () => {
    const filters = {
      search: 'john',
      city: 'Chandigarh',
      status: 'NEW'
    };
    
    const where = buildWhereClause(filters);
    
    expect(where.OR).toBeDefined();
    expect(where.city).toBe('Chandigarh');
    expect(where.status).toBe('NEW');
  });

  test('Calculate pagination', () => {
    const pagination = calculatePagination(2, 10, 25);
    
    expect(pagination.page).toBe(2);
    expect(pagination.limit).toBe(10);
    expect(pagination.offset).toBe(10);
    expect(pagination.totalPages).toBe(3);
    expect(pagination.hasNext).toBe(true);
    expect(pagination.hasPrev).toBe(true);
  });

  test('Create history entry', () => {
    const oldData = { status: 'NEW', notes: 'Old notes' };
    const newData = { status: 'Qualified', notes: 'New notes' };
    
    const history = createHistoryEntry('buyer-id', 'user-id', oldData, newData);
    
    expect(history.buyerId).toBe('buyer-id');
    expect(history.changedById).toBe('user-id');
    expect(history.diff.status.from).toBe('NEW');
    expect(history.diff.status.to).toBe('Qualified');
  });

  test('Map BHK to Prisma enum', () => {
    expect(mapBHKToPrisma('1')).toBe('ONE');
    expect(mapBHKToPrisma('2')).toBe('TWO');
    expect(mapBHKToPrisma('Studio')).toBe('Studio');
  });

  test('Map Timeline to Prisma enum', () => {
    expect(mapTimelineToPrisma('0-3m')).toBe('ZERO_TO_THREE_MONTHS');
    expect(mapTimelineToPrisma('3-6m')).toBe('THREE_TO_SIX_MONTHS');
  });
});