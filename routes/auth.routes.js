const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Khớp với fetch('/api/auth/register') ở Frontend
router.post('/register', authController.register);

// Khớp với fetch('/api/auth/login') ở Frontend
router.post('/login', authController.login);

module.exports = router;