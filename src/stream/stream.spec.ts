import { test } from 'ava'
import stream = require('stream')

import { spec } from '../index'

function readStream(): stream.Stream {
  const rs = new stream.Readable()
  const message = 'hello world'
  let i = 0
  rs._read = function () {
    if (message[i])
      rs.push(message[i++])
    else
      rs.push(null)
  }
  return rs
}

test.skip('read stream', async t => {
  const streamSpec = await spec.save('stream/read', readStream)
  console.log(streamSpec.subject)
  const read = streamSpec.subject()
  const actual = await new Promise(a => {
    let message = ''
    read.on('data', m => {
      message += m
    })
    read.on('end', () => {
      a(message)
    })
    t.pass()
  })
  t.is(actual, 'hello world')

  await streamSpec.satisfy([
    undefined,
    { type: 'fn/return', meta: { returnType: 'stream', id: 1 } },
    { type: 'stream', meta: { id: 1, length: 11 } }
  ])
})

test.skip('read stream simulate', async t => {
  const streamSpec = await spec.simulate('stream/read', readStream)
  const read = streamSpec.subject()
  const actual = await new Promise(a => {
    let message = ''
    read.on('data', m => {
      message += m
    })
    read.on('end', () => {
      a(message)
    })
    t.pass()
  })
  t.is(actual, 'hello world')

  await streamSpec.satisfy([
    undefined,
    { type: 'fn/return', meta: { returnType: 'stream', id: 1 } },
    { type: 'stream', meta: { id: 1, length: 11 } }
  ])
})