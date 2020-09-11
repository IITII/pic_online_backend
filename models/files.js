/**
 * @author IITII
 * @date 2020/9/7 15:25
 */

module.exports = () =>{
  'use strict';
  const fs = require('fs'),
    path = require('path'),
    config = require('./config.js');
  const imgDir = config.pic_dir,
    imgRegex = '\\S+\\.(jpe?g|png|gif|svg)';
  let base_dir = config.base_dir;

  if (!base_dir.match('/$')) {
    base_dir += '/';
  }

  if (!fs.existsSync(imgDir)) {
    console.error(`Un-exist dir: ${imgDir}`);
    process.exit(1);
  }
  if (fs.statSync(imgDir).isDirectory()) {
    try {
      fs.accessSync(imgDir, fs.constants.R_OK);
      console.log(`imgDir is readable: ${imgDir}`);
    } catch (e) {
      console.error(`Permission deny!!!`);
      process.exit(1);
    }
  } else {
    console.error(`imgDir is not a directory!!!`);
    process.exit(1);
  }

  let id = 1;
  let files_data = {
    tree_data: {},
    keyMap: []
  }

  /**
   * Get all image under directory
   * @param dir image dir path
   * @return {{children: [], label: string, id: number}}
   */
  function getFiles(dir) {
    let id_pre = id;
    id++;
    let files = {
      label: path.basename(dir),
      id: id_pre,
      children: [],
    };
    let tmp = [];
    let filePath = '';
    fs.readdirSync(dir).forEach(i => {
      filePath = dir + path.sep + i;
      if (fs.statSync(filePath).isDirectory()) {
        files.children.push(getFiles(filePath));
      } else {
        // Only add images
        if (i.match(imgRegex) !== null) {
          let tmpString = path.relative(imgDir, filePath);
          tmpString = tmpString.replace(/\\/g, '/');
          tmp.push({
            src: base_dir + tmpString,
            href: base_dir + tmpString,
            info: path.parse(base_dir + tmpString).name,
          });
        }
      }
    });
    files_data.keyMap.push([id_pre, tmp]);
    return files;
  }

  files_data.tree_data = [getFiles(imgDir)];
  return files_data;
}
