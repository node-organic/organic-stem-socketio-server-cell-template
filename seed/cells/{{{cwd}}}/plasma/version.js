module.exports = function (plasma, dna) {
  let packagejson = require('../package.json')
  plasma.on('chemicalVersion', function (c) {
    plasma.emit({
      type: 'chemicalVersionResult',
      transport: 'socketio',
      version: packagejson.version
    })
  })
}
