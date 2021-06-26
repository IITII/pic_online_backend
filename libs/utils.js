/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/05/08 11:03
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  ffmpeg = require('../libs/ffmpeg.js')

/**
 * 递归遍历文件夹中图片文件
 * @param baseDir 与欲读取的文件夹做替换，通常为Http服务器的根目录
 * @param dir 欲读取的文件夹
 * @param prefix 前缀
 * @param iRegex 图片正则
 * @param logger logger
 */
async function readImage(baseDir, dir, prefix, iRegex, logger = console) {
  const startTime = new Date()
  checkDir(baseDir)
  checkDir(dir)
  prefix = prefix.endsWith('/') ? prefix : prefix + '/'

  function func(media) {
    return media.sort(sortImage)
      .map(_ => absPathToHttp(_, baseDir, prefix))
      .map(_ => encode_url(_))
  }

  const info = await read_files(dir, iRegex, func, logger)
  logger.warn(`Deal finish, time: ${computedTime(startTime)}`)
  return info
}

/**
 * 递归遍历文件夹中视频文件
 * @param baseDir 与欲读取的文件夹做替换，通常为Http服务器的根目录
 * @param dir 欲读取的文件夹
 * @param posterFolder 视频图片缓存文件夹
 * @param prefix 前缀
 * @param vRegex 视频正则
 * @param logger logger
 */
async function readVideo(baseDir, dir, posterFolder, prefix, vRegex, logger = console) {
  let startTime = new Date(),
    cacheFilename = 'cache.txt',
    cacheFilePath = path.resolve(posterFolder, cacheFilename),
    cache = new Map()

  checkDir(baseDir)
  checkDir(dir)

  if (fs.existsSync(cacheFilePath)) {
    try {
      const rawText = fs.readFileSync(cacheFilePath),
        rawJson = JSON.parse(rawText)
      cache = new Map(Object.entries(rawJson))
    } catch (e) {
      logger.warn(`Cache init failed: ${e.message}`)
    }
  }

  prefix = prefix.endsWith('/') ? prefix : prefix + '/'

  async function func(media) {
    media = media.sort(sortVideo)
    const res = []
    for (const m of media) {
      const k = encodeURI(m)
      if (cache.has(k)) {
        res.push(cache.get(k))
      } else {
        const screenshot = await ffmpeg.screenshot(m, posterFolder),
          resolution = await ffmpeg.getResolution(m),
          src = absPathToHttp(screenshot, baseDir, prefix),
          video = absPathToHttp(m, baseDir, prefix),
          v = {src, ...resolution, video}
        res.push(v)
        cache.set(k, v)
      }
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(Object.fromEntries(cache)))
    return res
  }

  const info = await read_files(dir, vRegex, func, logger)
  logger.warn(`Deal finish, time: ${computedTime(startTime)}`)
  return info
}

/**
 * dfs递归文件夹
 * @param dir{String} 欲读取的文件夹
 * @param regex{RegExp} 欲匹配的文件正则
 * @param mediaFunc{Function} 读取文件以后，需要进行的操作
 * @param logger logger
 */
async function read_files(dir, regex, mediaFunc, logger = console) {
  if (typeof regex === 'string') {
    regex = new RegExp(regex)
  }
  let nodeKey = 0,
    nodeKeyMap = new Map(),
    // total file count
    fileCount = 0,
    dirCount = 0,
    startTime = new Date()

  async function dfs(dirPath) {
    nodeKey++
    let tmpNodeKey = nodeKey,
      filePath = '',
      media = []
    const files = {
      nodeKey: tmpNodeKey, header: 'root',
      label: path.basename(dirPath),
      // dir file count
      fileCount: 0, children: []
    }
    for (const i of fs.readdirSync(dirPath)) {
      filePath = dirPath + path.sep + i
      if (i.startsWith('.')) {
        continue
      }
      if (fs.statSync(filePath).isDirectory()) {
        dirCount++
        files.children.push(await dfs(filePath))
      } else if (i.match(regex) !== null) {
        fileCount++
        files.fileCount++
        media.push(filePath)
      }
    }
    media = await mediaFunc(media)
    nodeKeyMap.set(tmpNodeKey, media)
    return files
  }

  const tree = await dfs(dir)
  logger.warn(`Read finish, time: ${computedTime(startTime)} dir: ${dirCount}, file: ${fileCount}, dir: ${dir}`)
  return {tree, nodeKeyMap}
}


function checkDir(dir) {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    return true
  } else {
    throw new Error('No such file or directory!')
  }
}

function sortImage(a, b) {
  // 文件名长的放前面，一般会是封面
  // 字符串逐字比较，数字转换后比较，其他字符比较 ascii 值
  a = a.split('/').pop().split('.').shift()
  b = b.split('/').pop().split('.').shift()
  const a1 = parseInt(a), b1 = parseInt(b)
  // 可能会越界，无所谓了
  if (isNaN(a1) || isNaN(b1)) {
    return b.length - a.length
  } else {
    return a1 - b1
  }
}

function sortVideo(a, b) {
  return sortImage(a, b)
}

function absPathToHttp(absPath, baseDir, prefix) {
  return prefix +
    path.relative(baseDir, absPath)
      .replace(/\\/g, '/')
}

function encode_url(url) {
  if (process.env.PIC_ENCODE_URL === 'true') {
    return encodeURI(url)
  } else {
    return url
  }
}

function computedTime(startTime) {
  const total = new Date() - startTime,
    level = [1000, 1000 * 60, 1000 * 60 * 60,]
  if (total < level[0]) {
    return total + 'ms'
  } else if (total < level[1]) {
    return (level[0]).toFixed(2) + 's'
  } else if (total < level[2]) {
    return (total / level[1]).toFixed(2) + 'min'
  } else {
    return (total / level[2]).toFixed(2) + 'h'
  }
}

module.exports = {
  readImage,
  readVideo,
}
