import { a } from 'assertron'
import { some } from 'satisfier'
import { logLevels } from 'standard-log'
import { createKomondor, createTestContext } from '../index.js'

const { context } = createTestContext()
const k = createKomondor(context)

afterAll(() => k.cleanup())

describe(`kd.live()`, () => {
  it('can invoke with no options', async () => {
    const spec = k.live('live with no options')
    const s = await spec((x: number) => x + 1)
    expect(s(1)).toBe(2)
    await spec.done()
  })

  it('can specify timeout', async () => {
    const spec = k.live('live with options', { timeout: 2000 })
    const s = await spec((x: number) => x + 1)
    expect(s(1)).toBe(2)
    await spec.done()
  })

  it('can specify log level', async () => {
    const spec = k.live('live has enableLog method', { logLevel: logLevels.all })
    await spec(() => { })
  })
})

describe(`kd.save()`, () => {
  it('can invoke with no options', async () => {
    const spec = k.save('save with no options')
    const s = await spec((x: number) => x + 1)
    expect(s(1)).toBe(2)
    await spec.done()
  })

  it('can specify timeout', async () => {
    const spec = k.save('save with options', { timeout: 2000 })
    const s = await spec((x: number) => x + 1)
    expect(s(1)).toBe(2)
    await spec.done()
  })

  it('can specify log level', async () => {
    const spec = k.save('save has enableLog method', { logLevel: logLevels.debug })
    await spec(() => { })
    await spec.done()

    expect(spec.reporter.logs.length).toBe(1)
  })
})

test('auto lifecycle', async () => {
  const save = k('auto lifecycle')
  await save({})
  expect(save.mode).toBe('save')
  await save.done()

  const simulate = k('auto lifecycle')
  await simulate({})
  expect(simulate.mode).toBe('simulate')
  await simulate.done()
})

it('gets memory log reporter', async () => {
  const save = k.save('gets memory log reporter', { logLevel: logLevels.all })

  const subject = { a: 1 }
  const spy = await save(subject)
  expect(spy.a).toBe(1)
  await save.done()

  a.satisfies(save.reporter.getLogMessagesWithIdAndLevel(), some(
    /^mocktomata:gets memory log reporter:save/
  ))

  const simulate = k.simulate('gets memory log reporter', { logLevel: logLevels.all })
  const stub = await simulate(subject)
  expect(stub.a).toBe(1)
  await simulate.done()

  a.satisfies(simulate.reporter.getLogMessagesWithIdAndLevel(), some(
    /^mocktomata:gets memory log reporter:simulate/
  ))
})
