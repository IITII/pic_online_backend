'use strict'

const {MoleculerClientError} = require('moleculer').Errors,
  bcrypt = require('bcryptjs'),
  jwt = require('jsonwebtoken'),
  DbMixin = require('../mixins/db.mixin')


/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'user',
  // version: 1

  /**
   * Mixins
   */
  mixins: [DbMixin('user')],

  /**
   * Settings
   */
  settings: {
    // Available fields in the responses
    // _id 字段为 MongoDB 自动生成的 Object 类型的主键
    fields: ['_id', 'name', 'password', 'language', 'user_type',],
    JWT_SECRET: process.env.JWT_SECRET || 'jwt-pic-online-secret',
  },

  /**
   * Actions
   */
  actions: {
    create: {
      rest: 'POST /create',
      params: {
        name: {type: 'string', min: 3, max: 10},
        password: {type: 'string', min: 1, max: 10},
        user_type: {type: 'enum', default: 'user', values: ['admin', 'user'],},
        language: {type: 'enum', default: 'zh-hans', values: ['zh-hans', 'en-us'],}
      },
      async handler(ctx) {
        const entity = ctx.params,
          role = ctx.meta.role
        if (entity.user_type !== 0 && role !== 'admin') {
          throw new MoleculerClientError('Forbidden', 422)
        }
        const found = await this.adapter.find({limit: 1, query: {name: entity.name}})
        if (found.length > 0) {
          throw new MoleculerClientError('User is exist, please login...', 422)
        }
        const res = await this.adapter.insert(entity)
        const json = this.transformEntity(res, true, ctx.meta.token)
        await this.entityChanged('created', json, ctx)
        return json
      }
    },
    login: {
      rest: 'POST /login',
      params: {
        name: {type: 'string', min: 3, max: 10},
        password: {type: 'string', min: 1, max: 10},
      },
      async handler(ctx) {
        const {name, password} = ctx.params
        let user = await this.adapter.find({limit: 1, query: {name}})
        if (user.length === 0) {
          throw new MoleculerClientError('Username or password is invalid!', 422)
        } else {
          user = user[0]
        }

        const password_correct = await bcrypt.compare(password, user.password)
        if (!password_correct) {
          throw new MoleculerClientError('Name or password is invalid!', 422)
        }

        return this.transformEntity(user, true, ctx.meta.token)
      }
    },
    tokenLogin: {
      rest: 'POST /login_by_token',
      cache: {
        keys: ['token'],
        ttl: 60 * 10 // 10min
      },
      params: {
        token: 'string'
      },
      async handler(ctx) {
        const token = ctx.params.token
        const entity = await this.broker.call('user.resolveToken', {token})
        return this.transformEntity(entity, true, ctx.meta.token)
      }
    },
    /**
     * Get user by JWT token (for API GW authentication)
     *
     * @actions
     * @param {String} token - JWT token
     *
     * @returns {Object} Resolved user
     */
    resolveToken: {
      cache: {
        keys: ['token'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        token: 'string'
      },
      async handler(ctx) {
        const decoded = await new this.Promise((resolve, reject) => {
          jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err, decoded) => {
            return err ? reject(err) : resolve(decoded)
          })
        })
        if (decoded._id)
          return this.getById(decoded._id)
      }
    }
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Generate a JWT token from user entity
     *
     * @param {Object} user
     */
    generateJWT(user) {
      const today = new Date(),
        exp = new Date(today),
        // token expired time. unit: hour
        tokenExpire = process.env.JWT_TOKEN_EXPIRE || 24
      exp.setHours(today.getHours() + +tokenExpire)

      return jwt.sign({
        _id: user._id,
        name: user.name,
        exp: Math.floor(exp.getTime() / 1000)
      }, this.settings.JWT_SECRET)
    },
    /**
     * Transform returned user entity. Generate JWT token if necessary.
     *
     * @param {Object} user
     * @param {Boolean} withToken
     * @param token
     */
    transformEntity(user, withToken, token) {
      const newUser = {},
        keep = '_id,name,language,user_type'.split(','),
        noKeep = 'password'.split(',')
      if (user) {
        // user 对象的 get 和 set 方法被重载过
        keep.forEach(k => newUser[k] = user[k] || '')
        noKeep.forEach(n => delete newUser[n])
        if (withToken)
          newUser.token = token || this.generateJWT(user)
      }

      return {user: newUser}
    },
    /**
     * Loading sample data to the collection.
     * It is called in the DB.mixin after the database
     * connection establishing & the collection is empty.
     */
    async seedDB() {
      const users = 'admin,user'.split(',')
        .map(u => {
          return {
            name: u, user_type: u,
            language: 'zh-hans',
            password: bcrypt.hashSync(u, 10)
          }
        })
      await this.adapter.insertMany(users)
    },

  },

  /**
   * Fired after database connection establishing.
   */
  async afterConnected() {
    // await this.adapter.collection.createIndex({ name: 1 });
  }
}
