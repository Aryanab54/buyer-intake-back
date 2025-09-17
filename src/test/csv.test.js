const { parseCSVBuffer, validateCSVData, generateCSV } = require('../utils/csvHandler');

describe('CSV Handler', () => {
  test('Parse CSV buffer', async () => {
    const csvData = 'fullName,phone,city,propertyType,purpose,timeline,source\nJohn Doe,9876543210,Chandigarh,Apartment,Buy,ZERO_TO_THREE_MONTHS,Website';
    const buffer = Buffer.from(csvData);
    
    const result = await parseCSVBuffer(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('John Doe');
  });

  test('Validate CSV data with errors', async () => {
    const csvData = [{
      fullName: 'J', // Too short
      phone: '123', // Too short
      city: 'Chandigarh',
      propertyType: 'Apartment',
      purpose: 'Buy',
      timeline: 'ZERO_TO_THREE_MONTHS',
      source: 'Website'
    }];
    
    const result = await validateCSVData(csvData);
    expect(result.errors).toHaveLength(1);
    expect(result.validData).toHaveLength(0);
  });

  test('Generate CSV from data', async () => {
    const data = [{
      fullName: 'John Doe',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      purpose: 'Buy',
      timeline: 'ZERO_TO_THREE_MONTHS',
      source: 'Website',
      tags: ['urgent']
    }];
    
    const csv = await generateCSV(data);
    expect(csv).toContain('John Doe');
    expect(csv).toContain('9876543210');
  });
});