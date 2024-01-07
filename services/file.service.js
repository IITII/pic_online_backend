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
const path = require('path')
const {resolve} = require('url')
const fs = require('fs')

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
    pic_lazy: {
      rest: 'POST /pic_lazy',
      params: {
        nodeKey: {type: 'string'},
      },
      async handler(ctx) {
        const {nodeKey} = ctx.params,
          tree = this.settings.pic.tree
        let node = this.findByNodeKey(+nodeKey, tree)
        return node.length === 0 ? [] : node.children
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
        return arr.files.slice(start, end).map(_ => ({src: this.resolveHttp(config.prefix, arr.dir, _)}))
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
          self = this,
          start = page_size * page,
          end = page_size * (page + 1)
        return arr.slice(start, end).map(_ => {
          let {src, video} = _
          src = self.resolveHttp(config.prefix, '', src)
          video = self.resolveHttp(config.prefix, '', video)
          return {..._, src, video}
        })
      },
    },
    video_del: {
      rest: 'POST /video_del',
      params: {
        nodeKey: {type: 'number', min: 1},
        dir: {type: 'string'},
        recursive: {type: 'boolean', default: false},
      },
      async handler(ctx) {
        throw new MoleculerClientError(`Not implemented`, 500)
      }
    },
    pic_del: {
      rest: 'POST /pic_del',
      params: {
        nodeKey: {type: 'number', min: 1},
        dir: {type: 'string'},
        recursive: {type: 'boolean', default: false},
      },
      async handler(ctx) {
        const {nodeKey, dir, recursive} = ctx.params,
          {tree, nodeKeyMap} = this.settings.pic
        if (!nodeKeyMap) {
          throw new MoleculerClientError('Please wait for a while', 500)
        }
        const obj = nodeKeyMap.get(nodeKey)
        let dirs = 0, files = 0
        if (obj) {
          if (dir === obj.dir) {
            let node = this.findByNodeKey(nodeKey, tree)
            let count = this.getCountByNodeKey(node)
            dirs = count.dirs
            files = count.files
            if (dirs > 1 && !recursive) {
              throw new MoleculerClientError('Please delete the subdirectory first', 500)
            }
            const p = path.resolve(config.base_dir, dir)
            this.logger.warn(`Delete node: ${nodeKey}, recursive: ${recursive}, dir: ${p}`)
            // 关联删除子文件夹 nodeKey
            nodeKeyMap.delete(nodeKey)
            if (fs.existsSync(p)) {
              fs.rmSync(p, {recursive: true})
            } else {
              this.logger.info(`Dir not exists: ${nodeKey}, recursive: ${recursive}, dir: ${p}`)
            }
          } else {
            throw new MoleculerClientError(`dir not match: ${dir} -> ${obj.dir}`, 500)
          }
        }
        return {success: true, dirs, files}
      },
    },
    reload: {
      rest: '/reload',
      timeout: 0,
      async handler() {
        // slow test
        // function sleep(ms) {
        //   return new Promise(resolve => setTimeout(resolve, ms));
        // }
        // await sleep(100 * 1000)
        return this.reload(false)
      },
    },
  },
  methods: {
    resolveHttp(prefix, dir, filename) {
      return resolve(prefix, path.join(dir, filename))
    },
    /**
     * 递归查找 nodeKey
     */
    findByNodeKey(key, tree) {
      let res = []
      if (!tree) return res
      if (tree.nodeKey === key) {
        res = JSON.parse(JSON.stringify(tree))
      } else {
        for (const child of tree.children) {
          res = this.findByNodeKey(key, child)
          if (res.length !== 0) {
            break
          }
        }
      }
      return res
    },
    async updatePicInfo() {
      const pic = await readImage(config.base_dir, config.pic_dir, config.prefix, config.iRegex, this.logger)
      for (const k in this.settings.pic) {
        this.settings.pic[k] = pic[k]
      }
      this.saveCache('img', this.settings.pic)
    },
    async updateVideoInfo() {
      const video = await readVideo(config.base_dir, config.video_dir, config.poster_dir, config.prefix, config.vRegex, this.logger)
      for (const k in this.settings.video) {
        this.settings.video[k] = video[k]
      }
      this.saveCache('video', this.settings.video)
    },
    /**
     * 获取 map 里面的文件夹和文件数量
     */
    getDirAndFileCount(nodeKeyMap) {
      const dirs = nodeKeyMap.size
      const files = [...nodeKeyMap.values()].map(_ => (_.files || _).length).reduce((p, c) => p + c, 0)
      return dirs + files
    },
    getCountByNodeKey(node) {
      let dirs = 0, files = 0
      if (node) {
        dirs += 1
        files += node.fileCount
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            const {dirs: d, files: f} = this.getCountByNodeKey(child)
            dirs += d
            files += f
          }
        }
      }
      return {dirs, files}
    },
    readCache(filename, dir = config.poster_dir) {
      let file = path.resolve(dir, `${filename}.cache.json`)
      let cache = {tree: null, nodeKeyMap: null}
      if (fs.existsSync(file)) {
        cache = JSON.parse(fs.readFileSync(file).toString())
        cache.nodeKeyMap = new Map(Object.entries(cache.nodeKeyMap))
      }
      return cache
    },
    saveCache(filename, data, dir = config.poster_dir) {
      let file = path.resolve(dir, `${filename}.cache.json`)
      let cache = {tree: JSON.parse(JSON.stringify(data.tree))}
      cache.nodeKeyMap = Object.fromEntries(data.nodeKeyMap)
      this.logger.info(`Save cache to ${file}`)
      fs.writeFileSync(file, JSON.stringify(cache))
    },
    async reload(useCache = false) {
      if (useCache && config.cache.imgCache) {
        this.settings.pic = this.readCache('img')
        if (!this.settings.pic.tree) {
          await this.updatePicInfo()
        }
      } else {
        await this.updatePicInfo()
      }
      if (useCache && config.cache.videoCache) {
        this.settings.video = this.readCache('video')
        if (!this.settings.video.tree) {
          await this.updateVideoInfo()
        }
      } else {
        await this.updateVideoInfo()
      }
      let imgCount = this.getDirAndFileCount(this.settings.pic.nodeKeyMap)
      let videoCount = this.getDirAndFileCount(this.settings.video.nodeKeyMap)
      return {imgCount, videoCount}
    },
  },
  events: {},
  async started() {
    const {imgCount, videoCount} = await this.reload(true)
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
