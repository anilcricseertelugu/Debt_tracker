const SimulationSession = require('../models/SimulationSession');
const Income = require('../models/Income');
const RecurringExpense = require('../models/RecurringExpense');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const { getUserIdForFilter } = require('../utils/authHelper');

const { addMonths } = require('../utils/dateHelper');

// Helper removed, using addMonths instead


const runMonthlyCycle = (session, extraPayments = {}, walletAdjustment = 0) => {
    // 1. Start with Previous Month's Closing Balance (e.g., 41k)
    let wallet = session.walletBalance;
    let logs = [];

    // 0. Process Wallet Adjustment (User Edit) BEFORE Payments
    if (walletAdjustment !== 0) {
        wallet += walletAdjustment;
        logs.push(`Wallet Adjustment: ${walletAdjustment > 0 ? '+' : ''}₹${walletAdjustment.toLocaleString()}`);
    }

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

                            // CALCULATE SAVINGS BEFORE CLOSING
                            const saved = calculateSavings(loan, session);
                            session.totalInterestSaved = (session.totalInterestSaved || 0) + saved;

                            wallet -= foreclosureAmount;
                            loan.remainingBalance = 0;
                            loan.status = 'Closed';
                            logs.push(`${loan.name} foreclosed. Saved ₹${Math.round(saved).toLocaleString()} in interest!`);
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
    session.currentDate = addMonths(session.currentDate, 1);
    session.walletBalance = wallet; // Feb End Balance (e.g. 51.5k)

    session.financialBreakdown = {
        rollover: rollover,        // Feb Start Balance (e.g. 7.8k)
        monthlySurplus: monthlyCash
    };

    // Ensure strictly number logic
    if (typeof session.totalInterestSaved !== 'number') session.totalInterestSaved = 0;

    session.markModified('loansSnapshot');
    return logs;
};

// --- HELPERS ---
const calculateSavings = (loan, session) => {
    // BANK LOANS: Calculate future interest saved
    if (loan.type === 'Bank') {
        const bal = loan.remainingBalance || 0;
        const emi = loan.emi || 0;
        const r = (loan.interestRate || 0) / 1200; // Monthly Rate

        if (bal <= 0 || emi <= 0 || r <= 0) return 0;

        // NPER = -LOG(1 - (r*PV/PMT)) / LOG(1+r)
        // Avoid Domain Error for Log
        const inner = 1 - (r * bal / emi);
        if (inner <= 0) return 0; // Should not happen for active loan usually

        const nper = -Math.log(inner) / Math.log(1 + r);
        const totalFuturePayable = nper * emi;

        // Savings = Total Future Payable - Current Principal Balance
        const savings = Math.max(0, totalFuturePayable - bal);
        return savings;
    }

    // HAND LOANS: Calculate savings from monthly interest
    if (loan.type === 'Hand') {
        const monthlyInterest = loan.monthlyInterest || 0;
        if (monthlyInterest <= 0) return 0; // Interest-free hand loans

        // Calculate longest active loan tenure
        let longestTenure = 60; // Default fallback

        if (session && session.loansSnapshot) {
            const activeBankLoans = session.loansSnapshot.filter(l =>
                l.status === 'Active' && l.type === 'Bank'
            );

            if (activeBankLoans.length > 0) {
                const tenures = activeBankLoans.map(l => {
                    const bal = l.remainingBalance || 0;
                    const emi = l.emi || 0;
                    const r = (l.interestRate || 0) / 1200;

                    if (bal <= 0 || emi <= 0 || r <= 0) return 0;

                    const inner = 1 - (r * bal / emi);
                    if (inner <= 0) return 0;

                    return -Math.log(inner) / Math.log(1 + r);
                });

                const maxTenure = Math.max(...tenures);
                if (maxTenure > 0) {
                    longestTenure = Math.ceil(maxTenure);
                }
            }
        }

        const savings = monthlyInterest * longestTenure;
        return savings;
    }

    return 0;
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
            ...handLoans.map(l => {
                let monthlyInterest = 0;
                // Calculate monthly interest for Monthly_Interest type loans
                if (l.loanType === 'Monthly_Interest' && l.monthlyInterestRate && l.monthlyInterestRate > 0) {
                    monthlyInterest = (l.principalAmount * l.monthlyInterestRate) / 100;
                }

                return {
                    originalLoanId: l._id.toString(),
                    name: l.lenderName,
                    type: 'Hand',
                    remainingBalance: l.remainingBalance,
                    emi: 0,
                    interestRate: 0,
                    monthlyInterest: monthlyInterest,
                    status: 'Active'
                };
            })
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
        const { extraPayments, monthlyIncome, monthlyExpenses, walletAdjustment } = req.body;

        // 1. Read Previous Stage Output
        const session = await SimulationSession.findOne({ user: userId });
        if (!session) {
            return res.status(404).json({ message: 'No active simulation found' });
        }

        // UPDATE SESSION CONFIG IF PROVIDED (Persists for future months)
        if (monthlyIncome !== undefined) session.monthlyIncome = Number(monthlyIncome);
        if (monthlyExpenses !== undefined) session.monthlyExpenses = Number(monthlyExpenses);

        // 2. Process (Input: Previous Session -> Output: Next Session)
        const logs = runMonthlyCycle(session, extraPayments, Number(walletAdjustment) || 0);

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
