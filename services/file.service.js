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
      cache: {
        ttl: 60 * 5
      },
      handler() {
        const tree = this.settings.pic.tree
        if (!tree) {
          throw new MoleculerClientError('Please wait for a while', 500)
        } else {
          return [tree]
        }
      }
    },
    video_tree: {
      rest: 'GET /video_tree',
      cache: {
        ttl: 60 * 5
      },
      handler() {
        const tree = this.settings.video.tree
        if (!tree) {
          throw new MoleculerClientError('Please wait for a while', 500)
        } else {
          return [tree]
        }
      }
    },
    pic_map: {
      rest: 'POST /pic_map',
      cache: {
        ttl: 60 * 5
      },
      params: {
        nodeKey: {type: 'number', min: 1},
        page: {type: 'number', default: 0, min: 0},
        page_size: {type: 'number', default: 10, min: 1, max: 100}
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
      }
    },
    video_map: {
      rest: 'POST /video_map',
      cache: {
        ttl: 60 * 5
      },
      params: {
        nodeKey: {type: 'number', min: 1},
        page: {type: 'number', default: 0, min: 0},
        page_size: {type: 'number', default: 10, min: 1, max: 100}
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
      }
    },
  },
  methods: {
    async updateMediaInfo() {
      const pic = await readImage(config.base_dir, config.pic_dir, config.prefix, config.iRegex, this.logger)
      const video = await readVideo(config.base_dir, config.video_dir, config.poster_dir, config.prefix, config.vRegex, this.logger)
      for (const k in this.settings.pic) {
        this.settings.pic[k] = pic[k]
      }
      for (const k in this.settings.video) {
        this.settings.video[k] = video[k]
      }
      await this.broker.cacher.clean('file.**')
    },
  },
  events: {},
  async started() {
    await this.updateMediaInfo()
    const watcher = chokidar.watch(config.pic_dir, config.chokidar)
    watcher
      .on('all', debounce(this.updateMediaInfo, 500))
      .on('error', e => this.logger.error(e))
  },
  async stopped() {
  }
}
