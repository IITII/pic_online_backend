/**
 * @author iitii
 * @date 2020/11/22 02:33
 */
'use strict'
const path = require('path'), fs = require('fs'),
  {logger} = require('../middlewares/logger')

/**
 * Check the special dir path is exist and readable
 * @param dir directory path
 * @returns {boolean} true for ok, false for others
 */
function dirExistAndReadable(dir) {
  let flag = true
  if (!fs.existsSync(dir)) {
    logger.error(`dir is not exist...`)
    flag = false
  }
  if (!fs.statSync(dir).isDirectory()) {
    logger.error(`dir: ${dir} is not a directory...`)
    flag = false
  }
  try {
    fs.accessSync(dir, fs.constants.R_OK)
    logger.info(`dir: ${dir} is existed and readable.`)
  } catch (e) {
    logger.error(`dir: ${dir} is not exist or unreadable...`)
    flag = false
  }
  return flag
}

/**
 * 添加或者移除必要的斜杠
 * @param string 处理的String
 * @param add true 为添加斜杠，false 为删除斜杠
 * @returns {string} 处理后的String
 */
function slashDeal(string, add = false) {
  if (string !== '/') {
    let tmp = string.replace(/\/$/, '')
    return add ? tmp + '/' : tmp
  } else {
    return string
  }
}

/**
 * dfs递归文件夹
 * @param baseDir 与欲读取的文件夹做替换，通常为Http服务器的根目录
 * @param dir 欲读取的文件夹
 * @param prefix 前缀(会自动添加 '/')
 * @param regex 媒体文件正则表达式
 */
function dirDetail(baseDir, dir, prefix = '', regex = '\\S+\\.(jpe?g|png|gif|svg|mp4)') {
  if (!dirExistAndReadable(dir)) {
    return {}
  }
  dir = slashDeal(dir)
  prefix = slashDeal(prefix, true)
  let nodeKey = 0,
    nodeKeyMap = new Map(),
    fileCount = 0,
    dirCount = 0
  
  function dfs(dirPath) {
    nodeKey++
    let tmpNodeKey = nodeKey
    let filePath = ''
    let mediaArray = []
    let files = {
      nodeKey: tmpNodeKey,
      label: path.basename(dirPath),
      header: 'root',
      children: []
    }
    fs.readdirSync(dirPath).forEach(i => {
      filePath = dirPath + path.sep + i
      if (i.startsWith('.')) {
        return;
      }
      if (fs.statSync(filePath).isDirectory()) {
        files.children.push(dfs(filePath))
        dirCount++
      } else {
        if (i.match(regex) !== null) {
          let tmp = path.relative(baseDir, filePath)
          //Adjust for Windows
          tmp = tmp.replace(/\\/g, '/')
          mediaArray.push(prefix + tmp)
          fileCount++
        }
      }
    })
    mediaArray.sort((a, b) => {
      // 文件名长的放前面，一般会是封面
      // 字符串逐字比较，数字转换后比较，其他字符比较 ascii 值
      a = a.split('/').pop().split('.').shift()
      b = b.split('/').pop().split('.').shift()
      const a1 = parseInt(a)
      const b1 = parseInt(b)
      // 可能会越界，无所谓了
      if (isNaN(a1) || isNaN(b1)) {
        return b.length - a.length
      } else {
        return a1 - b1
      }
    })
    nodeKeyMap.set(tmpNodeKey, mediaArray)
    return files
  }
  
  let tree = dfs(dir)
  logger.info(`Read dir finish: ${dir}`)
  logger.info(`dirCount: ${dirCount}, fileCount: ${fileCount}`)
  return {
    tree: tree,
    nodeKeyMap: Object.fromEntries(nodeKeyMap)
  }
}

//
// (() => {
//     let dir = __dirname + '/../tmp/'
//     console.dir(dirDetail(dir, dir))
//     dirDetail(dir, dir, 'http://baidu.com')
// })()

module.exports = {
  dirDetail,
}
