const SimulationSession = require('../models/SimulationSession');
const { getUserIdForFilter } = require('../utils/authHelper');

// --- THE ROBOT ENGINE ---
// Runs a simulation starting from the current session state using a specific strategy.
const runRobotSimulation = (loansInput, strategy, sessionContext) => {
    // 1. Deep Copy Data (Don't mutate original session)
    let loans = JSON.parse(JSON.stringify(loansInput));
    let { monthlyIncome, monthlyExpenses, initialWallet } = sessionContext;

    let wallet = initialWallet || 0;
    let months = 0;
    let totalInterestPaid = 0;

    // Logs for the user to see exactly what the Robot did
    let executionLog = [];
    let timeline = [];

    // Safety Break: 600 Months (50 Years)
    while (months < 600) {
        let activeLoans = loans.filter(l => l.balance > 0);

        // --- VICTORY CHECK ---
        if (activeLoans.length === 0) {
            if (timeline.length > 0 && timeline[timeline.length - 1].balance > 0) {
                timeline.push({ month: months, balance: 0 });
            }
            break;
        }

        let monthLog = { month: months + 1, messages: [] };

        // --- 1. ACCRUE INTEREST ---
        activeLoans.forEach(l => {
            if (l.rate > 0) {
                const interest = Math.round(l.balance * (l.rate / 1200));
                l.balance += interest;
                totalInterestPaid += interest;
            }
        });

        // --- 2. INCOME & EXPENSES ---
        // Wallet grows by Surplus
        wallet += monthlyIncome;
        if (monthlyExpenses > 0) wallet -= monthlyExpenses;

        // --- 3. PAY MINIMUMS (Mandatory) ---
        activeLoans.forEach(l => {
            let payment = l.minPayment;
            if (payment > l.balance) payment = l.balance;

            if (wallet >= payment) {
                wallet -= payment;
                l.balance -= payment;
            } else {
                // Bankrupt / Debt Trap scenario
                l.balance -= wallet;
                wallet = 0;
                monthLog.messages.push("CRITICAL: Wallet empty, verified minimums partially paid.");
            }
        });

        // --- 4. ROBOT MOVE (Strategy) ---
        // Only if we have surplus cash
        if (wallet > 0 && strategy !== 'BASELINE') {
            // A. Identify Targets based on Strategy
            let targets = loans.filter(l => l.balance > 0);

            if (strategy === 'SNOWBALL') {
                // Smallest Balance First
                targets.sort((a, b) => a.balance - b.balance);
            } else if (strategy === 'AVALANCHE') {
                // Highest Rate First
                targets.sort((a, b) => b.rate - a.rate);
            } else if (strategy === 'HIGHEST_PRINCIPAL') {
                // Highest Balance First (The "Heavy Lifter" Robot)
                targets.sort((a, b) => b.balance - a.balance);
            }

            // B. Execute or Wait
            if (targets.length > 0) {
                const target = targets[0]; // Top objective

                if (wallet >= target.balance) {
                    // KILL CONFIRMED
                    const payAmount = target.balance;
                    wallet -= payAmount;
                    target.balance = 0;
                    monthLog.messages.push(`ROBOT ACTION: Foreclosed ${target.name} (Paid ₹${payAmount.toLocaleString()})`);
                } else {
                    // HOLD POSITION
                    monthLog.messages.push(`ROBOT WAITING: Accumulating for ${target.name} (Has ₹${wallet.toLocaleString()} / Needs ₹${target.balance.toLocaleString()})`);
                }
            }
        } else if (strategy === 'BASELINE') {
            // Baseline Robot just hoards cash or pays minimums. 
            // Usually baseline in these sims implies "min payments only".
            // We just let `wallet` accumulate without extra payments.
        }

        months++;

        // --- 5. SNAPSHOT ---
        const totalDebt = loans.reduce((sum, l) => sum + l.balance, 0);
        timeline.push({ month: months, balance: Math.round(totalDebt) });
        if (monthLog.messages.length > 0) executionLog.push(monthLog);
    }

    return {
        strategy,
        months,
        totalInterestPaid,
        completionDate: new Date(new Date().setMonth(new Date().getMonth() + months)),
        timeline,
        executionLog
    };
};

const Income = require('../models/Income');
const RecurringExpense = require('../models/RecurringExpense');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');

// Helper to run one month of the simulation (to get consistent start state)
const runMonthlyCycle = (session) => {
    // Stage 1 logic from simulatorController (Replicated for safety/independence)
    let wallet = session.walletBalance || 0;
    wallet += (session.monthlyIncome || 0);
    wallet -= (session.monthlyExpenses || 0);

    let totalObligations = 0;
    if (session.loansSnapshot) {
        session.loansSnapshot.forEach(loan => {
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
                loan.remainingBalance -= (paymentDue - interestCharged);
            }
        });
    }

    // Set end of Month 1 state
    session.walletBalance = wallet;
    const d = new Date(session.currentDate);
    d.setMonth(d.getMonth() + 1);
    session.currentDate = d;
    return session;
};

exports.calculateStrategies = async (req, res) => {
    try {
        const userId = await getUserIdForFilter(req);

        // --- RESET LOGIC (Satisfies "Initialize session again like reset") ---
        // 1. Fetch Source Truth
        const incomes = await Income.find({ user: userId });
        const expenses = await RecurringExpense.find({ user: userId });
        const bankLoans = await BankLoan.find({ user: userId, status: 'Active' });
        const handLoans = await HandLoan.find({ user: userId, status: 'Active' });

        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalRecurring = expenses.reduce((sum, e) => sum + e.amount, 0);

        const loanSnapshots = [
            ...bankLoans.map(l => ({
                originalLoanId: l._id.toString(),
                name: `${l.bankName} - ${l.loanName}`, // Normalized Name
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

        // 2. Wipe Old Session & Create New
        await SimulationSession.deleteMany({ user: userId });

        const initialSurplus = totalIncome - totalRecurring - (loanSnapshots.reduce((sum, l) => sum + (l.emi || l.monthlyInterest || 0), 0));

        let session = new SimulationSession({
            user: userId,
            currentDate: new Date(),
            walletBalance: 0, // Starts at 0
            monthlyIncome: totalIncome,
            monthlyExpenses: totalRecurring,
            initialMonthlySurplus: initialSurplus,
            loansSnapshot: loanSnapshots
        });

        // 3. Fast Forward: Process Month 1 (Matches Simulator's "Auto-Advance Stage 1")
        // This calculates the rolling cash at end of M1, so Robot starts deciding for M2.
        runMonthlyCycle(session);
        await session.save();

        // --- ROBOT EXECUTION (On Fresh Data) ---

        // Prepare Context
        const { monthlyIncome, monthlyExpenses, walletBalance, loansSnapshot } = session;
        const normalizedLoans = loansSnapshot.map(l => ({
            name: l.name,
            balance: l.remainingBalance,
            rate: l.interestRate || 0,
            minPayment: l.emi || l.monthlyInterest || 0
        }));

        const context = {
            monthlyIncome: monthlyIncome || 0,
            monthlyExpenses: monthlyExpenses || 0,
            initialWallet: walletBalance || 0
        };

        const baseline = runRobotSimulation(normalizedLoans, 'BASELINE', context);
        const snowball = runRobotSimulation(normalizedLoans, 'SNOWBALL', context);
        const avalanche = runRobotSimulation(normalizedLoans, 'AVALANCHE', context);
        const highestPrincipal = runRobotSimulation(normalizedLoans, 'HIGHEST_PRINCIPAL', context);

        res.json({
            success: true,
            data: {
                budgetOverview: {
                    income: monthlyIncome,
                    expenses: monthlyExpenses,
                    initialWallet: walletBalance
                },
                baseline,
                strategies: {
                    snowball,
                    avalanche,
                    highestPrincipal
                }
            }
        });

    } catch (err) {
        console.error("Strategy Reset & Calc Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
