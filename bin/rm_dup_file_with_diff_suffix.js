/**
 * 将相同文件名，不同后缀的文件删除.
 * 默认保留 .webp 后缀的文件, 主要用于删除压缩后未正常删除的重复图片文件
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/06/30
 */
'use strict'

const fs = require('fs')
const path = require('path')

let base = process.env.DUP_DIR || '.'
base = path.resolve(base)

dfs(base)

function dfs(base, keepSuffix = '.webp', logger = console) {
  logger.info(`Start to scan ${base}`)
  let contents = fs.readdirSync(base, {withFileTypes: true})
  let dirs = contents.filter(_ => _.isDirectory())
  let files = contents.filter(_ => _.isFile())
  let basenameMap = new Map()
  files.forEach(f => {
    let k = path.basename(f.name, path.extname(f.name))
    let v = basenameMap.get(k) || []
    v.push(f.name)
    basenameMap.set(k, v)
  })
  basenameMap.forEach((v, k) => {
    if (v.length > 1) {
      logger.debug(`basename ${k} found ${v.length} files: ${v.join(', ')}`)
      let keepFile = v.find(_ => _.endsWith(keepSuffix))
      if (keepFile) {
        v = v.filter(_ => _ !== keepFile)
        logger.info(`Keep ${keepFile}, delete others: ${v.join(', ')}`)
        v.forEach(_ => {
          let p = path.join(base, _)
          fs.unlinkSync(p)
        })
      } else {
        logger.info(`basename ${k} cannot found ${keepSuffix} file. keep all files: ${v.join(', ')}`)
      }
    }
  })
  for (const dir of dirs) {
    dfs(path.join(base, dir.name), keepSuffix, logger)
  }
}
