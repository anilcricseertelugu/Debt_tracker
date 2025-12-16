const mongoose = require('mongoose');

const savedPlanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // e.g., "Aggressive Repayment Plan A"
    description: { type: String },

    // Snapshot of the configuration used for simulation
    configuration: {
        totalMonthlyIncome: { type: Number, required: true },
        totalMonthlyExpenses: { type: Number, required: true },
        initialSavings: { type: Number, default: 0 }
    },

    // The Resulting Forecast Data (JSON blob of the timeline)
    // We store the computed timeline so we can just load and view it without re-simulating if logic changes
    forecastData: [{
        monthIndex: Number,
        monthLabel: String,
        openingBalance: Number,
        totalEMI: Number,
        surplus: Number,
        closingBalance: Number,
        loans: [{
            loanId: String,
            name: String,
            remainingBalance: Number,
            status: String
        }]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('SavedPlan', savedPlanSchema);
