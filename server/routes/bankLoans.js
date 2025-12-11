const express = require('express');
const router = express.Router();
const controller = require('../controllers/bankLoanController');

const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', controller.getAllBankLoans);
router.post('/', protect, admin, controller.createBankLoan);
router.get('/:loanId', controller.getBankLoanById);
router.put('/:loanId', protect, admin, controller.updateBankLoan);
router.delete('/:loanId', protect, admin, controller.deleteBankLoan);

module.exports = router;
