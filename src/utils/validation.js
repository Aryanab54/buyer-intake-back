const { z } = require('zod');

const CITIES = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'];
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail'];
const BHK_OPTIONS = ['Studio', '1', '2', '3', '4', 'ONE', 'TWO', 'THREE', 'FOUR'];
const PURPOSES = ['Buy', 'Rent'];
const TIMELINES = ['0-3m', '3-6m', '>6m', 'Exploring'];
const SOURCES = ['Website', 'Referral', 'Walk-in', 'Call', 'Other'];
const STATUSES = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'];

const buyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  city: z.enum(CITIES),
  propertyType: z.enum(PROPERTY_TYPES),
  bhk: z.enum(BHK_OPTIONS).optional(),
  purpose: z.enum(PURPOSES),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  timeline: z.enum(TIMELINES),
  source: z.enum(SOURCES),
  status: z.enum(STATUSES).default('New'),
  notes: z.string().max(1000).optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([])
}).refine(data => {
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa property types'
}).refine(data => {
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Budget max must be greater than or equal to budget min'
});

const updateBuyerSchema = buyerSchema.partial().extend({
  updatedAt: z.string().datetime().optional()
});

// Internal mapping helpers
const mapToPrismaEnums = (data) => {
  const timelineMap = {
    '0-3m': 'ZERO_TO_THREE_MONTHS',
    '3-6m': 'THREE_TO_SIX_MONTHS', 
    '>6m': 'MORE_THAN_SIX_MONTHS',
    'Exploring': 'Exploring'
  };

  const sourceMap = {
    'Walk-in': 'Walk_in'
  };

  const statusMap = {
    'New': 'NEW'
  };

  // Map BHK human values to Prisma enum if needed
  const bhkMap = {
    '1': 'ONE',
    '2': 'TWO',
    '3': 'THREE',
    '4': 'FOUR',
    'Studio': 'Studio'
  };

  return {
    ...data,
    timeline: timelineMap[data.timeline] || data.timeline,
    source: sourceMap[data.source] || data.source,
    status: statusMap[data.status] || data.status,
    bhk: data.bhk ? (bhkMap[data.bhk] || data.bhk) : undefined
  };
};

const preprocessBuyerInput = (data) => ({
  ...data,
  budgetMin: data.budgetMin !== undefined && data.budgetMin !== '' ? parseInt(data.budgetMin) : undefined,
  budgetMax: data.budgetMax !== undefined && data.budgetMax !== '' ? parseInt(data.budgetMax) : undefined,
  email: data.email || undefined,
  bhk: data.bhk || undefined,
  notes: data.notes || undefined,
});

const validateBuyer = (data) => {
  // Preprocess numeric and optional string fields
  const preprocessed = preprocessBuyerInput(data);
  // Parse with Zod (throws ZodError on failure)
  const parsed = buyerSchema.parse(preprocessed);
  // Map to Prisma enums
  return mapToPrismaEnums(parsed);
};

const validateBuyerUpdate = (data) => {
  const preprocessed = preprocessBuyerInput(data);
  const parsed = updateBuyerSchema.parse(preprocessed);
  // Map only provided enum fields
  const mapped = mapToPrismaEnums(parsed);
  return mapped;
};

module.exports = {
  CITIES,
  PROPERTY_TYPES,
  BHK_OPTIONS,
  PURPOSES,
  TIMELINES,
  SOURCES,
  STATUSES,
  buyerSchema,
  updateBuyerSchema,
  validateBuyer,
  validateBuyerUpdate
};