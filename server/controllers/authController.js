const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_prod', {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ $or: [{ username }, { email }] });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User or Email already exists' });
        }

        const user = await User.create({
            username,
            email,
            password,
            role: 'guest' // Default role
        });

        if (user) {
            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
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
                email: 'anil@example.com', // Default admin email
                password: 'admin@123',
                role: 'admin'
            });
            console.log('Admin user seeded: anil / admin@123');
        }
    } catch (err) {
        console.error('Seeding error:', err.message);
    }
};
