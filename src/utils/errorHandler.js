class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

const handlePrismaError = (error) => {
  switch (error.code) {
    case 'P2002':
      return new ApiError('Duplicate entry found', 409, error.meta);
    case 'P2025':
      return new ApiError('Record not found', 404);
    case 'P2003':
      return new ApiError('Foreign key constraint failed', 400);
    case 'P2014':
      return new ApiError('Invalid ID provided', 400);
    default:
      return new ApiError('Database error', 500);
  }
};

const handleZodError = (error) => {
  const details = error.errors?.map(err => ({
    field: err.path?.join('.') || 'unknown',
    message: err.message
  })) || [];
  
  return new ApiError('Validation failed', 400, details);
};

const errorHandler = (error, req, res, next) => {
  let apiError = error;
  
  // Convert known errors to ApiError
  if (error.name === 'PrismaClientKnownRequestError') {
    apiError = handlePrismaError(error);
  } else if (error.name === 'ZodError') {
    apiError = handleZodError(error);
  } else if (!(error instanceof ApiError)) {
    apiError = new ApiError('Internal server error', 500);
  }
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }
  
  res.status(apiError.statusCode).json({
    error: apiError.message,
    details: apiError.details,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

module.exports = {
  ApiError,
  handlePrismaError,
  handleZodError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};