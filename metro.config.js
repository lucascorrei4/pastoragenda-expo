const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
  // Videos
  'mp4', 'mov', 'avi', 'webm',
  // Audio
  'mp3', 'wav', 'aac', 'ogg',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
  // Archives
  'zip', 'rar', '7z'
);

// Add support for additional source extensions
config.resolver.sourceExts.push('ts', 'tsx', 'js', 'jsx', 'json');

module.exports = config;
