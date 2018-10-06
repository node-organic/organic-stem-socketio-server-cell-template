const path = require('path')
const os = require('os')
const execa = require('execa')
const request = require('async-request')
const terminate = require('terminate')
const ioclient = require('socket.io-client')
const generateCore = require('organic-stem-core-template')

const get = async function (url) {
  return request(url)
}

const timeout = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let tempDir = path.join(os.tmpdir(), 'test-stack-upgrade-' + Math.random())

beforeAll(async () => {
  jest.setTimeout(60 * 1000)
  await generateCore({
    destDir: tempDir,
    answers: {
      'project-name': 'test'
    }
  })
})

test('stack upgrade', async () => {
  jest.setTimeout(60 * 1000)
  let execute = require('../index')
  await execute({
    destDir: tempDir,
    answers: {
      'cell-name': 'test',
      'cell-desc': 'desc',
      'cell-port': 13371,
      'cell-groups': ['default'],
      'cell-mountpoint': '/events',
      'cwd': 'test'
    }
  })
})

test('the cell works', async (done) => {
  let cmds = [
    'cd ' + tempDir + '/cells/test',
    'npm run develop'
  ]
  let child = execa.shell(cmds.join(' && '))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
  await timeout(1000)
  let result = await get('http://localhost:13371/socket.io/socket.io.js')
  expect(result.statusCode).toBe(200)
  let client = ioclient('http://localhost:13371', {
    transports: ['websocket']
  })
  client.on('connect', function () {
    client.on('chemical', (c) => {
      expect(c.type).toBe('chemicalVersionResult')
      expect(c.version).toBe('1.0.0')
      terminate(child.pid)
      client.close()
      done()
    })
    // test socketio-handlers
    client.emit('version', (err, v) => {
      if (err) return done(err)
      expect(v).toBe('1.0.0')
      // test plasma-socketio-channel
      client.emit('chemical', {
        type: 'chemicalVersion',
      })
    })
  })
})
