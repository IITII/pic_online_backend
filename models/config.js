'use strict';
const path = require('path');
let config = {
  port: 3000,
  pic_dir: process.env.PIC_DIR || path.resolve(__dirname,'../tmp','E:\\Pictures'),
  base_dir: process.env.PIC_BASE_DIR || 'http://localhost/pic/',
  log:{
    logName: 'Pic_Online',
    logPath: path.resolve(__dirname,'../logs/log.log')
  },
}

module.exports = config;