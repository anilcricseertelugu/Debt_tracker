const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
// const Payment = require('../models/Payment');

exports.getDashboardSummary = async (req, res) => {
    try {
        // Fetch all active loans
        const bankLoans = await BankLoan.find({ status: 'Active' });
        const handLoans = await HandLoan.find({ status: 'Active' });

        // Calculate totals
        const bankOutstanding = bankLoans.reduce((sum, loan) => sum + loan.remainingPrincipal, 0);
        const bankMonthly = bankLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);
        const bankInterestLiability = bankLoans.reduce((sum, loan) =>
            sum + Math.max(0, (loan.totalInterestPayable - (loan.emiAmount * loan.emisPaid * (loan.interestRate / 100)))), 0
            // Aprox calc for interest liability left? 
            // Better: Calculate total remaining payments * EMI - remaining principal?
            // Remaining EMIs = (Tenure - Paid). 
            // Total Remaining Pay = Remaining EMIs * EMI.
            // Interest Liability = Total Remaining Pay - Remaining Principal.
        );

        // Correct Interest Liability Calculation
        let totalBankInterestLiability = 0;
        bankLoans.forEach(loan => {
            const remainingEmis = loan.tenureMonths - loan.emisPaid;
            const totalRemainingPay = remainingEmis * loan.emiAmount;
            const interestOnly = totalRemainingPay - loan.remainingPrincipal;
            totalBankInterestLiability += Math.max(0, interestOnly);
        });

        const handOutstanding = handLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
        // Hand loans monthly obligation (interest only)
        const handMonthly = handLoans.reduce((sum, loan) =>
            sum + (loan.monthlyInterestAmount || (loan.principalAmount * (loan.monthlyInterestRate || 0) / 100) || 0), 0
        );

        const totalOutstanding = bankOutstanding + handOutstanding;
        const totalMonthlyObligation = bankMonthly + handMonthly;

        res.json({
            success: true,
            data: {
                totalOutstanding: Math.round(totalOutstanding),
                totalMonthlyObligation: Math.round(totalMonthlyObligation),
                activeLoans: {
                    bank: bankLoans.length,
                    hand: handLoans.length,
                    total: bankLoans.length + handLoans.length
                },
                totalInterestLiability: Math.round(totalBankInterestLiability), // Mainly bank loans have predictable future interest
                debtComposition: {
                    bankLoans: Math.round(bankOutstanding),
                    handLoansInterest: Math.round(handLoans.filter(l => l.loanType === 'Monthly_Interest').reduce((s, l) => s + l.remainingBalance, 0)),
                    handLoansFree: Math.round(handLoans.filter(l => l.loanType === 'Interest_Free').reduce((s, l) => s + l.remainingBalance, 0))
                }
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDashboardAnalytics = async (req, res) => {
    try {
        const bankLoans = await BankLoan.find({ status: 'Active' });
        const handLoans = await HandLoan.find({ status: 'Active' });

        // Debt Composition Pie Data
        const bankTotal = bankLoans.reduce((s, l) => s + l.remainingPrincipal, 0);
        const handInterest = handLoans.filter(l => l.loanType === 'Monthly_Interest').reduce((s, l) => s + l.remainingBalance, 0);
        const handFree = handLoans.filter(l => l.loanType === 'Interest_Free').reduce((s, l) => s + l.remainingBalance, 0);

        // Principal vs Interest (Bank)
        const principalVsInterest = bankLoans.map(loan => {
            const remainingEmis = loan.tenureMonths - loan.emisPaid;
            const totalPay = remainingEmis * loan.emiAmount;
            const interest = Math.max(0, totalPay - loan.remainingPrincipal);
            return {
                loanName: loan.loanName,
                principal: Math.round(loan.remainingPrincipal),
                interest: Math.round(interest)
            };
        });

        // Timeline
        const timeline = bankLoans.map(loan => {
            // Estimate end date: Start + Tenure
            const end = new Date(loan.startDate);
            end.setMonth(end.getMonth() + loan.tenureMonths);
            return {
                loanName: loan.loanName,
                endDate: end.toISOString().split('T')[0]
            };
        });

        res.json({
            success: true,
            data: {
                debtComposition: {
                    labels: ['Bank Loans', 'Hand Loans (Interest)', 'Hand Loans (Free)'],
                    values: [Math.round(bankTotal), Math.round(handInterest), Math.round(handFree)]
                },
                principalVsInterest,
                loanTimeline: timeline,
                // Monthly Cashflow projection requires complex amortization generation for next 12 months for all loans.
                // Omitted for brevity in this initial pass, or return empty placeholder
                monthlyCashflow: []
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
