const mongoose = require('mongoose');
const User = require('../models/User');
const BankLoan = require('../models/BankLoan');
const HandLoan = require('../models/HandLoan');
const Payment = require('../models/Payment');

const migrateData = async () => {
    try {
        console.log('Starting data migration...');

        // 1. Find the default admin user
        const adminUser = await User.findOne({ username: 'anil' });

        if (!adminUser) {
            console.error('Migration Aborted: Admin user "anil" not found. Please seed admin first.');
            return;
        }

        const adminId = adminUser._id;
        console.log(`Found admin user: ${adminUser.username} (${adminId})`);

        // 2. Update Bank Loans
        const bankResult = await BankLoan.updateMany(
            { user: { $exists: false } },
            { $set: { user: adminId } }
        );
        console.log(`Bank Loans Updated: ${bankResult.modifiedCount}`);

        // 3. Update Hand Loans
        const handResult = await HandLoan.updateMany(
            { user: { $exists: false } },
            { $set: { user: adminId } }
        );
        console.log(`Hand Loans Updated: ${handResult.modifiedCount}`);

        // 4. Update Payments
        const paymentResult = await Payment.updateMany(
            { user: { $exists: false } },
            { $set: { user: adminId } }
        );
        console.log(`Payments Updated: ${paymentResult.modifiedCount}`);

        console.log('Data migration completed successfully.');

    } catch (error) {
        console.error('Migration Failed:', error);
    }
};

module.exports = migrateData;
