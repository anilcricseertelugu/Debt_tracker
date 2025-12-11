const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');

const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', controller.getPayments);
router.post('/', protect, admin, controller.createPayment);
router.get('/loan/:loanId', controller.getPaymentsByLoanId);

module.exports = router;
