/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/09
 */
'use strict'

const {getIp} = require('../../libs/ddns')
let res
res = getIp()
console.log(res)
