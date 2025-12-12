const express = require('express');
const router = express.Router();
const controller = require('../controllers/handLoanController');

const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

router.get('/', optionalProtect, controller.getAllHandLoans);
router.post('/', protect, admin, controller.createHandLoan);
router.get('/:loanId', optionalProtect, controller.getHandLoanById);
router.put('/:loanId', protect, admin, controller.updateHandLoan);
router.delete('/:loanId', protect, admin, controller.deleteHandLoan);

module.exports = router;
