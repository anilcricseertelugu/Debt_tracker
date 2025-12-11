const mongoose = require('mongoose');

const handLoanSchema = new mongoose.Schema({
    loanId: { type: String, required: true, unique: true },
    lenderName: { type: String, required: true },
    loanType: { type: String, enum: ['Monthly_Interest', 'Interest_Free'], required: true },
    principalAmount: { type: Number, required: true },
    monthlyInterestRate: { type: Number }, // Optional, for Monthly_Interest
    monthlyInterestAmount: { type: Number }, // Optional, for Monthly_Interest
    startDate: { type: Date, required: true },
    totalRepaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, required: true },
    lastInterestPaidDate: { type: Date },
    interestDue: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' }
}, {
    timestamps: true
});

module.exports = mongoose.model('HandLoan', handLoanSchema);
