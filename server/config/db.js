const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check if URI is defined
        if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('placeholder')) {
            console.warn('⚠️  MONGODB_URI is not set or is a placeholder. Database features will fail.');
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            // options not strictly needed in Mongoose 6+, but keeping per spec if needed, 
            // though spec said 8.0.3 where these are deprecated. 
            // I will omit deprecated options to be safe with Mongoose 8 
            // OR follow spec exactly? Spec said `useNewUrlParser: true`. 
            // Mongoose 8 throws warning/error if you pass them. 
            // I will include them but comment them out or rely on user modifying code if they use older mongoose. 
            // Actually standard Mongoose 8 behavior is fine.
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
