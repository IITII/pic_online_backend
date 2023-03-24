/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/05/23 12:52
 */
'use strict'
const fs = require('fs')
const path = require('path')

let config = {
  // images dir
  pic_dir: process.env.PIC_DIR || path.resolve(__dirname, './public/media/A/images'),
  video_dir: process.env.VIDEO_DIR || path.resolve(__dirname, './public/media/A/video'),
  poster_dir: process.env.PIC_POSTER_DIR || path.resolve(__dirname, './public/cache'),
  // basedir, you can put a site dir at here
  base_dir: process.env.PIC_BASE_DIR || path.resolve(__dirname, './public'),
  prefix: process.env.PIC_PREFIX || 'http://localhost:8000',
  iRegex: /\S+\.(jpe?g|png|webp|gif|svg|JPE?G)/,
  vRegex: /\S+\.(mp4|MP4|mkv|MKV|flv|FLV|avi|AVI)/,
  // file watch limit
  watchLimit: {
    // images max
    imgMax: 2000,
    // video max
    videoMax: 200,
  },
  moleculer: {
    server: {
      auto_open: process.env.MOLECULER_AUTO_OPEN === 'true',
      ip: process.env.MOLECULER_IP || '0.0.0.0',
      port: process.env.MOLECULER_PORT || 3000,
      pathname: process.env.MOLECULER_PATHNAME || '/pic',
    },
    https: {
      key: process.env.MOLECULER_HTTPS_KEY,
      cert: process.env.MOLECULER_HTTPS_CERT,
    },
    ddns: {
      enable: process.env.MOLECULER_DDNS_ENABLE === 'true',
      domain: process.env.MOLECULER_DDNS_DOMAIN || '',
      token: process.env.MOLECULER_DDNS_TOKEN || '',
    }
  },
  axios: {
    // baseURL: 'https://api.telegram.org/bot',
    // proxy: process.env.PROXY,
    proxy: undefined,
    timeout: 1000 * 10,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
    },
  },
  // Chokidar
  // See: https://github.com/paulmillr/chokidar
  chokidar: {
    // https://github.com/paulmillr/chokidar/issues/849
    // https://github.com/paulmillr/chokidar#performance
    usePolling: true,
    // ignore dotfiles
    ignored: /((^|[/\\])\..|\S+\.(txt|log|js|ts|mp3|DS_Store|sh|docker_file|yml))/,
    ignoreInitial: true,
    depth: 99,
    ignorePermissionErrors: false,
    atomic: 1000,
    awaitWriteFinish: {
      // options.awaitWriteFinish can be set to an object in order
      // to adjust timing params:
      // awaitWriteFinish.stabilityThreshold (default: 2000).
      // Amount of time in milliseconds for a file size to remain
      // constant before emitting its event.
      stabilityThreshold: 2000,
      // awaitWriteFinish.pollInterval (default: 100). File size
      // polling interval, in milliseconds.
      pollInterval: 500,
    },
  },
}

if (fs.existsSync(config.moleculer.https.key) && fs.existsSync(config.moleculer.https.cert)) {
  config.moleculer.https.key = fs.readFileSync(config.moleculer.https.key)
  config.moleculer.https.cert = fs.readFileSync(config.moleculer.https.cert)
} else {
  config.moleculer.https = false
}

let proxy = process.env.PROXY || ''
proxy = proxy.replace(/https?:\/\//, '')
if (proxy) {
  config.axios.proxy = {
    host: proxy.split(':')[0],
    port: proxy.split(':')[1],
  }
}

module.exports = config
