const VALIDATION_RULES = {
  EMAIL: /^[a-zA-Z0-9._-]+@[a-z]+\.[a-z]{2,}$/,
  PHONE: /^\d{10}$/,
  PASSWORD_MIN_LENGTH: 8
};

const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_REQUIRED: 'Token is required',
    INVALID_TOKEN: 'Invalid token',
    TOKEN_EXPIRED: 'Token has expired'
  },
  USER: {
    NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already registered',
    PHONE_EXISTS: 'Phone number already registered',
    INVALID_PASSWORD: 'Current password is incorrect'
  },
  ARTICLE: {
    NOT_FOUND: 'Article not found',
    UNAUTHORIZED: 'Not authorized to perform this action',
    BLOCKED: 'Article is not available'
  }
};

module.exports = { VALIDATION_RULES, ERROR_MESSAGES }; 