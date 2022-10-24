import delay from 'delay'
import { createStandardLogForTest } from 'standard-log'
import { createTimeTracker } from './index.js'

const testOptions = { timeout: 10 }
const notCalled = () => { throw new Error('should not reach') }
test('not started until elapse() is called', async () => {
  const sl = createStandardLogForTest()
  const log = sl.getLogger('test')
  let called = false
  createTimeTracker({ log }, testOptions, () => called = true)
  await delay(10)
  expect(called).not.toBeTruthy()
})

test('invoke the callback when timeout is reached', async () => {
  const sl = createStandardLogForTest()
  const log = sl.getLogger('test')
  let called = false
  const timeTracker = createTimeTracker({ log }, testOptions, () => called = true)
  timeTracker.elapse()
  await delay(10)

  timeTracker.stop()
  expect(called).toBeTruthy()
})

test('first elapse() returns 0', async () => {
  const sl = createStandardLogForTest()
  const log = sl.getLogger('test')
  const timeTracker = createTimeTracker({ log }, testOptions, notCalled)
  const elapsed = timeTracker.elapse()
  timeTracker.stop()

  expect(elapsed).toBe(0)
})

test('duration returns total duration since first elapse() call', async () => {
  const sl = createStandardLogForTest()
  const log = sl.getLogger('test')
  const timeTracker = createTimeTracker({ log }, testOptions, notCalled)
  timeTracker.elapse()
  await delay(5)
  timeTracker.elapse()
  await delay(5)
  timeTracker.elapse()
  await delay(5)
  const actual = timeTracker.duration()

  timeTracker.stop()
  expect(actual).toBeGreaterThanOrEqual(10)
  expect(actual).toBeLessThanOrEqual(5000)
})

test('elapse() returns time passed since last elapse() call', async () => {
  const sl = createStandardLogForTest()
  const log = sl.getLogger('test')
  const timeTracker = createTimeTracker({ log }, { timeout: 2000 }, notCalled)

  let elapsedTotal = timeTracker.elapse()
  await delay(30)
  let elapsed = timeTracker.elapse()
  expect(elapsed).toBeGreaterThan(0)
  elapsedTotal += elapsed

  await delay(30)
  elapsed = timeTracker.elapse()
  expect(elapsed).toBeGreaterThan(0)
  elapsedTotal += elapsed

  const duration = timeTracker.stop()
  expect(duration).toBeGreaterThanOrEqual(elapsedTotal)

  timeTracker.stop()
})
