module.exports = function (plasma, dna) {
  let packagejson = require('../package.json')

  return function (cb) {
    cb(null, packagejson.version)
  }
}
