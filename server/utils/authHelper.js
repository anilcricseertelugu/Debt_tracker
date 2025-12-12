const User = require('../models/User');

const getUserIdForFilter = async (req) => {
    if (req.user) {
        return req.user._id;
    }
    // Guest fallback: Return Default Admin ID
    const admin = await User.findOne({ username: 'anil' });
    return admin ? admin._id : null;
};

module.exports = { getUserIdForFilter };
