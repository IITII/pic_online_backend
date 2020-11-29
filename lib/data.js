/**
 * @author iitii
 * @date 2020/11/22 02:33
 */
'use strict';
const path = require('path'), fs = require('fs'),
  {logger} = require('../middlewares/logger')

/**
 * Check the special dir path is exist and readable
 * @param dir directory path
 * @returns {boolean} true for ok, false for others
 */
function dirExistAndReadable(dir) {
    let flag = true;
    if (!fs.existsSync(dir)) {
        logger.error(`dir is not exist...`);
        flag = false;
    }
    if (!fs.statSync(dir).isDirectory()) {
        logger.error(`dir: ${dir} is not a directory...`);
        flag = false;
    }
    try {
        fs.accessSync(dir, fs.constants.R_OK);
        logger.info(`dir: ${dir} is existed and readable.`);
    } catch (e) {
        logger.error(`dir: ${dir} is not exist or unreadable...`);
        flag = false;
    }
    return flag;
}

/**
 * dfs递归文件夹
 * @param baseDir 与欲读取的文件夹做替换，通常为Http服务器的根目录
 * @param dir 欲读取的文件夹
 * @param prefix 前缀(会自动添加 '/')
 * @param regex 媒体文件正则表达式
 */
function dirDetail(baseDir, dir, prefix = "", regex = '\\S+\\.(jpe?g|png|gif|svg|mp4)') {
    if (!dirExistAndReadable(dir)) {
        return {};
    }
    if (!prefix.match('/$')) {
        prefix += '/';
    }
    let nodeKey = 0,
      nodeKeyMap = new Map()
    
    function dfs(dirPath) {
        nodeKey++;
        let tmpNodeKey = nodeKey;
        let filePath = "";
        let mediaArray = [];
        let files = {
            nodeKey: tmpNodeKey,
            label: path.basename(dir),
            children: []
        };
        fs.readdirSync(dirPath).forEach(i => {
            filePath = dirPath + path.sep + i;
            if (fs.statSync(filePath).isDirectory()) {
                files.children.push(dfs(filePath));
            } else {
                if (i.match(regex) !== null) {
                    let tmp = path.relative(baseDir, filePath);
                    //Adjust for Windows
                    tmp = tmp.replace(/\\/g, '/');
                    mediaArray.push(prefix + tmp);
                }
            }
        })
        nodeKeyMap.set(tmpNodeKey, mediaArray);
        return files;
    }
    
    let tree = dfs(dir);
    return {
        tree: tree,
        nodeKeyMap: nodeKeyMap
    }
}

//
// (() => {
//     let dir = __dirname + '/../tmp/'
//     console.dir(dirDetail(dir, dir))
//     dirDetail(dir, dir, 'http://baidu.com')
// })()

module.exports = {
    dirDetail,
}
