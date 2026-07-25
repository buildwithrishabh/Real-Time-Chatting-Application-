const cloudinary = require('cloudinary').v2;
const config = require('./env');
const logger = require('./logger');

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true
});

logger.info('☁️ Cloudinary SDK configured successfully');

module.exports = cloudinary;