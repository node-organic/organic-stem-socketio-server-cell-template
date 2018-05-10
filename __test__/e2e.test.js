const path = require('path')
const os = require('os')
const execa = require('execa')
const request = require('async-request')
const terminate = require('terminate')

const get = async function (url) {
  return request(url)
}

const timeout = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let tempDir = path.join(os.tmpdir(), 'test-stack-upgrade-' + Math.random())
test('stack upgrade', async () => {
  jest.setTimeout(60 * 1000)
  let execute = require('../index')
  await execute({
    destDir: tempDir,
    answers: {
      'cell-name': 'test',
      'cell-desc': 'desc',
      'cell-port': 13371,
      'cell-groups': 'default',
      'cell-mount-point': '/events'
    }
  })
})

test('the cell works', async () => {
  let cmds = [
    'cd ' + tempDir + '/cells/test',
    'node ./index'
  ]
  let child = execa.shell(cmds.join(' && '))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
  await timeout(1000)
  let result = await get('http://localhost:13371/socket.io/socket.io.js')
  expect(result.statusCode).toBe(200)
  terminate(child.pid)
})