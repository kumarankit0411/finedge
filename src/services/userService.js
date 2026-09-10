const User = require('../models/userModel');
const { ConflictError } = require('../errors/apiError');

const createUser = async (userData) => {
    const existingUser = await User.findOne({ email: userData.email});
    if (existingUser) {
        throw new ConflictError('Email already exists');
    }
    const user = new User(userData);
    await user.save();
    return user;
};

module.exports = { createUser };