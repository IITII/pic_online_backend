/**
 * @author iitii
 * @date 2020/11/29 02:44
 */
'use strict';
//无需手动debounce，chokidar已配置debounce，see：config.chokidar.awaitWriteFinish
const cluster = require('cluster'), path = require('path'), chokidar = require('chokidar'),
  config = require('../models/config'), {logger} = require('../middlewares/logger'), {dirDetail} = require('../lib/data'),
  watcher = chokidar.watch(config.pic_dir, config.chokidar);
let version = 1;

if (cluster.isWorker) {
  logger.info(`Watcher worker is started, pid: ${process.pid}`)
} else {
  logger.error(`Please start ${path.resolve(__filename)} as a worker!!!`)
  process.exit(1)
}

watcher
  .on('all', (eventName, filePath) => {
    logger.debug(`Watcher eventName: ${eventName}, path: ${filePath}`)
    process.send({
      version: version++,
      fileInfo: dirDetail(config.base_dir, config.pic_dir, config.prefix)
    })
  })
  .on("error", error => {
    logger.error(error)
  })

process.on('message', message => {
  logger.debug(`Receive msg from master: ${JSON.stringify(message)}`)
  if (message.hasOwnProperty('command')) {
    switch (message.command) {
      case "refresh":
        logger.info(`Manual update fileInfo...`)
        let tmp = dirDetail(config.base_dir, config.pic_dir, config.prefix)
        process.send({
          version: version++,
          fileInfo: tmp
        })
        break
      default:
        logger.warn(`No such command ${message.command}`)
        break
    }
  }
})
