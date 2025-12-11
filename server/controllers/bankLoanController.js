const BankLoan = require('../models/BankLoan');
const { generateBankLoanId } = require('../utils/idGenerator');
const { calculateEMI, calculateRemainingPrincipal, calculateNextDueDate, calculateTotalInterest, generateAmortizationSchedule } = require('../utils/calculations');

exports.getAllBankLoans = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && status !== 'All') {
            filter.status = status;
        } else if (!status) {
            filter.status = 'Active'; // Default
        }

        const loans = await BankLoan.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: loans });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getBankLoanById = async (req, res) => {
    try {
        const loan = await BankLoan.findOne({ loanId: req.params.loanId });
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        // Generate amortization schedule on the fly for the response
        const schedule = generateAmortizationSchedule(
            loan.principalAmount,
            loan.interestRate,
            loan.tenureMonths,
            loan.emisPaid
        );

        res.json({ success: true, data: { loan, amortizationSchedule: schedule } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createBankLoan = async (req, res) => {
    try {
        const data = req.body;

        // Generate ID
        const loanId = await generateBankLoanId();

        // Calculations
        const emiAmount = calculateEMI(data.principalAmount, data.interestRate, data.tenureMonths);
        const totalInterest = calculateTotalInterest(data.principalAmount, emiAmount, data.tenureMonths);

        // Calculate remaining principal if fresh vs ongoing
        let remainingPrincipal = data.principalAmount;
        let nextDueDate = new Date(data.startDate);

        // Wait, for ongoing loans, user enters `emisPaid`.
        if (data.emisPaid > 0) {
            remainingPrincipal = calculateRemainingPrincipal(
                data.principalAmount,
                data.interestRate,
                data.tenureMonths,
                data.emisPaid
            );
            nextDueDate = calculateNextDueDate(data.startDate, data.emisPaid);
        } else {
            // Fresh loan, next due date is 1 month after start
            nextDueDate = calculateNextDueDate(data.startDate, 0);
        }

        const newLoan = new BankLoan({
            loanId,
            ...data,
            emiAmount,
            remainingPrincipal,
            totalInterestPayable: totalInterest,
            nextDueDate
        });

        await newLoan.save();
        res.status(201).json({ success: true, message: 'Bank loan added successfully', data: newLoan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBankLoan = async (req, res) => {
    try {
        const { loanId } = req.params;
        const updates = req.body;

        // Fetch existing loan to merge with updates if partial update (though form sends all)
        const loan = await BankLoan.findOne({ loanId });
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        // Merge updates into a temporary object to calculate
        const merged = { ...loan.toObject(), ...updates };

        // Recalculate derived fields
        const emiAmount = calculateEMI(merged.principalAmount, merged.interestRate, merged.tenureMonths);
        const totalInterest = calculateTotalInterest(merged.principalAmount, emiAmount, merged.tenureMonths);

        let remainingPrincipal = merged.principalAmount;
        let nextDueDate = new Date(merged.startDate);

        // Standardize date object
        if (typeof merged.startDate === 'string') {
            nextDueDate = new Date(merged.startDate);
        }

        if (merged.emisPaid > 0) {
            remainingPrincipal = calculateRemainingPrincipal(
                merged.principalAmount,
                merged.interestRate,
                merged.tenureMonths,
                merged.emisPaid
            );
            nextDueDate = calculateNextDueDate(merged.startDate, merged.emisPaid);
        } else {
            nextDueDate = calculateNextDueDate(merged.startDate, 0);
        }

        // Apply updates
        loan.set({
            ...updates,
            emiAmount,
            totalInterestPayable: totalInterest,
            remainingPrincipal,
            nextDueDate
        });

        const updatedLoan = await loan.save();
        res.json({ success: true, data: updatedLoan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteBankLoan = async (req, res) => {
    try {
        // Soft delete
        const updated = await BankLoan.findOneAndUpdate(
            { loanId: req.params.loanId },
            { status: 'Closed' },
            { new: true }
        );
        res.json({ success: true, message: 'Loan closed', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
