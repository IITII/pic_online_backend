/**
 * @author iitii
 * @date 2020/12/5 16:43
 */
'use strict';

const pic = {
  nodeKey: "Integer",
  low: "Integer",
  high: "Integer",
  required: [
    "nodeKey",
    "low",
    "high"
  ]
}

module.exports = {
  private: {
    pic: pic
  },
  public: {}
}
