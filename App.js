'use strict';
const config = require('./models/config')
const {logger, loggerMiddleware} = require('./middlewares/logger');
const Koa = require('koa');
const cors = require('koa2-cors');
const app = new Koa();
const BodyParser = require('koa-bodyparser');
// koa 封装类
const convert = require('koa-convert');

const publicRouter = require('./routes/public');
const utilsMiddleware = require('./middlewares/utils');
// CORS
app.use(cors());
// logger
app.use(loggerMiddleware);
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
})));
app.use(utilsMiddleware.postData)
app.use(publicRouter.routes());

app.listen(config.port || 3000, () => {
  logger.info(`Service is listening on port: ${config.port || 3000}`)
});
