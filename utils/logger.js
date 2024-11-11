const logger = {
  error: (message, error) => {
    console.error(`[ERROR] ${message}:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      timestamp: new Date().toISOString()
    });
  },

  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}:`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  },

  info: (message, data = {}) => {
    console.log(`[INFO] ${message}:`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = logger; 