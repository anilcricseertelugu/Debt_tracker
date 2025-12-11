const express = require('express');
const router = express.Router();
const controller = require('../controllers/handLoanController');

router.get('/', controller.getAllHandLoans);
router.post('/', controller.createHandLoan);
router.get('/:loanId', controller.getHandLoanById);
router.put('/:loanId', controller.updateHandLoan);
router.delete('/:loanId', controller.deleteHandLoan);

module.exports = router;
