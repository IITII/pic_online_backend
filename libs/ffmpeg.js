/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/06/02 16:15
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  ffmpeg = require('fluent-ffmpeg'),
  {uuid_gen} = require('./utils.js')

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
    let filename, filePath
    do {
      filename = `${uuid_gen()}.png`
      filePath = path.resolve(screenshotFolder, filename)
    } while (fs.existsSync(filePath))
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
