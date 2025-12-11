const express = require('express');
const router = express.Router();
const controller = require('../controllers/calculationController');

router.post('/emi', controller.calculateEMIApi);
router.post('/foreclosure', controller.calculateForeclosureApi);
router.get('/amortization/:loanId', controller.getAmortizationApi);

module.exports = router;
