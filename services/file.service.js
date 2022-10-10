/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/05/23 13:37
 */
'use strict'
const {debounce} = require('lodash'),
  chokidar = require('chokidar'),
  {MoleculerClientError} = require('moleculer').Errors,
  config = require('../api.config.js'),
  {readImage, readVideo} = require('../libs/utils.js')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'file',
  settings: {
    pic: {tree: null, nodeKeyMap: null},
    video: {tree: null, nodeKeyMap: null},
  },
  actions: {
    pic_tree: {
      rest: 'GET /pic_tree',
      handler() {
        const tree = this.settings.pic.tree
        if (!tree) {
          throw new MoleculerClientError('Please wait for a while', 500)
        } else {
          return [tree]
        }
      },
    },
    video_tree: {
      rest: 'GET /video_tree',
      handler() {
        const tree = this.settings.video.tree
        if (!tree) {
          throw new MoleculerClientError('Please wait for a while', 500)
        } else {
          return [tree]
        }
      },
    },
    pic_map: {
      rest: 'POST /pic_map',
      params: {
        nodeKey: {type: 'number', min: 1},
        page: {type: 'number', default: 0, min: 0},
        page_size: {type: 'number', default: 10, min: 1, max: 100},
      },
      async handler(ctx) {
        const {nodeKey, page, page_size} = ctx.params,
          map = this.settings.pic.nodeKeyMap
        if (!map) {
          throw new MoleculerClientError('Please wait for a while', 500)
        }
        const arr = map.get(nodeKey),
          start = page_size * page,
          end = page_size * (page + 1)
        return arr.slice(start, end).map(_ => {
          return {
            src: _,
            // video: undefined
          }
        })
      },
    },
    video_map: {
      rest: 'POST /video_map',
      params: {
        nodeKey: {type: 'number', min: 1},
        page: {type: 'number', default: 0, min: 0},
        page_size: {type: 'number', default: 10, min: 1, max: 100},
      },
      async handler(ctx) {
        const {nodeKey, page, page_size} = ctx.params,
          map = this.settings.video.nodeKeyMap
        if (!map) {
          throw new MoleculerClientError('Please wait for a while', 500)
        }
        const arr = map.get(nodeKey),
          start = page_size * page,
          end = page_size * (page + 1)
        return arr.slice(start, end)
      },
    },
  },
  methods: {
    async updatePicInfo() {
      const pic = await readImage(config.base_dir, config.pic_dir, config.prefix, config.iRegex, this.logger)
      for (const k in this.settings.pic) {
        this.settings.pic[k] = pic[k]
      }
    },
    async updateVideoInfo() {
      const video = await readVideo(config.base_dir, config.video_dir, config.poster_dir, config.prefix, config.vRegex, this.logger)
      for (const k in this.settings.video) {
        this.settings.video[k] = video[k]
      }
    },
    getDirAndFileCount(nodeKeyMap) {
      const dirs = nodeKeyMap.size
      const files = [...nodeKeyMap.values()].map(_ => _.length).reduce((p, c) => p + c, 0)
      return dirs + files
    },
  },
  events: {},
  async started() {
    await this.updatePicInfo()
    await this.updateVideoInfo()
    let imgCount = this.getDirAndFileCount(this.settings.pic.nodeKeyMap)
    let videoCount = this.getDirAndFileCount(this.settings.video.nodeKeyMap)
    if (imgCount < config.watchLimit.imgMax) {
      const pic = chokidar.watch(config.pic_dir, config.chokidar)
      pic
        .on('all', debounce(this.updatePicInfo, 500))
        .on('error', e => this.logger.error(e))
    } else {
      this.logger.warn(`图片过多， 不监听文件变化。MAX: ${config.watchLimit.imgMax} => CUR: ${imgCount}`)
    }
    if (videoCount < config.watchLimit.videoMax) {
      const video = chokidar.watch(config.video_dir, config.chokidar)
      video
        .on('all', debounce(this.updateVideoInfo, 1000))
        .on('error', e => this.logger.error(e))
    } else {
      this.logger.warn(`视频过多， 不监听文件变化。MAX: ${config.watchLimit.videoMax} => CUR: ${videoCount}`)
    }
  },
  async stopped() {
  },
}
