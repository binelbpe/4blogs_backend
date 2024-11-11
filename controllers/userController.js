const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { ERROR_MESSAGES } = require('../constants/validation');
const { TOKEN_CONFIG } = require('../constants/tokens');
const { UPLOAD_CONFIG } = require('../constants/upload');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

exports.register = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    
    if (userExists) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({
        message: userExists.email === email 
          ? ERROR_MESSAGES.USER.EMAIL_EXISTS 
          : ERROR_MESSAGES.USER.PHONE_EXISTS
      });
    }

    let preferences = [];
    if (req.body.preferences) {
      try {
        preferences = JSON.parse(req.body.preferences);
        if (!Array.isArray(preferences)) {
          throw new Error('Preferences must be an array');
        }
      } catch (error) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(400).json({message: 'Invalid preferences format'||error.message})
      }
    }

    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      dateOfBirth: req.body.dateOfBirth,
      preferences: preferences,
      image: req.file ? `/uploads/${req.file.filename}` : null
    };

    const user = await User.create(userData);
    const token = generateToken(user._id);
    return res.status(201).json({success:true,data:{token,user: user.toPublicJSON()},message:'Registration successful'})
  } catch (error) {
    logger.error('Registration failed', error);
    if (req.file) {
      deleteFile(req.file.path);
    }
    return res.status(400).json({message:'Registration failed'})
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Get user data without sensitive info
    const userData = user.toPublicJSON();

    return res.status(200).json({
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login failed', error);
    return res.status(400).json({ message: error.message || 'Login failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or token revoked' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh failed', error);
    return res.status(400).json({ message: 'Failed to refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to logout' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({message: 'User not found'} );
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({message:error.message||'Error fetching user profile'} );
  }
};

exports.getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({ 
      author: req.params.id,
      deleted: false 
    })
    .sort({ createdAt: -1 })
    .populate('author', 'firstName lastName');

    res.json(articles);
  } catch (error) {
    res.status(400).json({message:error.message||'Error fetching user articles'});
  }
}; 


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json("User Not Found")
    }
    return res.status(200).json(user.toPublicJSON())
  } catch (error) {
    return res.status(400).json({message:error.message})
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({message:'User not found'})
    }

    if (req.file) {
      if (user.image) {
        deleteFile(user.image);
      }
      user.image = `/uploads/${req.file.filename}`;
    }
    const fieldsToUpdate = ['firstName', 'lastName', 'email', 'phone'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field]) {
        user[field] = req.body[field];
      }
    });

    if (req.body.preferences) {
      try {
        user.preferences = JSON.parse(req.body.preferences);
      } catch (error) {
        console.error('Error parsing preferences:', error);
      }
    }

    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
      
        return res.status(400).json({message:'Current password is incorrect'})
      }
      user.password = req.body.newPassword;
    }

    await user.save();
    
    const updatedUser = user.toPublicJSON();
    return res.status(200).json({success:true,data:{user: updatedUser},message:'Profile updated successfully'})

  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({message:'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ')})
    }
    return res.status(400).json({message:error.message || 'Failed to update profile'})
  }
}; 