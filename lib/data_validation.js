/**
 * @author iitii
 * @date 2020/12/5 16:47
 */
'use strict';
const schema = require('../models/api_schema'),
  {Validator} = require('jsonschema'),
  v = new Validator();

/**
 * 基础 json 格式校验
 * @param instance 欲校验的数据
 * @param template JSON Schema模版
 * @returns {boolean} 测试通过返回 true
 */
function validator(instance, template) {
  return v.validate(instance, template).errors.length === 0;
}

/**
 * 校验 pic post 请求 body
 * @param instance 欲校验的数据
 * @returns {boolean} 测试通过返回 true
 */
function private_pic(instance) {
  return validator(instance, schema.private.pic)
}

module.exports = {
  private_pic,
}
