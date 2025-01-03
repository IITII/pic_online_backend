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
 * @param prefix
 * @param iRegex 图片正则
 * @param logger logger
 */
async function readImage(baseDir, dir, prefix, iRegex, ignoreFilePrefix, logger = console) {
  const startTime = new Date()
  checkDir(baseDir)
  checkDir(dir)

  function func(media) {
    media.files = media.files.sort(sortImage)
    return media
      // .map(_ => path.relative(baseDir, _))
      // .map(_ => _.replace(/[\\/]/g, '/'))
      // .map(_ => absPathToHttp(_, baseDir, prefix))
  }

  const info = await read_files(baseDir, dir, iRegex, func, ignoreFilePrefix, logger)
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
async function readVideo(baseDir, dir, posterFolder, prefix, vRegex, ignoreFilePrefix, logger = console) {
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
    media.files = media.files.sort(sortImage)
    let files = media.files.map(f => path.resolve(baseDir, media.dir, f))
    const res = []
    for (const m of files) {
      const relative_video = path.relative(baseDir, m).replace(/[\\/]/g, '/'),
        k = encodeURI(relative_video)
      let v
      if (cache.has(k)) {
        v = cache.get(k)
        // v.src = replace_host(v.src, prefix)
        // v.video = replace_host(v.video, prefix)
      } else {
        const screenshot = await ffmpeg.screenshot(m, posterFolder),
          resolution = await ffmpeg.getResolution(m),
          src = encode_url(path.relative(baseDir, screenshot).replace(/[\\/]/g, '/')),
          video = path.relative(baseDir, m).replace(/[\\/]/g, '/')
        v = {src, ...resolution, video}
      }
      res.push(v)
      cache.set(k, v)
    }
    cache.forEach((v, k) => {
      const p = path.resolve(baseDir, decodeURI(k).replace(prefix, ''))
      const vPath = path.resolve(baseDir, v.src.replace(prefix, ''))
      if (!fs.existsSync(p)) {
        logger.warn(`Delete cache: ${p} -> ${vPath}`)
        if (fs.existsSync(vPath)) {
          fs.unlinkSync(vPath)
        }
        cache.delete(k)
      }
    })
    fs.writeFileSync(cacheFilePath, JSON.stringify(Object.fromEntries(cache)))
    return res
  }

  const info = await read_files(baseDir, dir, vRegex, func, ignoreFilePrefix, logger)
  logger.warn(`Deal finish, time: ${computedTime(startTime)}`)
  return info
}

function replace_host(pre, target) {
  let t1, pu
  t1 = new URL(target).host
  pu = new URL(pre)
  pu.host = t1
  return pu.toString()
}

/**
 * dfs递归文件夹
 * @param baseDir 基准文件夹
 * @param dir{String} 欲读取的文件夹
 * @param regex{RegExp} 欲匹配的文件正则
 * @param mediaFunc{Function} 读取文件以后，需要进行的操作
 * @param logger logger
 */
async function read_files(baseDir, dir, regex, mediaFunc, ignoreFilePrefix, logger = console) {
  if (typeof regex === 'string') {
    regex = new RegExp(regex)
  }
  let nodeKey = 0,
    nodeKeyMap = new Map(),
    // total file count
    fileCount = 0,
    dirCount = 0,
    seconds,
    startTime = Date.now()

  async function dfs(dirPath) {
    // cpu 密集时，setInterval 不会被按时调用
    let costSec = +((Date.now() - startTime)/1000).toFixed(0)
    if (seconds !== costSec) {
      logger.info(`Scanning ${dir}: dir: ${dirCount}, file: ${fileCount}, curDir: ${dirPath}...`)
      seconds = costSec
    }

    nodeKey++
    let tmpNodeKey = nodeKey,
      filePath = '', label = path.basename(dirPath),
      media = []
    let relative = path.relative(baseDir, dirPath)
    const files = {
      nodeKey: tmpNodeKey, header: 'root', label,
      // dir file count
      dir: relative,
      dirCount: 0,
      fileCount: 0, children: [],
    }
    for (const i of fs.readdirSync(dirPath).sort()) {
      filePath = dirPath + path.sep + i
      if (ignoreFilePrefix.some(_ => i.startsWith(_))) {
        logger.debug(`ignore file: ${filePath}...`)
        continue
      }
      try {
        if (fs.statSync(filePath).isDirectory()) {
          dirCount++
          files.dirCount++
          files.children.push(await dfs(filePath))
        } else if (i.match(regex) !== null) {
          fileCount++
          files.fileCount++
          media.push(i)
        }
      } catch (e) {
        logger.warn(`process '${filePath}' failed, maybe current file system don't support some char...`, e.message)
        logger.debug(e)
      }
    }
    media = {label, dir: relative, files: media}
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
    throw new Error(`No such file or directory: ${dir}`)
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
  let res
  res = prefix
  res += path.relative(baseDir, absPath)
    .replace(/\\/g, '/')
  return encode_url(res)
}

function encode_url(url) {
  if (process.env.PIC_ENCODE_URL === 'false') {
    return url
  } else {
    return encodeURI(url)
  }
}

function computedTime(startTime, frac = 2) {
  let time = new Date() - startTime
  const seconds = 1000
  const units = [
    {unit: 'd', value: 24 * 60 * 60 * seconds},
    {unit: 'h', value: 60 * 60 * seconds},
    {unit: 'm', value: 60 * seconds},
  ]
  let res = ''
  units.forEach(u => {
    if (time >= u.value) {
      res += `${Math.floor(time / u.value)}${u.unit}`
      time %= u.value
    }
  })
  res += `${(time / seconds).toFixed(frac)}s`
  return res
}

/**
 * 筛选特殊字符
 * @example escape('1aA-_@中é') => 1aA-_@%u4E2D%E9
 */
function allowChars(str, logger = console) {
  for (const c of str) {
    let uni = escape(c), c16, url_max = 0x7e
    switch (uni.length) {
      case 1:
        // ascii chars
        break
      case 3:
        // URL encode
        // https://blog.csdn.net/guoquanyou/article/details/3268939
        c16 = uni.slice(1)
        c16 = parseInt(c16, 16)
        if (c16 > url_max) {
          logger.warn(`URL encode char '${c}' => ${uni} is not allowed`, str)
        }
        break
      case 6:
        // unicode
        // allow 中文 & ascii: /(\w|[\u4E00-\u9FA5])*/
        break
      case 12:
        // unicode emoji
        logger.warn(`emoji '${c}' => ${uni} is not allowed`, str)
        break
      default:
        logger.warn(`char '${c}' => ${uni} too long: ${uni.length}`, str)
        break
    }
  }
}

module.exports = {
  readImage,
  readVideo,
  allowChars,
}
