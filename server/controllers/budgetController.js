const Income = require('../models/Income');
const Expense = require('../models/Expense');
const RecurringExpense = require('../models/RecurringExpense');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const { getUserIdForFilter } = require('../utils/authHelper');

exports.addIncome = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const { source, amount, date } = req.body;

        const income = new Income({
            source,
            amount,
            date,
            user: userId
        });

        await income.save();
        res.status(201).json({ success: true, data: income });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getIncomes = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        // Income is now Fixed Monthly, so just return all distinct sources
        const incomes = await Income.find({ user: userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: incomes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        await Income.findOneAndDelete({ _id: req.params.id, user: userId });
        res.json({ success: true, message: 'Income deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const { category, amount, date, description } = req.body;

        const expense = new Expense({
            category,
            amount,
            date,
            description,
            user: userId
        });

        await expense.save();
        res.status(201).json({ success: true, data: expense });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const expenses = await Expense.find({ user: userId }).sort({ date: -1 }).limit(50);
        res.json({ success: true, data: expenses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        await Expense.findOneAndDelete({ _id: req.params.id, user: userId });
        res.json({ success: true, message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Recurring Expenses ---
exports.addRecurringExpense = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const { category, amount } = req.body;

        const expense = new RecurringExpense({
            category,
            amount,
            user: userId
        });

        await expense.save();
        res.status(201).json({ success: true, data: expense });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getRecurringExpenses = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const expenses = await RecurringExpense.find({ user: userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: expenses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteRecurringExpense = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        await RecurringExpense.findOneAndDelete({ _id: req.params.id, user: userId });
        res.json({ success: true, message: 'Recurring Expense deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};



exports.getBudgetSummary = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Fixed Income
        const incomes = await Income.find({ user: userId });
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

        // 2. Expected Recurring Expenses (Bills etc)
        const recurringExpenses = await RecurringExpense.find({ user: userId });
        const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);

        // 3. Debt Obligations (Bank EMIs + Hand Loan Interest)
        const bankLoans = await BankLoan.find({ user: userId, status: 'Active' });
        const handLoans = await HandLoan.find({ user: userId, status: 'Active' });

        const totalBankEMIs = bankLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);

        const totalHandInterest = handLoans.reduce((sum, loan) => {
            if (loan.loanType === 'Monthly_Interest' && loan.monthlyInterestAmount) {
                return sum + loan.monthlyInterestAmount;
            }
            return sum;
        }, 0);

        const totalDebtObligations = totalBankEMIs + totalHandInterest;

        // 4. Actual Expenses (This Month)
        const actualExpenses = await Expense.find({
            user: userId,
            date: { $gte: firstDay }
        });
        const totalActual = actualExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculations
        // Total Expected Outflow = Recurring Bills + Debt Obligations
        const totalExpected = totalRecurring + totalDebtObligations;

        // Projected Savings = Income - Total Expected
        const projectedSavings = totalIncome - totalExpected;

        // Balance (Tracking)
        const balance = totalIncome - totalActual;

        res.json({
            success: true,
            data: {
                totalIncome,
                totalRecurring, // Bills only
                totalDebtObligations, // Debt only
                totalExpected, // Bills + Debt
                totalActual,
                projectedSavings,
                balance,
                debtBreakdown: {
                    bankLoans: bankLoans.map(l => ({ name: l.bankName + ' - ' + l.loanName, amount: l.emiAmount })),
                    handLoans: handLoans.map(l => ({
                        name: l.lenderName,
                        amount: l.loanType === 'Monthly_Interest' ? l.monthlyInterestAmount : 0
                    })).filter(l => l.amount > 0)
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
