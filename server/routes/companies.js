const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const companiesController = require('../controllers/companiesController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/companies
router.get('/', companiesController.getCompanies);

// GET /api/companies/stats
router.get('/stats', companiesController.getCompanyStats);

// GET /api/companies/:id
router.get('/:id', companiesController.getCompany);

// POST /api/companies
router.post('/', validate(schemas.createCompany), companiesController.createCompany);

// PUT /api/companies/:id
router.put('/:id', companiesController.updateCompany);

// DELETE /api/companies/:id
router.delete('/:id', companiesController.deleteCompany);

module.exports = router;
