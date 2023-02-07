const fs = require('fs'),
  path = require('path'),
  {allowChars} = require('../../../libs/utils'),
  dir = process.env.TEST_DIR || '.'



  fs.readdirSync(dir).forEach(_ => {
    let r = allowChars(_)
    if (_ !== r) {
        _ = path.resolve(dir, _)
        r = path.resolve(dir, r)
        if (fs.existsSync(r)) {
            console.warn(`Rename failed, ${r} is exist`)
        } else {
            console.info(`Rename ${_} => ${r}`)
            fs.renameSync(_, r)
        }
    }
})
