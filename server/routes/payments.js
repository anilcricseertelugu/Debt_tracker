const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');

const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

router.get('/', optionalProtect, controller.getPayments);
router.post('/', protect, controller.createPayment);
router.post('/auto-pay', protect, controller.autoPayAll);
router.get('/loan/:loanId', optionalProtect, controller.getPaymentsByLoanId);

module.exports = router;
