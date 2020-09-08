'use strict';
const Router = require('koa-router');
const router = Router();
const auth = require('../controllers/auth');
let files = require('../models/files');
module.exports = router;

router.get('/', async (ctx, next) => {
  ctx.response.body = "Hello"
  next()
});
router.get('/files', async (ctx, next) => {
  ctx.response.body = JSON.stringify(files)
  next()
});
router.post('/', auth);