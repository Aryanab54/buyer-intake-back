const { ApiError, handlePrismaError, handleZodError } = require('../utils/errorHandler');
const { ZodError } = require('zod');

describe('Error Handler', () => {
  test('ApiError creation', () => {
    const error = new ApiError('Test error', 400, { field: 'test' });
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'test' });
  });

  test('Handle Prisma P2002 error', () => {
    const prismaError = {
      code: 'P2002',
      meta: { target: ['email'] }
    };
    
    const apiError = handlePrismaError(prismaError);
    
    expect(apiError.statusCode).toBe(409);
    expect(apiError.message).toBe('Duplicate entry found');
  });

  test('Handle Prisma P2025 error', () => {
    const prismaError = { code: 'P2025' };
    const apiError = handlePrismaError(prismaError);
    
    expect(apiError.statusCode).toBe(404);
    expect(apiError.message).toBe('Record not found');
  });

  test('Handle Zod validation error', () => {
    const zodError = {
      errors: [
        { path: ['fullName'], message: 'Required' },
        { path: ['phone'], message: 'Invalid format' }
      ]
    };
    
    const apiError = handleZodError(zodError);
    
    expect(apiError.statusCode).toBe(400);
    expect(apiError.details).toHaveLength(2);
    expect(apiError.details[0].field).toBe('fullName');
  });
});