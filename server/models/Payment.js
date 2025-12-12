const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    loanId: { type: String, required: true, index: true }, // Not using ObjectId ref to keep loose coupling as per spec string ID? 
    // Spec says "Reference to loan (indexed)" but example showed "BL001". 
    // I will use String to match the custom IDs (BL001 etc).
    loanType: { type: String, enum: ['Bank', 'Hand'], required: true },
    paymentDate: { type: Date, required: true },
    paymentType: {
        type: String,
        enum: ['EMI', 'Interest', 'Principal', 'Partial', 'Foreclosure', 'Repayment'],
        required: true
    },
    amountPaid: { type: Number, required: true },
    principalPaid: { type: Number, default: 0 },
    interestPaid: { type: Number, default: 0 },
    balanceAfterPayment: { type: Number, required: true },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

// Index as per spec
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
