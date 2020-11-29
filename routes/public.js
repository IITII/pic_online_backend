'use strict';
const Router = require('koa-router'), router = new Router(), publicRouter = new Router()

router
  .get('/', ctx => {
    ctx.response.status = 200;
    ctx.response.body = "Hello"
  })
  .post('/', ctx => {
    ctx.response.body = 'post'
  })

// 添加嵌套子路由
publicRouter.use('/public', router.routes(), router.allowedMethods())

module.exports = publicRouter;
