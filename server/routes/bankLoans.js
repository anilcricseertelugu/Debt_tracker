const express = require('express');
const router = express.Router();
const controller = require('../controllers/bankLoanController');

const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

router.get('/', optionalProtect, controller.getAllBankLoans);
router.post('/', protect, controller.createBankLoan);
router.get('/:loanId', optionalProtect, controller.getBankLoanById);
router.put('/:loanId', protect, controller.updateBankLoan);
router.delete('/:loanId', protect, controller.deleteBankLoan);

module.exports = router;
