'use strict';
const path = require('path');
let config = {
  port: 3000,
  // images dir
  pic_dir: process.env.PIC_DIR || path.resolve(__dirname, '../tmp'),
  // basedir, you can put a site dir at here
  base_dir: process.env.PIC_BASE_DIR || path.resolve(__dirname, '../tmp'),
  prefix: 'http://baidu.com',
  log: {
    logName: 'Pic_Online',
    logPath: path.resolve(__dirname, '../logs/log.log'),
    level: process.env.LOGGER_LEVEL || 'debug'
  },
  // Chokidar
  // See: https://github.com/paulmillr/chokidar
  chokidar: {
    // ignore dotfiles
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
    depth: 99,
    ignorePermissionErrors: false,
    // atomic (default: true if useFsEvents and usePolling are false).
    // Automatically filters out artifacts that occur when using editors
    // that use "atomic writes" instead of writing directly to the source
    // file. If a file is re-added within 100 ms of being deleted, Chokidar
    // emits a change event rather than unlink then add. If the default of
    // 100 ms does not work well for you, you can override it by setting
    // atomic to a custom value, in milliseconds.
    atomic: 2000,
    // awaitWriteFinish (default: false). By default, the add event will
    // fire when a file first appears on disk, before the entire file
    // has been written. Furthermore, in some cases some change events
    // will be emitted while the file is being written. In some cases,
    // especially when watching for large files there will be a need to
    // wait for the write operation to finish before responding to a
    // file creation or modification. Setting awaitWriteFinish to true
    // (or a truthy value) will poll file size, holding its add and
    // change events until the size does not change for a configurable
    // amount of time. The appropriate duration setting is heavily
    // dependent on the OS and hardware. For accurate detection this
    // parameter should be relatively high, making file watching much
    // less responsive. Use with caution.
    awaitWriteFinish: {
      // options.awaitWriteFinish can be set to an object in order
      // to adjust timing params:
      // awaitWriteFinish.stabilityThreshold (default: 2000).
      // Amount of time in milliseconds for a file size to remain
      // constant before emitting its event.
      stabilityThreshold: 10000,
      // awaitWriteFinish.pollInterval (default: 100). File size
      // polling interval, in milliseconds.
      pollInterval: 500,
    }
  }
}

module.exports = config;
