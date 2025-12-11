// Minimal validation logic for now, can perform checking on inputs
exports.validateBankLoan = (data) => {
    const errors = [];
    if (!data.loanName) errors.push('Loan Name is required');
    if (!data.bankName) errors.push('Bank Name is required');
    if (!data.principalAmount || data.principalAmount <= 0) errors.push('Valid Principal Amount is required');
    return errors;
};
