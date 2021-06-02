/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/05/08 11:03
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  ffmpeg = require('../libs/ffmpeg.js')

/**
 * dfs递归文件夹
 * @param baseDir 与欲读取的文件夹做替换，通常为Http服务器的根目录
 * @param dir 欲读取的文件夹
 * @param posterFolder 视频图片缓存文件夹
 * @param prefix 前缀
 * @param iRegex 图片正则
 * @param vRegex 视频正则
 * @param logger logger
 */
async function readdir(baseDir, dir, posterFolder, prefix = '', iRegex, vRegex, logger = console) {
  // this.logger.info(`Read dir finish, dirCount: ${dirCount}, fileCount: ${fileCount}, dir: ${dir}`)
  if (!(fs.existsSync(dir) && fs.statSync(dir).isDirectory())) {
    throw new Error('No such file or directory!')
  }
  prefix = prefix.endsWith('/') ? prefix : prefix + '/'
  const pic = {nodeKey: 0, tree: null, nodeKeyMap: new Map(), fileCount: 0, dirCount: 0},
    video = {nodeKey: 0, tree: null, nodeKeyMap: new Map(), fileCount: 0, dirCount: 0}

  async function dfs(dirPath) {
    pic.nodeKey++
    video.nodeKey++
    let tmpNodeKey = {pic: pic.nodeKey, video: video.nodeKey},
      filePath = '',
      media = {pic: [], video: []}
    const files = {
      pic: {
        nodeKey: tmpNodeKey.pic,
        label: path.basename(dirPath),
        header: 'root',
        fileCount: 0,
        children: []
      },
      video: {
        nodeKey: tmpNodeKey.video,
        label: path.basename(dirPath),
        header: 'root',
        fileCount: 0,
        children: []
      }
    }
    for (const i of fs.readdirSync(dirPath)) {
      filePath = dirPath + path.sep + i
      if (i.startsWith('.')) {
        continue
      }
      if (fs.statSync(filePath).isDirectory()) {
        const stack = await dfs(filePath)
        files.pic.children.push(stack.pic)
        files.video.children.push(stack.video)
        pic.dirCount++
        video.dirCount++
      } else {
        let tmp = path.relative(baseDir, filePath)
        //Adjust for Windows
        tmp = tmp.replace(/\\/g, '/')
        const link = prefix + tmp
        if (i.match(iRegex) !== null) {
          media.pic.push(link)
          pic.fileCount++
          files.pic.fileCount++
        } else if (i.match(vRegex) !== null) {
          const screenshot = await ffmpeg.screenshot(filePath, posterFolder),
            resolution = await ffmpeg.getResolution(filePath),
            videoTmp = path.relative(baseDir, screenshot)
              .replace(/\\/g, '/'),
            src = prefix + videoTmp
          media.video.push({src, ...resolution, video: link})
          video.fileCount++
          files.video.fileCount++
        }
      }
    }
    media.pic.sort((a, b) => {
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
    })
    pic.nodeKeyMap.set(tmpNodeKey.pic, media.pic)
    video.nodeKeyMap.set(tmpNodeKey.video, media.video)
    return files
  }

  const trees = await dfs(dir)
  pic.tree = trees.pic
  video.tree = trees.video
  logger.warn(`Read images finish, dirCount: ${pic.dirCount}, fileCount: ${pic.fileCount}, dir: ${dir}`)
  logger.warn(`Read video finish, dirCount: ${video.dirCount}, fileCount: ${video.fileCount}, dir: ${dir}`)
  return {pic, video}
}

module.exports = {
  readdir
}
