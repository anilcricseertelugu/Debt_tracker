/**
 * Calculate EMI (Equated Monthly Installment)
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {number} EMI amount
 */
exports.calculateEMI = (principal, annualRate, tenureMonths) => {
    const monthlyRate = (annualRate / 12) / 100;

    if (monthlyRate === 0) {
        return Math.round((principal / tenureMonths) * 100) / 100;
    }

    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)
        / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return Math.round(emi * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate total interest payable
 */
exports.calculateTotalInterest = (principal, emi, tenureMonths) => {
    const totalAmount = emi * tenureMonths;
    // If result is negative (e.g. very short tenure?), clamp to 0, though shouldn't happen with correct inputs
    return Math.max(0, Math.round((totalAmount - principal) * 100) / 100);
};

/**
 * Generate complete amortization schedule
 */
exports.generateAmortizationSchedule = (principal, annualRate, tenureMonths, emisPaid = 0) => {
    const monthlyRate = (annualRate / 12) / 100;
    // Use the exported calculateEMI to ensure consistency
    const emi = exports.calculateEMI(principal, annualRate, tenureMonths);

    let balance = principal;
    const schedule = [];

    // Calculate balance after paid EMIs
    for (let i = 1; i <= emisPaid; i++) {
        const interest = balance * monthlyRate;
        const principalPart = emi - interest;
        balance -= principalPart;
    }

    // Generate remaining schedule
    for (let month = emisPaid + 1; month <= tenureMonths; month++) {
        const interest = balance * monthlyRate;
        let principalPart = emi - interest;

        // Adjust last payment to bring balance exactly to 0 if needed (handling rounding errors)
        // Though spec doesn't explicitly ask for this, it's good practice. 
        // However, sticking to strict spec logic:
        // "balance -= principalPart"

        balance -= principalPart;

        schedule.push({
            month: month,
            emiAmount: Math.round(emi * 100) / 100,
            principalComponent: Math.round(principalPart * 100) / 100,
            interestComponent: Math.round(interest * 100) / 100,
            remainingBalance: Math.round(Math.max(0, balance) * 100) / 100
        });
    }

    return schedule;
};

/**
 * Calculate foreclosure amount
 */
exports.calculateForeclosure = (
    remainingPrincipal,
    annualRate,
    lastPaymentDate,
    foreclosureDate,
    prepaymentChargePercent = 2
) => {
    // Calculate days between last payment and foreclosure
    const lastPayment = new Date(lastPaymentDate);
    const foreclosure = new Date(foreclosureDate);

    const diffTime = foreclosure - lastPayment;
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate accrued interest
    const dailyRate = annualRate / 365 / 100;
    // Ensure non-negative duration
    const effectiveDaysString = Math.max(0, daysDiff);

    const accruedInterest = remainingPrincipal * dailyRate * effectiveDaysString;

    // Calculate prepayment charges
    const prepaymentCharge = (remainingPrincipal * prepaymentChargePercent) / 100;

    // Total foreclosure amount
    const totalAmount = remainingPrincipal + accruedInterest + prepaymentCharge;

    return {
        remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
        accruedInterest: Math.round(accruedInterest * 100) / 100,
        prepaymentCharge: Math.round(prepaymentCharge * 100) / 100,
        totalForeclosureAmount: Math.round(totalAmount * 100) / 100,
        daysSinceLastPayment: effectiveDaysString
    };
};

/**
 * Calculate accrued interest for hand loans (Monthly Interest)
 */
exports.calculateAccruedInterest = (principal, monthlyRate, lastInterestPaidDate, currentDate) => {
    const lastPaid = new Date(lastInterestPaidDate);
    const current = new Date(currentDate);

    const diffTime = current - lastPaid;
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const monthsElapsed = daysDiff / 30; // Approximate months as per spec
    const accruedInterest = (principal * monthlyRate * monthsElapsed) / 100;

    return {
        daysSinceLastPayment: Math.max(0, daysDiff),
        monthsElapsed: Math.round(monthsElapsed * 100) / 100,
        accruedInterest: Math.round(accruedInterest * 100) / 100
    };
};

/**
 * Calculate next due date for EMI
 */
exports.calculateNextDueDate = (startDate, emisPaid) => {
    const nextDue = new Date(startDate);
    nextDue.setMonth(nextDue.getMonth() + emisPaid + 1);
    return nextDue;
};

/**
 * Calculate remaining principal for ongoing loan
 */
exports.calculateRemainingPrincipal = (principal, annualRate, tenureMonths, emisPaid) => {
    const monthlyRate = (annualRate / 12) / 100;
    const emi = exports.calculateEMI(principal, annualRate, tenureMonths);

    let balance = principal;

    for (let i = 1; i <= emisPaid; i++) {
        const interest = balance * monthlyRate;
        const principalPart = emi - interest;
        balance -= principalPart;
    }

    return Math.round(Math.max(0, balance) * 100) / 100;
};
