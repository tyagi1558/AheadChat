const express = require('express');
const router = express.Router();
const { getUsers, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Routes
router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);

module.exports = router;