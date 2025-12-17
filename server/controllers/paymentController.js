const Payment = require('../models/Payment');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const { generatePaymentId } = require('../utils/idGenerator');
const { calculateNextDueDate } = require('../utils/calculations');
const { getUserIdForFilter } = require('../utils/authHelper');

// --- INTERNAL HELPER (Reused Logic) ---
const processPaymentLogic = async (data, user) => {
    const { loanId, loanType, paymentDate, paymentType, amountPaid, notes } = data;
    const paymentId = await generatePaymentId();

    let principalPaid = 0;
    let interestPaid = 0;
    let balanceAfterPayment = 0;

    // --- BANK LOAN LOGIC ---
    if (loanType === 'Bank') {
        const loan = await BankLoan.findOne({ loanId });
        if (!loan) throw new Error(`Bank Loan ${loanId} not found`);

        if (paymentType === 'EMI' || paymentType === 'Partial') {
            const monthlyRate = (loan.interestRate / 12) / 100;
            interestPaid = Math.round(loan.remainingPrincipal * monthlyRate);
            principalPaid = amountPaid - interestPaid;

            if (principalPaid < 0) principalPaid = 0;

            loan.remainingPrincipal -= principalPaid;
            loan.remainingPrincipal = Math.max(0, Math.round(loan.remainingPrincipal));
            loan.emisPaid += 1;

            if (loan.nextDueDate) {
                loan.nextDueDate = calculateNextDueDate(loan.startDate, loan.emisPaid);
            }

            balanceAfterPayment = loan.remainingPrincipal;
            await loan.save();
        }
        else if (paymentType === 'Foreclosure') {
            principalPaid = loan.remainingPrincipal;
            loan.remainingPrincipal = 0;
            loan.status = 'Closed';
            balanceAfterPayment = 0;
            await loan.save();
        }
    }

    // --- HAND LOAN LOGIC ---
    else if (loanType === 'Hand') {
        const loan = await HandLoan.findOne({ loanId });
        if (!loan) throw new Error(`Hand Loan ${loanId} not found`);

        if (loan.loanType === 'Interest_Free') {
            loan.totalRepaid += amountPaid;
            loan.remainingBalance = loan.principalAmount - loan.totalRepaid;
            balanceAfterPayment = loan.remainingBalance;
            if (loan.remainingBalance <= 0) loan.status = 'Closed';
            await loan.save();
        }
        else {
            if (paymentType === 'Interest') {
                interestPaid = amountPaid;
                loan.lastInterestPaidDate = paymentDate;
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
        user: user._id
    });

    await payment.save();

    return {
        paymentId,
        principalPaid,
        interestPaid,
        newBalance: balanceAfterPayment,
        // Only fetch next due date if bank loan, otherwise null
        nextDueDate: loanType === 'Bank' ? (await BankLoan.findOne({ loanId })).nextDueDate : null
    };
};

exports.createPayment = async (req, res) => {
    try {
        const result = await processPaymentLogic(req.body, req.user);
        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: result
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.autoPayAll = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const paymentDate = new Date().toISOString().split('T')[0];

        // 1. Fetch Active Loans
        const bankLoans = await BankLoan.find({ user: userId, status: 'Active' });
        const handLoans = await HandLoan.find({ user: userId, status: 'Active', loanType: 'Monthly_Interest' });

        let processedCount = 0;
        let totalPaid = 0;
        const errors = [];

        // 2. Process Bank Loans (Pay EMI)
        for (const loan of bankLoans) {
            try {
                await processPaymentLogic({
                    loanId: loan.loanId,
                    loanType: 'Bank',
                    paymentDate,
                    paymentType: 'EMI',
                    amountPaid: loan.emiAmount,
                    notes: 'Auto Pay All - EMI'
                }, req.user);
                processedCount++;
                totalPaid += loan.emiAmount;
            } catch (err) {
                errors.push(`Bank Loan ${loan.loanName}: ${err.message}`);
            }
        }

        // 3. Process Hand Loans (Pay Interest)
        for (const loan of handLoans) {
            try {
                if (loan.monthlyInterestAmount > 0) {
                    await processPaymentLogic({
                        loanId: loan.loanId,
                        loanType: 'Hand',
                        paymentDate,
                        paymentType: 'Interest',
                        amountPaid: loan.monthlyInterestAmount,
                        notes: 'Auto Pay All - Interest'
                    }, req.user);
                    processedCount++;
                    totalPaid += loan.monthlyInterestAmount;
                }
            } catch (err) {
                errors.push(`Hand Loan ${loan.lenderName}: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Processed ${processedCount} payments totaling ₹${totalPaid.toLocaleString()}`,
            processedCount,
            errors
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
