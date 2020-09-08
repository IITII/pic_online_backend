'use strict';
const path = require('path');
let config = {
  port: 3000,
  // images dir
  pic_dir: process.env.PIC_DIR || path.resolve(__dirname, '../tmp'),
  // basedir, you can put a basic url at here
  base_dir: process.env.PIC_BASE_DIR || 'http://localhost/pic/',
  log: {
    logName: 'Pic_Online',
    logPath: path.resolve(__dirname, '../logs/log.log')
  },
}

module.exports = config;