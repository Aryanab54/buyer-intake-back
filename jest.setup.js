// Add any global test setup here
beforeAll(() => {
  console.log("✅ Jest setup is running before all tests");
});

afterAll(async () => {
  console.log("✅ Jest cleanup after all tests");
  // Force exit after cleanup
  setTimeout(() => process.exit(0), 100);
});