/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/09
 */
'use strict'

const {moleculer} = require('../api.config.js')
const {axios} = require('./axios_client')
const os = require('os')

function getIp() {
  let ifs = os.networkInterfaces()
  let res = []
  for (const name in ifs) {
    let ifa = ifs[name]
    ifa = ifa.filter(ifa => ifa.family === 'IPv4')
    if (ifa.length > 0) {
      res.push(...ifa)
    }
  }
  res = res.filter(i => i.mac !== '00:00:00:00:00:00')
  res = res.map(_ => _.address)
  res = [...new Set(res)]
  let res2 = [], prefer
  prefer = '192.,172.,10.'.split(',')
  if (res.length > 1) {
    for (const p of prefer) {
      res2 = res.filter(_ => _.startsWith(p))
      if (res2.length > 0) {
        res2 = res2[0]
        break
      }
    }
  } else if (res.length === 1) {
    res2 = res[0]
  }
  res2 = res2.length > 0 ? res2 : '127.0.0.1'
  return res2
}

async function he_ddns(ip = undefined) {
  const params = {
    hostname: moleculer.ddns.domain,
    password: moleculer.ddns.token,
    myip: ip || getIp(),
  }
  // const conf = {responseType: 'text', responseEncoding: 'utf8'}
  return axios.get('https://dyn.dns.he.net/nic/update', {params})
    .catch(e => {
      if (e.code === 'HPE_INVALID_HEADER_TOKEN') {
        let res = Buffer.from(e.rawPacket, 'binary').toString('utf8')
        res = res.split('\r\n\r\n')
        return res[1]
      }
      throw e
    })
}

module.exports = {
  he_ddns,
  getIp,
}
