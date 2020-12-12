/**
 * @author iitii
 * @date 2020/11/22 22:07
 */
'use strict';
const path = require('path'),
  data_validation = require('../lib/data_validation'),
  {logger} = require('../middlewares/logger'),
  cluster = require('cluster')

let data = {
  version: 0,
  fileInfo: {},
}
let init = true

if (cluster.isMaster) {
  logger.info(`Master is started, pid: ${process.pid}`)
  //Setup master
  //See: http://nodejs.cn/api/cluster.html#cluster_cluster_setupmaster_settings
  cluster.setupMaster({
    exec: path.resolve(__dirname, '../lib/watcher.js'),
    silent: true,
    windowsHide: true,
    serialization: 'advanced',
  })
} else {
  logger.error(`Please start ${path.resolve(__filename)} as a master!!!`)
  process.exit(1)
}

// only once
if (init) {
  init = false
  const worker = cluster.fork()
  worker.on('message', message => {
    if (message.hasOwnProperty('topic') && message.topic === 'log4js:message') {
      return
    }
    // update data
    if (message.hasOwnProperty('version') && data.version !== message.version && message.hasOwnProperty('fileInfo')) {
      data = message
      logger.info(`Updated fileInfo data, message.version: ${message.version}`)
      logger.debug(`Receive msg from worker, message.fileInfo.tree: ${JSON.stringify(message.fileInfo.tree)}`)
      // Convert Map to JSON: Object.formEntries(obj), convert JSON to Map: new Map(Object.entries(obj))
      logger.debug(`Receive msg from worker, message.fileInfo.nodeKeyMap: ${JSON.stringify(Object.fromEntries(message.fileInfo.nodeKeyMap))}`)
    } else {
      logger.debug(`Receive msg from worker: ${JSON.stringify(message)}`)
    }
  })
  worker.send({
    command: 'refresh'
  })
}


function getTree(ctx) {
  // 因为 quasar 的 tree 组件里面的 data 为数组类型的，所以需要返回一个数组
  ctx.response.body = [].concat(data.fileInfo.tree);
}

function getMoreImages(ctx) {
  const req_body = ctx.request.body
  if (data_validation.private_pic(req_body)) {
    
    const nodeKey = parseInt(req_body.nodeKey),
      low = parseInt(req_body.low),
      high = parseInt(req_body.high)
    
    let mediaArray = data.fileInfo.nodeKeyMap.get(nodeKey)
    if (mediaArray == null) {
      ctx.response.status = 404
      ctx.response.body = 'No such nodeKey!!!'
    } else {
      ctx.response.status = 200
      ctx.response.body = mediaArray.slice(low, high)
    }
  } else {
    ctx.response.status = 406
    ctx.response.body = "Param: nodeKey, low, high is required, please checkout your post data..."
  }
}


module.exports = {
  getTree,
  getMoreImages,
}
