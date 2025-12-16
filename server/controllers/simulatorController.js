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

exports.initSimulation = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);

        // 1. Fetch REAL Live Data
        const incomes = await Income.find({ user: userId });
        const expenses = await RecurringExpense.find({ user: userId });
        const bankLoans = await BankLoan.find({ user: userId, status: 'Active' });
        const handLoans = await HandLoan.find({ user: userId, status: 'Active' });

        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalRecurring = expenses.reduce((sum, e) => sum + e.amount, 0);

        // 2. Prepare Loan Snapshots
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

        // 3. Create Session (Start with Current Month, Surplus = 0 initially or calculated?)
        // Let's assume starting surplus is 0 or user's current projected savings?
        // Let's start clean for the 'Next Month'. The wallet accumulates AFTER the month passes.
        // Actually, Stage 1 is "Upcoming Month". User enters stage with 0 (or real savings?). 
        // For simplicity, Start Wallet = 0.

        // Delete old sessions for cleanup? Optional.
        await SimulationSession.deleteMany({ user: userId });

        const initialSurplus = totalIncome - totalRecurring - (loanSnapshots.reduce((sum, l) => sum + (l.emi || l.monthlyInterest || 0), 0));

        const session = new SimulationSession({
            user: userId,
            currentDate: new Date(), // Today
            walletBalance: 0,
            monthlyIncome: totalIncome,
            monthlyExpenses: totalRecurring,
            initialMonthlySurplus: initialSurplus, // Baseline
            loansSnapshot: loanSnapshots,
            financialBreakdown: {
                rollover: 0,
                monthlySurplus: 0 // Starts at 0, shows gain/loss relative to start
            }
        });

        await session.save();

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
        const { extraPayments } = req.body; // { loanId: amount, ... }

        // 1. Get Current Session
        const session = await SimulationSession.findOne({ user: userId });
        if (!session) {
            console.error("No session found");
            return res.status(404).json({ message: 'No active simulation found' });
        }
        console.log("Session Found. Current Wallet:", session.walletBalance);

        // Logic:
        // We are at Month X. User made 'extraPayments' decisions using current wallet/external cash.
        // We need to:
        // A. Apply Extra Payments (Reduce Principal immediately).
        // B. Run Monthly Cycle for Month X:
        //    - Add Income to Wallet
        //    - Subtract Fixed Expenses from Wallet
        //    - Deduct EMIs/Interest from Wallet
        //    - Apply Interest to Loan Balances (Bank)
        // C. Advance Date to Month X+1

        let wallet = session.walletBalance;
        let logs = []; // To tell user what happened

        // A. Apply User's Extra Payments (Pre-Payment)
        // User inputs "I pay 5k to Loan A".
        // Use wallet? Or "External Cash"?
        // Protocol: "Use available Free Flow Cash".
        // We assume frontend validated wallet balance, but we check here too?
        // Or user implies "I will use my salary that comes in". 
        // Let's assume standard: Income arrives at START of month.

        // Revised Flow for Clarity "One Stage at a Time":
        // 1. Income Arrives (+Income)
        // 2. Bills Paid (-Expenses)
        // 3. Obligations Paid (-EMIs)
        // 4. Result: "Free Flow Cash" for this month.
        // 5. User Decision: "Use this Cash to Pay Extra".
        // 6. Next Stage.

        // So, the 'processNextStage' effectively CLOSES the current month.

        // --- NEW: Calculate "Rollover" before adding new income ---
        // At this specific line, 'wallet' contains the Balance *after* user made Extra Payments (if logic was above)
        // correct? The logic below:
        // A. Apply User's Extra Payments (Pre-Payment)
        // Wait, the logic structure in file is: 
        // 1. Add Income
        // 2. Subtract Expenses
        // ...
        // 4. Apply Extra Payments (User Decision)

        // This order is tricky for "Rollover".
        // Conceptually:
        // Start of M2: Wallet has X (Rollover from M1).
        // Then M2 Income arrives.

        // So `session.walletBalance` IS the rollover at the start of the logic?
        // YES. `let wallet = session.walletBalance;` at line 99.

        const rolloverAmount = wallet; // Captured before any monthly modifications

        // Step 1: Add Income
        wallet += (session.monthlyIncome || 0);

        // Step 2: Subtract Expenses
        wallet -= (session.monthlyExpenses || 0);

        console.log("Wallet after Income/Exp:", wallet);

        // Step 3: Process Loans (Standard Obligations)
        let totalObligations = 0;
        if (session.loansSnapshot) {
            session.loansSnapshot.forEach(loan => {
                if (loan.status === 'Closed') return;

                let paymentDue = 0;
                let interestCharged = 0;

                if (loan.type === 'Bank') {
                    paymentDue = loan.emi || 0;
                    // Calculate Interest for this month
                    const r = (loan.remainingBalance || 0);
                    const ir = (loan.interestRate || 0);
                    interestCharged = (r * (ir / 100)) / 12;
                } else {
                    // Hand Loan - Interest Only
                    paymentDue = loan.monthlyInterest || 0;
                    interestCharged = loan.monthlyInterest || 0;
                }

                totalObligations += paymentDue;

                // Deduct from Wallet (Mandatory Payment)
                wallet -= paymentDue;

                // Update Balance (Amortization)
                if (loan.type === 'Bank') {
                    const principalComponent = paymentDue - interestCharged;
                    loan.remainingBalance -= principalComponent;
                }
                // Hand Loan: Interest paid, Principal stays same unless extra payment

                // Check Close (Natural)
                if (loan.remainingBalance <= 0) {
                    loan.remainingBalance = 0;
                    loan.status = 'Closed';
                    logs.push(`${loan.name} closed naturally!`);
                }
            });
        }

        // CALC: Monthly Surplus (The "New" Cash this month)
        // Income - Expenses - Obligations
        const monthlySurplus = (session.monthlyIncome || 0) - (session.monthlyExpenses || 0) - totalObligations;

        console.log("Wallet after Obligations:", wallet);

        // Step 4: Apply Extra Payments (User Decision)
        // User sends { "loan_id": 5000 }
        if (extraPayments) {
            for (const [loanId, amount] of Object.entries(extraPayments)) {
                const numAmount = Number(amount);
                if (numAmount > 0) {
                    const loan = session.loansSnapshot.find(l => l._id && l._id.toString() === loanId);
                    // Note: session.loansSnapshot is an array of subdocs, have _id

                    if (loan && loan.status === 'Active') {
                        if (wallet >= numAmount) {
                            wallet -= numAmount;
                            loan.remainingBalance -= numAmount;
                            logs.push(`Paid extra ₹${numAmount} to ${loan.name}`);

                            if (loan.remainingBalance <= 0) {
                                loan.remainingBalance = 0;
                                loan.status = 'Closed';
                                logs.push(`${loan.name} closed via extra payment!`);
                            }
                        } else {
                            logs.push(`Skipped extra payment to ${loan.name}: Insufficient Wallet`);
                        }
                    } else {
                        console.log("Loan not found or closed:", loanId);
                    }
                }
            }
        }

        // 5. Advance Date
        session.currentDate = getNextMonth(session.currentDate);
        session.walletBalance = wallet;

        // Save Breakdown
        // Note: The 'rolloverAmount' we calculated at top was BEFORE Current Month's payments were processed?
        // Wait, logic check:
        // Scenario: M1 Surplus = 10k.
        // User pays 5k Extra.
        // processNextStage Called.
        // Line 99: wallet = 10k.
        // line 100: rolloverAmount = 10k.
        // Then Step 1-3 run for M2.
        // Step 4 runs Extra Payment? 
        // WAIT. Extra payment logic is at lines 162+.
        // It subtracts from `wallet`.

        // Does Extra Payment come from "Rollover" or "Current Month Cash"?
        // It comes from the `wallet` variable which ACCUMULATES everything.
        // So the order matters for *calculation* but not final result?
        // But for "user to know", Rollover = What they started with.

        // However, if I pay Extra *inside* this function, that extra payment effectively reduces the rollover?
        // Or reduces the new surplus?
        // Usually Extra Payment is done at END of month (using surplus).
        // So rollover is intact?

        // Let's stick to simplest definition: Rollover = What was in wallet when function started.

        session.financialBreakdown = {
            rollover: rolloverAmount,
            monthlySurplus: monthlySurplus // Absolute value: Income - Expenses - CurrentObligations
        };

        session.markModified('loansSnapshot'); // CRITICAL: Ensure nested array changes (status='Closed') are persisted
        console.log("Saving Session...", session.currentDate);
        await session.save();
        console.log("Session Saved.");

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
