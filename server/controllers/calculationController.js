const { calculateEMI, calculateForeclosure, generateAmortizationSchedule } = require('../utils/calculations');
const BankLoan = require('../models/BankLoan');

exports.calculateEMIApi = (req, res) => {
    const { principalAmount, interestRate, tenureMonths } = req.body;
    const emi = calculateEMI(principalAmount, interestRate, tenureMonths);
    const totalAmount = emi * tenureMonths;
    const totalInterest = totalAmount - principalAmount;

    res.json({
        success: true,
        data: {
            emiAmount: emi,
            totalInterestPayable: Math.round(totalInterest),
            totalAmount: Math.round(totalAmount)
        }
    });
};

exports.calculateForeclosureApi = async (req, res) => {
    try {
        const { loanId, foreclosureDate } = req.body;
        const loan = await BankLoan.findOne({ loanId }); // Or check HandLoan too? Usually Bank.

        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        // We need last payment date. If no payments, use StartDate.
        // Spec doesn't strictly track "lastPaymentDate" field in BankLoan model, 
        // but HandLoan has `lastInterestPaidDate`.
        // BankLoan has `createdAt` or we can query Payments.
        // For now assuming foreclosure calculation based on CURRENT state.

        // Let's assume last payment was handled or we use current Date as reference? 
        // `calculateForeclosure` needs `lastPaymentDate`. 
        // We'll use start date + months paid?
        // Accurate way: Find the last payment in Payments collection.

        // Fallback: Use now as reference if no payments? 
        // Better: Estimate last payment date based on `emisPaid` and `startDate`.
        const lastPaymentDate = new Date(loan.startDate);
        lastPaymentDate.setMonth(lastPaymentDate.getMonth() + loan.emisPaid);

        const result = calculateForeclosure(
            loan.remainingPrincipal,
            loan.interestRate,
            lastPaymentDate,
            foreclosureDate || new Date()
        );

        res.json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAmortizationApi = async (req, res) => {
    try {
        const loan = await BankLoan.findOne({ loanId: req.params.loanId });
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        const schedule = generateAmortizationSchedule(
            loan.principalAmount,
            loan.interestRate,
            loan.tenureMonths,
            loan.emisPaid
        );

        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
