const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { ValidationError, UnauthorizedError } = require('../errors/apiError');

const registerUser = async (req, res, next) => {
    try {
        const {name, email, password} = req.body;
        if (!name || !email || !password) {
            throw new ValidationError('All fields are required');
        }
        const user = await userService.createUser({name, email, password});
        const userObj = user.toObject();
        delete userObj.password;
        res.status(201).json({ user: userObj });
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }
      const user = await User.findOne({ email });
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials');
      }
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
};

module.exports = { registerUser, loginUser };