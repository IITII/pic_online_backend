/**
 * @author iitii
 * @date 2020/11/22 00:40
 */
'use strict';
const Router = require('koa-router'), router = new Router(), privateRouter = new Router(),
  file_info = require('../controllers/file_info');

router
  .get('/tree', file_info.getTree)
  .post('/pic', file_info.getMoreImages)

// 添加嵌套子路由
privateRouter.use('/private', router.routes(), router.allowedMethods())

module.exports = privateRouter
