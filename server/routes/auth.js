const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', validate(schemas.register), authController.register);

// POST /api/auth/login
router.post('/login', validate(schemas.login), authController.login);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
