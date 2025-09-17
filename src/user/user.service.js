const { PrismaClient } = require('../generated/prisma');
const { ApiError } = require('../utils/errorHandler');

const prisma = new PrismaClient();

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return user;
};

const updateUser = async (id, data) => {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return user;
};

const createUser = async (email, name = null) => {
  const user = await prisma.user.create({
    data: {
      email,
      name
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return user;
};

const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
};

module.exports = {
  getUserById,
  updateUser,
  createUser,
  findUserByEmail
};