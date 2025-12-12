const mongoose = require('mongoose');

const bankLoanSchema = new mongoose.Schema({
    loanId: { type: String, required: true, unique: true },
    loanName: { type: String, required: true },
    bankName: { type: String, required: true },
    loanType: { type: String, enum: ['Fresh', 'Ongoing'], required: true },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    emisPaid: { type: Number, default: 0 },
    remainingPrincipal: { type: Number, required: true },
    totalInterestPayable: { type: Number, required: true },
    nextDueDate: { type: Date },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('BankLoan', bankLoanSchema);
