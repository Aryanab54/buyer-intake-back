const csv = require('csv-parser');
const { stringify } = require('csv-stringify');
const { Readable } = require('stream');
const { buyerSchema } = require('./validation');
const { mapBHKFromPrisma, mapTimelineFromPrisma } = require('./helpers');
const { mapBHKToPrisma, mapTimelineToPrisma } = require('./helpers');

const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseCSVRow = (row) => {
  const parsed = {
    fullName: row.fullName?.trim(),
    email: row.email?.trim() || undefined,
    phone: row.phone?.toString().trim(),
    city: row.city?.trim(),
    propertyType: row.propertyType?.trim(),
    bhk: row.bhk?.trim() || undefined,
    purpose: row.purpose?.trim(),
    budgetMin: row.budgetMin ? parseInt(row.budgetMin) : undefined,
    budgetMax: row.budgetMax ? parseInt(row.budgetMax) : undefined,
    timeline: row.timeline?.trim(),
    source: row.source?.trim(),
    status: row.status?.trim() || 'New',
    notes: row.notes?.trim() || undefined,
    tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  };
  
  // Map values to Prisma enums
  if (parsed.bhk) parsed.bhk = mapBHKToPrisma(parsed.bhk);
  if (parsed.timeline) parsed.timeline = mapTimelineToPrisma(parsed.timeline);
  if (parsed.status) {
    const statusMap = { 'New': 'NEW' };
    parsed.status = statusMap[parsed.status] || parsed.status;
  }
  if (parsed.source === 'Walk-in') parsed.source = 'Walk_in';
  
  return parsed;
};

const validateCSVData = async (csvData, maxRows = 200) => {
  if (csvData.length > maxRows) {
    throw new Error(`CSV file cannot exceed ${maxRows} rows`);
  }

  const validData = [];
  const errors = [];

  for (let i = 0; i < csvData.length; i++) {
    const rawRow = csvData[i];
    const parsed = parseCSVRow(rawRow);

    // Build a Zod-friendly object resembling buyerSchema input (frontend-style values)
    const zodInput = {
      fullName: parsed.fullName,
      email: parsed.email || '',
      phone: parsed.phone,
      city: parsed.city,
      propertyType: parsed.propertyType,
      // Map Prisma enum bhk back to human value for Zod validation when needed
      bhk: parsed.bhk === 'ONE' ? '1' : parsed.bhk === 'TWO' ? '2' : parsed.bhk === 'THREE' ? '3' : parsed.bhk === 'FOUR' ? '4' : parsed.bhk || '',
      purpose: parsed.purpose,
      budgetMin: parsed.budgetMin,
      budgetMax: parsed.budgetMax,
      // Map Prisma timeline back for Zod validation
      timeline: parsed.timeline === 'ZERO_TO_THREE_MONTHS' ? '0-3m' : parsed.timeline === 'THREE_TO_SIX_MONTHS' ? '3-6m' : parsed.timeline === 'MORE_THAN_SIX_MONTHS' ? '>6m' : 'Exploring',
      source: parsed.source === 'Walk_in' ? 'Walk-in' : parsed.source,
      status: parsed.status === 'NEW' ? 'New' : parsed.status,
      notes: parsed.notes || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : []
    };

    try {
      // Validate using buyerSchema (will throw on error)
      buyerSchema.parse(zodInput);
      // If valid, keep parsed (already mapped to Prisma enums for bhk/timeline/source/status)
      validData.push(parsed);
    } catch (error) {
      const rowErrors = (error.errors || []).map(e => ({ field: e.path?.[0] || 'row', message: e.message }));
      errors.push({
        row: i + 1,
        data: rawRow,
        errors: rowErrors.length ? rowErrors : [{ message: error.message }]
      });
    }
  }

  return { validData, errors };
};

const formatBuyerForExport = (buyer) => {
  return {
    fullName: buyer.fullName,
    email: buyer.email || '',
    phone: buyer.phone,
    city: buyer.city,
    propertyType: buyer.propertyType,
    bhk: buyer.bhk ? mapBHKFromPrisma(buyer.bhk) : '',
    purpose: buyer.purpose,
    budgetMin: buyer.budgetMin || '',
    budgetMax: buyer.budgetMax || '',
    timeline: mapTimelineFromPrisma(buyer.timeline),
    source: buyer.source,
    status: buyer.status,
    notes: buyer.notes || '',
    tags: Array.isArray(buyer.tags) ? buyer.tags.join(',') : '',
    updatedAt: buyer.updatedAt
  };
};

const generateCSV = (data) => {
  return new Promise((resolve, reject) => {
    const formattedData = data.map(formatBuyerForExport);
    
    stringify(formattedData, { 
      header: true,
      columns: [
        'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk',
        'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source',
        'status', 'notes', 'tags', 'updatedAt'
      ]
    }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
};

module.exports = {
  parseCSVBuffer,
  parseCSVRow,
  validateCSVData,
  formatBuyerForExport,
  generateCSV
};