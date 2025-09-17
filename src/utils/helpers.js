// Helper functions for database operations and data transformation

const createHistoryEntry = (buyerId, changedById, oldData, newData) => {
  const diff = {};
  
  Object.keys(newData).forEach(key => {
    if (key === 'updatedAt' || key === 'id' || key === 'createdAt') return;
    
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff[key] = {
        from: oldValue,
        to: newValue
      };
    }
  });

  return {
    buyerId,
    changedById,
    changedAt: new Date(),
    diff
  };
};

const buildWhereClause = (filters) => {
  const where = {};
  
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  
  if (filters.city) where.city = filters.city;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.status) where.status = filters.status;
  if (filters.timeline) where.timeline = filters.timeline;
  
  return where;
};

const buildOrderBy = (sortBy = 'updatedAt', sortOrder = 'desc') => {
  return { [sortBy]: sortOrder };
};

const calculatePagination = (page = 1, limit = 10, total) => {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    offset,
    totalPages,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// Convert frontend BHK values to Prisma enum values
const mapBHKToPrisma = (bhk) => {
  const mapping = {
    '1': 'ONE',
    '2': 'TWO', 
    '3': 'THREE',
    '4': 'FOUR',
    'Studio': 'Studio'
  };
  return mapping[bhk] || bhk;
};

// Convert Prisma BHK enum to frontend values
const mapBHKFromPrisma = (bhk) => {
  const mapping = {
    'ONE': '1',
    'TWO': '2',
    'THREE': '3', 
    'FOUR': '4',
    'Studio': 'Studio'
  };
  return mapping[bhk] || bhk;
};

// Convert frontend timeline to Prisma enum
const mapTimelineToPrisma = (timeline) => {
  const mapping = {
    '0-3m': 'ZERO_TO_THREE_MONTHS',
    '3-6m': 'THREE_TO_SIX_MONTHS',
    '>6m': 'MORE_THAN_SIX_MONTHS',
    'Exploring': 'Exploring'
  };
  return mapping[timeline] || timeline;
};

// Convert Prisma timeline to frontend
const mapTimelineFromPrisma = (timeline) => {
  const mapping = {
    'ZERO_TO_THREE_MONTHS': '0-3m',
    'THREE_TO_SIX_MONTHS': '3-6m', 
    'MORE_THAN_SIX_MONTHS': '>6m',
    'Exploring': 'Exploring'
  };
  return mapping[timeline] || timeline;
};

module.exports = {
  createHistoryEntry,
  buildWhereClause,
  buildOrderBy,
  calculatePagination,
  mapBHKToPrisma,
  mapBHKFromPrisma,
  mapTimelineToPrisma,
  mapTimelineFromPrisma
};