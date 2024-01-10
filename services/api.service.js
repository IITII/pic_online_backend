'use strict'

const ApiGateway = require('moleculer-web'),
  {UnAuthorizedError, ForbiddenError} = ApiGateway.Errors,
  {pick} = require('lodash')
const {moleculer, base_dir} = require('../api.config')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

module.exports = {
  name: 'api',
  mixins: [ApiGateway],

  // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
  settings: {
    // Exposed port
    port: moleculer.server.port,

    // Exposed IP
    ip: moleculer.server.ip,

    https: moleculer.https,

    // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
    use: [],

    // Global CORS settings for all routes
    cors: {
      // Configures the Access-Control-Allow-Origin CORS header.
      origin: '*',
      // Configures the Access-Control-Allow-Methods CORS header.
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
      // Configures the Access-Control-Allow-Headers CORS header.
      // The POST request send Content-Type header,
      // which is not allowed in your CORS config.
      // Use allowedHeaders: "*" or allowedHeaders: ["Content-Type"]
      // https://github.com/moleculerjs/moleculer-web/issues/160#issuecomment-581050092
      allowedHeaders: ['Content-Type', 'authorization', 'Access-Control-Allow-Origin'],
      // allowedHeaders: '*',
      // Configures the Access-Control-Expose-Headers CORS header.
      exposedHeaders: [],
      // Configures the Access-Control-Allow-Credentials CORS header.
      credentials: false,
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600,
    },

    routes: [
      {
        // no auth, high quota
        path: '/limit', authentication: false, authorization: false,
        autoAliases: true,
        whitelist: [
          'user.login', 'user.tokenLogin',
        ],
        aliases: {},
        mappingPolicy: 'restrict', logging: true, mergeParams: true,
        rateLimit: {
          window: 60 * 1000, limit: 120, headers: false,
          // Function used to generate keys. Defaults to:
          key: (req) => {
            return req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
              req.socket.remoteAddress || req.connection.socket.remoteAddress
          },
        },
      },
      {
        // admin only, no limit
        path: '/dev', meta: {roles: ['admin']},
        whitelist: ['$node.*', 'openapi.*'],
        aliases: {},
        mergeParams: true, logging: true,
        authentication: false, authorization: true,
        autoAliases: true, mappingPolicy: 'all',
      },
      {
        // admin and maintainer, no limit
        path: '/admin', meta: {roles: ['admin']},
        whitelist: [
          'user.create',
        ],
        logging: true,
        mergeParams: true, authorization: true,
        autoAliases: true, mappingPolicy: 'all',
        bodyParsers: {
          json: {strict: false, limit: '5MB'},
          urlencoded: {extended: true, limit: '5MB'},
        },
      },
      {
        path: '/api', meta: {roles: ['admin', 'user']},

        whitelist: [
          'file.*',
        ],

        rateLimit: {
          window: 60 * 1000, limit: 300, headers: false,
          // Function used to generate keys. Defaults to:
          key: (req) => {
            return req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
              req.socket.remoteAddress || req.connection.socket.remoteAddress
          },
        },
        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: false,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: process.env.LOCAL_DEV !== 'true',

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {},

        /**
         * Before call hook. You can check the request.
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingRequest} req
         * @param {ServerResponse} res
         * @param {Object} data
         *
         onBeforeCall(ctx, route, req, res) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers['user-agent'];
				}, */

        /**
         * After call hook. You can modify the data.
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingRequest} req
         * @param {ServerResponse} res
         * @param {Object} data
         onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: '5MB',
          },
          urlencoded: {
            extended: true,
            limit: '5MB',
          },
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: 'all', // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true,
      },
    ],
    onError(req, res, err) {
      // Return with the error as JSON object
      if (req.url === '/' && err.code === 404) {
        res.writeHead(302)
        res.end('<html><meta http-equiv="refresh" content="0;url=/pic"></html>')
        return
      }
      res.setHeader('Content-type', 'application/json; charset=utf-8')

      if (err.code === 422) {
        // 422 为自定义错误码，说明消息需要自定义处理
        // 重新修改响应头状态为 200
        res.writeHead(200)

        res.end(JSON.stringify({errors: err.message}, null, 2))
      } else {
        res.writeHead(err.code || 500)
        const errObj = pick(err, ['name', 'message', 'code', 'type', 'data'])
        res.end(JSON.stringify(errObj, null, 2))
      }
      this.logResponse(req, res, err ? err.ctx : null)
    },
    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    log4XXResponses: false,
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    logRequestParams: 'info',
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    logResponseData: process.env.NODE_ENV === 'production' ? false : 'info',


    // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
    assets: {
      folder: base_dir,

      // Options to `server-static` module
      options: {
        dotfiles: 'ignore', maxAge: '1d',
        index: ['index.html', 'index.htm', 'index'],
      },
    },
  },

  methods: {

    /**
     * Authorize the request. Check that the authenticated user has right to access the resource.
     *
     * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    async authorize(ctx, route, req) {
      let token
      // 判断请求 headers 里面有没有认证信息
      if (req.headers.authorization) {
        // 获取请求 headers 里面的认证信息
        const auth = req.headers.authorization.split(' '),
          authType = auth[0]
        if (authType === 'Token')
          token = auth[1]
      }
      let user
      if (token) {
        // Verify JWT token
        // 验证 JWT token
        try {
          user = await ctx.call('user.resolveToken', {token})
          if (user) {
            // 转换用户类型到用户角色
            const role = user.user_type
            this.logger.debug(`Authenticated via JWT. _id:${user._id}, username: ${user.name}, userType: ${user.user_type}`)
            // Reduce user fields (it will be transferred to other nodes)
            ctx.meta.user = pick(user, ['_id', 'name', 'language', 'user_type'])
            // 给 context 添加一些自定义信息
            ctx.meta.token = token
            ctx.meta._id = user._id
            ctx.meta.role = role
          }
        } catch (err) {
          // Ignored because we continue processing if user doesn't exists
        }
      }

      // 粗度权限控制，基于路由权限认证
      // 使用自定义的 role 属性进行权限认证
      // Auth with custom `role` property
      if (route.opts.meta && route.opts.meta.roles) {
        const routeRoles = route.opts.meta.roles
        const userRole = ctx.meta.role
        const _id = ctx.meta._id
        // 有无用户信息
        if (user) {
          // 用户角色是否在路由权限组里面
          if (routeRoles.some(r => r === userRole)) {
            // Auth success, go next
            this.logger.debug(`Authenticated success, path: ${req.parsedUrl}, allowRoles: ${routeRoles}, userRole: ${userRole}, _id: ${_id}`)
          } else {
            // no right, forbidden
            throw new ForbiddenError()
          }
        } else {
          this.logger.debug(`Authenticated failed, path: ${req.parsedUrl}, allowRoles: ${routeRoles}, userRole: ${userRole}, _id: ${_id}`)
          throw new UnAuthorizedError()
        }
      } else {
        this.logger.warn(`${route.opts.path}'s meta property is missing...`)
        // no need auth, go next
      }
    },
  },
}
