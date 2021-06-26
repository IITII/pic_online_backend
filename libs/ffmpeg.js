/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/06/02 16:15
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  ffmpeg = require('fluent-ffmpeg'),
  md5File = require('md5-file')

async function getResolution(mediaPath) {
  return await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(mediaPath, (e, m) => {
      if (e) {
        return reject(e)
      }
      try {
        let videoStream = m.streams.filter(s => s.codec_type === 'video')
        if (videoStream.length === 0) {
          return reject(new Error('No vcodec stream'))
        } else {
          return resolve({
            height: videoStream[0].height,
            width: videoStream[0].width,
          })
        }
      } catch (e) {
        return reject(e)
      }
    })
  })
}

async function screenshot(mediaPath, screenshotFolder) {
  return await new Promise((resolve, reject) => {
    const filename = `${md5File.sync(mediaPath)}.png`
    const filePath = path.resolve(screenshotFolder, filename)
    if (fs.existsSync(filePath)) {
      return resolve(filePath)
    }
    ffmpeg(mediaPath)
      .on('end', f => resolve(f.length > 0
        ? path.resolve(screenshotFolder, f[0])
        : filePath))
      .on('error', e => reject(e))
      .screenshot({
        folder: screenshotFolder,
        filename, timestamps: [3],
      })
  })
}

module.exports = {
  getResolution,
  screenshot
}
