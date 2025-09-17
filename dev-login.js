// Development login bypass
const express = require('express');
const router = express.Router();

router.post('/dev-login', (req, res) => {
  const token = 'dev-token-12345';
  const user = {
    id: 'dev-user-id',
    email: 'dev@example.com',
    name: 'Dev User'
  };
  
  res.json({
    success: true,
    data: {
      token,
      user
    }
  });
});

module.exports = router;