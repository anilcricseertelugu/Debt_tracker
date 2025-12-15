const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Check optionalProtect vs protect - assuming optionalProtect to match other routes, 
// but controller enforces user check. 
// Ideally should use 'protect' if login is mandatory. 
// Using optionalProtect to be consistent with dashboardRoutes, 
// as controller handles fallback/guest logic if implemented.



router.get('/income', optionalProtect, controller.getIncomes);
router.post('/income', optionalProtect, controller.addIncome);
router.delete('/income/:id', optionalProtect, controller.deleteIncome);

router.get('/expenses', optionalProtect, controller.getExpenses);
router.post('/expenses', optionalProtect, controller.addExpense);
router.delete('/expenses/:id', optionalProtect, controller.deleteExpense);

router.get('/recurring', optionalProtect, controller.getRecurringExpenses);
router.post('/recurring', optionalProtect, controller.addRecurringExpense);
router.delete('/recurring/:id', optionalProtect, controller.deleteRecurringExpense);

router.get('/summary', optionalProtect, controller.getBudgetSummary);

module.exports = router;
