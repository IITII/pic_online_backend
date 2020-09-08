const {logger} = require('./logger')

function postData(ctx, next) {
  if (ctx.method.toLocaleUpperCase() === 'post'.toLocaleUpperCase()) {
    logger.debug(ctx.request.body);
  }
  next();
}

module.exports = {
  postData
}