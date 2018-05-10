#!/usr/bin/env node

const StackUpgrade = require('organic-stack-upgrade')
const path = require('path')

const execute = async function ({destDir = process.cwd(), answers} = {}) {
  let stack = new StackUpgrade({
    destDir: destDir,
    name: 'organic-stem-socketio-server-cell-template',
    version: '1.0.0'
  })
  let coreTemplateExists = false
  try {
    coreTemplateExists = await stack.checkUpgrade('organic-stem-core-template', '^1.0.0')
  } catch (e) {
    // ignore any errors
    coreTemplateExists = false
  }
  if (!coreTemplateExists) {
    console.warn('organic-stem-core-template not found...')
    console.info('force installing organic-angel, angelscripts-help and angelscripts-monorepo')
    await stack.exec('npm install organic-angel angelscripts-help angelscripts-monorepo --save-dev')
  }
  console.info('cell-groups can be comma separated list of groups')
  let resulted_answers = await stack.configure({
    sourceDir: path.join(__dirname, 'seed'),
    answers
  })
  resulted_answers['cell-groups'] = JSON.stringify(resulted_answers['cell-groups'].split(',').map(v => v.trim()))
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
