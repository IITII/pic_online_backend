'use strict';
const Router = require('koa-router');
const router = Router();
const auth = require('../controllers/auth');
const config = require('../models/config'),
  {logger} = require('../middlewares/logger'),
  _ = require('lodash'),
  chokidar = require('chokidar');

const watcher = chokidar.watch(config.pic_dir, config.chokidar);
const files = require('../models/files');
let file_info = files();

// Using debounce to abuse scan directory frequently
watcher.on('all', _.debounce(() => {
  logger.debug(`Re-scan files...`);
  file_info = files();
}, 1000, {'trailing': true}))
  .on('error', error => logger.error(`Watcher error: ${error}`))

module.exports = router;

router.get('/', async (ctx, next) => {
  ctx.response.body = "Hello"
  next()
});
router.get('/files', async (ctx, next) => {
  ctx.response.body = JSON.stringify(file_info);
  next()
});
router.post('/', auth);