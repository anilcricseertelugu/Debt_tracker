const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
    configKey: { type: String, required: true, unique: true, default: 'settings' },
    prepaymentChargePercentage: { type: Number, default: 2.0 },
    currencySymbol: { type: String, default: '₹' },
    dateFormat: { type: String, default: 'DD-MM-YYYY' },
    lastBackupDate: { type: Date },
    appVersion: { type: String, default: '1.0.0' }
}, {
    timestamps: true
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
