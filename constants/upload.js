const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  UPLOAD_PATH: 'uploads'
};

module.exports = { UPLOAD_CONFIG }; 