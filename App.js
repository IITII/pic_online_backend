/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/09
 */
'use strict'

const {moleculer} = require('./api.config.js'),
  moleculer_config = require('./moleculer.config.js'),
  {ServiceBroker} = require('moleculer'),
  broker = new ServiceBroker(moleculer_config)
const {getIp, he_ddns} = require('./libs/ddns')
const fs = require('fs')

fs.readdirSync('services')
  .filter(_ => _.endsWith('.service.js'))
  .forEach(file => {
    broker.createService(require(`./services/${file}`))
  })
broker.start()
  .then(async _ => {
    let {ip, port, pathname} = moleculer.server
    let https = moleculer.https ? 'https' : 'http'
    if (moleculer.server.ip === '0.0.0.0') {
      ip = getIp()
    }
    let start_urls = []
    start_urls.push(new URL(`${https}://${ip}:${port}${pathname}`).toString())
    if (moleculer.ddns.enable) {
      start_urls.push(new URL(`${https}://${moleculer.ddns.domain}:${port}${pathname}`).toString())
      await he_ddns(ip)
        .then(broker.logger.info)
        .catch(broker.logger.error)
    }
    start_urls.forEach(s => broker.logger.info(`Moleculer server is started on ${s}`))
    if (moleculer.server.auto_open) {
      start_urls.forEach(s => require('open')(s))
    }
  })
  .catch(console.error)
