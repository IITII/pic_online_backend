/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/10/09
 */
'use strict'

const {ServiceBroker} = require('moleculer')
const fileService = require('../../../services/file.service')
const broker = new ServiceBroker()

broker.createService(fileService)
broker.start()

