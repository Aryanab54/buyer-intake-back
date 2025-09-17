const { PrismaClient } = require('../generated/prisma');
const { ApiError } = require('../utils/errorHandler');
const { parseCSVBuffer, validateCSVData, generateCSV } = require('../utils/csvHandler');
const { buildWhereClause, buildOrderBy, calculatePagination, createHistoryEntry } = require('../utils/helpers');

const prisma = new PrismaClient();

const createBuyer = async (data, ownerId) => {
  // Create dev user if it doesn't exist
  if (ownerId === 'dev-user') {
    await prisma.user.upsert({
      where: { id: 'dev-user' },
      update: {},
      create: {
        id: 'dev-user',
        email: 'dev@example.com',
        name: 'Dev User'
      }
    });
  }

  // Ensure enums and defaults are set; validation layer should already map them
  const transformedData = {
    ...data,
    status: data.status || 'NEW',
    ownerId,
    tags: Array.isArray(data.tags) ? data.tags : []
  };

  const buyer = await prisma.buyer.create({
    data: transformedData
  });

  // Create initial history entry on create
  await prisma.buyerHistory.create({
    data: createHistoryEntry(buyer.id, ownerId, {}, buyer)
  });

  return buyer;
};

const getBuyers = async (filters, page = 1, limit = 10, sortBy = 'updatedAt', sortOrder = 'desc') => {
  const where = {};
  
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search } }
    ];
  }
  
  if (filters.city) where.city = filters.city;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.status) where.status = filters.status;
  if (filters.timeline) where.timeline = filters.timeline;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const [buyers, total] = await Promise.all([
    prisma.buyer.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.buyer.count({ where })
  ]);

  return {
    data: buyers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getBuyerById = async (id, userId) => {
  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  if (!buyer) {
    throw new ApiError('Buyer not found', 404);
  }

  // Also fetch last 5 history entries to align with frontend expectation
  const history = await prisma.buyerHistory.findMany({
    where: { buyerId: id },
    orderBy: { changedAt: 'desc' },
    take: 5,
    include: {
      changedBy: { select: { id: true, name: true, email: true } }
    }
  });

  return { buyer, history };
};

const updateBuyer = async (id, data, userId) => {
  const existingBuyer = await prisma.buyer.findUnique({
    where: { id }
  });

  if (!existingBuyer) {
    throw new ApiError('Buyer not found', 404);
  }

  // Skip auth check for dev user
  if (existingBuyer.ownerId !== userId && userId !== 'dev-user') {
    throw new ApiError('Not authorized to update this buyer', 403);
  }

  // Check for concurrent updates
  if (data.updatedAt && new Date(data.updatedAt) < existingBuyer.updatedAt) {
    throw new ApiError('Record has been modified by another user. Please refresh and try again.', 409);
  }

  const updatedBuyer = await prisma.buyer.update({
    where: { id },
    data: {
      ...data,
      tags: data.tags || existingBuyer.tags
    }
  });

  // Create history entry
  await prisma.buyerHistory.create({
    data: createHistoryEntry(id, userId, existingBuyer, updatedBuyer)
  });

  return updatedBuyer;
};

const deleteBuyer = async (id, userId) => {
  const buyer = await prisma.buyer.findUnique({
    where: { id }
  });

  if (!buyer) {
    throw new ApiError('Buyer not found', 404);
  }

  // Skip auth check for dev user
  if (buyer.ownerId !== userId && userId !== 'dev-user') {
    throw new ApiError('Not authorized to delete this buyer', 403);
  }

  await prisma.$transaction([
    prisma.buyerHistory.deleteMany({ where: { buyerId: id } }),
    prisma.buyer.delete({ where: { id } })
  ]);
};

const importCSV = async (buffer, ownerId) => {
  const csvData = await parseCSVBuffer(buffer);
  const { validData, errors } = await validateCSVData(csvData);

  if (validData.length === 0) {
    throw new ApiError('No valid data found in CSV', 400, { errors });
  }

  // Insert valid data in transaction
  const buyers = await prisma.$transaction(async (tx) => {
    const createdBuyers = [];
    
    for (const data of validData) {
      const buyer = await tx.buyer.create({
        data: {
          ...data,
          ownerId,
          tags: data.tags || []
        }
      });
      
      await tx.buyerHistory.create({
        data: createHistoryEntry(buyer.id, ownerId, {}, buyer)
      });
      
      createdBuyers.push(buyer);
    }
    
    return createdBuyers;
  });

  return {
    imported: buyers.length,
    errors: errors.length > 0 ? errors : null,
    data: buyers
  };
};

const exportCSV = async (filters, sortBy = 'updatedAt', sortOrder = 'desc') => {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(sortBy, sortOrder);

  const buyers = await prisma.buyer.findMany({
    where,
    orderBy
  });

  return await generateCSV(buyers);
};

const getBuyerHistory = async (buyerId, userId) => {
  const buyer = await prisma.buyer.findUnique({
    where: { id: buyerId }
  });

  if (!buyer) {
    throw new ApiError('Buyer not found', 404);
  }

  const history = await prisma.buyerHistory.findMany({
    where: { buyerId },
    orderBy: { changedAt: 'desc' },
    take: 5,
    include: {
      changedBy: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return history;
};

module.exports = {
  createBuyer,
  getBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  importCSV,
  exportCSV,
  getBuyerHistory
};