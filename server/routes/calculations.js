const express = require('express');
const router = express.Router();
const controller = require('../controllers/calculationController');
const strategyController = require('../controllers/strategyController');
const { protect } = require('../middleware/authMiddleware');

router.post('/emi', controller.calculateEMIApi);
router.post('/foreclosure', controller.calculateForeclosureApi);
router.get('/amortization/:loanId', controller.getAmortizationApi);
router.post('/strategy', protect, strategyController.calculateStrategies);

module.exports = router;
