import a from 'assertron'
import { AsyncContext } from 'async-fp'
import { transformConfig } from '../mockto/transformConfig.js'
import { loadPlugins } from '../spec-plugin/index.js'
import { createTestContext, createTestIO } from '../test-utils/index.js'
import { ExtraReference, PluginsNotLoaded } from './errors.js'
import { createSimulator } from './simulator.js'
import { createSpec } from './types-internal.js'

test('create not expected stub throws', async () => {
  const context = createTestContext().extend(loadPlugins).extend(transformConfig)
  const sim = createSimulator(
    context,
    'extra ref',
    { refs: [], actions: [] },
    { timeout: 10 })

  a.throws(() => sim.createStub({}), ExtraReference)
})

test('simulate without plugin install throws', () => {
  const io = createTestIO()
  const context = new AsyncContext<createSpec.Context>({ io, config: {}, plugins: [], timeTrackers: [], maskCriteria: [] })
  const simulator = createSimulator(
    context,
    'no plugin',
    { refs: [{ plugin: 'not-installed', profile: 'target' }], actions: [] },
    { timeout: 10 })
  a.throws(() => simulator.createStub(() => { }), PluginsNotLoaded)
})