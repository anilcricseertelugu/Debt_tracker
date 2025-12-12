const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const { getUserIdForFilter } = require('../utils/authHelper');

exports.getDashboardSummary = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);

        // Fetch all active loans for this user
        const bankLoans = await BankLoan.find({ status: 'Active', user: userId });
        const handLoans = await HandLoan.find({ status: 'Active', user: userId });

        // Calculate totals
        const bankOutstanding = bankLoans.reduce((sum, loan) => sum + loan.remainingPrincipal, 0);
        const bankMonthly = bankLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);

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
                totalInterestLiability: Math.round(totalBankInterestLiability),
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
        const userId = await getUserIdForFilter(req);

        const bankLoans = await BankLoan.find({ status: 'Active', user: userId });
        const handLoans = await HandLoan.find({ status: 'Active', user: userId });

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
                monthlyCashflow: []
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
