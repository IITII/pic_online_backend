/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/06/02 13:53
 */
'use strict'
const path = require('path')

// describe('ffmpeg', _ => {
//   let ffmpeg
//   beforeAll(_ => ffmpeg = require('fluent-ffmpeg')())
//   afterAll(_ => ffmpeg && ffmpeg.kill())
//   const media_path = path.resolve(__dirname, '../tmp/1.mp4')
//   const output_dir = path.dirname(media_path)
//   it('screenshot', _ => {
//     ffmpeg.input(media_path)
//       .screenshot({
//         folder: output_dir,
//         count: 1,
//         timestamps: [1],
//         filename: '%b_%s_%r_%i.png'
//       })
//       .then(_ => console.log(_))
//       .catch(e => console.log(e))
//   })
// })
let ffmpeg = require('fluent-ffmpeg')
const media_path = path.resolve(__dirname, '../../tmp/1.mp4'),
  output_dir = path.dirname(media_path)
ffmpeg()
  .input(media_path)
  // setup event handlers
  .on('filenames', function (filenames) {
    console.log('screenshots are ' + typeof filenames)
    console.log('screenshots are ' + filenames)
  })
  .on('end', function () {
    console.log('screenshots were saved')
  })
  .on('error', function (err) {
    console.log('an error happened: ' + err.message)
  })
  .screenshot({
    folder: output_dir,
    timestamps: [3],
    filename: '%b_%s_%r_%0i.png'
    // filename: 'screenshot_%b_%s_%i.png'
  })

// ffmpeg.ffprobe(media_path, (e,m) => {
//   console.error(e)
//   console.dir(m)
// })
