/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2024/01/10
 */
'use strict'
const {MoleculerClientError} = require('moleculer').Errors
const config = require('../api.config.js')


/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'openapi',
  settings: {},
  actions: {
    config: {
      rest: 'GET /config',
      async handler(ctx) {
        return 'hello'
      },
    },
  },
  methods: {},
  events: {},
  created() {},
  started() {},
  stopped() {},
}
