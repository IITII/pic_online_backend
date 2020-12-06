'use strict';
const fs = require('fs'), path = require('path'), config = require("../models/config"), log4js = require('koa-log4'),
  utils = require('../lib/utils'), logger = log4js.getLogger(config.log.logName);
logger.level = (config.log.level || "debug");
// 这个是判断是否有logs目录，没有就新建，用来存放日志
const logsDir = path.parse(config.log.logPath).dir;
if (!fs.existsSync(logsDir)) {
  utils.mkdir(logsDir, () => {
    console.log("Create un-exist dir: " + logsDir)
  });
}
// 配置log4.js
log4js.configure({
  appenders: {
    console: {type: 'console'},
    dateFile: {type: 'dateFile', filename: config.log.logPath, pattern: '-yyyy-MM-dd'}
  },
  categories: {
    default: {
      appenders: ['console', 'dateFile'],
      level: (config.log.level || 'debug')
    }
  }
});
// logger中间件
const loggerMiddleware = async (ctx, next) => {
// 请求开始时间
  const start = new Date();
  await next();
  // 结束时间
  const ms = new Date() - start;
  // 打印出请求相关参数
  const remoteAddress = ctx.headers['x-forwarded-for'] || ctx.ip || ctx.ips ||
    (ctx.socket && (ctx.socket.remoteAddress ||
      (ctx.socket.socket && ctx.socket.socket.remoteAddress)));
  let logText = `${remoteAddress} - ${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`;
  logger.info(logText);
};
module.exports = {
  logger,
  loggerMiddleware
};
