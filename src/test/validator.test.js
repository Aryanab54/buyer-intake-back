const { buyerSchema } = require('../utils/validation');

test("budgetMax should be >= budgetMin", () => {
  expect(() => {
    buyerSchema.parse({
      fullName: "John",
      phone: "9876543210",
      city: "Chandigarh",
      propertyType: "Apartment",
      bhk: "TWO",
      purpose: "Buy",
      budgetMin: 2000000,
      budgetMax: 1000000,
      timeline: "ZERO_TO_THREE_MONTHS",
      source: "Website"
    });
  }).toThrow();
});
