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
    // 高级序列化有点问题，还是修改为 JSON 吧
    serialization: 'json',
  })
} else {
  logger.error(`Please start ${path.resolve(__filename)} as a master!!!`)
  process.exit(1)
}

const worker = cluster.fork()
worker.on('message', message => {
  if (message.hasOwnProperty('topic') && message.topic === 'log4js:message') {
    return
  }
  // update data
  if (message.hasOwnProperty('version') && data.version !== message.version && message.hasOwnProperty('fileInfo')) {
    logger.info(`Updated fileInfo data, message.version: ${message.version}`)
    logger.debug(`Receive msg from worker, message.fileInfo.tree: ${JSON.stringify(message.fileInfo.tree)}`)
    // Convert Map to JSON: Object.fromEntries(obj), convert JSON to Map: new Map(Object.entries(obj))
    logger.debug(`Receive msg from worker, message.fileInfo.nodeKeyMap: ${JSON.stringify(message.fileInfo.nodeKeyMap)}`)
    // 需要注意，两次转变以后，key 值变为字符串类型
    message.fileInfo.nodeKeyMap = new Map(Object.entries(message.fileInfo.nodeKeyMap))
    data = message
  } else {
    logger.debug(`Receive msg from worker: ${JSON.stringify(message)}`)
  }
})
// only once
if (init) {
  init = false
  worker.send({
    command: 'refresh'
  })
}


function getTree(ctx) {
  // 因为 quasar 的 tree 组件里面的 data 为数组类型的，所以需要返回一个数组
  ctx.response.body = [].concat(data.fileInfo.tree);
}

function getMoreImages(ctx) {
  if (!(data.fileInfo.hasOwnProperty('nodeKeyMap') && data.fileInfo.nodeKeyMap != null)) {
    ctx.response.status = 500
    ctx.response.body = 'Reading dir...'
    return;
  }
  const req_body = ctx.request.body
  if (data_validation.private_pic(req_body)) {
  
    // 需要注意，两次转变以后，key 值变为字符串类型，为了避免 404，所以添加空串
    const nodeKey = req_body.nodeKey + '',
      low = parseInt(req_body.low),
      high = parseInt(req_body.high)
  
    // 可能的优化方向，使用 LRU 缓存，因为大部分情况下是在访问同一个 key
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
