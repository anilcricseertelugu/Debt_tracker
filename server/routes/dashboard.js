const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');

router.get('/summary', controller.getDashboardSummary);
router.get('/analytics', controller.getDashboardAnalytics);

module.exports = router;
