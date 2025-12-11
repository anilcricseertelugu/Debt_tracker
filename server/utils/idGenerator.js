const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const Payment = require('../models/Payment');

/**
 * Generate next ID (e.g., BL001 -> BL002)
 * @param {string} prefix - 'BL', 'HL', 'PM'
 * @param {Object} model - Mongoose model
 * @param {string} idField - 'loanId' or 'paymentId'
 */
const generateId = async (prefix, model, idField) => {
    // Find the last created document
    const lastDoc = await model.findOne().sort({ createdAt: -1 });

    if (!lastDoc) {
        return `${prefix}001`;
    }

    const lastId = lastDoc[idField];
    // Extract number part
    const numberPart = parseInt(lastId.replace(prefix, ''), 10);

    if (isNaN(numberPart)) {
        return `${prefix}001`; // Fallback
    }

    const nextNumber = numberPart + 1;
    // Pad with zeros (3 digits)
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};

exports.generateBankLoanId = () => generateId('BL', BankLoan, 'loanId');
exports.generateHandLoanId = () => generateId('HL', HandLoan, 'loanId');
exports.generatePaymentId = () => generateId('PM', Payment, 'paymentId');
