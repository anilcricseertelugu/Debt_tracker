const express = require('express');
const router = express.Router();
const controller = require('../controllers/bankLoanController');

router.get('/', controller.getAllBankLoans);
router.post('/', controller.createBankLoan);
router.get('/:loanId', controller.getBankLoanById);
router.put('/:loanId', controller.updateBankLoan);
router.delete('/:loanId', controller.deleteBankLoan);

module.exports = router;
