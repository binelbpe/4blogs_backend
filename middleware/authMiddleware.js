const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { ERROR_MESSAGES } = require('../constants/validation');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTH.TOKEN_REQUIRED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: ERROR_MESSAGES.AUTH.INVALID_TOKEN });
  }
};

module.exports = auth; 