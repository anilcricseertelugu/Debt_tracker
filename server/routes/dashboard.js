const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');

const { optionalProtect } = require('../middleware/authMiddleware');

router.get('/summary', optionalProtect, controller.getDashboardSummary);
router.get('/analytics', optionalProtect, controller.getDashboardAnalytics);

module.exports = router;
