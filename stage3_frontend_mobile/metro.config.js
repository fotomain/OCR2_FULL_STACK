const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Blocklist non-JS directories outside node_modules to avoid macOS EMFILE watcher crashes
config.resolver.blockList = [
  /.*[/\\]\.venv[/\\]/,
  /.*[/\\]dataset_for_ml[/\\]/,
  /.*[/\\]output[/\\]model[/\\]/,
  /.*[/\\]stage1_ml_ocr[/\\]/,
  /.*[/\\]stage2_frontend_web[/\\]/,
  /.*[/\\]stage2_frontend_mobile[/\\]/,
  /.*[/\\]\.git[/\\]/,
  /.*stage3_frontend_mobile[/\\]dist[/\\]/
];

module.exports = config;
