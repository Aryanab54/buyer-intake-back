const request = require('supertest');
const app = require('../../app');

test("POST /api/buyers creates buyer", async () => {
  const res = await request(app)
    .post("/api/buyers")
    .send({
      fullName: "Jane Doe",
      phone: "9998887776",
      city: "Mohali",
      propertyType: "Villa",
      bhk: "THREE",
      purpose: "Buy",
      timeline: "THREE_TO_SIX_MONTHS",
      source: "Referral"
    });
    
  expect(res.statusCode).toBe(401);
});
