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

// Import controllers for seeding
const { seedAdmin } = require('./controllers/authController');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB().then(() => {
    seedAdmin(); // Seed admin user after connection
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
