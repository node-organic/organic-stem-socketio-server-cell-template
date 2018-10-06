#!/usr/bin/env node

const StackUpgrade = require('organic-stack-upgrade')
const path = require('path')

const execute = async function ({destDir = process.cwd(), answers} = {}) {
  let stack = new StackUpgrade({
    destDir: destDir,
    packagejson: path.join(__dirname, '/package.json')
  })
  if (!await stack.checkUpgrade('organic-stem-core-template', '^2.1.0')) {
    throw new Error('organic-stem-core-template ^2.1.0 not found, are you working into the repo root?')
  }
  let resulted_answers = answers || {}
  if (!resulted_answers['cell-name']) {
    resulted_answers['cell-name'] = await stack.ask('cell-name?')
  }
  if (!resulted_answers['cwd']) {
    resulted_answers['cwd'] = await stack.ask(`cwd? (relative to ${destDir}/cells/)`, resulted_answers['cell-name'])
  }
  resulted_answers['dnaCellDirPath'] = path.dirname(resulted_answers['cwd'])
  if (resulted_answers['dnaCellDirPath'] && resulted_answers['dnaCellDirPath'] !== '.') {
    resulted_answers['build-branch'] = `cells.${resulted_answers['dnaCellDirPath'].split('/').join('.')}.${resulted_answers['cell-name']}.build`
  } else {
    resulted_answers['build-branch'] = `cells.${resulted_answers['cell-name']}.build`
  }
  if (!resulted_answers['cell-groups']) {
    resulted_answers['cell-groups'] = await stack.ask('cell-groups? (can be comma separated)')
    resulted_answers['cell-groups'] = resulted_answers['cell-groups'].split(',').map(v => v.trim())
  }
  resulted_answers = await stack.configure({
    sourceDirs: [path.join(__dirname, 'seed')],
    answers: resulted_answers
  })
  await stack.merge({
    sourceDir: path.join(__dirname, 'seed'),
    answers: resulted_answers
  })
  await stack.updateJSON()
  let cellName = resulted_answers['cell-name']
  console.info(`run npm install on ${cellName}...`)
  await stack.exec(`npx angel repo cell ${cellName} -- npm install`)
}

if (module.parent) {
  module.exports = execute
} else {
  execute().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
