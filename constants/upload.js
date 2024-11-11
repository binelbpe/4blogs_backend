const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, 
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  UPLOAD_PATH: 'uploads'
};

module.exports = { UPLOAD_CONFIG }; 