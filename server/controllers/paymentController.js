const Payment = require('../models/Payment');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const { generatePaymentId } = require('../utils/idGenerator');
const { calculateNextDueDate } = require('../utils/calculations');
const { getUserIdForFilter } = require('../utils/authHelper');

exports.createPayment = async (req, res) => {
    try {
        const { loanId, loanType, paymentDate, paymentType, amountPaid, notes } = req.body;
        const paymentId = await generatePaymentId();

        let principalPaid = 0;
        let interestPaid = 0;
        let balanceAfterPayment = 0;
        let nextDueDate = null;

        // --- BANK LOAN LOGIC ---
        if (loanType === 'Bank') {
            const loan = await BankLoan.findOne({ loanId });
            if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

            if (paymentType === 'EMI' || paymentType === 'Partial') {
                // Calculate Interest component for this month (simplified: usually based on daily or monthly)
                // Standard practice: Interest = Outstanding * MonthlyRate
                const monthlyRate = (loan.interestRate / 12) / 100;
                interestPaid = Math.round(loan.remainingPrincipal * monthlyRate);

                // Principal part is the rest
                principalPaid = amountPaid - interestPaid;

                // If they paid LESS than interest, principal increases? (Negative amortization)
                // Or we cap it.
                // Assuming user pays full EMI usually.

                if (principalPaid < 0) principalPaid = 0; // Edge case

                // Update Loan
                loan.remainingPrincipal -= principalPaid;
                loan.remainingPrincipal = Math.max(0, Math.round(loan.remainingPrincipal));
                loan.emisPaid += 1;

                // Update Next Due Date
                if (loan.nextDueDate) {
                    loan.nextDueDate = calculateNextDueDate(loan.nextDueDate, 0); // Add 1 month to current due date? 
                    // Logic: nextDueDate was previous due date. 
                    // `calculateNextDueDate(startDate, emisPaid)`
                    // Better:
                    loan.nextDueDate = calculateNextDueDate(loan.startDate, loan.emisPaid);
                }

                balanceAfterPayment = loan.remainingPrincipal;

                await loan.save();
            }
            else if (paymentType === 'Foreclosure') {
                // Full settlement
                principalPaid = loan.remainingPrincipal; // They pay off the rest
                // interestPaid logic is handled by frontend usually sending the total amount?
                // Spec says backend receives `amountPaid`.
                // Usually amountPaid = Principal + Interest + Charges.

                // We close the loan
                loan.remainingPrincipal = 0;
                loan.status = 'Closed';
                balanceAfterPayment = 0;
                await loan.save();
            }
        }

        // --- HAND LOAN LOGIC ---
        else if (loanType === 'Hand') {
            const loan = await HandLoan.findOne({ loanId });
            if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

            if (loan.loanType === 'Interest_Free') {
                // Simple repayment
                loan.totalRepaid += amountPaid;
                loan.remainingBalance = loan.principalAmount - loan.totalRepaid;
                balanceAfterPayment = loan.remainingBalance;
                if (loan.remainingBalance <= 0) loan.status = 'Closed';
                await loan.save();
            }
            else {
                // Monthly Interest Loan
                if (paymentType === 'Interest') {
                    interestPaid = amountPaid;
                    loan.lastInterestPaidDate = paymentDate;
                    // Balance doesn't change
                    balanceAfterPayment = loan.remainingBalance;
                    await loan.save();
                }
                else if (paymentType === 'Principal') {
                    principalPaid = amountPaid;
                    loan.remainingBalance -= amountPaid;
                    balanceAfterPayment = loan.remainingBalance;
                    if (loan.remainingBalance <= 0) loan.status = 'Closed';
                    await loan.save();
                }
            }
        }

        // Create Payment Record
        const payment = new Payment({
            paymentId,
            loanId,
            loanType,
            paymentDate,
            paymentType,
            amountPaid,
            principalPaid,
            interestPaid,
            balanceAfterPayment,
            notes,
            user: req.user._id // Correctly assign user
        });

        await payment.save();

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: {
                paymentId,
                principalPaid,
                interestPaid,
                newBalance: balanceAfterPayment,
                nextDueDate: loanType === 'Bank' ? (await BankLoan.findOne({ loanId })).nextDueDate : null
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const { loanId, startDate, endDate } = req.query;
        const userId = await getUserIdForFilter(req);

        const filter = { user: userId }; // Filter by User
        if (loanId) filter.loanId = loanId;

        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) filter.paymentDate.$gte = new Date(startDate);
            if (endDate) filter.paymentDate.$lte = new Date(endDate);
        }

        const payments = await Payment.find(filter).sort({ paymentDate: -1 });
        res.json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPaymentsByLoanId = async (req, res) => {
    try {
        const payments = await Payment.find({ loanId: req.params.loanId }).sort({ paymentDate: -1 });
        res.json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
