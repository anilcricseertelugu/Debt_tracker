const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
// Import routes
const bankLoanRoutes = require('./routes/bankLoans');
const handLoanRoutes = require('./routes/handLoans');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const calculationRoutes = require('./routes/calculations');
const authRoutes = require('./routes/authRoutes');

const migrateData = require('./utils/migration');

// Connect to MongoDB
connectDB().then(async () => {
    await seedAdmin(); // Seed admin user after connection
    await migrateData(); // Run migration to assign ownership
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans/bank', bankLoanRoutes);
app.use('/api/loans/hand', handLoanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calculate', calculationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
