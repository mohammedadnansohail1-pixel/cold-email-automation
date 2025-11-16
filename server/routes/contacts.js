const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const contactsController = require('../controllers/contactsController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/contacts
router.get('/', contactsController.getContacts);

// GET /api/contacts/:id
router.get('/:id', contactsController.getContact);

// POST /api/contacts
router.post('/', validate(schemas.createContact), contactsController.createContact);

// POST /api/contacts/bulk
router.post('/bulk', contactsController.bulkImportContacts);

// PUT /api/contacts/:id
router.put('/:id', contactsController.updateContact);

// DELETE /api/contacts/:id
router.delete('/:id', contactsController.deleteContact);

// POST /api/contacts/:id/opt-out
router.post('/:id/opt-out', contactsController.optOutContact);

module.exports = router;
