const fs = require('fs');
const path = require('path');
const {debounce} = require('lodash')

function mkdir(dir, cb) {
  let paths = dir.split(path.sep);
  let index = 1;
  
  function next(index) {
    //递归结束判断
    if (index > paths.length)
      return cb();
    let newPath = paths.slice(0, index).join(path.sep);
    fs.access(newPath, function (err) {
      if (err) {//如果文件不存在，就创建这个文件
        fs.mkdir(newPath, function () {
          next(index + 1);
        });
      } else {
        //如果这个文件已经存在，就进入下一个循环
        next(index + 1);
      }
    })
  }
  
  next(index);
}

function simple_debounce(func, delay, ...args) {
  let timer
  return () => {
    clearTimeout(timer)
    const context = this
    timer = setTimeout(() => {
      func.apply(context, args)
    }, delay)
  }
}

function bfs(nodeArray, maxNodeCount = 2) {
  let queue = [],
    tmpQueue = [],
    res = [],
    tmpRes = []
  
  queue = queue.concat(nodeArray)
  
  while (queue.length !== 0) {
    const tmp = queue.shift()
    tmpRes.push(tmp.nodeKey)
    if (tmp.children !== undefined && tmp.children.length !== 0) {
      tmpQueue = tmpQueue.concat(tmp.children)
    }
    if (queue.length === 0) {
      if (res.length + tmpRes.length >= maxNodeCount) {
        // 当根目录文件过多的时候，还是选择默认展开根目录
        // 因为好歹会展开这个目录，还不如自动做这个任务
        if (res.length === 0) {
          res = res.concat(tmpRes)
        }
        break
      } else {
        res = res.concat(tmpRes)
        tmpRes = []
      }
      queue = queue.concat(tmpQueue)
      tmpQueue = []
    }
  }
  return res
}

(() => {
  let ob = {
    nodeKey: 1,
    children: [
      {nodeKey: 2, children: []},
      {nodeKey: 3, children: []}
    ]
  }
  console.log(bfs(ob))
})()

module.exports = {
  mkdir,
  debounce
}
