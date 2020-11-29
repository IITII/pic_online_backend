'use strict';
// koa 封装类
const config = require('./models/config'), {logger, loggerMiddleware} = require('./middlewares/logger'),
  Koa = require('koa'), cors = require('koa2-cors'), app = new Koa(), BodyParser = require('koa-bodyparser'),
  convert = require('koa-convert'), publicRouter = require('./routes/public'),
  privateRouter = require('./routes/private'), utilsMiddleware = require('./middlewares/utils')

// CORS
app.use(cors())
// logger
app.use(loggerMiddleware)
app.use(convert(BodyParser({
  encode: 'utf-8',
  formLimit: '12mb',
  jsonLimit: "7mb",
  textLimit: "5mb",
  onerror: (err, ctx) => {
    ctx.response.status = 413;
    ctx.response.body = "Form 表单数据过大";
    logger.error(err);
  }
})))
app.use(utilsMiddleware.postData)
// public routers
app.use(publicRouter.routes())
  .use(publicRouter.allowedMethods())
// private routers
app.use(privateRouter.routes())
  .use(privateRouter.allowedMethods())

app.listen(config.port || 3000, () => {
  logger.info(`Service is listening on port: ${config.port || 3000}`)
});
