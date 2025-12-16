const mongoose = require('mongoose');

const simulationSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentDate: { type: Date, default: Date.now },

    // The "Free Flow Cash" available in the user's pocket for this simulation stage
    walletBalance: { type: Number, default: 0, required: true },

    // Fixed Monthly Stats (copied from Budget at start, can be modified during sim if we add that feature)
    monthlyIncome: { type: Number, required: true },
    monthlyExpenses: { type: Number, required: true }, // Bills

    // Deep Copy of Loans at this specific stage
    loansSnapshot: [{
        originalLoanId: { type: String }, // Reference to real loan ID
        name: String,
        type: { type: String, enum: ['Bank', 'Hand'] },

        // Simulation State
        remainingBalance: Number,
        emi: Number,
        interestRate: Number, // % for Bank, 0 for Hand usually
        monthlyInterest: Number, // Amount for Hand

        // Status in Simulation
        status: { type: String, enum: ['Active', 'Closed'], default: 'Active' }
    }],

    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('SimulationSession', simulationSessionSchema);
