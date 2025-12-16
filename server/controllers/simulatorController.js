const SimulationSession = require('../models/SimulationSession');
const Income = require('../models/Income');
const RecurringExpense = require('../models/RecurringExpense');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const { getUserIdForFilter } = require('../utils/authHelper');

// Helper to get next month date
const getNextMonth = (date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    return d;
};

const runMonthlyCycle = (session, extraPayments = {}) => {
    // 1. Start with Previous Month's Closing Balance (e.g., 41k)
    let wallet = session.walletBalance;
    let logs = [];

    // 2. Process Jan's Extra Payments (Foreclosure/Partial)
    // This happens *after* Jan EMIs (already deducted in prev cycle) but *before* Feb Income.
    if (extraPayments) {
        for (const [loanId, amount] of Object.entries(extraPayments)) {
            const numAmount = Number(amount);
            if (numAmount > 0) {
                const loan = session.loansSnapshot.find(l =>
                    (l._id && l._id.toString() === loanId) ||
                    (l.originalLoanId === loanId)
                );

                if (loan && loan.status === 'Active') {
                    // FORECLOSURE (Strict Logic)
                    if (numAmount >= (loan.remainingBalance - 10)) {
                        const foreclosureAmount = loan.remainingBalance;
                        if (wallet >= foreclosureAmount) {
                            wallet -= foreclosureAmount;
                            loan.remainingBalance = 0;
                            loan.status = 'Closed';
                            logs.push(`${loan.name} foreclosed`);
                            continue;
                        }
                    }
                    // PARTIAL
                    else {
                        if (wallet >= numAmount) {
                            wallet -= numAmount;
                            loan.remainingBalance -= numAmount;
                            logs.push(`Paid extra ₹${numAmount} to ${loan.name}`);
                            if (loan.remainingBalance <= 10) {
                                loan.remainingBalance = 0;
                                loan.status = 'Closed';
                                logs.push(`${loan.name} closed via extra payment!`);
                            }
                        } else {
                            logs.push(`Skipped extra payment: Insufficient Wallet`);
                        }
                    }
                }
            }
        }
    }

    // 3. CAPTURE ROLLOVER (The Bridge State)
    // This is Jan's Closing Balance (e.g. 7.8k). It becomes Feb's Opening Rollover.
    const rollover = wallet;

    // 4. Simulate Feb (Income - Expenses - New Obligations)
    wallet += (session.monthlyIncome || 0);
    wallet -= (session.monthlyExpenses || 0);

    let totalObligations = 0;
    if (session.loansSnapshot) {
        session.loansSnapshot.forEach(loan => {
            if (loan.status === 'Closed') return;

            let paymentDue = 0;
            let interestCharged = 0;

            if (loan.type === 'Bank') {
                paymentDue = loan.emi || 0;
                const r = (loan.remainingBalance || 0);
                const ir = (loan.interestRate || 0);
                interestCharged = (r * (ir / 100)) / 12;
            } else {
                paymentDue = loan.monthlyInterest || 0;
                interestCharged = loan.monthlyInterest || 0;
            }

            totalObligations += paymentDue;
            wallet -= paymentDue;

            if (loan.type === 'Bank') {
                const principalComponent = paymentDue - interestCharged;
                loan.remainingBalance -= principalComponent;
            }

            // Standard Close Check (Natural)
            if (loan.remainingBalance <= 10) {
                loan.remainingBalance = 0;
                loan.status = 'Closed';
                logs.push(`${loan.name} closed naturally!`);
            }
        });
    }

    // 5. Compute Feb's Monthly Cash (Surplus)
    const monthlyCash = (session.monthlyIncome || 0) - (session.monthlyExpenses || 0) - totalObligations;

    // 6. Output Generation
    session.currentDate = getNextMonth(session.currentDate);
    session.walletBalance = wallet; // Feb End Balance (e.g. 51.5k)

    session.financialBreakdown = {
        rollover: rollover,        // Feb Start Balance (e.g. 7.8k)
        monthlySurplus: monthlyCash
    };

    session.markModified('loansSnapshot');
    return logs;
};

exports.initSimulation = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);

        // 1. Initial Data Fetch (Only time we read REAL DB)
        const incomes = await Income.find({ user: userId });
        const expenses = await RecurringExpense.find({ user: userId });
        const bankLoans = await BankLoan.find({ user: userId, status: 'Active' });
        const handLoans = await HandLoan.find({ user: userId, status: 'Active' });

        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalRecurring = expenses.reduce((sum, e) => sum + e.amount, 0);

        const loanSnapshots = [
            ...bankLoans.map(l => ({
                originalLoanId: l._id.toString(),
                name: `${l.bankName} - ${l.loanName}`,
                type: 'Bank',
                remainingBalance: l.remainingPrincipal,
                emi: l.emiAmount,
                interestRate: l.interestRate,
                monthlyInterest: 0,
                status: 'Active'
            })),
            ...handLoans.map(l => ({
                originalLoanId: l._id.toString(),
                name: l.lenderName,
                type: 'Hand',
                remainingBalance: l.remainingBalance,
                emi: 0,
                interestRate: 0,
                monthlyInterest: l.loanType === 'Monthly_Interest' ? l.monthlyInterestAmount : 0,
                status: 'Active'
            }))
        ];

        // START STATE
        await SimulationSession.deleteMany({ user: userId });

        const initialSurplus = totalIncome - totalRecurring - (loanSnapshots.reduce((sum, l) => sum + (l.emi || l.monthlyInterest || 0), 0));

        const session = new SimulationSession({
            user: userId,
            currentDate: new Date(), // Stage 1 Date
            walletBalance: 0,
            monthlyIncome: totalIncome,
            monthlyExpenses: totalRecurring,
            initialMonthlySurplus: initialSurplus,
            loansSnapshot: loanSnapshots,
            financialBreakdown: {
                rollover: 0,
                monthlySurplus: 0
            }
        });

        // AUTO-ADVANCE: Process Stage 1 immediately so output feeds Stage 2
        console.log("Auto-Advancing Stage 1...");
        runMonthlyCycle(session, {});
        // Result: Session now holds Output of Stage 1 (Jan Date, Jan Starting Balance, Stage 1 Loan States)

        await session.save(); // Persist Stage 1 Output

        res.json({ success: true, data: session });

    } catch (err) {
        console.error("SIMULATOR ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.processNextStage = async (req, res) => {
    console.log("Processing Next Stage...");
    try {
        const userId = await getUserIdForFilter(req);
        const { extraPayments } = req.body;

        // 1. Read Previous Stage Output
        const session = await SimulationSession.findOne({ user: userId });
        if (!session) {
            return res.status(404).json({ message: 'No active simulation found' });
        }

        // 2. Process (Input: Previous Session -> Output: Next Session)
        const logs = runMonthlyCycle(session, extraPayments);

        // 3. Persist Output (for next stage to read)
        console.log("Saving Session Output...", session.currentDate);
        await session.save();
        console.log("Session Output Saved.");

        res.json({ success: true, data: session, logs });

    } catch (err) {
        console.error("CRASH IN NEXT STAGE:", err);
        res.status(500).json({ success: false, message: err.message, stack: err.stack });
    }
};

exports.getSimulationSession = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);
        const session = await SimulationSession.findOne({ user: userId });
        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
