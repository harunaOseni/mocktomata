import { test } from 'ava'

import { SimulationMismatch } from '.'

test('SimulationMismatch error', t => {
  const action = { type: 'fn/callback', payload: { a: 1 }, meta: { functionId: 3 } }
  const err = new SimulationMismatch('some id', 'fn/invoke', action)
  t.is(err.id, 'some id')
  t.is(err.expectedAction, 'fn/invoke')
  t.is(err.receivedAction, action)
  t.is(err.message, `Recorded data for 'some id' doesn't match with simulation. Expecting action type 'fn/invoke' but received: { type: 'fn/callback', payload: { a: 1 }, meta: { functionId: 3 } }`)
})

test('SimulationMismatch error, received action optional', t => {
  const err = new SimulationMismatch('some id', 'fn/invoke')
  t.is(err.id, 'some id')
  t.is(err.expectedAction, 'fn/invoke')
  t.is(err.message, 'Recorded data for \'some id\' doesn\'t match with simulation. Expecting action type \'fn/invoke\' but received: undefined')
})

test('SimulationMismatch error with expected action as SpecAction', t => {
  const expectedAction = { type: 'fn/invoke', payload: [0, 'a'] }
  const action = { type: 'fn/callback', payload: { a: 1 }, meta: { functionId: 3 } }
  const err = new SimulationMismatch('some id', expectedAction, action)
  t.is(err.id, 'some id')
  t.is(err.expectedAction, expectedAction)
  t.is(err.receivedAction, action)
  t.is(err.message, `Recorded data for 'some id' doesn't match with simulation. Expecting action type { type: 'fn/invoke', payload: [0, 'a'] } but received: { type: 'fn/callback', payload: { a: 1 }, meta: { functionId: 3 } }`)
})