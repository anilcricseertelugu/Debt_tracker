const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_prod', {
        expiresIn: '30d',
    });
};

exports.authUser = async (req, res) => {
    const { username, password } = req.body;

    // Hardcoded check for strict compliance with user request if DB fails or empty
    // But ideal is DB.

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                role: user.role,
                token: generateToken(user._id),
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
};

// Run this once on server start to ensure admin exists
exports.seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ username: 'anil' });
        if (!adminExists) {
            await User.create({
                username: 'anil',
                password: 'admin@123',
                role: 'admin'
            });
            console.log('Admin user seeded: anil / admin@123');
        }
    } catch (err) {
        console.error('Seeding error:', err.message);
    }
};
