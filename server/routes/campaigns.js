const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const campaignsController = require('../controllers/campaignsController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/campaigns
router.get('/', campaignsController.getCampaigns);

// GET /api/campaigns/:id
router.get('/:id', campaignsController.getCampaign);

// GET /api/campaigns/:id/analytics
router.get('/:id/analytics', campaignsController.getCampaignAnalytics);

// POST /api/campaigns
router.post('/', validate(schemas.createCampaign), campaignsController.createCampaign);

// PUT /api/campaigns/:id
router.put('/:id', campaignsController.updateCampaign);

// DELETE /api/campaigns/:id
router.delete('/:id', campaignsController.deleteCampaign);

// POST /api/campaigns/:id/contacts
router.post('/:id/contacts', campaignsController.addContactsToCampaign);

// POST /api/campaigns/:id/start
router.post('/:id/start', campaignsController.startCampaign);

// POST /api/campaigns/:id/pause
router.post('/:id/pause', campaignsController.pauseCampaign);

module.exports = router;
